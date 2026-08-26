import uuid
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, field_validator


class UserPreferenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    timezone: str
    locale: str
    email_notifications: bool


class UserPreferenceUpdate(BaseModel):
    timezone: str | None = Field(default=None, min_length=1, max_length=64)
    locale: str | None = Field(default=None, min_length=2, max_length=16)
    email_notifications: bool | None = None

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Timezone cannot be empty")
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError("Timezone must be a valid IANA timezone, for example Asia/Karachi") from exc
        return value

    @field_validator("locale")
    @classmethod
    def validate_locale(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Locale cannot be empty")
        return value


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    avatar_url: str | None
    role: str
    is_active: bool
    is_email_verified: bool
    created_at: datetime
    updated_at: datetime
    preferences: UserPreferenceRead


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=200)

    @field_validator("full_name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class Auth0UserInfo(BaseModel):
    sub: str
    email: EmailStr
    email_verified: bool = False
    name: str | None = None
    picture: HttpUrl | None = None
