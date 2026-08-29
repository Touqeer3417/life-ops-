import uuid
from collections.abc import Collection
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.models.oauth_connection import (
    OAuthConnection,
    OAuthConnectionStatus,
    OAuthProvider,
)


class OAuthConnectionRepository:
    """Database access for user-owned OAuth connections."""

    def __init__(
        self,
        session: AsyncSession,
    ) -> None:
        self.session = session

    async def get_google_connection(
        self,
        user_id: uuid.UUID,
    ) -> OAuthConnection | None:
        result = await self.session.execute(
            select(
                OAuthConnection
            ).where(
                OAuthConnection.user_id
                == user_id,
                OAuthConnection.provider
                == OAuthProvider.GOOGLE.value,
            )
        )

        return (
            result.scalar_one_or_none()
        )

    async def get_by_state_hash(
        self,
        state_hash: str,
    ) -> OAuthConnection | None:
        normalized_hash = (
            state_hash.strip()
        )

        if not normalized_hash:
            return None

        result = await self.session.execute(
            select(
                OAuthConnection
            ).where(
                OAuthConnection.oauth_state_hash
                == normalized_hash,
                OAuthConnection.provider
                == OAuthProvider.GOOGLE.value,
            )
        )

        return (
            result.scalar_one_or_none()
        )

    async def create_google_connection(
        self,
        *,
        user_id: uuid.UUID,
    ) -> OAuthConnection:
        connection = OAuthConnection(
            user_id=user_id,
            provider=(
                OAuthProvider.GOOGLE.value
            ),
            status=(
                OAuthConnectionStatus
                .PENDING.value
            ),
        )

        self.session.add(
            connection
        )

        await self.session.flush()

        return connection

    async def set_pending_authorization(
        self,
        connection: OAuthConnection,
        *,
        state_hash: str,
        state_expires_at: datetime,
        scopes: Collection[str],
    ) -> OAuthConnection:
        normalized_scopes = self._normalize_scopes(
            scopes
        )

        connection.oauth_state_hash = (
            state_hash.strip()
        )
        connection.oauth_state_expires_at = (
            state_expires_at
        )
        connection.pending_scopes = (
            normalized_scopes
        )

        if not connection.is_connected:
            connection.status = (
                OAuthConnectionStatus
                .PENDING.value
            )

        connection.last_error_code = None
        connection.last_error_message = None

        await self.session.flush()

        return connection

    async def mark_connected(
        self,
        connection: OAuthConnection,
        *,
        access_token_encrypted: str,
        refresh_token_encrypted: (
            str | None
        ),
        token_type: str,
        token_expires_at: datetime,
        scopes: Collection[str],
        connected_at: datetime,
    ) -> OAuthConnection:
        connection.access_token_encrypted = (
            access_token_encrypted
        )

        if refresh_token_encrypted:
            connection.refresh_token_encrypted = (
                refresh_token_encrypted
            )

        connection.token_type = (
            token_type
        )
        connection.token_expires_at = (
            token_expires_at
        )
        connection.scopes = (
            self._normalize_scopes(
                scopes
            )
        )

        connection.status = (
            OAuthConnectionStatus
            .CONNECTED.value
        )
        connection.connected_at = (
            connected_at
        )
        connection.disconnected_at = None

        self._clear_oauth_state(
            connection
        )
        self._clear_error(
            connection
        )

        await self.session.flush()

        return connection

    async def update_refreshed_tokens(
        self,
        connection: OAuthConnection,
        *,
        access_token_encrypted: str,
        refresh_token_encrypted: (
            str | None
        ),
        token_type: str,
        token_expires_at: datetime,
        scopes: Collection[str] | None,
        refreshed_at: datetime,
    ) -> OAuthConnection:
        connection.access_token_encrypted = (
            access_token_encrypted
        )

        if refresh_token_encrypted:
            connection.refresh_token_encrypted = (
                refresh_token_encrypted
            )

        connection.token_type = (
            token_type
        )
        connection.token_expires_at = (
            token_expires_at
        )
        connection.last_refreshed_at = (
            refreshed_at
        )
        connection.status = (
            OAuthConnectionStatus
            .CONNECTED.value
        )

        if scopes is not None:
            normalized_scopes = (
                self._normalize_scopes(
                    scopes
                )
            )

            if normalized_scopes:
                connection.scopes = (
                    normalized_scopes
                )

        self._clear_error(
            connection
        )

        await self.session.flush()

        return connection

    async def mark_reauthorization_required(
        self,
        connection: OAuthConnection,
        *,
        error_code: str,
        error_message: str,
    ) -> OAuthConnection:
        connection.status = (
            OAuthConnectionStatus
            .REAUTH_REQUIRED.value
        )

        connection.access_token_encrypted = (
            None
        )
        connection.token_expires_at = (
            None
        )

        connection.last_error_code = (
            error_code[:128]
        )
        connection.last_error_message = (
            error_message
        )

        self._clear_oauth_state(
            connection
        )

        await self.session.flush()

        return connection

    async def mark_disconnected(
        self,
        connection: OAuthConnection,
        *,
        disconnected_at: datetime,
    ) -> OAuthConnection:
        connection.status = (
            OAuthConnectionStatus
            .DISCONNECTED.value
        )

        connection.access_token_encrypted = (
            None
        )
        connection.refresh_token_encrypted = (
            None
        )
        connection.token_type = None
        connection.token_expires_at = (
            None
        )
        connection.scopes = []
        connection.disconnected_at = (
            disconnected_at
        )
        connection.last_refreshed_at = (
            None
        )

        self._clear_oauth_state(
            connection
        )
        self._clear_error(
            connection
        )

        await self.session.flush()

        return connection

    async def clear_pending_authorization(
        self,
        connection: OAuthConnection,
    ) -> OAuthConnection:
        self._clear_oauth_state(
            connection
        )

        await self.session.flush()

        return connection

    async def set_error(
        self,
        connection: OAuthConnection,
        *,
        error_code: str,
        error_message: str,
    ) -> OAuthConnection:
        connection.last_error_code = (
            error_code[:128]
        )
        connection.last_error_message = (
            error_message
        )

        await self.session.flush()

        return connection

    @staticmethod
    def _normalize_scopes(
        scopes: Collection[str],
    ) -> list[str]:
        return sorted(
            {
                scope.strip()
                for scope in scopes
                if scope.strip()
            }
        )

    @staticmethod
    def _clear_oauth_state(
        connection: OAuthConnection,
    ) -> None:
        connection.oauth_state_hash = None
        connection.oauth_state_expires_at = (
            None
        )
        connection.pending_scopes = []

    @staticmethod
    def _clear_error(
        connection: OAuthConnection,
    ) -> None:
        connection.last_error_code = None
        connection.last_error_message = None