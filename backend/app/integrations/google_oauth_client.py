from dataclasses import dataclass
from urllib.parse import urlencode

import httpx

from app.core.config import Settings
from app.core.exceptions import (
    GoogleOAuthError,
    OAuthReauthorizationRequiredError,
    ServiceUnavailableError,
)


GOOGLE_AUTHORIZATION_ENDPOINT = (
    "https://accounts.google.com/o/oauth2/v2/auth"
)
GOOGLE_TOKEN_ENDPOINT = (
    "https://oauth2.googleapis.com/token"
)
GOOGLE_REVOCATION_ENDPOINT = (
    "https://oauth2.googleapis.com/revoke"
)


@dataclass(frozen=True, slots=True)
class GoogleOAuthTokenResponse:
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str | None
    scopes: tuple[str, ...]

    @classmethod
    def from_payload(
        cls,
        payload: dict[str, object],
    ) -> "GoogleOAuthTokenResponse":
        access_token = payload.get(
            "access_token"
        )
        token_type = payload.get(
            "token_type"
        )
        expires_in = payload.get(
            "expires_in"
        )

        if not isinstance(
            access_token,
            str,
        ) or not access_token.strip():
            raise GoogleOAuthError(
                "Google OAuth response did not "
                "contain a valid access token"
            )

        if not isinstance(
            token_type,
            str,
        ) or not token_type.strip():
            raise GoogleOAuthError(
                "Google OAuth response did not "
                "contain a valid token type"
            )

        if not isinstance(
            expires_in,
            int,
        ) or expires_in <= 0:
            raise GoogleOAuthError(
                "Google OAuth response did not "
                "contain a valid token lifetime"
            )

        refresh_token_raw = payload.get(
            "refresh_token"
        )

        refresh_token = (
            refresh_token_raw.strip()
            if isinstance(
                refresh_token_raw,
                str,
            )
            and refresh_token_raw.strip()
            else None
        )

        scope_raw = payload.get(
            "scope"
        )

        scopes = (
            tuple(
                sorted(
                    {
                        scope.strip()
                        for scope in scope_raw.split()
                        if scope.strip()
                    }
                )
            )
            if isinstance(
                scope_raw,
                str,
            )
            else ()
        )

        return cls(
            access_token=access_token.strip(),
            token_type=token_type.strip(),
            expires_in=expires_in,
            refresh_token=refresh_token,
            scopes=scopes,
        )


