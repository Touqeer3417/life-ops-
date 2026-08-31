import uuid
from datetime import (
    date,
    datetime,
    timezone,
)
from typing import Any

import pytest

from app.core.config import (
    GOOGLE_GMAIL_READ_SCOPES,
    Settings,
)
from app.integrations.gmail_client import (
    GmailMessagePage,
    GmailMessageReference,
)
from app.models.user import User
from app.schemas.email import (
    EmailCategory,
    EmailSearchRequest,
)
from app.services.email_intelligence_service import (
    EmailMetadataAssessment,
)
from app.services.email_service import (
    EmailService,
    ParsedGmailMetadata,
)


def _settings() -> Settings:
    return Settings(
        app_env="test",
        gmail_metadata_fetch_concurrency=2,
        google_gmail_api_timeout_seconds=(
            2.0
        ),
    )


def _user() -> User:
    return User(
        id=uuid.uuid4(),
        auth0_subject=(
            "auth0|phase4-test-user"
        ),
        email=(
            "phase4@example.com"
        ),
        full_name=(
            "Phase 4 Test User"
        ),
        is_active=True,
        is_email_verified=True,
    )


def _service_without_init() -> EmailService:
    service = object.__new__(
        EmailService
    )

    service.settings = (
        _settings()
    )

    return service


