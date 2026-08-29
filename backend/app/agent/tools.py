import json
from datetime import datetime
from typing import (
    Annotated,
    Any,
)
from zoneinfo import (
    ZoneInfo,
    ZoneInfoNotFoundError,
)

from langchain_core.tools import (
    BaseTool,
    tool,
)
from pydantic import (
    Field,
    ValidationError as PydanticValidationError,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.core.config import Settings
from app.core.exceptions import (
    AppError,
)
from app.models.user import User
from app.schemas.calendar import (
    CalendarAvailabilityRequest,
    CalendarEventCreate,
    CalendarEventUpdate,
)
from app.services.calendar_service import (
    CalendarService,
)
from app.services.rag_service import (
    RAG_INSUFFICIENT_CONTEXT_MESSAGE,
    RagService,
)


def build_lifeops_tools(
    *,
    current_user: User,
    session: AsyncSession,
    settings: Settings,
) -> list[BaseTool]:
    """
    Build tools for one authenticated LifeOps request.

    current_user, session, settings and Google credentials
    are captured by backend closures and are intentionally
    absent from every LLM-visible tool input schema.
    """

    rag_service = RagService(
        session,
        settings,
    )

    calendar_service = (
        CalendarService(
            session,
            settings,
        )
    )

    @tool(
        "search_documents",
    )
    async def search_documents(
        query: Annotated[
            str,
            Field(
                min_length=1,
                max_length=4000,
                description=(
                    "The semantic search query "
                    "for the authenticated user's "
                    "uploaded documents."
                ),
            ),
        ],
    ) -> str:
        """
        Search ONLY the authenticated user's uploaded,
        indexed documents.

        Use this tool for questions about uploaded PDFs,
        DOCX files, TXT/Markdown notes, contracts,
        policies, knowledge-base content, or information
        stored in documents.

        Do NOT use this tool to answer questions about
        live Google Calendar events, the user's current
        schedule, meetings, calendar availability, or
        Calendar data.

        The authenticated user is already bound by the
        backend. Never ask for or supply a user ID.
        """

        normalized_query = (
            " ".join(
                query.split()
            )
        )

        if not normalized_query:
            return _tool_validation_error(
                tool_name=(
                    "search_documents"
                ),
                message=(
                    "Document search query "
                    "cannot be empty."
                ),
            )

        try:
            result = (
                await rag_service.retrieve(
                    current_user=(
                        current_user
                    ),
                    question=(
                        normalized_query
                    ),
                )
            )
        except AppError as exc:
            return _app_error_result(
                tool_name=(
                    "search_documents"
                ),
                exc=exc,
            )

        if not result.context_found:
            return _json_result(
                {
                    "ok": True,
                    "tool": (
                        "search_documents"
                    ),
                    "context_found": False,
                    "message": (
                        RAG_INSUFFICIENT_CONTEXT_MESSAGE
                    ),
                    "context": "",
                    "citations": [],
                }
            )

        return _json_result(
            {
                "ok": True,
                "tool": (
                    "search_documents"
                ),
                "context_found": True,
                "context": result.context,
                "citations": [
                    citation.model_dump(
                        mode="json"
                    )
                    for citation
                    in result.citations
                ],
            }
        )

    @tool(
        "list_calendar_events",
    )
    async def list_calendar_events(
        time_min: Annotated[
            datetime,
            Field(
                description=(
                    "Beginning of the Calendar "
                    "search interval. Resolve "
                    "relative dates such as "
                    "'today' or 'this week' to "
                    "a concrete datetime first."
                ),
            ),
        ],
        time_max: Annotated[
            datetime,
            Field(
                description=(
                    "Exclusive end of the "
                    "Calendar search interval. "
                    "Must be after time_min."
                ),
            ),
        ],
        timezone: Annotated[
            str | None,
            Field(
                description=(
                    "Optional valid IANA "
                    "timezone such as "
                    "Asia/Karachi. Omit it to "
                    "use the authenticated "
                    "user's saved timezone."
                ),
            ),
        ] = None,
        max_results: Annotated[
            int,
            Field(
                ge=1,
                le=2500,
                description=(
                    "Maximum number of Calendar "
                    "events to retrieve."
                ),
            ),
        ] = 50,
    ) -> str:
        """
        Read real events from the authenticated user's
        connected Google Calendar for a concrete time
        range.

        Use this for actual schedule questions such as:
        - events today
        - events tomorrow
        - calendar this week
        - calendar this month
        - events on a specific date

        Do NOT use document search for live Calendar
        information.

        time_min and time_max must represent the desired
        interval. The backend validates the interval and
        timezone before Google Calendar is queried.

        The Google connection and access token are
        resolved internally for the authenticated user.
        """

        try:
            validated_window = (
                CalendarAvailabilityRequest(
                    time_min=time_min,
                    time_max=time_max,
                    timezone=timezone,
                )
            )

            result = (
                await calendar_service
                .list_events(
                    current_user=(
                        current_user
                    ),
                    time_min=(
                        validated_window
                        .time_min
                    ),
                    time_max=(
                        validated_window
                        .time_max
                    ),
                    requested_timezone=(
                        validated_window
                        .timezone
                    ),
                    max_results=(
                        max_results
                    ),
                )
            )
        except PydanticValidationError as exc:
            return (
                _pydantic_error_result(
                    tool_name=(
                        "list_calendar_events"
                    ),
                    exc=exc,
                )
            )
        except AppError as exc:
            return _app_error_result(
                tool_name=(
                    "list_calendar_events"
                ),
                exc=exc,
            )

        return _successful_model_result(
            tool_name=(
                "list_calendar_events"
            ),
            model=result,
        )

    @tool(
        "check_calendar_availability",
    )
    async def check_calendar_availability(
        time_min: Annotated[
            datetime,
            Field(
                description=(
                    "Beginning of the exact "
                    "availability interval."
                ),
            ),
        ],
        time_max: Annotated[
            datetime,
            Field(
                description=(
                    "End of the exact "
                    "availability interval. "
                    "Must be after time_min."
                ),
            ),
        ],
        timezone: Annotated[
            str | None,
            Field(
                description=(
                    "Optional IANA timezone. "
                    "Omit it to use the "
                    "authenticated user's saved "
                    "timezone."
                ),
            ),
        ] = None,
    ) -> str:
        """
        Check whether the authenticated user's primary
        Google Calendar is free or busy during an exact
        time interval.

        Use this for questions such as:
        - Am I free tomorrow from 4 PM to 5 PM?
        - Do I have time Friday afternoon?
        - Is 10:00-10:30 available?

        Resolve natural-language dates/times into
        concrete datetimes before calling this tool.

        This tool performs a real Google Calendar
        FreeBusy query. Never infer availability from
        document search results.
        """

        try:
            payload = (
                CalendarAvailabilityRequest(
                    time_min=time_min,
                    time_max=time_max,
                    timezone=timezone,
                    calendar_ids=[
                        "primary"
                    ],
                )
            )

            result = (
                await calendar_service
                .check_availability(
                    current_user=(
                        current_user
                    ),
                    payload=payload,
                )
            )
        except PydanticValidationError as exc:
            return (
                _pydantic_error_result(
                    tool_name=(
                        "check_calendar_availability"
                    ),
                    exc=exc,
                )
            )
        except AppError as exc:
            return _app_error_result(
                tool_name=(
                    "check_calendar_availability"
                ),
                exc=exc,
            )

        return _successful_model_result(
            tool_name=(
                "check_calendar_availability"
            ),
            model=result,
        )

    @tool(
        "create_calendar_event",
    )
    async def create_calendar_event(
        summary: Annotated[
            str,
            Field(
                min_length=1,
                max_length=1024,
                description=(
                    "Title of the Calendar "
                    "event to create."
                ),
            ),
        ],
        start: Annotated[
            datetime,
            Field(
                description=(
                    "Concrete event start "
                    "datetime."
                ),
            ),
        ],
        end: Annotated[
            datetime,
            Field(
                description=(
                    "Concrete event end "
                    "datetime. Must be after "
                    "start."
                ),
            ),
        ],
        timezone: Annotated[
            str | None,
            Field(
                description=(
                    "Optional IANA timezone. "
                    "Omit it to use the "
                    "authenticated user's saved "
                    "timezone."
                ),
            ),
        ] = None,
        description: Annotated[
            str | None,
            Field(
                max_length=16384,
                description=(
                    "Optional Calendar event "
                    "description."
                ),
            ),
        ] = None,
        location: Annotated[
            str | None,
            Field(
                max_length=1024,
                description=(
                    "Optional Calendar event "
                    "location."
                ),
            ),
        ] = None,
    ) -> str:
        """
        Create a real event in the authenticated user's
        connected Google Calendar.

        Use this tool ONLY when the user explicitly asks
        to create, add, book, or schedule a Calendar
        event.

        Do not call it merely because a possible event
        was discussed.

        Before calling, make sure the user's intent,
        event title, start time, and end time are clear.
        Do not invent missing critical scheduling
        details.

        Google OAuth credentials are resolved internally
        and are never tool arguments.
        """

        try:
            payload = (
                CalendarEventCreate(
                    summary=summary,
                    description=(
                        description
                    ),
                    location=location,
                    start=start,
                    end=end,
                    timezone=timezone,
                )
            )

            result = (
                await calendar_service
                .create_event(
                    current_user=(
                        current_user
                    ),
                    payload=payload,
                )
            )
        except PydanticValidationError as exc:
            return (
                _pydantic_error_result(
                    tool_name=(
                        "create_calendar_event"
                    ),
                    exc=exc,
                )
            )
        except AppError as exc:
            return _app_error_result(
                tool_name=(
                    "create_calendar_event"
                ),
                exc=exc,
            )

        return _successful_model_result(
            tool_name=(
                "create_calendar_event"
            ),
            model=result,
        )

    @tool(
        "get_calendar_event",
    )
    async def get_calendar_event(
        event_id: Annotated[
            str,
            Field(
                min_length=1,
                max_length=2048,
                description=(
                    "Google Calendar event ID "
                    "previously obtained from "
                    "Calendar results."
                ),
            ),
        ],
        timezone: Annotated[
            str | None,
            Field(
                description=(
                    "Optional IANA timezone. "
                    "Omit it to use the user's "
                    "saved timezone."
                ),
            ),
        ] = None,
    ) -> str:
        """
        Retrieve details for one real event from the
        authenticated user's Google Calendar.

        Use this when an event ID is already known and
        more details are required.

        Never invent an event ID and never use an event
        belonging to a different user.
        """

        normalized_event_id = (
            event_id.strip()
        )

        if not normalized_event_id:
            return _tool_validation_error(
                tool_name=(
                    "get_calendar_event"
                ),
                message=(
                    "Calendar event ID "
                    "cannot be empty."
                ),
            )

        try:
            normalized_timezone = (
                _normalize_timezone(
                    timezone
                )
            )

            result = (
                await calendar_service
                .get_event(
                    current_user=(
                        current_user
                    ),
                    event_id=(
                        normalized_event_id
                    ),
                    requested_timezone=(
                        normalized_timezone
                    ),
                )
            )
        except ValueError as exc:
            return _tool_validation_error(
                tool_name=(
                    "get_calendar_event"
                ),
                message=str(exc),
            )
        except AppError as exc:
            return _app_error_result(
                tool_name=(
                    "get_calendar_event"
                ),
                exc=exc,
            )

        return _successful_model_result(
            tool_name=(
                "get_calendar_event"
            ),
            model=result,
        )

    @tool(
        "update_calendar_event",
    )
    async def update_calendar_event(
        event_id: Annotated[
            str,
            Field(
                min_length=1,
                max_length=2048,
                description=(
                    "ID of the existing Google "
                    "Calendar event to update."
                ),
            ),
        ],
        summary: Annotated[
            str | None,
            Field(
                min_length=1,
                max_length=1024,
                description=(
                    "Optional replacement event "
                    "title."
                ),
            ),
        ] = None,
        start: Annotated[
            datetime | None,
            Field(
                description=(
                    "Optional replacement start "
                    "datetime."
                ),
            ),
        ] = None,
        end: Annotated[
            datetime | None,
            Field(
                description=(
                    "Optional replacement end "
                    "datetime."
                ),
            ),
        ] = None,
        timezone: Annotated[
            str | None,
            Field(
                description=(
                    "Optional IANA timezone. "
                    "When changing timezone, "
                    "also supply start or end."
                ),
            ),
        ] = None,
        description: Annotated[
            str | None,
            Field(
                max_length=16384,
                description=(
                    "Optional replacement event "
                    "description."
                ),
            ),
        ] = None,
        location: Annotated[
            str | None,
            Field(
                max_length=1024,
                description=(
                    "Optional replacement event "
                    "location."
                ),
            ),
        ] = None,
    ) -> str:
        """
        Update an existing real event in the
        authenticated user's connected Google Calendar.

        Use this tool ONLY when the user explicitly asks
        to change or reschedule an existing event and a
        reliable event ID is known.

        Do not guess which event should be modified.
        Search/list events first when identification is
        necessary.
        """

        normalized_event_id = (
            event_id.strip()
        )

        if not normalized_event_id:
            return _tool_validation_error(
                tool_name=(
                    "update_calendar_event"
                ),
                message=(
                    "Calendar event ID "
                    "cannot be empty."
                ),
            )

        update_data: dict[
            str,
            Any,
        ] = {}

        if summary is not None:
            update_data[
                "summary"
            ] = summary

        if description is not None:
            update_data[
                "description"
            ] = description

        if location is not None:
            update_data[
                "location"
            ] = location

        if start is not None:
            update_data[
                "start"
            ] = start

        if end is not None:
            update_data[
                "end"
            ] = end

        if timezone is not None:
            update_data[
                "timezone"
            ] = timezone

        try:
            payload = (
                CalendarEventUpdate(
                    **update_data
                )
            )

            result = (
                await calendar_service
                .update_event(
                    current_user=(
                        current_user
                    ),
                    event_id=(
                        normalized_event_id
                    ),
                    payload=payload,
                )
            )
        except PydanticValidationError as exc:
            return (
                _pydantic_error_result(
                    tool_name=(
                        "update_calendar_event"
                    ),
                    exc=exc,
                )
            )
        except AppError as exc:
            return _app_error_result(
                tool_name=(
                    "update_calendar_event"
                ),
                exc=exc,
            )

        return _successful_model_result(
            tool_name=(
                "update_calendar_event"
            ),
            model=result,
        )

    return [
        search_documents,
        list_calendar_events,
        check_calendar_availability,
        create_calendar_event,
        get_calendar_event,
        update_calendar_event,
    ]


def _successful_model_result(
    *,
    tool_name: str,
    model: Any,
) -> str:
    """
    Serialize a Pydantic response without exposing any
    backend-only authentication/session information.
    """

    return _json_result(
        {
            "ok": True,
            "tool": tool_name,
            "data": model.model_dump(
                mode="json"
            ),
        }
    )


def _app_error_result(
    *,
    tool_name: str,
    exc: AppError,
) -> str:
    """
    Return expected application errors as safe tool
    observations so the agent can explain connection,
    scope, validation, or reauthorization problems.
    """

    return _json_result(
        {
            "ok": False,
            "tool": tool_name,
            "error": {
                "code": exc.code,
                "message": (
                    exc.message
                ),
            },
        }
    )


def _pydantic_error_result(
    *,
    tool_name: str,
    exc: PydanticValidationError,
) -> str:
    details: list[str] = []

    for error in exc.errors(
        include_url=False
    )[:5]:
        raw_location = (
            error.get(
                "loc",
                (),
            )
        )

        location = ".".join(
            str(part)
            for part
            in raw_location
        )

        message = str(
            error.get(
                "msg",
                "Invalid value",
            )
        )

        if location:
            details.append(
                f"{location}: {message}"
            )
        else:
            details.append(
                message
            )

    return _json_result(
        {
            "ok": False,
            "tool": tool_name,
            "error": {
                "code": (
                    "tool_validation_error"
                ),
                "message": (
                    "The tool input is invalid."
                ),
                "details": details,
            },
        }
    )


def _tool_validation_error(
    *,
    tool_name: str,
    message: str,
) -> str:
    return _json_result(
        {
            "ok": False,
            "tool": tool_name,
            "error": {
                "code": (
                    "tool_validation_error"
                ),
                "message": message,
            },
        }
    )


def _normalize_timezone(
    timezone_name: str | None,
) -> str | None:
    if timezone_name is None:
        return None

    normalized = (
        timezone_name.strip()
    )

    if not normalized:
        raise ValueError(
            "Timezone cannot be empty."
        )

    try:
        ZoneInfo(
            normalized
        )
    except ZoneInfoNotFoundError as exc:
        raise ValueError(
            "Timezone must be a valid IANA "
            "timezone, for example "
            "Asia/Karachi."
        ) from exc

    return normalized


def _json_result(
    payload: dict[
        str,
        Any,
    ],
) -> str:
    return json.dumps(
        payload,
        ensure_ascii=False,
        separators=(
            ",",
            ":",
        ),
    )