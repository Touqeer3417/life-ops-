from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import (
    Field,
    SecretStr,
    computed_field,
    field_validator,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict


SUPPORTED_DOCUMENT_EXTENSIONS = frozenset(
    {
        ".pdf",
        ".docx",
        ".txt",
        ".md",
    }
)

SUPPORTED_EMBEDDING_PROVIDERS = frozenset({"openai"})
SUPPORTED_LLM_PROVIDERS = frozenset({"openai", "groq"})


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

    database_url: str = (
        "postgresql+asyncpg://lifeops:lifeops@localhost:5432/lifeops"
    )
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173"]
    )

    auth0_domain: str = ""
    auth0_audience: str = ""
    auth0_algorithm: str = "RS256"
    auth0_userinfo_timeout_seconds: float = Field(
        default=5.0,
        gt=0,
        le=30,
    )

    upload_dir: Path = Path("uploads")
    max_file_size_mb: int = Field(default=10, ge=1, le=100)
    allowed_extensions: str = ".pdf,.docx,.txt,.md"

    chunk_size: int = Field(default=1000, ge=100, le=10_000)
    chunk_overlap: int = Field(default=150, ge=0, le=5_000)

    embedding_provider: str = "openai"
    embedding_model: str = "text-embedding-3-small"
    embedding_dimension: int = Field(default=1536, ge=1, le=2000)
    embedding_api_key: SecretStr = SecretStr("")

    llm_provider: str = "openai"
    llm_model: str = "gpt-4o-mini"
    llm_api_key: SecretStr = SecretStr("")

    retrieval_top_k: int = Field(default=5, ge=1, le=50)
    retrieval_similarity_threshold: float = Field(
        default=0.25,
        ge=0.0,
        le=1.0,
    )
    rag_max_context_chars: int = Field(
        default=16_000,
        ge=1_000,
        le=200_000,
    )

    @computed_field
    @property
    def auth0_issuer(self) -> str:
        domain = self.auth0_domain.strip().rstrip("/")
        return f"https://{domain}/" if domain else ""

    @computed_field
    @property
    def auth0_jwks_url(self) -> str:
        if not self.auth0_issuer:
            return ""
        return f"{self.auth0_issuer}.well-known/jwks.json"

    @computed_field
    @property
    def auth0_userinfo_url(self) -> str:
        return f"{self.auth0_issuer}userinfo" if self.auth0_issuer else ""

    @computed_field
    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024

    @property
    def allowed_extension_set(self) -> frozenset[str]:
        return frozenset(self.allowed_extensions.split(","))

    @field_validator("allowed_extensions")
    @classmethod
    def normalize_allowed_extensions(cls, value: str) -> str:
        normalized: set[str] = set()

        for raw_extension in value.split(","):
            extension = raw_extension.strip().lower()
            if not extension:
                continue

            if not extension.startswith("."):
                extension = f".{extension}"

            if extension not in SUPPORTED_DOCUMENT_EXTENSIONS:
                supported = ", ".join(sorted(SUPPORTED_DOCUMENT_EXTENSIONS))
                raise ValueError(
                    f"Unsupported configured document extension "
                    f"{extension!r}. Supported extensions: {supported}"
                )

            normalized.add(extension)

        if not normalized:
            raise ValueError(
                "At least one supported document extension must be configured"
            )

        return ",".join(sorted(normalized))

    @field_validator("embedding_provider", "llm_provider", mode="before")
    @classmethod
    def normalize_provider(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("Provider name cannot be empty")
        return normalized

    @field_validator("embedding_model", "llm_model")
    @classmethod
    def validate_model_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Model name cannot be empty")
        return normalized

    @model_validator(mode="after")
    def validate_rag_configuration(self) -> "Settings":
        if self.chunk_overlap >= self.chunk_size:
            raise ValueError("CHUNK_OVERLAP must be smaller than CHUNK_SIZE")

        if self.embedding_provider not in SUPPORTED_EMBEDDING_PROVIDERS:
            supported = ", ".join(sorted(SUPPORTED_EMBEDDING_PROVIDERS))
            raise ValueError(
                f"Unsupported EMBEDDING_PROVIDER "
                f"{self.embedding_provider!r}. Supported providers: {supported}"
            )

        if self.llm_provider not in SUPPORTED_LLM_PROVIDERS:
            supported = ", ".join(sorted(SUPPORTED_LLM_PROVIDERS))
            raise ValueError(
                f"Unsupported LLM_PROVIDER "
                f"{self.llm_provider!r}. Supported providers: {supported}"
            )

        return self

    def validate_runtime(self) -> None:
        if self.app_env == "test":
            return

        missing: dict[str, str] = {
            "AUTH0_DOMAIN": self.auth0_domain,
            "AUTH0_AUDIENCE": self.auth0_audience,
        }

        if self.embedding_provider == "openai":
            missing["EMBEDDING_API_KEY"] = (
                self.embedding_api_key.get_secret_value()
            )

        if self.llm_provider in SUPPORTED_LLM_PROVIDERS:
            missing["LLM_API_KEY"] = self.llm_api_key.get_secret_value()

        missing_names = [
            name
            for name, value in missing.items()
            if not value.strip()
        ]

        if missing_names:
            joined = ", ".join(missing_names)
            raise RuntimeError(
                f"Missing required application settings: {joined}"
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()