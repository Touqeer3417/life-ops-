import uuid
from datetime import datetime
from typing import (
    TYPE_CHECKING,
    Any,
)

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import (
    ARRAY,
    JSONB,
    UUID,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import (
    Base,
    TimestampMixin,
)

if TYPE_CHECKING:
    from app.models.user import User


class EmailMetadata(
    TimestampMixin,
    Base,
):
    """
    Processed LifeOps-relevant Gmail metadata.

    Full raw Gmail messages and attachments are intentionally not
    persisted. Message bodies are fetched lazily when a selected email
    needs summarization/extraction and are discarded after processing.
    """

    __tablename__ = (
        "email_metadata"
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "gmail_message_id",
            name=(
                "uq_email_metadata_"
                "user_id_gmail_message_id"
            ),
        ),
        CheckConstraint(
            "category IN ("
            "'important', "
            "'bill', "
            "'subscription', "
            "'deadline', "
            "'booking', "
            "'university', "
            "'receipt', "
            "'other'"
            ")",
            name=(
                "email_metadata_category_valid"
            ),
        ),
        CheckConstraint(
            "importance_score >= 0 "
            "AND importance_score <= 1",
            name=(
                "email_metadata_"
                "importance_score_valid"
            ),
        ),
        Index(
            "ix_email_metadata_"
            "user_received_at",
            "user_id",
            "received_at",
        ),
        Index(
            "ix_email_metadata_"
            "user_category_received_at",
            "user_id",
            "category",
            "received_at",
        ),
        Index(
            "ix_email_metadata_"
            "user_important_received_at",
            "user_id",
            "is_important",
            "received_at",
        ),
    )

    id: Mapped[
        uuid.UUID
    ] = mapped_column(
        UUID(
            as_uuid=True
        ),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[
        uuid.UUID
    ] = mapped_column(
        UUID(
            as_uuid=True
        ),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    gmail_message_id: Mapped[
        str
    ] = mapped_column(
        String(256),
        nullable=False,
    )

    gmail_thread_id: Mapped[
        str
    ] = mapped_column(
        String(256),
        nullable=False,
    )

    rfc822_message_id: Mapped[
        str | None
    ] = mapped_column(
        String(998),
        nullable=True,
    )

    sender: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    recipients: Mapped[
        list[str]
    ] = mapped_column(
        ARRAY(
            String(320)
        ),
        nullable=False,
        default=list,
        server_default=text(
            "ARRAY[]::varchar[]"
        ),
    )

    subject: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    received_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime(
            timezone=True
        ),
        nullable=True,
    )

    snippet: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    label_ids: Mapped[
        list[str]
    ] = mapped_column(
        ARRAY(
            String(128)
        ),
        nullable=False,
        default=list,
        server_default=text(
            "ARRAY[]::varchar[]"
        ),
    )

    category: Mapped[
        str
    ] = mapped_column(
        String(32),
        nullable=False,
        default="other",
        server_default="other",
    )

    is_important: Mapped[
        bool
    ] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    importance_score: Mapped[
        float
    ] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
        server_default="0",
    )

    summary: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    extracted_metadata: Mapped[
        dict[str, Any]
    ] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text(
            "'{}'::jsonb"
        ),
    )

    processed_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime(
            timezone=True
        ),
        nullable=False,
        default=lambda: datetime.now(
            tz=datetime.now().astimezone().tzinfo
        ),
        server_default=func.now(),
    )

    user: Mapped[
        "User"
    ] = relationship(
        lazy="selectin",
    )