@pytest.mark.asyncio
async def test_get_client_requests_gmail_scope_for_authenticated_user(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    current_user = _user()

    captured: dict[
        str,
        Any,
    ] = {}

    class FakeIntegrationService:
        async def get_valid_access_token(
            self,
            *,
            user_id,
            required_scopes,
        ) -> str:
            captured[
                "user_id"
            ] = user_id

            captured[
                "required_scopes"
            ] = tuple(
                required_scopes
            )

            return (
                "server-side-token"
            )

    class FakeGmailClient:
        def __init__(
            self,
            *,
            settings,
            access_token,
        ) -> None:
            captured[
                "settings"
            ] = settings

            captured[
                "access_token"
            ] = access_token

    monkeypatch.setattr(
        (
            "app.services.email_service."
            "GmailClient"
        ),
        FakeGmailClient,
    )

    service = (
        _service_without_init()
    )

    service.integration_service = (
        FakeIntegrationService()
    )

    await service._get_client(
        current_user
    )

    assert (
        captured["user_id"]
        == current_user.id
    )

    assert (
        captured[
            "required_scopes"
        ]
        == tuple(
            GOOGLE_GMAIL_READ_SCOPES
        )
    )

    assert (
        captured["access_token"]
        == "server-side-token"
    )


def test_build_gmail_query_supports_sender_subject_and_dates() -> None:
    service = (
        _service_without_init()
    )

    payload = (
        EmailSearchRequest(
            query="renewal",
            sender="billing@example.com",
            subject="Hosting Invoice",
            after=date(
                2026,
                8,
                1,
            ),
            before=date(
                2026,
                9,
                1,
            ),
            label_ids=[],
            categories=[],
            important_only=False,
            include_spam_trash=False,
            max_results=10,
            page_token=None,
        )
    )

    query = (
        service._build_gmail_query(
            payload
        )
    )

    assert "renewal" in query

    assert (
        'from:"billing@example.com"'
        in query
    )

    assert (
        'subject:"Hosting Invoice"'
        in query
    )

    assert (
        "after:2026/08/01"
        in query
    )

    assert (
        "before:2026/09/01"
        in query
    )


def test_important_query_uses_lifeops_candidate_terms() -> None:
    service = (
        _service_without_init()
    )

    payload = (
        EmailSearchRequest(
            important_only=True,
            max_results=10,
        )
    )

    query = (
        service._build_gmail_query(
            payload
        )
    )

    assert "is:important" in query

    assert "renewal" in query

    assert "deadline" in query

    assert "invoice" in query

    assert "internship" in query

    assert "university" in query


def test_user_supplied_search_query_is_preserved() -> None:
    service = (
        _service_without_init()
    )

    payload = (
        EmailSearchRequest(
            query=(
                'from:hostinger '
                '"renewal notice"'
            ),
            max_results=10,
        )
    )

    query = (
        service._build_gmail_query(
            payload
        )
    )

    assert (
        'from:hostinger '
        '"renewal notice"'
        in query
    )


def test_parse_metadata_extracts_headers_recipients_and_timestamp() -> None:
    raw_message = {
        "id": "message123",
        "threadId": (
            "thread123"
        ),
        "internalDate": (
            "1788170400000"
        ),
        "labelIds": [
            "INBOX",
            "IMPORTANT",
        ],
        "snippet": (
            "Your hosting plan "
            "renews soon."
        ),
        "payload": {
            "headers": [
                {
                    "name": "From",
                    "value": (
                        "Hostinger Billing "
                        "<billing@hostinger.com>"
                    ),
                },
                {
                    "name": "To",
                    "value": (
                        "One <one@example.com>, "
                        "Two <two@example.com>"
                    ),
                },
                {
                    "name": "Cc",
                    "value": (
                        "three@example.com"
                    ),
                },
                {
                    "name": "Subject",
                    "value": (
                        "Hosting Renewal"
                    ),
                },
                {
                    "name": "Date",
                    "value": (
                        "Mon, 31 Aug 2026 "
                        "10:00:00 +0000"
                    ),
                },
                {
                    "name": (
                        "Message-ID"
                    ),
                    "value": (
                        "<mail-123@example.com>"
                    ),
                },
            ]
        },
    }

    parsed = (
        EmailService._parse_metadata(
            raw_message
        )
    )

    assert (
        parsed.gmail_message_id
        == "message123"
    )

    assert (
        parsed.gmail_thread_id
        == "thread123"
    )

    assert (
        parsed.sender
        == (
            "Hostinger Billing "
            "<billing@hostinger.com>"
        )
    )

    assert (
        parsed.subject
        == "Hosting Renewal"
    )

    assert parsed.recipients == [
        "one@example.com",
        "two@example.com",
        "three@example.com",
    ]

    assert (
        parsed.rfc822_message_id
        == "<mail-123@example.com>"
    )

    assert parsed.received_at == (
        datetime(
            2026,
            8,
            31,
            10,
            0,
            tzinfo=timezone.utc,
        )
    )

    assert parsed.label_ids == [
        "INBOX",
        "IMPORTANT",
    ]


@pytest.mark.asyncio
async def test_metadata_page_never_fetches_full_message_body() -> None:
    class MetadataOnlyClient:
        def __init__(
            self,
        ) -> None:
            self.metadata_calls: list[
                str
            ] = []

            self.full_calls: list[
                str
            ] = []

        async def get_message_metadata(
            self,
            *,
            message_id: str,
        ) -> dict[
            str,
            Any,
        ]:
            self.metadata_calls.append(
                message_id
            )

            return {
                "id": message_id,
                "threadId": (
                    f"thread-{message_id}"
                ),
                "internalDate": (
                    "1788170400000"
                ),
                "labelIds": [
                    "INBOX"
                ],
                "snippet": (
                    "Metadata-only snippet"
                ),
                "payload": {
                    "headers": [
                        {
                            "name": (
                                "Subject"
                            ),
                            "value": (
                                "Metadata test"
                            ),
                        },
                    ],
                },
            }

        async def get_message_full(
            self,
            *,
            message_id: str,
        ):
            self.full_calls.append(
                message_id
            )

            raise AssertionError(
                "Search must not fetch "
                "full Gmail messages"
            )

    fake_client = (
        MetadataOnlyClient()
    )

    page = GmailMessagePage(
        messages=[
            GmailMessageReference(
                id="message1",
                thread_id=(
                    "thread1"
                ),
            ),
            GmailMessageReference(
                id="message2",
                thread_id=(
                    "thread2"
                ),
            ),
        ],
        next_page_token=None,
        result_size_estimate=2,
    )

    service = (
        _service_without_init()
    )

    results = (
        await service
        ._fetch_metadata_page(
            client=fake_client,
            page=page,
        )
    )

    assert len(
        results
    ) == 2

    assert set(
        fake_client.metadata_calls
    ) == {
        "message1",
        "message2",
    }

    assert (
        fake_client.full_calls
        == []
    )


def test_metadata_upsert_contains_no_raw_body_or_attachment_data() -> None:
    parsed = (
        ParsedGmailMetadata(
            gmail_message_id=(
                "message123"
            ),
            gmail_thread_id=(
                "thread123"
            ),
            rfc822_message_id=(
                "<123@example.com>"
            ),
            sender=(
                "billing@example.com"
            ),
            recipients=[
                "user@example.com"
            ],
            subject=(
                "Hosting renewal"
            ),
            received_at=(
                datetime(
                    2026,
                    8,
                    31,
                    10,
                    0,
                    tzinfo=timezone.utc,
                )
            ),
            snippet=(
                "Your plan renews soon"
            ),
            label_ids=[
                "INBOX"
            ],
        )
    )

    assessment = (
        EmailMetadataAssessment(
            category=(
                EmailCategory.SUBSCRIPTION
            ),
            importance_score=0.8,
            is_important=True,
            summary=(
                "Hosting renewal notice"
            ),
            subscription_hint=True,
        )
    )

    upsert = (
        EmailService._to_upsert(
            parsed=parsed,
            assessment=assessment,
        )
    )

    stored = vars(
        upsert
    )

    forbidden_names = {
        "body",
        "body_text",
        "raw_body",
        "raw_message",
        "attachment",
        "attachments",
        "mime_payload",
    }

    assert (
        forbidden_names
        .isdisjoint(
            stored.keys()
        )
    )

    assert (
        stored[
            "gmail_message_id"
        ]
        == "message123"
    )

    assert (
        stored[
            "extracted_metadata"
        ]
        == {
            "subscription_hint": True
        }
    )


def test_search_date_formatter_uses_gmail_date_format() -> None:
    assert (
        EmailService
        ._format_gmail_date(
            date(
                2026,
                8,
                31,
            )
        )
        == "2026/08/31"
    )


def test_gmail_quote_escapes_quotes() -> None:
    quoted = (
        EmailService
        ._gmail_quote(
            'Hostinger "Premium"'
        )
    )

    assert quoted == (
        '"Hostinger \\"Premium\\""'
    )