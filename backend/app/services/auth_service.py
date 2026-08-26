import httpx

from app.core.config import Settings
from app.core.exceptions import AuthenticationError, UpstreamServiceError
from app.schemas.user import Auth0UserInfo


class AuthService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def fetch_userinfo(self, access_token: str) -> Auth0UserInfo:
        try:
            async with httpx.AsyncClient(timeout=self.settings.auth0_userinfo_timeout_seconds) as client:
                response = await client.get(
                    self.settings.auth0_userinfo_url,
                    headers={"Authorization": f"Bearer {access_token}"},
                )
        except httpx.RequestError as exc:
            raise UpstreamServiceError("Unable to reach the identity provider") from exc

        if response.status_code in {401, 403}:
            raise AuthenticationError("Identity provider rejected the access token")
        if response.is_error:
            raise UpstreamServiceError("Identity provider user profile request failed")

        try:
            return Auth0UserInfo.model_validate(response.json())
        except Exception as exc:
            raise UpstreamServiceError("Identity provider returned an invalid user profile") from exc
