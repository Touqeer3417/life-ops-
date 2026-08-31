import re
from dataclasses import dataclass
from typing import Any
from urllib.parse import quote

import httpx

from app.core.config import Settings
from app.core.exceptions import (
    GmailMessageNotFoundError,
    GmailRateLimitError,
    GoogleGmailError,
    OAuthInsufficientScopeError,
    OAuthReauthorizationRequiredError,
)


GMAIL_API_BASE_URL = (
    "https://gmail.googleapis.com/"
    "gmail/v1/users/me"
)

GMAIL_MESSAGE_ID_PATTERN = re.compile(
    r"^[A-Za-z0-9_-]{1,256}$"
)

GMAIL_METADATA_HEADERS = (
    "From",
    "To",
    "Cc",
    "Bcc",
    "Reply-To",
    "Subject",
    "Date",
    "Message-ID",
    "List-Unsubscribe",
)

GMAIL_RATE_LIMIT_REASONS = frozenset(
    {
        "rateLimitExceeded",
        "userRateLimitExceeded",
        "dailyLimitExceeded",
        "quotaExceeded",
        "backendError",
    }
)

GMAIL_SCOPE_ERROR_REASONS = frozenset(
    {
        "insufficientPermissions",
        "forbidden",
    }
)


@dataclass(
    frozen=True,
    slots=True,
)
class GmailMessageReference:
    id: str
    thread_id: str


@dataclass(
    frozen=True,
    slots=True,
)
class GmailMessagePage:
    messages: list[
        GmailMessageReference
    ]

    next_page_token: (
        str | None
    )

    result_size_estimate: int


