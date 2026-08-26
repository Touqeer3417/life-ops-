from pydantic import BaseModel, ConfigDict, Field


class TokenClaims(BaseModel):
    model_config = ConfigDict(extra="allow")

    sub: str
    iss: str | None = None
    aud: str | list[str] | None = None
    scope: str = ""
    permissions: list[str] = Field(default_factory=list)

    @property
    def scopes(self) -> set[str]:
        return {scope for scope in self.scope.split() if scope}


class AuthSessionResponse(BaseModel):
    authenticated: bool = True
    subject: str
    scopes: list[str]
