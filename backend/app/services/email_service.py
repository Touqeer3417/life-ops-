import asyncio
from dataclasses import dataclass
from datetime import (
    date,
    datetime,
    timezone,
)
from email.utils import (
    getaddresses,
    parsedate_to_datetime,
)
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.core.config import (
    GOOGLE_GMAIL_READ_SCOPES,
    Settings,
)
from app.core.exceptions import (
    GoogleGmailError,
    OAuthReauthorizationRequiredError,
    ValidationError,
)
from app.integrations.gmail_client import (
    GmailClient,
    GmailMessagePage,
)
from app.integrations.gmail_mime import (
    extract_gmail_body,
)
from app.models.email_metadata import (
    EmailMetadata,
)
from app.models.user import User
from app.repositories.email_metadata_repository import (
    EmailMetadataRepository,
    EmailMetadataUpsert,
)
from app.schemas.email import (
    EmailCategory,
    EmailIntelligence,
    EmailMetadataRead,
    EmailSearchRequest,
    EmailSearchResponse,
    EmailSummaryResponse,
    ImportantEmailRequest,
    ImportantEmailResponse,
)
from app.services.email_intelligence_service import (
    EmailIntelligenceService,
    EmailMetadataAssessment,
)
from app.services.google_integration_service import (
    GoogleIntegrationService,
)


IMPORTANT_CANDIDATE_QUERY = (
    "{"
    "is:important "
    "\"urgent\" "
    "\"action required\" "
    "\"deadline\" "
    "\"invoice\" "
    "\"payment due\" "
    "\"receipt\" "
    "\"renewal\" "
    "\"subscription\" "
    "\"interview\" "
    "\"internship\" "
    "\"university\" "
    "\"booking\""
    "}"
)


@dataclass(
    frozen=True,
    slots=True,
)
class ParsedGmailMetadata:
    gmail_message_id: str

    gmail_thread_id: str

    rfc822_message_id: (
        str | None
    )

    sender: str | None

    recipients: list[
        str
    ]

    subject: str | None

    received_at: (
        datetime | None
    )

    snippet: str | None

    label_ids: list[
        str
    ]


