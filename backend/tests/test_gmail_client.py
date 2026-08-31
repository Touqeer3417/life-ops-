from typing import Any

import httpx
import pytest

from app.core.config import Settings
from app.core.exceptions import (
    GmailMessageNotFoundError,
    GmailRateLimitError,
    GoogleGmailError,
    OAuthInsufficientScopeError,
    OAuthReauthorizationRequiredError,
)
from app.integrations.gmail_client import (
    GMAIL_API_BASE_URL,
    GmailClient,
)


class FakeResponse:
    def __init__(
        self,
        *,
        status_code: int,
        payload: Any = None,
        json_error: bool = False,
    ) -> None:
        self.status_code = (
            status_code
        )

        self._payload = payload
        self._json_error = (
            json_error
        )

    @property
    def is_success(
        self,
    ) -> bool:
        return (
            200
            <= self.status_code
            < 300
        )

    def json(
        self,
    ) -> Any:
        if self._json_error:
            raise ValueError(
                "Invalid JSON"
            )

        return self._payload


def _install_fake_client(
    monkeypatch: pytest.MonkeyPatch,
    *,
    response: FakeResponse
    | Exception,
):
    class FakeAsyncClient:
        instances: list[
            "FakeAsyncClient"
        ] = []

        def __init__(
            self,
            *,
            base_url: str,
            timeout: float,
            headers: dict[
                str,
                str,
            ],
        ) -> None:
            self.base_url = (
                base_url
            )

            self.timeout = timeout

            self.headers = (
                dict(
                    headers
                )
            )

            self.requests: list[
                dict[
                    str,
                    Any,
                ]
            ] = []

            self.__class__.instances.append(
                self
            )

        async def __aenter__(
            self,
        ) -> "FakeAsyncClient":
            return self

        async def __aexit__(
            self,
            exc_type,
            exc,
            traceback,
        ) -> bool:
            return False

        async def request(
            self,
            method: str,
            path: str,
            *,
            params=None,
            **kwargs,
        ):
            self.requests.append(
                {
                    "method": method,
                    "path": path,
                    "params": params,
                    "kwargs": kwargs,
                }
            )

            if isinstance(
                response,
                Exception,
            ):
                raise response

            return response

    monkeypatch.setattr(
        (
            "app.integrations.gmail_client."
            "httpx.AsyncClient"
        ),
        FakeAsyncClient,
    )

    return FakeAsyncClient


def _settings() -> Settings:
    return Settings(
        app_env="test",
        google_gmail_api_timeout_seconds=(
            2.5
        ),
    )


