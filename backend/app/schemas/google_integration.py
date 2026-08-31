from datetime import datetime
from enum import StrEnum

from pydantic import (
    BaseModel,
    Field,
    HttpUrl,
    field_validator,
)


class GoogleCalendarAccessLevel(StrEnum):
    READ = "read"
    WRITE = "write"


class GoogleService(StrEnum):
    CALENDAR = "calendar"
    GMAIL = "gmail"


class GoogleConnectRequest(BaseModel):
    """
    Requested capabilities for the shared Google OAuth flow.

    Calendar and Gmail reuse one Google OAuth connection.

    Existing Phase 3 callers remain backward compatible:
    when services is omitted, Calendar is requested by default.
    """

    access_level: GoogleCalendarAccessLevel = (
        GoogleCalendarAccessLevel.READ
    )

    services: list[GoogleService] = Field(
        default_factory=lambda: [
            GoogleService.CALENDAR
        ],
        min_length=1,
        max_length=2,
    )

    force_consent: bool = False

    @field_validator(
        "services",
    )
    @classmethod
    def normalize_services(
        cls,
        value: list[GoogleService],
    ) -> list[GoogleService]:
        """
        Remove duplicate services while preserving order.
        """

        normalized: list[GoogleService] = []

        for service in value:
            if service not in normalized:
                normalized.append(
                    service
                )

        if not normalized:
            raise ValueError(
                "At least one Google service is required"
            )

        return normalized


class GoogleConnectResponse(BaseModel):
    authorization_url: HttpUrl

    expires_at: datetime

    requested_scopes: list[str]


class GoogleIntegrationRead(BaseModel):
    provider: str = "google"

    status: str

    connected: bool

    reauthorization_required: bool

    granted_scopes: list[str] = Field(
        default_factory=list
    )

    # Calendar capabilities
    can_read_calendar: bool = False

    can_check_availability: bool = False

    can_write_calendar: bool = False

    # Phase 4 Gmail capability
    can_read_gmail: bool = False

    connected_at: datetime | None = None

    last_refreshed_at: datetime | None = None

    last_error_code: str | None = None

    last_error_message: str | None = None


class GoogleOAuthCallbackResult(BaseModel):
    status: str

    connected: bool


class GoogleDisconnectResponse(BaseModel):
    status: str

    disconnected: bool

    revocation_confirmed: bool