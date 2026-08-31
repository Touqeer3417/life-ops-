import hashlib
import logging
import secrets
import uuid
from collections.abc import Collection
from datetime import (
    datetime,
    timedelta,
    timezone,
)

from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.core.config import (
    GOOGLE_CALENDAR_READ_SCOPES,
    GOOGLE_CALENDAR_WRITE_SCOPES,
    GOOGLE_GMAIL_READ_SCOPES,
    Settings,
)
from app.core.exceptions import (
    GoogleOAuthError,
    OAuthConnectionRequiredError,
    OAuthInsufficientScopeError,
    OAuthReauthorizationRequiredError,
    OAuthStateError,
)
from app.integrations.google_oauth_client import (
    GoogleOAuthClient,
)
from app.integrations.token_cipher import (
    OAuthTokenCipher,
)
from app.models.oauth_connection import (
    OAuthConnection,
    OAuthConnectionStatus,
)
from app.models.user import User
from app.repositories.oauth_connection_repository import (
    OAuthConnectionRepository,
)
from app.schemas.google_integration import (
    GoogleCalendarAccessLevel,
    GoogleConnectRequest,
    GoogleConnectResponse,
    GoogleDisconnectResponse,
    GoogleIntegrationRead,
    GoogleOAuthCallbackResult,
    GoogleService,
)


logger = logging.getLogger(
    "lifeops.integrations.google"
)


ACCESS_TOKEN_REFRESH_MARGIN = timedelta(
    seconds=60
)


