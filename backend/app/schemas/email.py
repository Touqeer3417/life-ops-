from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Any

from pydantic import (
    BaseModel,
    Field,
    field_validator,
    model_validator,
)


GMAIL_MESSAGE_ID_PATTERN = (
    r"^[A-Za-z0-9_-]{1,256}$"
)


class EmailCategory(StrEnum):
    IMPORTANT = "important"
    BILL = "bill"
    SUBSCRIPTION = "subscription"
    DEADLINE = "deadline"
    BOOKING = "booking"
    UNIVERSITY = "university"
    RECEIPT = "receipt"
    OTHER = "other"


class EvidenceCertainty(StrEnum):
    CONFIRMED = "confirmed"
    INFERRED = "inferred"


class BillingFrequency(StrEnum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    OTHER = "other"


class EmailSearchRequest(BaseModel):
    """
    Structured, bounded Gmail search for the
    authenticated LifeOps user.

    The frontend or agent never supplies Gmail
    credentials or a Gmail user ID. Those remain
    backend-owned.
    """

    query: str | None = Field(
        default=None,
        max_length=1000,
    )

    sender: str | None = Field(
        default=None,
        max_length=320,
    )

    subject: str | None = Field(
        default=None,
        max_length=500,
    )

    after: date | datetime | None = None

    before: date | datetime | None = None

    label_ids: list[str] = Field(
        default_factory=list,
        max_length=20,
    )

    categories: list[EmailCategory] = Field(
        default_factory=list,
        max_length=8,
    )

    important_only: bool = False

    include_spam_trash: bool = False

    max_results: int = Field(
        default=20,
        ge=1,
        le=50,
    )

    page_token: str | None = Field(
        default=None,
        max_length=4096,
    )

    @field_validator(
        "query",
        "sender",
        "subject",
        "page_token",
        mode="before",
    )
    @classmethod
    def normalize_optional_text(
        cls,
        value: object,
    ) -> object:
        if not isinstance(
            value,
            str,
        ):
            return value

        normalized = " ".join(
            value.split()
        )

        return normalized or None

    @field_validator(
        "label_ids",
        mode="after",
    )
    @classmethod
    def normalize_label_ids(
        cls,
        values: list[str],
    ) -> list[str]:
        normalized: list[str] = []

        for value in values:
            label = value.strip()

            if not label:
                continue

            if len(label) > 128:
                raise ValueError(
                    "Gmail label IDs must not "
                    "exceed 128 characters"
                )

            if label not in normalized:
                normalized.append(
                    label
                )

        return normalized

    @model_validator(
        mode="after",
    )
    def validate_date_range(
        self,
    ) -> "EmailSearchRequest":
        if (
            self.after is None
            or self.before is None
        ):
            return self

        after_date = (
            self.after.date()
            if isinstance(
                self.after,
                datetime,
            )
            else self.after
        )

        before_date = (
            self.before.date()
            if isinstance(
                self.before,
                datetime,
            )
            else self.before
        )

        if before_date <= after_date:
            raise ValueError(
                "before must be later than after"
            )

        return self


class ImportantEmailRequest(BaseModel):
    after: date | datetime | None = None

    before: date | datetime | None = None

    include_spam_trash: bool = False

    max_results: int = Field(
        default=20,
        ge=1,
        le=50,
    )

    page_token: str | None = Field(
        default=None,
        max_length=4096,
    )

    @field_validator(
        "page_token",
        mode="before",
    )
    @classmethod
    def normalize_page_token(
        cls,
        value: object,
    ) -> object:
        if not isinstance(
            value,
            str,
        ):
            return value

        normalized = value.strip()

        return normalized or None

    @model_validator(
        mode="after",
    )
    def validate_date_range(
        self,
    ) -> "ImportantEmailRequest":
        if (
            self.after is None
            or self.before is None
        ):
            return self

        after_date = (
            self.after.date()
            if isinstance(
                self.after,
                datetime,
            )
            else self.after
        )

        before_date = (
            self.before.date()
            if isinstance(
                self.before,
                datetime,
            )
            else self.before
        )

        if before_date <= after_date:
            raise ValueError(
                "before must be later than after"
            )

        return self


class SubscriptionEvidence(BaseModel):
    """
    Structured subscription evidence extracted
    from one Gmail message.

    `certainty` is important because an invoice or
    receipt does not automatically prove that a
    subscription is currently active.
    """

    provider: str | None = Field(
        default=None,
        max_length=200,
    )

    product_plan: str | None = Field(
        default=None,
        max_length=300,
    )

    amount: Decimal | None = Field(
        default=None,
        ge=Decimal("0"),
    )

    currency: str | None = Field(
        default=None,
        min_length=3,
        max_length=3,
    )

    billing_frequency: (
        BillingFrequency | None
    ) = None

    renewal_date: date | None = None

    payment_date: date | None = None

    status: str | None = Field(
        default=None,
        max_length=100,
    )

    source_message_id: str = Field(
        min_length=1,
        max_length=256,
        pattern=GMAIL_MESSAGE_ID_PATTERN,
    )

    source_subject: str | None = Field(
        default=None,
        max_length=1000,
    )

    evidence: str | None = Field(
        default=None,
        max_length=1500,
    )

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )

    certainty: EvidenceCertainty

    @field_validator(
        "currency",
        mode="after",
    )
    @classmethod
    def normalize_currency(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return value.upper()


class EmailIntelligence(BaseModel):
    category: EmailCategory = (
        EmailCategory.OTHER
    )

    is_important: bool = False

    importance_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
    )

    summary: str | None = Field(
        default=None,
        max_length=3000,
    )

    what_happened: str | None = Field(
        default=None,
        max_length=1500,
    )

    why_it_matters: str | None = Field(
        default=None,
        max_length=1500,
    )

    relevant_date: datetime | None = None

    deadline: datetime | None = None

    amount: Decimal | None = Field(
        default=None,
        ge=Decimal("0"),
    )

    currency: str | None = Field(
        default=None,
        min_length=3,
        max_length=3,
    )

    required_action: str | None = Field(
        default=None,
        max_length=1000,
    )

    subscription: (
        SubscriptionEvidence | None
    ) = None

    @field_validator(
        "currency",
        mode="after",
    )
    @classmethod
    def normalize_currency(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return value.upper()


class EmailMetadataRead(BaseModel):
    """
    Sanitized Gmail metadata persisted by LifeOps.

    Raw email bodies and attachments are deliberately
    excluded from this API model.
    """

    id: str | None = None

    gmail_message_id: str = Field(
        min_length=1,
        max_length=256,
        pattern=GMAIL_MESSAGE_ID_PATTERN,
    )

    gmail_thread_id: str = Field(
        min_length=1,
        max_length=256,
        pattern=GMAIL_MESSAGE_ID_PATTERN,
    )

    rfc822_message_id: str | None = Field(
        default=None,
        max_length=998,
    )

    sender: str | None = None

    recipients: list[str] = Field(
        default_factory=list,
    )

    subject: str | None = None

    received_at: datetime | None = None

    snippet: str | None = None

    label_ids: list[str] = Field(
        default_factory=list,
    )

    category: EmailCategory = (
        EmailCategory.OTHER
    )

    is_important: bool = False

    importance_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
    )

    summary: str | None = None

    extracted_metadata: dict[
        str,
        Any,
    ] = Field(
        default_factory=dict,
    )

    processed_at: datetime

    created_at: datetime

    updated_at: datetime


class EmailSearchResponse(BaseModel):
    messages: list[
        EmailMetadataRead
    ] = Field(
        default_factory=list,
    )

    next_page_token: str | None = None

    result_size_estimate: int = Field(
        default=0,
        ge=0,
    )


class ImportantEmailResponse(BaseModel):
    messages: list[
        EmailMetadataRead
    ] = Field(
        default_factory=list,
    )

    next_page_token: str | None = None

    result_size_estimate: int = Field(
        default=0,
        ge=0,
    )


class EmailSummaryResponse(BaseModel):
    message: EmailMetadataRead

    intelligence: EmailIntelligence


class EmailMessageReference(BaseModel):
    message_id: str = Field(
        min_length=1,
        max_length=256,
        pattern=GMAIL_MESSAGE_ID_PATTERN,
    )