from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import verify_access_token
from app.database.session import get_db_session
from app.models.user import User
from app.schemas.auth import TokenClaims
from app.services.auth_service import AuthService
from app.services.user_service import UserService

bearer_scheme = HTTPBearer(auto_error=False)

SessionDep = Annotated[AsyncSession, Depends(get_db_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


class AuthContext:
    def __init__(self, token: str, claims: TokenClaims) -> None:
        self.token = token
        self.claims = claims


def get_auth_context(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    settings: SettingsDep,
) -> AuthContext:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AuthenticationError()
    claims = verify_access_token(credentials.credentials, settings)
    return AuthContext(credentials.credentials, claims)


AuthContextDep = Annotated[AuthContext, Depends(get_auth_context)]


async def get_current_user(
    auth: AuthContextDep,
    session: SessionDep,
    settings: SettingsDep,
) -> User:
    service = UserService(session)
    existing = await service.repository.get_by_auth0_subject(auth.claims.sub)
    if existing is not None:
        if not existing.is_active:
            raise AuthorizationError("This user account is disabled")
        return existing

    identity = await AuthService(settings).fetch_userinfo(auth.token)
    if identity.sub != auth.claims.sub:
        raise AuthenticationError("Identity profile does not match the access token")
    user = await service.get_or_create_from_identity(identity)
    if not user.is_active:
        raise AuthorizationError("This user account is disabled")
    return user


CurrentUserDep = Annotated[User, Depends(get_current_user)]