class GmailClient:
    """
    Low-level asynchronous Gmail REST API client.

    Responsibilities:
    - Gmail-native message search
    - pagination
    - metadata-only retrieval
    - selected full-message retrieval
    - safe upstream error translation

    This class does not:
    - persist messages
    - classify email intelligence
    - summarize email
    - expose OAuth tokens
    - authorize users

    Authorization and user ownership remain service-layer concerns.
    """

    def __init__(
        self,
        *,
        settings: Settings,
        access_token: str,
    ) -> None:
        normalized_token = (
            access_token.strip()
        )

        if not normalized_token:
            raise (
                OAuthReauthorizationRequiredError(
                    "Google access token "
                    "is missing"
                )
            )

        self._access_token = (
            normalized_token
        )

        self._timeout = (
            settings
            .google_gmail_api_timeout_seconds
        )

    async def list_messages(
        self,
        *,
        query: str | None = None,
        label_ids: tuple[
            str,
            ...,
        ] = (),
        max_results: int = 50,
        page_token: str | None = None,
        include_spam_trash: bool = False,
    ) -> GmailMessagePage:
        """
        Search/list Gmail messages using Gmail's native search syntax.

        Only message/thread identifiers are returned by this endpoint.
        Callers should fetch metadata for the small result set rather
        than downloading whole messages or entire mailboxes.
        """

        if (
            max_results < 1
            or max_results > 500
        ):
            raise ValueError(
                "max_results must be "
                "between 1 and 500"
            )

        normalized_query = (
            query.strip()
            if query
            else ""
        )

        if (
            normalized_query
            and len(
                normalized_query
            ) > 5000
        ):
            raise ValueError(
                "Gmail search query is "
                "too long"
            )

        normalized_labels = (
            self._normalize_label_ids(
                label_ids
            )
        )

        normalized_page_token = (
            page_token.strip()
            if page_token
            else ""
        )

        params: list[
            tuple[
                str,
                str,
            ]
        ] = [
            (
                "maxResults",
                str(
                    max_results
                ),
            ),
            (
                "includeSpamTrash",
                (
                    "true"
                    if include_spam_trash
                    else "false"
                ),
            ),
        ]

        if normalized_query:
            params.append(
                (
                    "q",
                    normalized_query,
                )
            )

        if normalized_page_token:
            params.append(
                (
                    "pageToken",
                    normalized_page_token,
                )
            )

        for label_id in normalized_labels:
            params.append(
                (
                    "labelIds",
                    label_id,
                )
            )

        payload = await self._request(
            "GET",
            "/messages",
            params=params,
        )

        raw_messages = payload.get(
            "messages",
            [],
        )

        if not isinstance(
            raw_messages,
            list,
        ):
            raise GoogleGmailError(
                "Gmail returned an invalid "
                "message-list response"
            )

        messages: list[
            GmailMessageReference
        ] = []

        for item in raw_messages:
            if not isinstance(
                item,
                dict,
            ):
                continue

            raw_message_id = item.get(
                "id"
            )

            raw_thread_id = item.get(
                "threadId"
            )

            if (
                not isinstance(
                    raw_message_id,
                    str,
                )
                or not isinstance(
                    raw_thread_id,
                    str,
                )
            ):
                continue

            message_id = (
                raw_message_id.strip()
            )

            thread_id = (
                raw_thread_id.strip()
            )

            if (
                not message_id
                or not thread_id
            ):
                continue

            messages.append(
                GmailMessageReference(
                    id=message_id,
                    thread_id=thread_id,
                )
            )

        raw_next_page_token = (
            payload.get(
                "nextPageToken"
            )
        )

        next_page_token = (
            raw_next_page_token.strip()
            if isinstance(
                raw_next_page_token,
                str,
            )
            and raw_next_page_token.strip()
            else None
        )

        raw_estimate = payload.get(
            "resultSizeEstimate",
            0,
        )

        result_size_estimate = (
            raw_estimate
            if (
                isinstance(
                    raw_estimate,
                    int,
                )
                and not isinstance(
                    raw_estimate,
                    bool,
                )
                and raw_estimate >= 0
            )
            else 0
        )

        return GmailMessagePage(
            messages=messages,
            next_page_token=(
                next_page_token
            ),
            result_size_estimate=(
                result_size_estimate
            ),
        )

    async def get_message_metadata(
        self,
        *,
        message_id: str,
    ) -> dict[
        str,
        Any,
    ]:
        """
        Fetch headers/snippet/labels without fetching the message body.

        This is the default Phase 4 retrieval path for search result
        inspection and deterministic classification.
        """

        normalized_message_id = (
            self._normalize_message_id(
                message_id
            )
        )

        params: list[
            tuple[
                str,
                str,
            ]
        ] = [
            (
                "format",
                "metadata",
            ),
        ]

        for header_name in (
            GMAIL_METADATA_HEADERS
        ):
            params.append(
                (
                    "metadataHeaders",
                    header_name,
                )
            )

        return await self._request(
            "GET",
            (
                "/messages/"
                f"{self._encode_identifier(normalized_message_id)}"
            ),
            params=params,
        )

    async def get_message_full(
        self,
        *,
        message_id: str,
    ) -> dict[
        str,
        Any,
    ]:
        """
        Fetch the selected Gmail message with its MIME payload.

        This should be used only when the service layer genuinely needs
        message content for a requested summary or structured extraction.

        The Gmail client does not persist the returned raw body.
        """

        normalized_message_id = (
            self._normalize_message_id(
                message_id
            )
        )

        return await self._request(
            "GET",
            (
                "/messages/"
                f"{self._encode_identifier(normalized_message_id)}"
            ),
            params=[
                (
                    "format",
                    "full",
                ),
            ],
        )

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: (
            list[
                tuple[
                    str,
                    str,
                ]
            ]
            | None
        ) = None,
    ) -> dict[
        str,
        Any,
    ]:
        try:
            async with httpx.AsyncClient(
                base_url=(
                    GMAIL_API_BASE_URL
                ),
                timeout=(
                    self._timeout
                ),
                headers={
                    "Authorization": (
                        "Bearer "
                        f"{self._access_token}"
                    ),
                    "Accept": (
                        "application/json"
                    ),
                },
            ) as client:
                response = (
                    await client.request(
                        method,
                        path,
                        params=params,
                    )
                )

        except (
            httpx.TimeoutException
        ) as exc:
            raise GoogleGmailError(
                "Gmail request timed out"
            ) from exc

        except (
            httpx.RequestError
        ) as exc:
            raise GoogleGmailError(
                "Unable to reach Gmail"
            ) from exc

        if not response.is_success:
            self._raise_api_error(
                response
            )

        if response.status_code == 204:
            return {}

        try:
            payload = response.json()

        except ValueError as exc:
            raise GoogleGmailError(
                "Gmail returned an invalid "
                "response"
            ) from exc

        if not isinstance(
            payload,
            dict,
        ):
            raise GoogleGmailError(
                "Gmail returned an unexpected "
                "response"
            )

        return payload

    @classmethod
    def _raise_api_error(
        cls,
        response: httpx.Response,
    ) -> None:
        reasons = (
            cls._extract_error_reasons(
                response
            )
        )

        status_code = (
            response.status_code
        )

        if status_code == 401:
            raise (
                OAuthReauthorizationRequiredError(
                    "Google authorization is "
                    "invalid or expired. "
                    "Reconnect your Google account."
                )
            )

        if status_code == 403:
            if (
                reasons
                & GMAIL_RATE_LIMIT_REASONS
            ):
                raise GmailRateLimitError()

            if (
                reasons
                & GMAIL_SCOPE_ERROR_REASONS
            ):
                raise (
                    OAuthInsufficientScopeError(
                        "The Google connection "
                        "does not grant the Gmail "
                        "permission required for "
                        "this action."
                    )
                )

            # Google sometimes reports scope failures without a stable
            # structured reason. Keep the external message generic rather
            # than forwarding Google's raw response to the frontend.
            if cls._response_mentions_scope(
                response
            ):
                raise (
                    OAuthInsufficientScopeError(
                        "The Google connection "
                        "does not grant the Gmail "
                        "permission required for "
                        "this action."
                    )
                )

            raise GoogleGmailError(
                "Google denied the "
                "Gmail operation"
            )

        if status_code == 404:
            raise (
                GmailMessageNotFoundError()
            )

        if status_code == 429:
            raise (
                GmailRateLimitError()
            )

        if (
            500
            <= status_code
            < 600
        ):
            raise GoogleGmailError(
                "Gmail is temporarily "
                "unavailable"
            )

        raise GoogleGmailError(
            "Gmail rejected the request"
        )

    @staticmethod
    def _extract_error_reasons(
        response: httpx.Response,
    ) -> set[str]:
        reasons: set[str] = set()

        try:
            payload = response.json()
        except ValueError:
            return reasons

        if not isinstance(
            payload,
            dict,
        ):
            return reasons

        error = payload.get(
            "error"
        )

        if not isinstance(
            error,
            dict,
        ):
            return reasons

        raw_errors = error.get(
            "errors"
        )

        if isinstance(
            raw_errors,
            list,
        ):
            for item in raw_errors:
                if not isinstance(
                    item,
                    dict,
                ):
                    continue

                raw_reason = item.get(
                    "reason"
                )

                if isinstance(
                    raw_reason,
                    str,
                ):
                    reason = (
                        raw_reason.strip()
                    )

                    if reason:
                        reasons.add(
                            reason
                        )

        details = error.get(
            "details"
        )

        if isinstance(
            details,
            list,
        ):
            for detail in details:
                if not isinstance(
                    detail,
                    dict,
                ):
                    continue

                raw_reason = detail.get(
                    "reason"
                )

                if isinstance(
                    raw_reason,
                    str,
                ):
                    reason = (
                        raw_reason.strip()
                    )

                    if reason:
                        reasons.add(
                            reason
                        )

        return reasons

    @staticmethod
    def _response_mentions_scope(
        response: httpx.Response,
    ) -> bool:
        """
        Detect scope-related 403 errors without returning Google's raw
        message to the caller.
        """

        try:
            payload = response.json()
        except ValueError:
            return False

        if not isinstance(
            payload,
            dict,
        ):
            return False

        error = payload.get(
            "error"
        )

        if not isinstance(
            error,
            dict,
        ):
            return False

        raw_message = error.get(
            "message"
        )

        if not isinstance(
            raw_message,
            str,
        ):
            return False

        normalized = (
            raw_message
            .strip()
            .lower()
        )

        return (
            "scope" in normalized
            or "permission" in normalized
        )

    @staticmethod
    def _normalize_message_id(
        message_id: str,
    ) -> str:
        normalized = (
            message_id.strip()
        )

        if not normalized:
            raise ValueError(
                "message_id cannot be empty"
            )

        if not (
            GMAIL_MESSAGE_ID_PATTERN
            .fullmatch(
                normalized
            )
        ):
            raise ValueError(
                "message_id has an invalid "
                "format"
            )

        return normalized

    @staticmethod
    def _normalize_label_ids(
        label_ids: tuple[
            str,
            ...,
        ],
    ) -> list[str]:
        if len(
            label_ids
        ) > 100:
            raise ValueError(
                "A maximum of 100 Gmail "
                "label IDs may be supplied"
            )

        normalized: list[
            str
        ] = []

        seen: set[
            str
        ] = set()

        for raw_label_id in label_ids:
            label_id = (
                raw_label_id.strip()
            )

            if not label_id:
                continue

            if len(
                label_id
            ) > 128:
                raise ValueError(
                    "Gmail label ID exceeds "
                    "128 characters"
                )

            if label_id in seen:
                continue

            seen.add(
                label_id
            )

            normalized.append(
                label_id
            )

        return normalized

    @staticmethod
    def _encode_identifier(
        value: str,
    ) -> str:
        return quote(
            value,
            safe="",
        )