class GoogleIntegrationService:
    """
    Own the shared Google OAuth lifecycle for a LifeOps user.

    Auth0 authenticates the LifeOps user.

    Google OAuth is separate and grants access only to Google services
    explicitly approved by that authenticated user.

    Phase 3 and Phase 4 deliberately share:
    - one OAuthConnection row
    - one encrypted access token
    - one encrypted refresh token
    - one OAuth state lifecycle
    - one Google OAuth client

    Calendar and Gmail are represented only through different granted
    OAuth scopes.
    """

    def __init__(
        self,
        session: AsyncSession,
        settings: Settings,
    ) -> None:
        self.session = session
        self.settings = settings

        self.repository = (
            OAuthConnectionRepository(
                session
            )
        )

        self.oauth_client = (
            GoogleOAuthClient(
                settings
            )
        )

        self.token_cipher = (
            OAuthTokenCipher(
                settings
            )
        )

    async def get_status(
        self,
        user: User,
    ) -> GoogleIntegrationRead:
        connection = (
            await self.repository
            .get_google_connection(
                user.id
            )
        )

        if connection is None:
            return GoogleIntegrationRead(
                status=(
                    OAuthConnectionStatus
                    .DISCONNECTED.value
                ),
                connected=False,
                reauthorization_required=False,
                granted_scopes=[],
                can_read_calendar=False,
                can_check_availability=False,
                can_write_calendar=False,
                can_read_gmail=False,
            )

        return self._serialize_status(
            connection
        )

    async def create_authorization_url(
        self,
        user: User,
        payload: GoogleConnectRequest,
    ) -> GoogleConnectResponse:
        """
        Begin a Google OAuth flow.

        Existing granted scopes are included in the requested scope set.
        This is critical for incremental authorization: connecting Gmail
        later must not silently downgrade an existing Calendar connection.
        """

        connection = (
            await self.repository
            .get_google_connection(
                user.id
            )
        )

        if connection is None:
            connection = (
                await self.repository
                .create_google_connection(
                    user_id=user.id
                )
            )

        requested_scopes = (
            self._scopes_for_request(
                payload=payload,
                connection=connection,
            )
        )

        raw_state = secrets.token_urlsafe(
            48
        )

        state_hash = self._hash_state(
            raw_state
        )

        now = self._utc_now()

        state_expires_at = (
            now
            + timedelta(
                seconds=(
                    self.settings
                    .google_oauth_state_ttl_seconds
                )
            )
        )

        await (
            self.repository
            .set_pending_authorization(
                connection,
                state_hash=state_hash,
                state_expires_at=(
                    state_expires_at
                ),
                scopes=requested_scopes,
            )
        )

        await self.session.commit()

        force_consent = (
            payload.force_consent
            or not connection.has_refresh_token
            or connection.requires_reauthorization
        )

        authorization_url = (
            self.oauth_client
            .build_authorization_url(
                state=raw_state,
                scopes=tuple(
                    requested_scopes
                ),
                login_hint=user.email,
                force_consent=(
                    force_consent
                ),
            )
        )

        logger.info(
            "Created Google OAuth authorization "
            "request for user_id=%s services=%s "
            "calendar_access_level=%s",
            user.id,
            ",".join(
                service.value
                for service
                in payload.services
            ),
            payload.access_level.value,
        )

        return GoogleConnectResponse(
            authorization_url=(
                authorization_url
            ),
            expires_at=(
                state_expires_at
            ),
            requested_scopes=(
                requested_scopes
            ),
        )

    async def complete_authorization(
        self,
        *,
        state: str,
        code: str,
    ) -> GoogleOAuthCallbackResult:
        normalized_state = state.strip()

        if not normalized_state:
            raise OAuthStateError()

        state_hash = self._hash_state(
            normalized_state
        )

        connection = (
            await self.repository
            .get_by_state_hash(
                state_hash
            )
        )

        if connection is None:
            raise OAuthStateError()

        now = self._utc_now()

        if (
            connection.oauth_state_expires_at
            is None
            or connection.oauth_state_expires_at
            <= now
        ):
            await (
                self.repository
                .clear_pending_authorization(
                    connection
                )
            )

            await self.session.commit()

            raise OAuthStateError(
                "The Google OAuth request "
                "has expired"
            )

        pending_scopes = list(
            connection.pending_scopes
        )

        previous_scopes = list(
            connection.scopes
        )

        previous_refresh_token = (
            connection
            .refresh_token_encrypted
        )

        # Consume the state before contacting Google.
        #
        # This prevents replaying the same callback if the token exchange
        # fails or the callback is submitted more than once.
        await (
            self.repository
            .clear_pending_authorization(
                connection
            )
        )

        await self.session.commit()

        token_response = (
            await self.oauth_client
            .exchange_code(
                code
            )
        )

        refresh_token_encrypted = (
            self.token_cipher
            .encrypt_optional(
                token_response
                .refresh_token
            )
        )

        if (
            refresh_token_encrypted is None
            and previous_refresh_token is None
        ):
            await (
                self.repository
                .mark_reauthorization_required(
                    connection,
                    error_code=(
                        "refresh_token_missing"
                    ),
                    error_message=(
                        "Google did not provide "
                        "an offline refresh token"
                    ),
                )
            )

            await self.session.commit()

            raise (
                OAuthReauthorizationRequiredError(
                    "Google did not provide a "
                    "refresh token. Reconnect "
                    "Google and grant consent."
                )
            )

        if token_response.scopes:
            # Preserve already granted service scopes, while trusting the
            # OAuth token response for newly granted scopes.
            #
            # Do not blindly persist pending_scopes here because the user
            # may not have granted every newly requested permission.
            granted_scopes = (
                self._merge_scopes(
                    previous_scopes,
                    token_response.scopes,
                )
            )
        else:
            # Defensive fallback for OAuth providers/responses that omit
            # the scope field after a successful authorization.
            granted_scopes = (
                self._merge_scopes(
                    previous_scopes,
                    pending_scopes,
                )
            )

        token_expires_at = (
            now
            + timedelta(
                seconds=(
                    token_response
                    .expires_in
                )
            )
        )

        await (
            self.repository
            .mark_connected(
                connection,
                access_token_encrypted=(
                    self.token_cipher.encrypt(
                        token_response
                        .access_token
                    )
                ),
                refresh_token_encrypted=(
                    refresh_token_encrypted
                ),
                token_type=(
                    token_response
                    .token_type
                ),
                token_expires_at=(
                    token_expires_at
                ),
                scopes=granted_scopes,
                connected_at=now,
            )
        )

        await self.session.commit()

        logger.info(
            "Google OAuth connection completed "
            "for user_id=%s",
            connection.user_id,
        )

        return GoogleOAuthCallbackResult(
            status=(
                OAuthConnectionStatus
                .CONNECTED.value
            ),
            connected=True,
        )

    async def disconnect(
        self,
        user: User,
    ) -> GoogleDisconnectResponse:
        """
        Disconnect the complete Google integration.

        Calendar and Gmail share one Google OAuth connection, so this
        revokes the shared Google authorization and removes all locally
        stored Google credentials.
        """

        connection = (
            await self.repository
            .get_google_connection(
                user.id
            )
        )

        if connection is None:
            return GoogleDisconnectResponse(
                status=(
                    OAuthConnectionStatus
                    .DISCONNECTED.value
                ),
                disconnected=True,
                revocation_confirmed=True,
            )

        revocation_token = None

        if (
            connection
            .refresh_token_encrypted
        ):
            revocation_token = (
                self.token_cipher.decrypt(
                    connection
                    .refresh_token_encrypted
                )
            )

        elif (
            connection
            .access_token_encrypted
        ):
            revocation_token = (
                self.token_cipher.decrypt(
                    connection
                    .access_token_encrypted
                )
            )

        revocation_confirmed = True

        if revocation_token:
            try:
                await (
                    self.oauth_client
                    .revoke_token(
                        revocation_token
                    )
                )

            except GoogleOAuthError:
                # Local disconnect still succeeds.
                #
                # We must not retain encrypted credentials merely because
                # Google's revocation endpoint is temporarily unavailable.
                revocation_confirmed = False

                logger.warning(
                    "Unable to confirm Google OAuth "
                    "revocation for user_id=%s",
                    user.id,
                    exc_info=True,
                )

        await (
            self.repository
            .mark_disconnected(
                connection,
                disconnected_at=(
                    self._utc_now()
                ),
            )
        )

        await self.session.commit()

        logger.info(
            "Disconnected Google integration "
            "for user_id=%s "
            "revocation_confirmed=%s",
            user.id,
            revocation_confirmed,
        )

        return GoogleDisconnectResponse(
            status=(
                OAuthConnectionStatus
                .DISCONNECTED.value
            ),
            disconnected=True,
            revocation_confirmed=(
                revocation_confirmed
            ),
        )

    async def get_valid_access_token(
        self,
        *,
        user_id: uuid.UUID,
        required_scopes: Collection[str],
    ) -> str:
        """
        Return a decrypted, valid Google access token only after verifying
        that the user's Google connection owns all required capabilities.

        The decrypted token is returned only to internal integration code.
        It must never be returned by an API route, frontend response,
        agent tool result, or log statement.
        """

        connection = (
            await self.repository
            .get_google_connection(
                user_id
            )
        )

        if connection is None:
            raise (
                OAuthConnectionRequiredError()
            )

        if (
            connection
            .requires_reauthorization
        ):
            raise (
                OAuthReauthorizationRequiredError()
            )

        if not connection.is_connected:
            raise (
                OAuthConnectionRequiredError()
            )

        self._require_scopes(
            connection,
            required_scopes,
        )

        now = self._utc_now()

        if (
            connection
            .access_token_encrypted
            and connection.token_expires_at
            and connection.token_expires_at
            > (
                now
                + ACCESS_TOKEN_REFRESH_MARGIN
            )
        ):
            return (
                self.token_cipher.decrypt(
                    connection
                    .access_token_encrypted
                )
            )

        return (
            await self._refresh_access_token(
                connection
            )
        )

    async def mark_reauthorization_required(
        self,
        *,
        user_id: uuid.UUID,
        error_code: str,
        error_message: str,
    ) -> None:
        connection = (
            await self.repository
            .get_google_connection(
                user_id
            )
        )

        if connection is None:
            return

        await (
            self.repository
            .mark_reauthorization_required(
                connection,
                error_code=error_code,
                error_message=(
                    error_message
                ),
            )
        )

        await self.session.commit()

    async def _refresh_access_token(
        self,
        connection: OAuthConnection,
    ) -> str:
        encrypted_refresh_token = (
            connection
            .refresh_token_encrypted
        )

        if not encrypted_refresh_token:
            await (
                self.repository
                .mark_reauthorization_required(
                    connection,
                    error_code=(
                        "refresh_token_missing"
                    ),
                    error_message=(
                        "Google refresh token "
                        "is missing"
                    ),
                )
            )

            await self.session.commit()

            raise (
                OAuthReauthorizationRequiredError(
                    "Google refresh token is "
                    "missing. Reconnect your "
                    "Google account."
                )
            )

        refresh_token = (
            self.token_cipher.decrypt(
                encrypted_refresh_token
            )
        )

        try:
            token_response = (
                await self.oauth_client
                .refresh_access_token(
                    refresh_token
                )
            )

        except (
            OAuthReauthorizationRequiredError
        ) as exc:
            await (
                self.repository
                .mark_reauthorization_required(
                    connection,
                    error_code=(
                        "google_authorization_revoked"
                    ),
                    error_message=str(
                        exc
                    ),
                )
            )

            await self.session.commit()

            raise

        now = self._utc_now()

        refreshed_refresh_token = (
            self.token_cipher
            .encrypt_optional(
                token_response
                .refresh_token
            )
        )

        refreshed_scopes = (
            self._merge_scopes(
                connection.scopes,
                token_response.scopes,
            )
            if token_response.scopes
            else None
        )

        await (
            self.repository
            .update_refreshed_tokens(
                connection,
                access_token_encrypted=(
                    self.token_cipher.encrypt(
                        token_response
                        .access_token
                    )
                ),
                refresh_token_encrypted=(
                    refreshed_refresh_token
                ),
                token_type=(
                    token_response
                    .token_type
                ),
                token_expires_at=(
                    now
                    + timedelta(
                        seconds=(
                            token_response
                            .expires_in
                        )
                    )
                ),
                scopes=(
                    refreshed_scopes
                ),
                refreshed_at=now,
            )
        )

        await self.session.commit()

        logger.info(
            "Refreshed Google OAuth access "
            "token for user_id=%s",
            connection.user_id,
        )

        return (
            token_response.access_token
        )

    def _scopes_for_request(
        self,
        *,
        payload: GoogleConnectRequest,
        connection: OAuthConnection,
    ) -> list[str]:
        """
        Merge requested capabilities with scopes already granted.

        Important properties:
        - Gmail authorization does not remove Calendar scopes.
        - Calendar read requests never downgrade existing write access.
        - Calendar write authorization upgrades read access.
        - Gmail is currently read-only in Phase 4.
        """

        existing = set(
            connection.scopes
        )

        requested_services = set(
            payload.services
        )

        if (
            GoogleService.CALENDAR
            in requested_services
        ):
            self._merge_calendar_scopes(
                existing=existing,
                access_level=(
                    payload.access_level
                ),
            )

        if (
            GoogleService.GMAIL
            in requested_services
        ):
            existing.update(
                GOOGLE_GMAIL_READ_SCOPES
            )

        return sorted(
            existing
        )

    @staticmethod
    def _merge_calendar_scopes(
        *,
        existing: set[str],
        access_level: (
            GoogleCalendarAccessLevel
        ),
    ) -> None:
        read_events_scope = (
            GOOGLE_CALENDAR_READ_SCOPES[
                0
            ]
        )

        free_busy_scope = (
            GOOGLE_CALENDAR_READ_SCOPES[
                1
            ]
        )

        write_events_scope = (
            GOOGLE_CALENDAR_WRITE_SCOPES[
                0
            ]
        )

        if (
            access_level
            == GoogleCalendarAccessLevel.WRITE
        ):
            # Calendar write satisfies event-reading requirements.
            # Remove the narrower event-read scope to keep the stored
            # authorization set canonical.
            existing.discard(
                read_events_scope
            )

            existing.add(
                write_events_scope
            )

            existing.add(
                free_busy_scope
            )

            return

        if write_events_scope in existing:
            # Never downgrade an existing write connection simply because
            # the user later starts a read-only Calendar/Gmail flow.
            existing.add(
                free_busy_scope
            )

            return

        existing.update(
            GOOGLE_CALENDAR_READ_SCOPES
        )

    def _require_scopes(
        self,
        connection: OAuthConnection,
        required_scopes: Collection[str],
    ) -> None:
        granted = set(
            connection.scopes
        )

        missing = [
            scope
            for scope
            in required_scopes
            if not self._scope_is_satisfied(
                granted,
                scope,
            )
        ]

        if missing:
            raise (
                OAuthInsufficientScopeError(
                    "Google authorization is "
                    "missing permission(s) "
                    "required for this action. "
                    "Reconnect Google and grant "
                    "the requested access."
                )
            )

    @staticmethod
    def _scope_is_satisfied(
        granted: set[str],
        required: str,
    ) -> bool:
        if required in granted:
            return True

        read_events_scope = (
            GOOGLE_CALENDAR_READ_SCOPES[
                0
            ]
        )

        write_events_scope = (
            GOOGLE_CALENDAR_WRITE_SCOPES[
                0
            ]
        )

        if (
            required
            == read_events_scope
            and write_events_scope
            in granted
        ):
            return True

        return False

    @classmethod
    def _serialize_status(
        cls,
        connection: OAuthConnection,
    ) -> GoogleIntegrationRead:
        scopes = set(
            connection.scopes
        )

        read_scope = (
            GOOGLE_CALENDAR_READ_SCOPES[
                0
            ]
        )

        free_busy_scope = (
            GOOGLE_CALENDAR_READ_SCOPES[
                1
            ]
        )

        write_scope = (
            GOOGLE_CALENDAR_WRITE_SCOPES[
                0
            ]
        )

        gmail_read_scope = (
            GOOGLE_GMAIL_READ_SCOPES[
                0
            ]
        )

        can_read_calendar = (
            read_scope in scopes
            or write_scope in scopes
        )

        can_check_availability = (
            free_busy_scope in scopes
        )

        can_write_calendar = (
            write_scope in scopes
        )

        can_read_gmail = (
            gmail_read_scope in scopes
        )

        return GoogleIntegrationRead(
            status=connection.status,
            connected=(
                connection.is_connected
            ),
            reauthorization_required=(
                connection
                .requires_reauthorization
            ),
            granted_scopes=sorted(
                scopes
            ),
            can_read_calendar=(
                can_read_calendar
            ),
            can_check_availability=(
                can_check_availability
            ),
            can_write_calendar=(
                can_write_calendar
            ),
            can_read_gmail=(
                can_read_gmail
            ),
            connected_at=(
                connection.connected_at
            ),
            last_refreshed_at=(
                connection
                .last_refreshed_at
            ),
            last_error_code=(
                connection
                .last_error_code
            ),
            last_error_message=(
                connection
                .last_error_message
            ),
        )

    @staticmethod
    def _merge_scopes(
        *scope_groups: Collection[str],
    ) -> list[str]:
        return sorted(
            {
                scope.strip()
                for group
                in scope_groups
                for scope
                in group
                if scope.strip()
            }
        )

    @staticmethod
    def _hash_state(
        state: str,
    ) -> str:
        return hashlib.sha256(
            state.encode(
                "utf-8"
            )
        ).hexdigest()

    @staticmethod
    def _utc_now() -> datetime:
        return datetime.now(
            timezone.utc
        )