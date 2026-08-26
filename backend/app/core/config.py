from functools import lru_cache
from typing import Literal

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "LifeOps AI API"
    app_env: Literal["development", "test", "staging", "production"] = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+asyncpg://lifeops:lifeops@localhost:5432/lifeops"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    auth0_domain: str = ""
    auth0_audience: str = ""
    auth0_algorithm: str = "RS256"
    auth0_userinfo_timeout_seconds: float = 5.0

    @computed_field
    @property
    def auth0_issuer(self) -> str:
        domain = self.auth0_domain.strip().rstrip("/")
        return f"https://{domain}/" if domain else ""

    @computed_field
    @property
    def auth0_jwks_url(self) -> str:
        return f"{self.auth0_issuer}.well-known/jwks.json" if self.auth0_issuer else ""

    @computed_field
    @property
    def auth0_userinfo_url(self) -> str:
        return f"{self.auth0_issuer}userinfo" if self.auth0_issuer else ""

    def validate_runtime(self) -> None:
        if self.app_env != "test":
            missing = [
                name
                for name, value in {
                    "AUTH0_DOMAIN": self.auth0_domain,
                    "AUTH0_AUDIENCE": self.auth0_audience,
                }.items()
                if not value
            ]
            if missing:
                joined = ", ".join(missing)
                raise RuntimeError(f"Missing required authentication settings: {joined}")


@lru_cache
def get_settings() -> Settings:
    return Settings()
