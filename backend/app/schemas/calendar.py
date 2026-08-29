from datetime import (
    date as Date,
    datetime,
)
from typing import Literal
from zoneinfo import (
    ZoneInfo,
    ZoneInfoNotFoundError,
)

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    HttpUrl,
    field_validator,
    model_validator,
)


CalendarSendUpdates = Literal[
    "all",
    "externalOnly",
    "none",
]


def _validate_timezone_name(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    normalized = value.strip()

    if not normalized:
        raise ValueError(
            "Timezone cannot be empty"
        )

    try:
        ZoneInfo(
            normalized
        )
    except ZoneInfoNotFoundError as exc:
        raise ValueError(
            "Timezone must be a valid IANA timezone, "
            "for example Asia/Karachi"
        ) from exc

    return normalized


def _validate_datetime_pair(
    start: datetime,
    end: datetime,
) -> None:
    start_has_timezone = (
        start.tzinfo is not None
        and start.utcoffset() is not None
    )

    end_has_timezone = (
        end.tzinfo is not None
        and end.utcoffset() is not None
    )

    if (
        start_has_timezone
        != end_has_timezone
    ):
        raise ValueError(
            "start and end must either both include "
            "UTC offsets or both omit them"
        )

    if end <= start:
        raise ValueError(
            "end must be after start"
        )


class CalendarAttendeeInput(BaseModel):
    email: EmailStr
    display_name: str | None = Field(
        default=None,
        max_length=200,
    )


class CalendarAttendeeRead(BaseModel):
    email: EmailStr
    display_name: str | None = None
    response_status: str | None = None
    organizer: bool = False
    optional: bool = False


class CalendarEventCreate(BaseModel):
    summary: str = Field(
        min_length=1,
        max_length=1024,
    )

    description: str | None = Field(
        default=None,
        max_length=16_384,
    )

    location: str | None = Field(
        default=None,
        max_length=1024,
    )

    start: datetime
    end: datetime

    timezone: str | None = Field(
        default=None,
        max_length=64,
    )

    attendees: list[
        CalendarAttendeeInput
    ] = Field(
        default_factory=list,
        max_length=100,
    )

    send_updates: CalendarSendUpdates = (
        "none"
    )

    @field_validator(
        "summary",
    )
    @classmethod
    def normalize_summary(
        cls,
        value: str,
    ) -> str:
        normalized = value.strip()

        if not normalized:
            raise ValueError(
                "summary cannot be empty"
            )

        return normalized

    @field_validator(
        "description",
        "location",
    )
    @classmethod
    def normalize_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        normalized = value.strip()

        return normalized or None

    @field_validator(
        "timezone",
    )
    @classmethod
    def validate_timezone(
        cls,
        value: str | None,
    ) -> str | None:
        return _validate_timezone_name(
            value
        )

    @model_validator(
        mode="after"
    )
    def validate_time_range(
        self,
    ) -> "CalendarEventCreate":
        _validate_datetime_pair(
            self.start,
            self.end,
        )

        return self


class CalendarEventUpdate(BaseModel):
    summary: str | None = Field(
        default=None,
        min_length=1,
        max_length=1024,
    )

    description: str | None = Field(
        default=None,
        max_length=16_384,
    )

    location: str | None = Field(
        default=None,
        max_length=1024,
    )

    start: datetime | None = None
    end: datetime | None = None

    timezone: str | None = Field(
        default=None,
        max_length=64,
    )

    attendees: (
        list[
            CalendarAttendeeInput
        ]
        | None
    ) = Field(
        default=None,
        max_length=100,
    )

    send_updates: CalendarSendUpdates = (
        "none"
    )

    @field_validator(
        "summary",
    )
    @classmethod
    def normalize_summary(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        normalized = value.strip()

        if not normalized:
            raise ValueError(
                "summary cannot be empty"
            )

        return normalized

    @field_validator(
        "description",
        "location",
    )
    @classmethod
    def normalize_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        normalized = value.strip()

        return normalized or None

    @field_validator(
        "timezone",
    )
    @classmethod
    def validate_timezone(
        cls,
        value: str | None,
    ) -> str | None:
        return _validate_timezone_name(
            value
        )

    @model_validator(
        mode="after"
    )
    def validate_partial_time_range(
        self,
    ) -> "CalendarEventUpdate":
        if (
            self.start is not None
            and self.end is not None
        ):
            _validate_datetime_pair(
                self.start,
                self.end,
            )

        meaningful_fields = (
            self.summary,
            self.description,
            self.location,
            self.start,
            self.end,
            self.timezone,
            self.attendees,
        )

        if all(
            field is None
            for field in meaningful_fields
        ):
            raise ValueError(
                "At least one event field "
                "must be supplied"
            )

        return self


class CalendarEventTime(BaseModel):
    date_time: datetime | None = None
    date: Date | None = None
    timezone: str | None = None

    @model_validator(
        mode="after"
    )
    def validate_time_value(
        self,
    ) -> "CalendarEventTime":
        if (
            self.date_time is None
            and self.date is None
        ):
            raise ValueError(
                "Calendar event time must "
                "contain date_time or date"
            )

        return self


class CalendarEventRead(BaseModel):
    id: str
    status: str

    summary: str
    description: str | None = None
    location: str | None = None

    start: CalendarEventTime
    end: CalendarEventTime

    html_link: HttpUrl | None = None

    attendees: list[
        CalendarAttendeeRead
    ] = Field(
        default_factory=list
    )

    created_at: datetime | None = None
    updated_at: datetime | None = None


class CalendarEventListResponse(BaseModel):
    timezone: str
    events: list[
        CalendarEventRead
    ] = Field(
        default_factory=list
    )


class CalendarAvailabilityRequest(BaseModel):
    time_min: datetime
    time_max: datetime

    timezone: str | None = Field(
        default=None,
        max_length=64,
    )

    calendar_ids: list[str] = Field(
        default_factory=lambda: [
            "primary"
        ],
        min_length=1,
        max_length=50,
    )

    @field_validator(
        "timezone",
    )
    @classmethod
    def validate_timezone(
        cls,
        value: str | None,
    ) -> str | None:
        return _validate_timezone_name(
            value
        )

    @field_validator(
        "calendar_ids",
    )
    @classmethod
    def normalize_calendar_ids(
        cls,
        values: list[str],
    ) -> list[str]:
        normalized = [
            value.strip()
            for value in values
            if value.strip()
        ]

        normalized = list(
            dict.fromkeys(
                normalized
            )
        )

        if not normalized:
            raise ValueError(
                "At least one calendar ID "
                "is required"
            )

        return normalized

    @model_validator(
        mode="after"
    )
    def validate_time_range(
        self,
    ) -> "CalendarAvailabilityRequest":
        _validate_datetime_pair(
            self.time_min,
            self.time_max,
        )

        return self


class CalendarBusyPeriod(BaseModel):
    start: datetime
    end: datetime


class CalendarAvailabilityCalendar(
    BaseModel
):
    calendar_id: str

    busy: list[
        CalendarBusyPeriod
    ] = Field(
        default_factory=list
    )

    errors: list[str] = Field(
        default_factory=list
    )

    @property
    def is_free(self) -> bool:
        return not self.busy


class CalendarAvailabilityResponse(
    BaseModel
):
    time_min: datetime
    time_max: datetime
    timezone: str

    calendars: list[
        CalendarAvailabilityCalendar
    ] = Field(
        default_factory=list
    )

    is_free: bool