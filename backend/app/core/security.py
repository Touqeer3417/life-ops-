from functools import lru_cache

import jwt
from jwt import PyJWKClient

from app.core.config import Settings, get_settings
from app.core.exceptions import AuthenticationError
from app.schemas.auth import TokenClaims


@lru_cache(maxsize=4)
def _jwks_client(jwks_url: str) -> PyJWKClient:
    return PyJWKClient(jwks_url, cache_keys=True)


def verify_access_token(token: str, settings: Settings | None = None) -> TokenClaims:
    """Validate an Auth0 API access token and return normalized claims."""
    settings = settings or get_settings()
    if not settings.auth0_jwks_url or not settings.auth0_issuer or not settings.auth0_audience:
        raise AuthenticationError("Authentication is not configured on the server")

    try:
        signing_key = _jwks_client(settings.auth0_jwks_url).get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=[settings.auth0_algorithm],
            audience=settings.auth0_audience,
            issuer=settings.auth0_issuer,
            options={"require": ["exp", "iat", "sub"]},
        )
        return TokenClaims.model_validate(payload)
    except jwt.ExpiredSignatureError as exc:
        raise AuthenticationError("Access token has expired") from exc
    except jwt.InvalidTokenError as exc:
        raise AuthenticationError("Access token is invalid") from exc
    except Exception as exc:
        raise AuthenticationError("Unable to validate access token") from exc
