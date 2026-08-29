from datetime import datetime
from enum import StrEnum

from pydantic import (
    BaseModel,
    Field,
    HttpUrl,
)


class GoogleCalendarAccessLevel(StrEnum):
    READ = "read"
    WRITE = "write"


class GoogleConnectRequest(BaseModel):
    """
    Requested Calendar capability for the Google OAuth flow.

    READ requests Calendar event reading + free/busy access.
    WRITE requests Calendar event management + free/busy access.
    """

    access_level: GoogleCalendarAccessLevel = (
        GoogleCalendarAccessLevel.READ
    )

    force_consent: bool = False


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

    can_read_calendar: bool
    can_check_availability: bool
    can_write_calendar: bool

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