@pytest.mark.asyncio
async def test_list_messages_supports_native_search_and_pagination(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_client_class = (
        _install_fake_client(
            monkeypatch,
            response=FakeResponse(
                status_code=200,
                payload={
                    "messages": [
                        {
                            "id": (
                                "message-1"
                            ),
                            "threadId": (
                                "thread-1"
                            ),
                        },
                        {
                            "id": (
                                "message_2"
                            ),
                            "threadId": (
                                "thread_2"
                            ),
                        },
                    ],
                    "nextPageToken": (
                        "next-page"
                    ),
                    "resultSizeEstimate": (
                        42
                    ),
                },
            ),
        )
    )

    client = GmailClient(
        settings=_settings(),
        access_token=(
            "test-access-token"
        ),
    )

    result = await client.list_messages(
        query=(
            'from:hostinger '
            '"renewal"'
        ),
        label_ids=(
            "INBOX",
            "IMPORTANT",
        ),
        max_results=25,
        page_token=(
            "current-page"
        ),
        include_spam_trash=False,
    )

    assert [
        item.id
        for item
        in result.messages
    ] == [
        "message-1",
        "message_2",
    ]

    assert (
        result.next_page_token
        == "next-page"
    )

    assert (
        result.result_size_estimate
        == 42
    )

    instance = (
        fake_client_class
        .instances[0]
    )

    assert (
        instance.base_url
        == GMAIL_API_BASE_URL
    )

    assert (
        instance.headers[
            "Authorization"
        ]
        == "Bearer test-access-token"
    )

    request = (
        instance.requests[0]
    )

    assert (
        request["method"]
        == "GET"
    )

    assert (
        request["path"]
        == "/messages"
    )

    params = request[
        "params"
    ]

    assert (
        (
            "q",
            'from:hostinger "renewal"',
        )
        in params
    )

    assert (
        (
            "maxResults",
            "25",
        )
        in params
    )

    assert (
        (
            "pageToken",
            "current-page",
        )
        in params
    )

    assert (
        (
            "includeSpamTrash",
            "false",
        )
        in params
    )

    assert (
        params.count(
            (
                "labelIds",
                "INBOX",
            )
        )
        == 1
    )

    assert (
        params.count(
            (
                "labelIds",
                "IMPORTANT",
            )
        )
        == 1
    )


@pytest.mark.asyncio
async def test_get_message_metadata_requests_only_metadata_headers(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_client_class = (
        _install_fake_client(
            monkeypatch,
            response=FakeResponse(
                status_code=200,
                payload={
                    "id": "abc123",
                    "threadId": (
                        "thread123"
                    ),
                    "payload": {
                        "headers": [],
                    },
                },
            ),
        )
    )

    client = GmailClient(
        settings=_settings(),
        access_token="token",
    )

    result = (
        await client
        .get_message_metadata(
            message_id="abc123"
        )
    )

    assert result[
        "id"
    ] == "abc123"

    params = (
        fake_client_class
        .instances[0]
        .requests[0][
            "params"
        ]
    )

    assert (
        (
            "format",
            "metadata",
        )
        in params
    )

    metadata_headers = [
        value
        for key, value
        in params
        if key
        == "metadataHeaders"
    ]

    assert "From" in (
        metadata_headers
    )

    assert "Subject" in (
        metadata_headers
    )

    assert "Date" in (
        metadata_headers
    )

    assert "Message-ID" in (
        metadata_headers
    )


@pytest.mark.asyncio
async def test_get_message_full_uses_full_format(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_client_class = (
        _install_fake_client(
            monkeypatch,
            response=FakeResponse(
                status_code=200,
                payload={
                    "id": "abc123",
                    "threadId": (
                        "thread123"
                    ),
                    "payload": {},
                },
            ),
        )
    )

    client = GmailClient(
        settings=_settings(),
        access_token="token",
    )

    await client.get_message_full(
        message_id="abc123"
    )

    request = (
        fake_client_class
        .instances[0]
        .requests[0]
    )

    assert (
        request["path"]
        == "/messages/abc123"
    )

    assert (
        (
            "format",
            "full",
        )
        in request[
            "params"
        ]
    )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    (
        "status_code",
        "payload",
        "expected_exception",
    ),
    [
        (
            401,
            {
                "error": {
                    "message": (
                        "Invalid credentials"
                    )
                }
            },
            OAuthReauthorizationRequiredError,
        ),
        (
            403,
            {
                "error": {
                    "message": (
                        "Insufficient Permission"
                    ),
                    "errors": [
                        {
                            "reason": (
                                "insufficientPermissions"
                            )
                        }
                    ],
                }
            },
            OAuthInsufficientScopeError,
        ),
        (
            404,
            {
                "error": {
                    "message": (
                        "Message not found"
                    )
                }
            },
            GmailMessageNotFoundError,
        ),
        (
            429,
            {
                "error": {
                    "message": (
                        "Rate limit reached"
                    )
                }
            },
            GmailRateLimitError,
        ),
    ],
)
async def test_google_errors_are_translated_to_safe_app_errors(
    monkeypatch: pytest.MonkeyPatch,
    status_code: int,
    payload: dict[
        str,
        Any,
    ],
    expected_exception: type[
        Exception
    ],
) -> None:
    _install_fake_client(
        monkeypatch,
        response=FakeResponse(
            status_code=(
                status_code
            ),
            payload=payload,
        ),
    )

    client = GmailClient(
        settings=_settings(),
        access_token="token",
    )

    with pytest.raises(
        expected_exception
    ):
        await client.get_message_full(
            message_id="abc123"
        )


@pytest.mark.asyncio
async def test_403_rate_limit_reason_is_not_misclassified_as_scope_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _install_fake_client(
        monkeypatch,
        response=FakeResponse(
            status_code=403,
            payload={
                "error": {
                    "errors": [
                        {
                            "reason": (
                                "userRateLimitExceeded"
                            )
                        }
                    ]
                }
            },
        ),
    )

    client = GmailClient(
        settings=_settings(),
        access_token="token",
    )

    with pytest.raises(
        GmailRateLimitError
    ):
        await client.get_message_full(
            message_id="abc123"
        )


@pytest.mark.asyncio
async def test_server_error_is_exposed_as_generic_gmail_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _install_fake_client(
        monkeypatch,
        response=FakeResponse(
            status_code=503,
            payload={
                "error": {
                    "message": (
                        "Sensitive upstream "
                        "implementation detail"
                    )
                }
            },
        ),
    )

    client = GmailClient(
        settings=_settings(),
        access_token="token",
    )

    with pytest.raises(
        GoogleGmailError
    ) as exc_info:
        await client.get_message_full(
            message_id="abc123"
        )

    assert (
        "Sensitive upstream"
        not in str(
            exc_info.value
        )
    )


@pytest.mark.asyncio
async def test_timeout_is_translated_to_google_gmail_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    timeout_error = (
        httpx.ReadTimeout(
            "timed out",
            request=httpx.Request(
                "GET",
                (
                    "https://gmail."
                    "googleapis.com/"
                ),
            ),
        )
    )

    _install_fake_client(
        monkeypatch,
        response=timeout_error,
    )

    client = GmailClient(
        settings=_settings(),
        access_token="token",
    )

    with pytest.raises(
        GoogleGmailError
    ) as exc_info:
        await client.list_messages(
            query="hostinger",
        )

    assert (
        "timed out"
        in str(
            exc_info.value
        ).lower()
    )


@pytest.mark.asyncio
async def test_invalid_json_response_is_rejected(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _install_fake_client(
        monkeypatch,
        response=FakeResponse(
            status_code=200,
            json_error=True,
        ),
    )

    client = GmailClient(
        settings=_settings(),
        access_token="token",
    )

    with pytest.raises(
        GoogleGmailError
    ):
        await client.list_messages()


@pytest.mark.asyncio
async def test_invalid_message_id_is_rejected_before_network_call(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_client_class = (
        _install_fake_client(
            monkeypatch,
            response=FakeResponse(
                status_code=200,
                payload={},
            ),
        )
    )

    client = GmailClient(
        settings=_settings(),
        access_token="token",
    )

    with pytest.raises(
        ValueError
    ):
        await client.get_message_full(
            message_id=(
                "../../not-valid"
            )
        )

    assert (
        fake_client_class.instances
        == []
    )


def test_missing_access_token_is_rejected() -> None:
    with pytest.raises(
        OAuthReauthorizationRequiredError
    ):
        GmailClient(
            settings=_settings(),
            access_token="   ",
        )