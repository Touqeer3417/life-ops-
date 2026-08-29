import uuid
from collections.abc import Collection
from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class OAuthProvider(StrEnum):
    GOOGLE = "google"


class OAuthConnectionStatus(StrEnum):
    PENDING = "pending"
    CONNECTED = "connected"
    REAUTH_REQUIRED = "reauth_required"
    DISCONNECTED = "disconnected"


class OAuthConnection(TimestampMixin, Base):
    """
    Server-side OAuth authorization owned by one LifeOps user.

    Tokens stored on this model must always be encrypted before persistence.
    Raw Google access/refresh tokens must never be returned to the frontend.

    One Google authorization is stored per LifeOps user. Future Google
    integrations, such as Gmail, can extend the granted scopes on the same
    authorization instead of creating independent copies of the user's
    Google refresh token.
    """

    __tablename__ = "oauth_connections"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "provider",
            name="uq_oauth_connections_user_id_provider",
        ),
        CheckConstraint(
            "status IN "
            "('pending', 'connected', "
            "'reauth_required', 'disconnected')",
            name="oauth_connection_status_valid",
        ),
        CheckConstraint(
            "provider IN ('google')",
            name="oauth_connection_provider_valid",
        ),
        Index(
            "ix_oauth_connections_user_id_status",
            "user_id",
            "status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    provider: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=OAuthProvider.GOOGLE.value,
        server_default=OAuthProvider.GOOGLE.value,
    )

    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=OAuthConnectionStatus.PENDING.value,
        server_default=OAuthConnectionStatus.PENDING.value,
    )

    access_token_encrypted: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    refresh_token_encrypted: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    token_type: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
    )

    token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    scopes: Mapped[list[str]] = mapped_column(
        ARRAY(String(255)),
        nullable=False,
        default=list,
        server_default=text(
            "ARRAY[]::varchar[]"
        ),
    )

    oauth_state_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        unique=True,
        index=True,
    )

    oauth_state_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    pending_scopes: Mapped[list[str]] = mapped_column(
        ARRAY(String(255)),
        nullable=False,
        default=list,
        server_default=text(
            "ARRAY[]::varchar[]"
        ),
    )

    connected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    last_refreshed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    disconnected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    last_error_code: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
    )

    last_error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    user: Mapped["User"] = relationship(
        lazy="selectin",
    )

    @property
    def is_connected(self) -> bool:
        return (
            self.status
            == OAuthConnectionStatus.CONNECTED.value
        )

    @property
    def requires_reauthorization(self) -> bool:
        return (
            self.status
            == OAuthConnectionStatus.REAUTH_REQUIRED.value
        )

    @property
    def has_refresh_token(self) -> bool:
        return bool(
            self.refresh_token_encrypted
        )

    @property
    def has_pending_oauth_state(self) -> bool:
        return bool(
            self.oauth_state_hash
            and self.oauth_state_expires_at
        )

    def has_scopes(
        self,
        required_scopes: Collection[str],
    ) -> bool:
        granted = set(self.scopes)
        required = set(required_scopes)
        return required.issubset(granted)