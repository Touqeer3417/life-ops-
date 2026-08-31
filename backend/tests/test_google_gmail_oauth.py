import uuid

import pytest

from app.core.config import (
    GOOGLE_CALENDAR_READ_SCOPES,
    GOOGLE_CALENDAR_WRITE_SCOPES,
    GOOGLE_GMAIL_READ_SCOPES,
)
from app.core.exceptions import (
    OAuthInsufficientScopeError,
)
from app.models.oauth_connection import (
    OAuthConnection,
    OAuthConnectionStatus,
)
from app.schemas.google_integration import (
    GoogleCalendarAccessLevel,
    GoogleConnectRequest,
    GoogleService,
)
from app.services.google_integration_service import (
    GoogleIntegrationService,
)


def _service() -> GoogleIntegrationService:
    """
    Scope computation does not require a database/session,
    OAuth client or token cipher, so construct the service
    without invoking its infrastructure-heavy __init__.
    """

    return object.__new__(
        GoogleIntegrationService
    )


def _connection(
    scopes: list[str],
) -> OAuthConnection:
    return OAuthConnection(
        user_id=uuid.uuid4(),
        status=(
            OAuthConnectionStatus
            .CONNECTED.value
        ),
        scopes=list(
            scopes
        ),
        pending_scopes=[],
        access_token_encrypted=(
            "encrypted-access-token"
        ),
        refresh_token_encrypted=(
            "encrypted-refresh-token"
        ),
    )


def test_connect_request_remains_calendar_backward_compatible() -> None:
    request = (
        GoogleConnectRequest()
    )

    assert request.services == [
        GoogleService.CALENDAR
    ]

    assert (
        request.access_level
        == GoogleCalendarAccessLevel.READ
    )


def test_gmail_incremental_authorization_preserves_calendar_read() -> None:
    connection = _connection(
        list(
            GOOGLE_CALENDAR_READ_SCOPES
        )
    )

    request = (
        GoogleConnectRequest(
            services=[
                GoogleService.GMAIL
            ],
        )
    )

    scopes = (
        _service()
        ._scopes_for_request(
            payload=request,
            connection=connection,
        )
    )

    for scope in (
        GOOGLE_CALENDAR_READ_SCOPES
    ):
        assert scope in scopes

    for scope in (
        GOOGLE_GMAIL_READ_SCOPES
    ):
        assert scope in scopes


def test_gmail_incremental_authorization_preserves_calendar_write() -> None:
    connection = _connection(
        list(
            GOOGLE_CALENDAR_WRITE_SCOPES
        )
    )

    request = (
        GoogleConnectRequest(
            services=[
                GoogleService.GMAIL
            ],
        )
    )

    scopes = (
        _service()
        ._scopes_for_request(
            payload=request,
            connection=connection,
        )
    )

    for scope in (
        GOOGLE_CALENDAR_WRITE_SCOPES
    ):
        assert scope in scopes

    assert (
        GOOGLE_GMAIL_READ_SCOPES[0]
        in scopes
    )


def test_calendar_read_flow_does_not_downgrade_existing_write_scope() -> None:
    connection = _connection(
        list(
            GOOGLE_CALENDAR_WRITE_SCOPES
        )
        + list(
            GOOGLE_GMAIL_READ_SCOPES
        )
    )

    request = (
        GoogleConnectRequest(
            services=[
                GoogleService.CALENDAR
            ],
            access_level=(
                GoogleCalendarAccessLevel.READ
            ),
        )
    )

    scopes = (
        _service()
        ._scopes_for_request(
            payload=request,
            connection=connection,
        )
    )

    assert (
        GOOGLE_CALENDAR_WRITE_SCOPES[0]
        in scopes
    )

    assert (
        GOOGLE_GMAIL_READ_SCOPES[0]
        in scopes
    )


def test_calendar_write_upgrade_preserves_gmail_scope() -> None:
    connection = _connection(
        list(
            GOOGLE_CALENDAR_READ_SCOPES
        )
        + list(
            GOOGLE_GMAIL_READ_SCOPES
        )
    )

    request = (
        GoogleConnectRequest(
            services=[
                GoogleService.CALENDAR
            ],
            access_level=(
                GoogleCalendarAccessLevel.WRITE
            ),
        )
    )

    scopes = (
        _service()
        ._scopes_for_request(
            payload=request,
            connection=connection,
        )
    )

    read_event_scope = (
        GOOGLE_CALENDAR_READ_SCOPES[
            0
        ]
    )

    write_event_scope = (
        GOOGLE_CALENDAR_WRITE_SCOPES[
            0
        ]
    )

    assert (
        write_event_scope
        in scopes
    )

    assert (
        read_event_scope
        not in scopes
    )

    assert (
        GOOGLE_CALENDAR_READ_SCOPES[1]
        in scopes
    )

    assert (
        GOOGLE_GMAIL_READ_SCOPES[0]
        in scopes
    )


def test_combined_calendar_and_gmail_request_contains_both_capabilities() -> None:
    connection = _connection(
        []
    )

    request = (
        GoogleConnectRequest(
            services=[
                GoogleService.CALENDAR,
                GoogleService.GMAIL,
            ],
            access_level=(
                GoogleCalendarAccessLevel.READ
            ),
        )
    )

    scopes = (
        _service()
        ._scopes_for_request(
            payload=request,
            connection=connection,
        )
    )

    for scope in (
        GOOGLE_CALENDAR_READ_SCOPES
    ):
        assert scope in scopes

    assert (
        GOOGLE_GMAIL_READ_SCOPES[0]
        in scopes
    )


def test_calendar_write_scope_satisfies_calendar_read_requirement() -> None:
    connection = _connection(
        list(
            GOOGLE_CALENDAR_WRITE_SCOPES
        )
    )

    _service()._require_scopes(
        connection,
        [
            GOOGLE_CALENDAR_READ_SCOPES[
                0
            ]
        ],
    )


def test_gmail_scope_must_be_explicitly_granted() -> None:
    connection = _connection(
        list(
            GOOGLE_CALENDAR_READ_SCOPES
        )
    )

    with pytest.raises(
        OAuthInsufficientScopeError
    ):
        _service()._require_scopes(
            connection,
            GOOGLE_GMAIL_READ_SCOPES,
        )


def test_status_reports_gmail_and_calendar_capabilities() -> None:
    connection = _connection(
        list(
            GOOGLE_CALENDAR_READ_SCOPES
        )
        + list(
            GOOGLE_GMAIL_READ_SCOPES
        )
    )

    result = (
        GoogleIntegrationService
        ._serialize_status(
            connection
        )
    )

    assert result.connected is True

    assert (
        result.can_read_calendar
        is True
    )

    assert (
        result.can_check_availability
        is True
    )

    assert (
        result.can_read_gmail
        is True
    )

    assert (
        result.can_write_calendar
        is False
    )


def test_status_without_gmail_scope_does_not_claim_gmail_access() -> None:
    connection = _connection(
        list(
            GOOGLE_CALENDAR_READ_SCOPES
        )
    )

    result = (
        GoogleIntegrationService
        ._serialize_status(
            connection
        )
    )

    assert (
        result.can_read_gmail
        is False
    )


def test_duplicate_google_services_are_normalized() -> None:
    request = (
        GoogleConnectRequest(
            services=[
                GoogleService.GMAIL,
                GoogleService.GMAIL,
            ]
        )
    )

    assert request.services == [
        GoogleService.GMAIL
    ]