class GoogleOAuthClient:
    """Async Google OAuth 2.0 web-server client."""

    def __init__(
        self,
        settings: Settings,
    ) -> None:
        try:
            settings.validate_google_calendar_configuration()
        except RuntimeError as exc:
            raise ServiceUnavailableError(
                str(exc)
            ) from exc

        self._client_id = (
            settings.google_oauth_client_id.strip()
        )
        self._client_secret = (
            settings.google_oauth_client_secret
            .get_secret_value()
            .strip()
        )
        self._redirect_uri = (
            settings.google_oauth_redirect_uri.strip()
        )
        self._timeout = (
            settings.google_oauth_http_timeout_seconds
        )

    def build_authorization_url(
        self,
        *,
        state: str,
        scopes: tuple[str, ...],
        login_hint: str | None = None,
        force_consent: bool = False,
    ) -> str:
        normalized_state = state.strip()

        if not normalized_state:
            raise ValueError(
                "OAuth state cannot be empty"
            )

        normalized_scopes = tuple(
            dict.fromkeys(
                scope.strip()
                for scope in scopes
                if scope.strip()
            )
        )

        if not normalized_scopes:
            raise ValueError(
                "At least one Google OAuth "
                "scope is required"
            )

        params: dict[str, str] = {
            "client_id": self._client_id,
            "redirect_uri": self._redirect_uri,
            "response_type": "code",
            "scope": " ".join(
                normalized_scopes
            ),
            "access_type": "offline",
            "include_granted_scopes": "true",
            "state": normalized_state,
        }

        if force_consent:
            params["prompt"] = "consent"

        if (
            login_hint is not None
            and login_hint.strip()
        ):
            params["login_hint"] = (
                login_hint.strip()
            )

        return (
            f"{GOOGLE_AUTHORIZATION_ENDPOINT}"
            f"?{urlencode(params)}"
        )

    async def exchange_code(
        self,
        code: str,
    ) -> GoogleOAuthTokenResponse:
        normalized_code = code.strip()

        if not normalized_code:
            raise GoogleOAuthError(
                "Google OAuth authorization code "
                "is missing"
            )

        payload = await self._post_token_request(
            {
                "code": normalized_code,
                "client_id": self._client_id,
                "client_secret": self._client_secret,
                "redirect_uri": self._redirect_uri,
                "grant_type": "authorization_code",
            }
        )

        return (
            GoogleOAuthTokenResponse
            .from_payload(payload)
        )

    async def refresh_access_token(
        self,
        refresh_token: str,
    ) -> GoogleOAuthTokenResponse:
        normalized_refresh_token = (
            refresh_token.strip()
        )

        if not normalized_refresh_token:
            raise (
                OAuthReauthorizationRequiredError(
                    "Google refresh token is "
                    "missing. Reconnect your "
                    "Google account."
                )
            )

        payload = await self._post_token_request(
            {
                "client_id": self._client_id,
                "client_secret": self._client_secret,
                "refresh_token": (
                    normalized_refresh_token
                ),
                "grant_type": "refresh_token",
            },
            refresh_request=True,
        )

        return (
            GoogleOAuthTokenResponse
            .from_payload(payload)
        )

    async def revoke_token(
        self,
        token: str,
    ) -> None:
        normalized_token = token.strip()

        if not normalized_token:
            return

        try:
            async with httpx.AsyncClient(
                timeout=self._timeout
            ) as client:
                response = await client.post(
                    GOOGLE_REVOCATION_ENDPOINT,
                    data={
                        "token": normalized_token,
                    },
                    headers={
                        "Accept": (
                            "application/json"
                        ),
                    },
                )
        except httpx.RequestError as exc:
            raise GoogleOAuthError(
                "Unable to reach Google's OAuth "
                "revocation service"
            ) from exc

        # Google may return 400 when a credential is
        # already invalid/revoked. From LifeOps'
        # perspective the desired disconnected state
        # is already achieved, so treat this as safe.
        if response.status_code in {
            200,
            400,
        }:
            return

        raise GoogleOAuthError(
            "Google rejected the OAuth "
            "token revocation request"
        )

    async def _post_token_request(
        self,
        form_data: dict[str, str],
        *,
        refresh_request: bool = False,
    ) -> dict[str, object]:
        try:
            async with httpx.AsyncClient(
                timeout=self._timeout
            ) as client:
                response = await client.post(
                    GOOGLE_TOKEN_ENDPOINT,
                    data=form_data,
                    headers={
                        "Accept": (
                            "application/json"
                        ),
                    },
                )
        except httpx.TimeoutException as exc:
            raise GoogleOAuthError(
                "Google OAuth request timed out"
            ) from exc
        except httpx.RequestError as exc:
            raise GoogleOAuthError(
                "Unable to reach Google's "
                "OAuth service"
            ) from exc

        try:
            payload = response.json()
        except ValueError as exc:
            raise GoogleOAuthError(
                "Google OAuth returned an "
                "invalid response"
            ) from exc

        if not isinstance(
            payload,
            dict,
        ):
            raise GoogleOAuthError(
                "Google OAuth returned an "
                "unexpected response"
            )

        if response.is_success:
            return payload

        error = payload.get(
            "error"
        )
        description = payload.get(
            "error_description"
        )

        error_code = (
            error.strip()
            if isinstance(
                error,
                str,
            )
            else ""
        )

        error_description = (
            description.strip()
            if isinstance(
                description,
                str,
            )
            else ""
        )

        if (
            refresh_request
            and error_code
            in {
                "invalid_grant",
                "invalid_token",
            }
        ):
            raise (
                OAuthReauthorizationRequiredError(
                    "Google authorization has "
                    "expired or been revoked. "
                    "Reconnect your Google account."
                )
            )

        message = (
            error_description
            or error_code
            or "Google OAuth request failed"
        )

        raise GoogleOAuthError(
            message
        )