class EmailService:
    """
    Authenticated, user-scoped Gmail business logic.

    Privacy rules:
    - Gmail credentials are resolved only from current_user.id.
    - Access tokens never leave the backend integration layer.
    - Search uses Gmail-native query/pagination instead of mailbox dumps.
    - Search fetches metadata, not full bodies.
    - Full body retrieval occurs only for a selected summary/extraction.
    - Raw bodies and attachments are never persisted.
    """

    def __init__(
        self,
        session: AsyncSession,
        settings: Settings,
    ) -> None:
        self.session = session
        self.settings = settings

        self.integration_service = (
            GoogleIntegrationService(
                session,
                settings,
            )
        )

        self.repository = (
            EmailMetadataRepository(
                session
            )
        )

        self.intelligence_service = (
            EmailIntelligenceService(
                settings
            )
        )

    async def search(
        self,
        *,
        current_user: User,
        payload: EmailSearchRequest,
    ) -> EmailSearchResponse:
        client = await self._get_client(
            current_user
        )

        gmail_query = (
            self._build_gmail_query(
                payload
            )
        )

        requires_local_filtering = bool(
            payload.categories
            or payload.important_only
        )

        candidate_limit = (
            min(
                max(
                    payload.max_results * 3,
                    payload.max_results,
                ),
                150,
            )
            if requires_local_filtering
            else payload.max_results
        )

        try:
            page = await client.list_messages(
                query=(
                    gmail_query
                    or None
                ),
                label_ids=tuple(
                    payload.label_ids
                ),
                max_results=(
                    candidate_limit
                ),
                page_token=(
                    payload.page_token
                ),
                include_spam_trash=(
                    payload
                    .include_spam_trash
                ),
            )

            parsed_messages = (
                await self._fetch_metadata_page(
                    client=client,
                    page=page,
                )
            )

        except (
            OAuthReauthorizationRequiredError
        ):
            await self._mark_reauthorization(
                current_user
            )
            raise

        selected: list[
            tuple[
                ParsedGmailMetadata,
                EmailMetadataAssessment,
            ]
        ] = []

        requested_categories = {
            category.value
            for category
            in payload.categories
        }

        for parsed in parsed_messages:
            assessment = (
                self.intelligence_service
                .assess_metadata(
                    sender=parsed.sender,
                    subject=parsed.subject,
                    snippet=parsed.snippet,
                    label_ids=(
                        parsed.label_ids
                    ),
                )
            )

            if (
                requested_categories
                and assessment
                .category.value
                not in requested_categories
            ):
                continue

            if (
                payload.important_only
                and not assessment
                .is_important
            ):
                continue

            selected.append(
                (
                    parsed,
                    assessment,
                )
            )

            if (
                len(selected)
                >= payload.max_results
            ):
                break

        persisted: list[
            EmailMetadata
        ] = []

        for (
            parsed,
            assessment,
        ) in selected:
            metadata = (
                await self.repository
                .upsert_processed_metadata(
                    user_id=current_user.id,
                    data=(
                        self._to_upsert(
                            parsed=parsed,
                            assessment=(
                                assessment
                            ),
                        )
                    ),
                )
            )

            persisted.append(
                metadata
            )

        if persisted:
            await self.session.commit()

        return EmailSearchResponse(
            messages=[
                self._to_read_model(
                    item
                )
                for item in persisted
            ],
            next_page_token=(
                page.next_page_token
            ),
            result_size_estimate=(
                page.result_size_estimate
            ),
        )

    async def important(
        self,
        *,
        current_user: User,
        payload: ImportantEmailRequest,
    ) -> ImportantEmailResponse:
        """
        Retrieve a bounded set of LifeOps-important messages.

        We do not rely solely on Gmail's IMPORTANT label. Candidate
        retrieval combines Gmail's importance signal with LifeOps concepts
        such as bills, renewals, deadlines, university mail and interviews,
        then deterministic scoring filters the final results.
        """

        search_request = (
            EmailSearchRequest(
                query=None,
                sender=None,
                subject=None,
                after=payload.after,
                before=payload.before,
                label_ids=[],
                categories=[],
                important_only=True,
                include_spam_trash=(
                    payload
                    .include_spam_trash
                ),
                max_results=(
                    payload.max_results
                ),
                page_token=(
                    payload.page_token
                ),
            )
        )

        search_result = await self.search(
            current_user=current_user,
            payload=search_request,
        )

        return ImportantEmailResponse(
            messages=(
                search_result.messages
            ),
            next_page_token=(
                search_result
                .next_page_token
            ),
            result_size_estimate=(
                search_result
                .result_size_estimate
            ),
        )

    async def summarize_message(
        self,
        *,
        current_user: User,
        message_id: str,
    ) -> EmailSummaryResponse:
        """
        Fetch and analyze one selected Gmail message.

        This is the only Phase 4 path that needs the message body.
        Attachments are ignored by gmail_mime.py and raw message content
        is discarded after analysis.
        """

        normalized_message_id = (
            message_id.strip()
        )

        if not normalized_message_id:
            raise ValidationError(
                "message_id cannot be empty"
            )

        client = await self._get_client(
            current_user
        )

        try:
            raw_message = (
                await client
                .get_message_full(
                    message_id=(
                        normalized_message_id
                    ),
                )
            )

        except (
            OAuthReauthorizationRequiredError
        ):
            await self._mark_reauthorization(
                current_user
            )
            raise

        parsed = self._parse_metadata(
            raw_message
        )

        raw_payload = raw_message.get(
            "payload",
            {},
        )

        if not isinstance(
            raw_payload,
            dict,
        ):
            raise GoogleGmailError(
                "Gmail returned an invalid "
                "message payload"
            )

        parsed_body = (
            extract_gmail_body(
                raw_payload,
                max_chars=(
                    self.settings
                    .gmail_max_body_chars
                ),
            )
        )

        intelligence = (
            await self.intelligence_service
            .analyze_message(
                gmail_message_id=(
                    parsed.gmail_message_id
                ),
                sender=parsed.sender,
                recipients=(
                    parsed.recipients
                ),
                subject=parsed.subject,
                received_at=(
                    parsed.received_at
                ),
                snippet=parsed.snippet,
                label_ids=(
                    parsed.label_ids
                ),
                body_text=(
                    parsed_body.text
                ),
            )
        )

        metadata = (
            await self.repository
            .upsert_processed_metadata(
                user_id=current_user.id,
                data=(
                    self._to_analyzed_upsert(
                        parsed=parsed,
                        intelligence=(
                            intelligence
                        ),
                    )
                ),
            )
        )

        await self.session.commit()

        return EmailSummaryResponse(
            message=(
                self._to_read_model(
                    metadata
                )
            ),
            intelligence=(
                intelligence
            ),
        )

    async def _get_client(
        self,
        current_user: User,
    ) -> GmailClient:
        access_token = (
            await self.integration_service
            .get_valid_access_token(
                user_id=current_user.id,
                required_scopes=(
                    GOOGLE_GMAIL_READ_SCOPES
                ),
            )
        )

        return GmailClient(
            settings=self.settings,
            access_token=access_token,
        )

    async def _fetch_metadata_page(
        self,
        *,
        client: GmailClient,
        page: GmailMessagePage,
    ) -> list[
        ParsedGmailMetadata
    ]:
        semaphore = asyncio.Semaphore(
            self.settings
            .gmail_metadata_fetch_concurrency
        )

        async def fetch_one(
            message_id: str,
        ) -> ParsedGmailMetadata:
            async with semaphore:
                raw = (
                    await client
                    .get_message_metadata(
                        message_id=(
                            message_id
                        )
                    )
                )

            return (
                self._parse_metadata(
                    raw
                )
            )

        if not page.messages:
            return []

        return list(
            await asyncio.gather(
                *[
                    fetch_one(
                        message.id
                    )
                    for message
                    in page.messages
                ]
            )
        )

    def _build_gmail_query(
        self,
        payload: EmailSearchRequest,
    ) -> str:
        parts: list[
            str
        ] = []

        if payload.query:
            parts.append(
                payload.query.strip()
            )

        if payload.sender:
            parts.append(
                "from:"
                f"{self._gmail_quote(payload.sender)}"
            )

        if payload.subject:
            parts.append(
                "subject:"
                f"{self._gmail_quote(payload.subject)}"
            )

        if payload.after:
            parts.append(
                "after:"
                f"{self._format_gmail_date(payload.after)}"
            )

        if payload.before:
            parts.append(
                "before:"
                f"{self._format_gmail_date(payload.before)}"
            )

        if (
            payload.important_only
            and not payload.query
        ):
            parts.append(
                IMPORTANT_CANDIDATE_QUERY
            )

        return " ".join(
            part
            for part in parts
            if part
        ).strip()

    @staticmethod
    def _gmail_quote(
        value: str,
    ) -> str:
        normalized = " ".join(
            value.split()
        )

        escaped = (
            normalized
            .replace(
                "\\",
                "\\\\",
            )
            .replace(
                '"',
                '\\"',
            )
        )

        return f'"{escaped}"'

    @staticmethod
    def _format_gmail_date(
        value: date | datetime,
    ) -> str:
        if isinstance(
            value,
            datetime,
        ):
            value = value.date()

        return value.strftime(
            "%Y/%m/%d"
        )

    @classmethod
    def _parse_metadata(
        cls,
        raw_message: dict[
            str,
            Any,
        ],
    ) -> ParsedGmailMetadata:
        raw_message_id = (
            raw_message.get(
                "id"
            )
        )

        raw_thread_id = (
            raw_message.get(
                "threadId"
            )
        )

        if (
            not isinstance(
                raw_message_id,
                str,
            )
            or not raw_message_id.strip()
        ):
            raise GoogleGmailError(
                "Gmail returned a message "
                "without an ID"
            )

        if (
            not isinstance(
                raw_thread_id,
                str,
            )
            or not raw_thread_id.strip()
        ):
            raise GoogleGmailError(
                "Gmail returned a message "
                "without a thread ID"
            )

        payload = raw_message.get(
            "payload",
            {},
        )

        if not isinstance(
            payload,
            dict,
        ):
            payload = {}

        headers = (
            cls._extract_headers(
                payload
            )
        )

        sender = (
            cls._first_header(
                headers,
                "from",
            )
        )

        subject = (
            cls._first_header(
                headers,
                "subject",
            )
        )

        rfc822_message_id = (
            cls._first_header(
                headers,
                "message-id",
            )
        )

        recipient_headers: list[
            str
        ] = []

        for header_name in (
            "to",
            "cc",
            "bcc",
        ):
            recipient_headers.extend(
                headers.get(
                    header_name,
                    [],
                )
            )

        recipients = (
            cls._parse_recipients(
                recipient_headers
            )
        )

        received_at = (
            cls._parse_received_at(
                headers=headers,
                raw_internal_date=(
                    raw_message.get(
                        "internalDate"
                    )
                ),
            )
        )

        raw_snippet = raw_message.get(
            "snippet"
        )

        snippet = (
            " ".join(
                raw_snippet.split()
            )
            if isinstance(
                raw_snippet,
                str,
            )
            and raw_snippet.strip()
            else None
        )

        raw_labels = raw_message.get(
            "labelIds",
            [],
        )

        label_ids: list[
            str
        ] = []

        if isinstance(
            raw_labels,
            list,
        ):
            label_ids = [
                label.strip()
                for label
                in raw_labels
                if isinstance(
                    label,
                    str,
                )
                and label.strip()
            ]

        return ParsedGmailMetadata(
            gmail_message_id=(
                raw_message_id.strip()
            ),
            gmail_thread_id=(
                raw_thread_id.strip()
            ),
            rfc822_message_id=(
                rfc822_message_id
            ),
            sender=sender,
            recipients=recipients,
            subject=subject,
            received_at=received_at,
            snippet=snippet,
            label_ids=label_ids,
        )

    @staticmethod
    def _extract_headers(
        payload: dict[
            str,
            Any,
        ],
    ) -> dict[
        str,
        list[str],
    ]:
        raw_headers = payload.get(
            "headers",
            [],
        )

        result: dict[
            str,
            list[str],
        ] = {}

        if not isinstance(
            raw_headers,
            list,
        ):
            return result

        for raw_header in raw_headers:
            if not isinstance(
                raw_header,
                dict,
            ):
                continue

            raw_name = raw_header.get(
                "name"
            )

            raw_value = raw_header.get(
                "value"
            )

            if (
                not isinstance(
                    raw_name,
                    str,
                )
                or not isinstance(
                    raw_value,
                    str,
                )
            ):
                continue

            name = (
                raw_name
                .strip()
                .lower()
            )

            value = (
                raw_value.strip()
            )

            if not name or not value:
                continue

            result.setdefault(
                name,
                [],
            ).append(
                value
            )

        return result

    @staticmethod
    def _first_header(
        headers: dict[
            str,
            list[str],
        ],
        name: str,
    ) -> str | None:
        values = headers.get(
            name,
            [],
        )

        if not values:
            return None

        return values[0]

    @staticmethod
    def _parse_recipients(
        header_values: list[str],
    ) -> list[str]:
        parsed = getaddresses(
            header_values
        )

        result: list[
            str
        ] = []

        seen: set[
            str
        ] = set()

        for _, address in parsed:
            normalized = (
                address.strip()
                .lower()
            )

            if (
                not normalized
                or normalized in seen
            ):
                continue

            seen.add(
                normalized
            )

            result.append(
                normalized[
                    :320
                ]
            )

        return result

    @staticmethod
    def _parse_received_at(
        *,
        headers: dict[
            str,
            list[str],
        ],
        raw_internal_date: Any,
    ) -> datetime | None:
        date_headers = headers.get(
            "date",
            [],
        )

        if date_headers:
            try:
                parsed = (
                    parsedate_to_datetime(
                        date_headers[0]
                    )
                )

                if parsed.tzinfo is None:
                    parsed = parsed.replace(
                        tzinfo=timezone.utc
                    )

                return (
                    parsed.astimezone(
                        timezone.utc
                    )
                )

            except (
                TypeError,
                ValueError,
                OverflowError,
            ):
                pass

        if isinstance(
            raw_internal_date,
            str,
        ):
            try:
                milliseconds = int(
                    raw_internal_date
                )

                return datetime.fromtimestamp(
                    milliseconds / 1000,
                    tz=timezone.utc,
                )

            except (
                ValueError,
                OSError,
                OverflowError,
            ):
                pass

        return None

    @staticmethod
    def _to_upsert(
        *,
        parsed: ParsedGmailMetadata,
        assessment: EmailMetadataAssessment,
    ) -> EmailMetadataUpsert:
        return EmailMetadataUpsert(
            gmail_message_id=(
                parsed.gmail_message_id
            ),
            gmail_thread_id=(
                parsed.gmail_thread_id
            ),
            rfc822_message_id=(
                parsed.rfc822_message_id
            ),
            sender=parsed.sender,
            recipients=(
                parsed.recipients
            ),
            subject=parsed.subject,
            received_at=(
                parsed.received_at
            ),
            snippet=parsed.snippet,
            label_ids=(
                parsed.label_ids
            ),
            category=(
                assessment.category.value
            ),
            is_important=(
                assessment.is_important
            ),
            importance_score=(
                assessment
                .importance_score
            ),
            summary=(
                assessment.summary
            ),
            extracted_metadata={
                "subscription_hint": (
                    assessment
                    .subscription_hint
                ),
            },
        )

    @staticmethod
    def _to_analyzed_upsert(
        *,
        parsed: ParsedGmailMetadata,
        intelligence: EmailIntelligence,
    ) -> EmailMetadataUpsert:
        return EmailMetadataUpsert(
            gmail_message_id=(
                parsed.gmail_message_id
            ),
            gmail_thread_id=(
                parsed.gmail_thread_id
            ),
            rfc822_message_id=(
                parsed.rfc822_message_id
            ),
            sender=parsed.sender,
            recipients=(
                parsed.recipients
            ),
            subject=parsed.subject,
            received_at=(
                parsed.received_at
            ),
            snippet=parsed.snippet,
            label_ids=(
                parsed.label_ids
            ),
            category=(
                intelligence.category.value
            ),
            is_important=(
                intelligence.importance_score
                >= 0.60
            ),
            importance_score=(
                intelligence
                .importance_score
            ),
            summary=(
                intelligence.summary
            ),
            extracted_metadata=(
                intelligence.model_dump(
                    mode="json"
                )
            ),
        )

    @staticmethod
    def _to_read_model(
        metadata: EmailMetadata,
    ) -> EmailMetadataRead:
        return EmailMetadataRead.model_validate(
            {
                "id": str(
                    metadata.id
                ),
                "gmail_message_id": (
                    metadata
                    .gmail_message_id
                ),
                "gmail_thread_id": (
                    metadata
                    .gmail_thread_id
                ),
                "rfc822_message_id": (
                    metadata
                    .rfc822_message_id
                ),
                "sender": (
                    metadata.sender
                ),
                "recipients": list(
                    metadata.recipients
                    or []
                ),
                "subject": (
                    metadata.subject
                ),
                "received_at": (
                    metadata.received_at
                ),
                "snippet": (
                    metadata.snippet
                ),
                "label_ids": list(
                    metadata.label_ids
                    or []
                ),
                "category": (
                    metadata.category
                ),
                "is_important": (
                    metadata
                    .is_important
                ),
                "importance_score": (
                    metadata
                    .importance_score
                ),
                "summary": (
                    metadata.summary
                ),
                "extracted_metadata": (
                    metadata
                    .extracted_metadata
                    or {}
                ),
                "processed_at": (
                    metadata.processed_at
                ),
                "created_at": (
                    metadata.created_at
                ),
                "updated_at": (
                    metadata.updated_at
                ),
            }
        )

    async def _mark_reauthorization(
        self,
        current_user: User,
    ) -> None:
        await (
            self.integration_service
            .mark_reauthorization_required(
                user_id=current_user.id,
                error_code=(
                    "google_gmail_unauthorized"
                ),
                error_message=(
                    "Gmail rejected the stored "
                    "Google authorization. "
                    "Reconnect the Google account."
                ),
            )
        )