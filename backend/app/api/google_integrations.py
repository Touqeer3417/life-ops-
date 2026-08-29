from typing import Annotated

from fastapi import (
    APIRouter,
    Query,
    status,
)
from fastapi.responses import (
    RedirectResponse,
)

from app.core.exceptions import (
    OAuthAuthorizationDeniedError,
    OAuthStateError,
)
from app.dependencies import (
    CurrentUserDep,
    SessionDep,
    SettingsDep,
)
from app.schemas.google_integration import (
    GoogleConnectRequest,
    GoogleConnectResponse,
    GoogleDisconnectResponse,
    GoogleIntegrationRead,
)
from app.services.google_integration_service import (
    GoogleIntegrationService,
)


router = APIRouter(
    prefix="/integrations/google",
    tags=["integrations"],
)


@router.get(
    "",
    response_model=GoogleIntegrationRead,
)
async def get_google_integration(
    current_user: CurrentUserDep,
    session: SessionDep,
    settings: SettingsDep,
) -> GoogleIntegrationRead:
    """
    Return Google integration status for the authenticated user.

    Auth0 remains the application's authentication provider.
    This endpoint never exposes Google access or refresh tokens.
    """

    return await GoogleIntegrationService(
        session,
        settings,
    ).get_status(
        current_user
    )


@router.post(
    "/connect",
    response_model=GoogleConnectResponse,
    status_code=status.HTTP_200_OK,
)
async def connect_google(
    payload: GoogleConnectRequest,
    current_user: CurrentUserDep,
    session: SessionDep,
    settings: SettingsDep,
) -> GoogleConnectResponse:
    """
    Start or upgrade a Google Calendar OAuth authorization.

    The returned URL should be opened in the browser. OAuth state
    is generated server-side and only its SHA-256 hash is persisted.
    """

    return await GoogleIntegrationService(
        session,
        settings,
    ).create_authorization_url(
        current_user,
        payload,
    )


@router.get(
    "/callback",
    response_class=RedirectResponse,
    status_code=status.HTTP_303_SEE_OTHER,
)
async def google_oauth_callback(
    session: SessionDep,
    settings: SettingsDep,
    state_value: Annotated[
        str | None,
        Query(
            alias="state",
            min_length=1,
            max_length=512,
        ),
    ] = None,
    code: Annotated[
        str | None,
        Query(
            min_length=1,
            max_length=4096,
        ),
    ] = None,
    error: Annotated[
        str | None,
        Query(
            max_length=256,
        ),
    ] = None,
) -> RedirectResponse:
    """
    Handle Google's browser OAuth callback.

    This route intentionally does not require an Auth0 bearer token:
    Google redirects the browser directly to it. User identity and
    CSRF protection come from the one-time server-generated OAuth
    state bound to a single oauth_connections row.
    """

    if error:
        raise OAuthAuthorizationDeniedError(
            "Google authorization was "
            f"not granted: {error}"
        )

    if not state_value:
        raise OAuthStateError(
            "Google OAuth callback is "
            "missing state"
        )

    if not code:
        raise OAuthStateError(
            "Google OAuth callback is "
            "missing an authorization code"
        )

    await GoogleIntegrationService(
        session,
        settings,
    ).complete_authorization(
        state=state_value,
        code=code,
    )

    frontend_url = (
        settings.frontend_app_url
        .rstrip("/")
    )

    return RedirectResponse(
        url=(
            f"{frontend_url}"
            "/app/integrations"
            "?google=connected"
        ),
        status_code=(
            status.HTTP_303_SEE_OTHER
        ),
    )


@router.delete(
    "",
    response_model=GoogleDisconnectResponse,
)
async def disconnect_google(
    current_user: CurrentUserDep,
    session: SessionDep,
    settings: SettingsDep,
) -> GoogleDisconnectResponse:
    """
    Disconnect Google from the authenticated LifeOps account.

    LifeOps clears its encrypted credentials even if Google cannot
    confirm remote revocation because of a temporary provider failure.
    """

    return await GoogleIntegrationService(
        session,
        settings,
    ).disconnect(
        current_user
    )