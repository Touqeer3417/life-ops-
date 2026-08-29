from datetime import datetime
from typing import Annotated

from fastapi import (
    APIRouter,
    Path,
    Query,
    status,
)

from app.dependencies import (
    CurrentUserDep,
    SessionDep,
    SettingsDep,
)
from app.schemas.calendar import (
    CalendarAvailabilityRequest,
    CalendarAvailabilityResponse,
    CalendarEventCreate,
    CalendarEventListResponse,
    CalendarEventRead,
    CalendarEventUpdate,
)
from app.services.calendar_service import (
    CalendarService,
)


router = APIRouter(
    prefix="/calendar",
    tags=["calendar"],
)


@router.get(
    "/events",
    response_model=CalendarEventListResponse,
)
async def list_calendar_events(
    time_min: Annotated[
        datetime,
        Query(
            description=(
                "Beginning of the event window. "
                "Naive values are interpreted "
                "in the selected user timezone."
            ),
        ),
    ],
    time_max: Annotated[
        datetime,
        Query(
            description=(
                "End of the event window. "
                "Naive values are interpreted "
                "in the selected user timezone."
            ),
        ),
    ],
    current_user: CurrentUserDep,
    session: SessionDep,
    settings: SettingsDep,
    timezone_name: Annotated[
        str | None,
        Query(
            alias="timezone",
            min_length=1,
            max_length=64,
            description=(
                "Optional IANA timezone. "
                "Defaults to the authenticated "
                "user's saved timezone."
            ),
        ),
    ] = None,
    max_results: Annotated[
        int,
        Query(
            ge=1,
            le=2500,
        ),
    ] = 50,
) -> CalendarEventListResponse:
    """
    Read events from the authenticated user's primary Google Calendar.
    """

    return await CalendarService(
        session,
        settings,
    ).list_events(
        current_user=current_user,
        time_min=time_min,
        time_max=time_max,
        requested_timezone=(
            timezone_name
        ),
        max_results=max_results,
    )


@router.get(
    "/events/{event_id}",
    response_model=CalendarEventRead,
)
async def get_calendar_event(
    event_id: Annotated[
        str,
        Path(
            min_length=1,
            max_length=2048,
        ),
    ],
    current_user: CurrentUserDep,
    session: SessionDep,
    settings: SettingsDep,
    timezone_name: Annotated[
        str | None,
        Query(
            alias="timezone",
            min_length=1,
            max_length=64,
        ),
    ] = None,
) -> CalendarEventRead:
    """
    Return details for one event from the user's primary calendar.
    """

    return await CalendarService(
        session,
        settings,
    ).get_event(
        current_user=current_user,
        event_id=event_id,
        requested_timezone=(
            timezone_name
        ),
    )


@router.post(
    "/availability",
    response_model=(
        CalendarAvailabilityResponse
    ),
)
async def check_calendar_availability(
    payload: CalendarAvailabilityRequest,
    current_user: CurrentUserDep,
    session: SessionDep,
    settings: SettingsDep,
) -> CalendarAvailabilityResponse:
    """
    Query Google Calendar FreeBusy for the authenticated user.

    This is a read-only operation and uses the dedicated least-privilege
    free/busy OAuth permission.
    """

    return await CalendarService(
        session,
        settings,
    ).check_availability(
        current_user=current_user,
        payload=payload,
    )


@router.post(
    "/events",
    response_model=CalendarEventRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_calendar_event(
    payload: CalendarEventCreate,
    current_user: CurrentUserDep,
    session: SessionDep,
    settings: SettingsDep,
) -> CalendarEventRead:
    """
    Create an event in the authenticated user's primary Google Calendar.

    This write endpoint requires the Calendar write OAuth scope. It is
    deliberately isolated from read operations so a future approval/HITL
    layer can wrap the write operation without redesigning the client.
    """

    return await CalendarService(
        session,
        settings,
    ).create_event(
        current_user=current_user,
        payload=payload,
    )


@router.patch(
    "/events/{event_id}",
    response_model=CalendarEventRead,
)
async def update_calendar_event(
    event_id: Annotated[
        str,
        Path(
            min_length=1,
            max_length=2048,
        ),
    ],
    payload: CalendarEventUpdate,
    current_user: CurrentUserDep,
    session: SessionDep,
    settings: SettingsDep,
) -> CalendarEventRead:
    """
    Partially update an event in the user's primary Google Calendar.

    Calendar deletion is intentionally not implemented in Phase 3.
    """

    return await CalendarService(
        session,
        settings,
    ).update_event(
        current_user=current_user,
        event_id=event_id,
        payload=payload,
    )