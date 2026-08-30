from base64 import urlsafe_b64decode
from binascii import Error as BinasciiError
from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

from pydantic import (
    Field,
    SecretStr,
    computed_field,
    field_validator,
    model_validator,
)
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


SUPPORTED_DOCUMENT_EXTENSIONS = frozenset(
    {
        ".pdf",
        ".docx",
        ".txt",
        ".md",
    }
)

SUPPORTED_EMBEDDING_PROVIDERS = frozenset(
    {
        "openai",
    }
)

SUPPORTED_LLM_PROVIDERS = frozenset(
    {
        "openai",
        "groq",
    }
)

SUPPORTED_RERANKER_DEVICES = frozenset(
    {
        "auto",
        "cpu",
        "cuda",
        "mps",
    }
)


GOOGLE_CALENDAR_READ_SCOPES = (
    "https://www.googleapis.com/auth/calendar.events.readonly",
    "https://www.googleapis.com/auth/calendar.freebusy",
)

GOOGLE_CALENDAR_WRITE_SCOPES = (
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.freebusy",
)


class Settings(BaseSettings):
    """
    Central LifeOps application configuration.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # =====================================================
    # Application
    # =====================================================

    app_name: str = (
        "LifeOps AI API"
    )

    app_env: Literal[
        "development",
        "test",
        "staging",
        "production",
    ] = "development"

    debug: bool = False

    api_v1_prefix: str = (
        "/api/v1"
    )

    frontend_app_url: str = (
        "http://localhost:5173"
    )

    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173"
        ]
    )

    # =====================================================
    # Database
    # =====================================================

    database_url: str = (
        "postgresql+asyncpg://"
        "lifeops:lifeops@"
        "localhost:5432/lifeops"
    )

    # =====================================================
    # Auth0
    # =====================================================

    auth0_domain: str = ""

    auth0_audience: str = ""

    auth0_algorithm: str = "RS256"

    auth0_userinfo_timeout_seconds: float = Field(
        default=5.0,
        gt=0,
        le=30,
    )

    # =====================================================
    # Documents
    # =====================================================

    upload_dir: Path = Path(
        "uploads"
    )

    max_file_size_mb: int = Field(
        default=10,
        ge=1,
        le=100,
    )

    allowed_extensions: str = (
        ".pdf,.docx,.txt,.md"
    )

    # =====================================================
    # Child chunking
    # =====================================================

    chunk_size: int = Field(
        default=800,
        ge=100,
        le=10_000,
    )

    chunk_overlap: int = Field(
        default=120,
        ge=0,
        le=5_000,
    )

    # =====================================================
    # Parent chunking
    # =====================================================

    parent_chunk_size: int = Field(
        default=3000,
        ge=500,
        le=50_000,
    )

    parent_chunk_overlap: int = Field(
        default=200,
        ge=0,
        le=10_000,
    )

    table_parent_max_rows: int = Field(
        default=20,
        ge=1,
        le=500,
    )

    # =====================================================
    # Embeddings
    # =====================================================

    embedding_provider: str = (
        "openai"
    )

    embedding_model: str = (
        "text-embedding-3-small"
    )

    embedding_dimension: int = Field(
        default=1536,
        ge=1,
        le=10_000,
    )

    embedding_api_key: SecretStr = (
        SecretStr("")
    )

    # =====================================================
    # LLM
    # =====================================================

    llm_provider: str = "openai"

    llm_model: str = (
        "gpt-4o-mini"
    )

    llm_api_key: SecretStr = (
        SecretStr("")
    )

    # =====================================================
    # Dense retrieval
    # =====================================================

    retrieval_candidate_k: int = Field(
        default=20,
        ge=1,
        le=200,
    )

    retrieval_top_k: int = Field(
        default=5,
        ge=1,
        le=20,
    )

    # This is intentionally recall-oriented.
    # CrossEncoder applies the stronger final filter.
    retrieval_similarity_threshold: float = Field(
        default=0.15,
        ge=0.0,
        le=1.0,
    )

    rag_max_context_chars: int = Field(
        default=16_000,
        ge=1_000,
        le=200_000,
    )

    # =====================================================
    # Query rewrite / expansion / HyDE
    # =====================================================

    query_rewrite_enabled: bool = True

    query_rewrite_variant_count: int = Field(
        default=3,
        ge=1,
        le=10,
    )

    query_hyde_enabled: bool = True

    query_rewrite_max_chars: int = Field(
        default=1000,
        ge=100,
        le=10_000,
    )

    # =====================================================
    # CrossEncoder reranking
    # =====================================================

    reranker_enabled: bool = True

    reranker_model: str = (
        "BAAI/bge-reranker-base"
    )

    reranker_score_threshold: float = Field(
        default=0.50,
        ge=0.0,
        le=1.0,
    )

    reranker_candidate_limit: int = Field(
        default=50,
        ge=1,
        le=500,
    )

    reranker_batch_size: int = Field(
        default=16,
        ge=1,
        le=256,
    )

    reranker_max_length: int = Field(
        default=512,
        ge=64,
        le=4096,
    )

    reranker_device: Literal[
        "auto",
        "cpu",
        "cuda",
        "mps",
    ] = "auto"

    # =====================================================
    # Google OAuth
    # =====================================================

    google_oauth_client_id: str = ""

    google_oauth_client_secret: SecretStr = (
        SecretStr("")
    )

    google_oauth_redirect_uri: str = (
        "http://localhost:8000/"
        "api/v1/integrations/google/callback"
    )

    google_oauth_token_encryption_key: SecretStr = (
        SecretStr("")
    )

    google_oauth_state_ttl_seconds: int = Field(
        default=600,
        ge=60,
        le=3600,
    )

    google_oauth_http_timeout_seconds: float = Field(
        default=10.0,
        gt=0,
        le=60,
    )

    google_calendar_api_timeout_seconds: float = Field(
        default=10.0,
        gt=0,
        le=60,
    )

    # =====================================================
    # Computed properties
    # =====================================================

    @computed_field
    @property
    def auth0_issuer(
        self,
    ) -> str:
        domain = (
            self.auth0_domain
            .strip()
            .rstrip("/")
        )

        return (
            f"https://{domain}/"
            if domain
            else ""
        )

    @computed_field
    @property
    def auth0_jwks_url(
        self,
    ) -> str:
        if not self.auth0_issuer:
            return ""

        return (
            f"{self.auth0_issuer}"
            ".well-known/jwks.json"
        )

    @computed_field
    @property
    def auth0_userinfo_url(
        self,
    ) -> str:
        if not self.auth0_issuer:
            return ""

        return (
            f"{self.auth0_issuer}"
            "userinfo"
        )

    @computed_field
    @property
    def max_file_size_bytes(
        self,
    ) -> int:
        return (
            self.max_file_size_mb
            * 1024
            * 1024
        )

    @computed_field
    @property
    def google_calendar_configured(
        self,
    ) -> bool:
        return all(
            (
                self.google_oauth_client_id.strip(),

                self.google_oauth_client_secret
                .get_secret_value()
                .strip(),

                self.google_oauth_redirect_uri.strip(),

                self.google_oauth_token_encryption_key
                .get_secret_value()
                .strip(),
            )
        )

    @property
    def allowed_extension_set(
        self,
    ) -> frozenset[str]:
        return frozenset(
            extension.strip()
            for extension
            in self.allowed_extensions.split(",")
            if extension.strip()
        )

    @property
    def google_calendar_read_scopes(
        self,
    ) -> tuple[str, ...]:
        return (
            GOOGLE_CALENDAR_READ_SCOPES
        )

    @property
    def google_calendar_write_scopes(
        self,
    ) -> tuple[str, ...]:
        return (
            GOOGLE_CALENDAR_WRITE_SCOPES
        )

    @property
    def reranker_resolved_device(
        self,
    ) -> str | None:
        """
        None lets Sentence Transformers choose the
        available device automatically.
        """

        if self.reranker_device == "auto":
            return None

        return self.reranker_device

    # =====================================================
    # Validators
    # =====================================================

    @field_validator(
        "allowed_extensions"
    )
    @classmethod
    def normalize_allowed_extensions(
        cls,
        value: str,
    ) -> str:
        normalized: set[str] = set()

        for raw_extension in value.split(
            ","
        ):
            extension = (
                raw_extension
                .strip()
                .lower()
            )

            if not extension:
                continue

            if not extension.startswith(
                "."
            ):
                extension = (
                    f".{extension}"
                )

            if (
                extension
                not in
                SUPPORTED_DOCUMENT_EXTENSIONS
            ):
                supported = ", ".join(
                    sorted(
                        SUPPORTED_DOCUMENT_EXTENSIONS
                    )
                )

                raise ValueError(
                    "Unsupported configured "
                    "document extension "
                    f"{extension!r}. "
                    "Supported extensions: "
                    f"{supported}"
                )

            normalized.add(
                extension
            )

        if not normalized:
            raise ValueError(
                "At least one supported "
                "document extension must "
                "be configured"
            )

        return ",".join(
            sorted(normalized)
        )

    @field_validator(
        "embedding_provider",
        "llm_provider",
        mode="before",
    )
    @classmethod
    def normalize_provider(
        cls,
        value: str,
    ) -> str:
        normalized = (
            value.strip().lower()
        )

        if not normalized:
            raise ValueError(
                "Provider name cannot "
                "be empty"
            )

        return normalized

    @field_validator(
        "embedding_model",
        "llm_model",
        "reranker_model",
    )
    @classmethod
    def validate_model_name(
        cls,
        value: str,
    ) -> str:
        normalized = (
            value.strip()
        )

        if not normalized:
            raise ValueError(
                "Model name cannot "
                "be empty"
            )

        return normalized

    @field_validator(
        "frontend_app_url",
        "google_oauth_redirect_uri",
    )
    @classmethod
    def validate_http_url(
        cls,
        value: str,
    ) -> str:
        normalized = (
            value.strip()
        )

        if not normalized:
            raise ValueError(
                "URL cannot be empty"
            )

        parsed = urlsplit(
            normalized
        )

        if (
            parsed.scheme
            not in {
                "http",
                "https",
            }
            or not parsed.netloc
        ):
            raise ValueError(
                "URL must be an absolute "
                "HTTP or HTTPS URL"
            )

        return normalized

    # =====================================================
    # Combined RAG validation
    # =====================================================

    @model_validator(
        mode="after"
    )
    def validate_rag_configuration(
        self,
    ) -> "Settings":
        if (
            self.chunk_overlap
            >= self.chunk_size
        ):
            raise ValueError(
                "CHUNK_OVERLAP must be "
                "smaller than CHUNK_SIZE"
            )

        if (
            self.parent_chunk_overlap
            >= self.parent_chunk_size
        ):
            raise ValueError(
                "PARENT_CHUNK_OVERLAP must "
                "be smaller than "
                "PARENT_CHUNK_SIZE"
            )

        if (
            self.parent_chunk_size
            <= self.chunk_size
        ):
            raise ValueError(
                "PARENT_CHUNK_SIZE must "
                "be greater than CHUNK_SIZE"
            )

        if (
            self.retrieval_candidate_k
            < self.retrieval_top_k
        ):
            raise ValueError(
                "RETRIEVAL_CANDIDATE_K must "
                "be greater than or equal to "
                "RETRIEVAL_TOP_K"
            )

        if (
            self.reranker_candidate_limit
            < self.retrieval_top_k
        ):
            raise ValueError(
                "RERANKER_CANDIDATE_LIMIT "
                "must be greater than or "
                "equal to RETRIEVAL_TOP_K"
            )

        if (
            self.embedding_provider
            not in
            SUPPORTED_EMBEDDING_PROVIDERS
        ):
            supported = ", ".join(
                sorted(
                    SUPPORTED_EMBEDDING_PROVIDERS
                )
            )

            raise ValueError(
                "Unsupported "
                "EMBEDDING_PROVIDER "
                f"{self.embedding_provider!r}. "
                "Supported providers: "
                f"{supported}"
            )

        if (
            self.llm_provider
            not in
            SUPPORTED_LLM_PROVIDERS
        ):
            supported = ", ".join(
                sorted(
                    SUPPORTED_LLM_PROVIDERS
                )
            )

            raise ValueError(
                "Unsupported LLM_PROVIDER "
                f"{self.llm_provider!r}. "
                "Supported providers: "
                f"{supported}"
            )

        if (
            self.reranker_device
            not in
            SUPPORTED_RERANKER_DEVICES
        ):
            raise ValueError(
                "Unsupported reranker device"
            )

        return self

    # =====================================================
    # Runtime validation
    # =====================================================

    def validate_runtime(
        self,
    ) -> None:
        if self.app_env == "test":
            return

        missing: dict[
            str,
            str,
        ] = {
            "AUTH0_DOMAIN": (
                self.auth0_domain
            ),
            "AUTH0_AUDIENCE": (
                self.auth0_audience
            ),
        }

        if (
            self.embedding_provider
            == "openai"
        ):
            missing[
                "EMBEDDING_API_KEY"
            ] = (
                self.embedding_api_key
                .get_secret_value()
            )

        if (
            self.llm_provider
            in
            SUPPORTED_LLM_PROVIDERS
        ):
            missing[
                "LLM_API_KEY"
            ] = (
                self.llm_api_key
                .get_secret_value()
            )

        missing_names = [
            name
            for name, value
            in missing.items()
            if not value.strip()
        ]

        if missing_names:
            joined = ", ".join(
                missing_names
            )

            raise RuntimeError(
                "Missing required "
                "application settings: "
                f"{joined}"
            )

    def validate_google_calendar_configuration(
        self,
    ) -> None:
        missing: dict[
            str,
            str,
        ] = {
            "GOOGLE_OAUTH_CLIENT_ID": (
                self.google_oauth_client_id
            ),

            "GOOGLE_OAUTH_CLIENT_SECRET": (
                self.google_oauth_client_secret
                .get_secret_value()
            ),

            "GOOGLE_OAUTH_REDIRECT_URI": (
                self.google_oauth_redirect_uri
            ),

            "GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY": (
                self.google_oauth_token_encryption_key
                .get_secret_value()
            ),
        }

        missing_names = [
            name
            for name, value
            in missing.items()
            if not value.strip()
        ]

        if missing_names:
            joined = ", ".join(
                missing_names
            )

            raise RuntimeError(
                "Google Calendar integration "
                "is not configured. "
                "Missing settings: "
                f"{joined}"
            )

        redirect_uri = urlsplit(
            self.google_oauth_redirect_uri
        )

        if (
            self.app_env
            in {
                "staging",
                "production",
            }
            and redirect_uri.scheme
            != "https"
        ):
            raise RuntimeError(
                "GOOGLE_OAUTH_REDIRECT_URI "
                "must use HTTPS outside "
                "development/test environments"
            )

        encryption_key = (
            self.google_oauth_token_encryption_key
            .get_secret_value()
            .strip()
        )

        try:
            decoded_key = (
                urlsafe_b64decode(
                    encryption_key.encode(
                        "ascii"
                    )
                )
            )

        except (
            UnicodeEncodeError,
            ValueError,
            BinasciiError,
        ) as exc:
            raise RuntimeError(
                "GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY "
                "must be a valid Fernet key"
            ) from exc

        if len(decoded_key) != 32:
            raise RuntimeError(
                "GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY "
                "must decode to exactly "
                "32 bytes"
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()