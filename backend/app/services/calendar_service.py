from datetime import (
    date,
    datetime,
    timezone,
)
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.core.config import (
    GOOGLE_CALENDAR_READ_SCOPES,
    GOOGLE_CALENDAR_WRITE_SCOPES,
    Settings,
)
from app.core.exceptions import (
    OAuthReauthorizationRequiredError,
    ValidationError,
)
from app.integrations.google_calendar_client import (
    GoogleCalendarClient,
)
from app.models.user import User
from app.schemas.calendar import (
    CalendarAttendeeRead,
    CalendarAvailabilityCalendar,
    CalendarAvailabilityRequest,
    CalendarAvailabilityResponse,
    CalendarBusyPeriod,
    CalendarEventCreate,
    CalendarEventListResponse,
    CalendarEventRead,
    CalendarEventTime,
    CalendarEventUpdate,
)
from app.services.google_integration_service import (
    GoogleIntegrationService,
)


class CalendarService:
    """
    User-scoped Google Calendar business logic.

    Auth0 identifies the LifeOps user. Google OAuth credentials are
    resolved only for that user's stored Google connection.
    """

    def __init__(
        self,
        session: AsyncSession,
        settings: Settings,
    ) -> None:
        self.session = session
        self.settings = settings

        self.integration_service = (
            GoogleIntegrationService(
                session,
                settings,
            )
        )

    async def list_events(
        self,
        *,
        current_user: User,
        time_min: datetime,
        time_max: datetime,
        requested_timezone: str | None,
        max_results: int,
    ) -> CalendarEventListResponse:
        timezone_name = self._resolve_timezone(
            current_user,
            requested_timezone,
        )

        normalized_min = self._to_utc(
            time_min,
            timezone_name,
        )

        normalized_max = self._to_utc(
            time_max,
            timezone_name,
        )

        if normalized_max <= normalized_min:
            raise ValidationError(
                "time_max must be after time_min"
            )

        client = await self._get_client(
            current_user=current_user,
            required_scopes=(
                GOOGLE_CALENDAR_READ_SCOPES[
                    0
                ],
            ),
        )

        try:
            raw_events = await client.list_events(
                time_min=normalized_min,
                time_max=normalized_max,
                timezone=timezone_name,
                max_results=max_results,
            )
        except OAuthReauthorizationRequiredError:
            await self._mark_reauthorization(
                current_user
            )
            raise

        return CalendarEventListResponse(
            timezone=timezone_name,
            events=[
                self._parse_event(
                    event
                )
                for event in raw_events
            ],
        )

    async def get_event(
        self,
        *,
        current_user: User,
        event_id: str,
        requested_timezone: str | None,
    ) -> CalendarEventRead:
        timezone_name = self._resolve_timezone(
            current_user,
            requested_timezone,
        )

        client = await self._get_client(
            current_user=current_user,
            required_scopes=(
                GOOGLE_CALENDAR_READ_SCOPES[
                    0
                ],
            ),
        )

        try:
            raw_event = await client.get_event(
                event_id=event_id,
                timezone=timezone_name,
            )
        except OAuthReauthorizationRequiredError:
            await self._mark_reauthorization(
                current_user
            )
            raise

        return self._parse_event(
            raw_event
        )

    async def check_availability(
        self,
        *,
        current_user: User,
        payload: CalendarAvailabilityRequest,
    ) -> CalendarAvailabilityResponse:
        timezone_name = self._resolve_timezone(
            current_user,
            payload.timezone,
        )

        normalized_min = self._to_utc(
            payload.time_min,
            timezone_name,
        )

        normalized_max = self._to_utc(
            payload.time_max,
            timezone_name,
        )

        if normalized_max <= normalized_min:
            raise ValidationError(
                "time_max must be after time_min"
            )

        client = await self._get_client(
            current_user=current_user,
            required_scopes=(
                GOOGLE_CALENDAR_READ_SCOPES[
                    1
                ],
            ),
        )

        try:
            raw_response = (
                await client.query_free_busy(
                    time_min=normalized_min,
                    time_max=normalized_max,
                    timezone=timezone_name,
                    calendar_ids=tuple(
                        payload.calendar_ids
                    ),
                )
            )
        except OAuthReauthorizationRequiredError:
            await self._mark_reauthorization(
                current_user
            )
            raise

        raw_calendars = raw_response.get(
            "calendars",
            {},
        )

        calendars: list[
            CalendarAvailabilityCalendar
        ] = []

        if isinstance(
            raw_calendars,
            dict,
        ):
            for calendar_id in (
                payload.calendar_ids
            ):
                raw_calendar = (
                    raw_calendars.get(
                        calendar_id,
                        {},
                    )
                )

                calendars.append(
                    self._parse_availability_calendar(
                        calendar_id,
                        raw_calendar,
                    )
                )

        is_free = bool(
            calendars
        ) and all(
            not calendar.busy
            and not calendar.errors
            for calendar in calendars
        )

        return CalendarAvailabilityResponse(
            time_min=normalized_min,
            time_max=normalized_max,
            timezone=timezone_name,
            calendars=calendars,
            is_free=is_free,
        )

    async def create_event(
        self,
        *,
        current_user: User,
        payload: CalendarEventCreate,
    ) -> CalendarEventRead:
        timezone_name = self._resolve_timezone(
            current_user,
            payload.timezone,
        )

        start_utc = self._to_utc(
            payload.start,
            timezone_name,
        )

        end_utc = self._to_utc(
            payload.end,
            timezone_name,
        )

        if end_utc <= start_utc:
            raise ValidationError(
                "Event end must be after start"
            )

        event_body: dict[
            str,
            Any,
        ] = {
            "summary": payload.summary,
            "start": {
                "dateTime": (
                    start_utc.isoformat()
                ),
                "timeZone": (
                    timezone_name
                ),
            },
            "end": {
                "dateTime": (
                    end_utc.isoformat()
                ),
                "timeZone": (
                    timezone_name
                ),
            },
        }

        if payload.description is not None:
            event_body["description"] = (
                payload.description
            )

        if payload.location is not None:
            event_body["location"] = (
                payload.location
            )

        if payload.attendees:
            event_body["attendees"] = [
                {
                    "email": str(
                        attendee.email
                    ),
                }
                for attendee
                in payload.attendees
            ]

        client = await self._get_client(
            current_user=current_user,
            required_scopes=(
                GOOGLE_CALENDAR_WRITE_SCOPES[
                    0
                ],
            ),
        )

        try:
            raw_event = await client.create_event(
                event=event_body,
                send_updates=(
                    payload.send_updates
                ),
            )
        except OAuthReauthorizationRequiredError:
            await self._mark_reauthorization(
                current_user
            )
            raise

        return self._parse_event(
            raw_event
        )

    async def update_event(
        self,
        *,
        current_user: User,
        event_id: str,
        payload: CalendarEventUpdate,
    ) -> CalendarEventRead:
        timezone_name = self._resolve_timezone(
            current_user,
            payload.timezone,
        )

        supplied_fields = (
            payload.model_fields_set
        )

        if (
            "timezone" in supplied_fields
            and "start" not in supplied_fields
            and "end" not in supplied_fields
        ):
            raise ValidationError(
                "timezone can only be changed "
                "together with start or end"
            )

        event_patch: dict[
            str,
            Any,
        ] = {}

        if (
            "summary" in supplied_fields
            and payload.summary is not None
        ):
            event_patch["summary"] = (
                payload.summary
            )

        if "description" in supplied_fields:
            event_patch["description"] = (
                payload.description
                if payload.description
                is not None
                else ""
            )

        if "location" in supplied_fields:
            event_patch["location"] = (
                payload.location
                if payload.location
                is not None
                else ""
            )

        if (
            "start" in supplied_fields
            and payload.start is not None
        ):
            start_utc = self._to_utc(
                payload.start,
                timezone_name,
            )

            event_patch["start"] = {
                "dateTime": (
                    start_utc.isoformat()
                ),
                "timeZone": timezone_name,
            }

        if (
            "end" in supplied_fields
            and payload.end is not None
        ):
            end_utc = self._to_utc(
                payload.end,
                timezone_name,
            )

            event_patch["end"] = {
                "dateTime": (
                    end_utc.isoformat()
                ),
                "timeZone": timezone_name,
            }

        if (
            payload.start is not None
            and payload.end is not None
        ):
            start_utc = self._to_utc(
                payload.start,
                timezone_name,
            )

            end_utc = self._to_utc(
                payload.end,
                timezone_name,
            )

            if end_utc <= start_utc:
                raise ValidationError(
                    "Event end must be "
                    "after start"
                )

        if "attendees" in supplied_fields:
            event_patch["attendees"] = [
                {
                    "email": str(
                        attendee.email
                    ),
                }
                for attendee
                in (
                    payload.attendees
                    or []
                )
            ]

        if not event_patch:
            raise ValidationError(
                "At least one supported event "
                "field must be supplied"
            )

        client = await self._get_client(
            current_user=current_user,
            required_scopes=(
                GOOGLE_CALENDAR_WRITE_SCOPES[
                    0
                ],
            ),
        )

        try:
            raw_event = await client.update_event(
                event_id=event_id,
                event_patch=event_patch,
                send_updates=(
                    payload.send_updates
                ),
            )
        except OAuthReauthorizationRequiredError:
            await self._mark_reauthorization(
                current_user
            )
            raise

        return self._parse_event(
            raw_event
        )

    async def _get_client(
        self,
        *,
        current_user: User,
        required_scopes: tuple[str, ...],
    ) -> GoogleCalendarClient:
        access_token = (
            await self.integration_service
            .get_valid_access_token(
                user_id=current_user.id,
                required_scopes=(
                    required_scopes
                ),
            )
        )

        return GoogleCalendarClient(
            settings=self.settings,
            access_token=access_token,
        )

    async def _mark_reauthorization(
        self,
        current_user: User,
    ) -> None:
        await self.integration_service.mark_reauthorization_required(
            user_id=current_user.id,
            error_code=(
                "google_calendar_unauthorized"
            ),
            error_message=(
                "Google Calendar rejected the "
                "stored authorization. "
                "Reconnect the Google account."
            ),
        )

    @staticmethod
    def _resolve_timezone(
        current_user: User,
        requested_timezone: str | None,
    ) -> str:
        if requested_timezone:
            return requested_timezone

        preferences = (
            current_user.preferences
        )

        if (
            preferences is not None
            and preferences.timezone
        ):
            return preferences.timezone

        return "UTC"

    @staticmethod
    def _to_utc(
        value: datetime,
        timezone_name: str,
    ) -> datetime:
        if (
            value.tzinfo is None
            or value.utcoffset()
            is None
        ):
            value = value.replace(
                tzinfo=ZoneInfo(
                    timezone_name
                )
            )

        return value.astimezone(
            timezone.utc
        )

    @classmethod
    def _parse_event(
        cls,
        raw_event: dict[
            str,
            Any,
        ],
    ) -> CalendarEventRead:
        raw_start = raw_event.get(
            "start",
            {},
        )

        raw_end = raw_event.get(
            "end",
            {},
        )

        if not isinstance(
            raw_start,
            dict,
        ):
            raw_start = {}

        if not isinstance(
            raw_end,
            dict,
        ):
            raw_end = {}

        raw_attendees = raw_event.get(
            "attendees",
            [],
        )

        attendees: list[
            CalendarAttendeeRead
        ] = []

        if isinstance(
            raw_attendees,
            list,
        ):
            for raw_attendee in (
                raw_attendees
            ):
                if not isinstance(
                    raw_attendee,
                    dict,
                ):
                    continue

                email = raw_attendee.get(
                    "email"
                )

                if not isinstance(
                    email,
                    str,
                ) or not email.strip():
                    continue

                attendees.append(
                    CalendarAttendeeRead(
                        email=email,
                        display_name=(
                            cls._optional_string(
                                raw_attendee.get(
                                    "displayName"
                                )
                            )
                        ),
                        response_status=(
                            cls._optional_string(
                                raw_attendee.get(
                                    "responseStatus"
                                )
                            )
                        ),
                        organizer=bool(
                            raw_attendee.get(
                                "organizer",
                                False,
                            )
                        ),
                        optional=bool(
                            raw_attendee.get(
                                "optional",
                                False,
                            )
                        ),
                    )
                )

        event_id = raw_event.get(
            "id"
        )

        if not isinstance(
            event_id,
            str,
        ) or not event_id:
            raise ValidationError(
                "Google Calendar returned "
                "an event without an ID"
            )

        summary = raw_event.get(
            "summary"
        )

        if not isinstance(
            summary,
            str,
        ) or not summary.strip():
            summary = "(Untitled event)"

        status_value = raw_event.get(
            "status"
        )

        status_text = (
            status_value
            if isinstance(
                status_value,
                str,
            )
            else "confirmed"
        )

        return CalendarEventRead(
            id=event_id,
            status=status_text,
            summary=summary,
            description=(
                cls._optional_string(
                    raw_event.get(
                        "description"
                    )
                )
            ),
            location=(
                cls._optional_string(
                    raw_event.get(
                        "location"
                    )
                )
            ),
            start=cls._parse_event_time(
                raw_start
            ),
            end=cls._parse_event_time(
                raw_end
            ),
            html_link=(
                cls._optional_string(
                    raw_event.get(
                        "htmlLink"
                    )
                )
            ),
            attendees=attendees,
            created_at=(
                cls._parse_datetime(
                    raw_event.get(
                        "created"
                    )
                )
            ),
            updated_at=(
                cls._parse_datetime(
                    raw_event.get(
                        "updated"
                    )
                )
            ),
        )

    @classmethod
    def _parse_event_time(
        cls,
        value: dict[
            str,
            Any,
        ],
    ) -> CalendarEventTime:
        date_time_value = value.get(
            "dateTime"
        )

        date_value = value.get(
            "date"
        )

        timezone_value = (
            cls._optional_string(
                value.get(
                    "timeZone"
                )
            )
        )

        parsed_datetime = (
            cls._parse_datetime(
                date_time_value
            )
        )

        parsed_date: date | None = None

        if (
            parsed_datetime is None
            and isinstance(
                date_value,
                str,
            )
        ):
            try:
                parsed_date = (
                    date.fromisoformat(
                        date_value
                    )
                )
            except ValueError as exc:
                raise ValidationError(
                    "Google Calendar returned "
                    "an invalid event date"
                ) from exc

        return CalendarEventTime(
            date_time=parsed_datetime,
            date=parsed_date,
            timezone=timezone_value,
        )

    @classmethod
    def _parse_availability_calendar(
        cls,
        calendar_id: str,
        raw_calendar: Any,
    ) -> CalendarAvailabilityCalendar:
        if not isinstance(
            raw_calendar,
            dict,
        ):
            return (
                CalendarAvailabilityCalendar(
                    calendar_id=calendar_id,
                    errors=[
                        "Invalid response from "
                        "Google Calendar"
                    ],
                )
            )

        busy_periods: list[
            CalendarBusyPeriod
        ] = []

        raw_busy = raw_calendar.get(
            "busy",
            [],
        )

        if isinstance(
            raw_busy,
            list,
        ):
            for raw_period in raw_busy:
                if not isinstance(
                    raw_period,
                    dict,
                ):
                    continue

                start = cls._parse_datetime(
                    raw_period.get(
                        "start"
                    )
                )

                end = cls._parse_datetime(
                    raw_period.get(
                        "end"
                    )
                )

                if (
                    start is not None
                    and end is not None
                ):
                    busy_periods.append(
                        CalendarBusyPeriod(
                            start=start,
                            end=end,
                        )
                    )

        errors: list[str] = []

        raw_errors = raw_calendar.get(
            "errors",
            [],
        )

        if isinstance(
            raw_errors,
            list,
        ):
            for raw_error in raw_errors:
                if isinstance(
                    raw_error,
                    dict,
                ):
                    reason = (
                        raw_error.get(
                            "reason"
                        )
                    )

                    if isinstance(
                        reason,
                        str,
                    ) and reason.strip():
                        errors.append(
                            reason.strip()
                        )
                elif isinstance(
                    raw_error,
                    str,
                ) and raw_error.strip():
                    errors.append(
                        raw_error.strip()
                    )

        return CalendarAvailabilityCalendar(
            calendar_id=calendar_id,
            busy=busy_periods,
            errors=errors,
        )

    @staticmethod
    def _parse_datetime(
        value: Any,
    ) -> datetime | None:
        if not isinstance(
            value,
            str,
        ) or not value.strip():
            return None

        normalized = (
            value.strip()
            .replace(
                "Z",
                "+00:00",
            )
        )

        try:
            return datetime.fromisoformat(
                normalized
            )
        except ValueError as exc:
            raise ValidationError(
                "Google Calendar returned "
                "an invalid datetime"
            ) from exc

    @staticmethod
    def _optional_string(
        value: Any,
    ) -> str | None:
        if not isinstance(
            value,
            str,
        ):
            return None

        normalized = value.strip()

        return normalized or None