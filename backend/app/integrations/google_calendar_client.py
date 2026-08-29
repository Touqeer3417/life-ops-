from datetime import datetime
from typing import Any
from urllib.parse import quote

import httpx

from app.core.config import Settings
from app.core.exceptions import (
    GoogleCalendarError,
    NotFoundError,
    OAuthInsufficientScopeError,
    OAuthReauthorizationRequiredError,
)


GOOGLE_CALENDAR_API_BASE_URL = (
    "https://www.googleapis.com/calendar/v3"
)


class GoogleCalendarClient:
    """Low-level async Google Calendar REST API client."""

    def __init__(
        self,
        *,
        settings: Settings,
        access_token: str,
    ) -> None:
        normalized_token = (
            access_token.strip()
        )

        if not normalized_token:
            raise (
                OAuthReauthorizationRequiredError(
                    "Google access token is missing"
                )
            )

        self._access_token = (
            normalized_token
        )
        self._timeout = (
            settings.google_calendar_api_timeout_seconds
        )

    async def list_events(
        self,
        *,
        time_min: datetime,
        time_max: datetime,
        calendar_id: str = "primary",
        timezone: str | None = None,
        max_results: int = 50,
    ) -> list[dict[str, Any]]:
        if time_max <= time_min:
            raise ValueError(
                "time_max must be after time_min"
            )

        if max_results < 1 or max_results > 2500:
            raise ValueError(
                "max_results must be between "
                "1 and 2500"
            )

        params: dict[
            str,
            str | int,
        ] = {
            "timeMin": (
                time_min.isoformat()
            ),
            "timeMax": (
                time_max.isoformat()
            ),
            "singleEvents": "true",
            "orderBy": "startTime",
            "maxResults": max_results,
        }

        if timezone:
            params["timeZone"] = (
                timezone.strip()
            )

        payload = await self._request(
            "GET",
            (
                "/calendars/"
                f"{self._encode(calendar_id)}"
                "/events"
            ),
            params=params,
        )

        raw_items = payload.get(
            "items",
            [],
        )

        if not isinstance(
            raw_items,
            list,
        ):
            raise GoogleCalendarError(
                "Google Calendar returned an "
                "invalid events response"
            )

        events: list[
            dict[str, Any]
        ] = []

        for item in raw_items:
            if isinstance(
                item,
                dict,
            ):
                events.append(
                    item
                )

        return events

    async def get_event(
        self,
        *,
        event_id: str,
        calendar_id: str = "primary",
        timezone: str | None = None,
    ) -> dict[str, Any]:
        normalized_event_id = (
            event_id.strip()
        )

        if not normalized_event_id:
            raise ValueError(
                "event_id cannot be empty"
            )

        params: dict[
            str,
            str,
        ] = {}

        if timezone:
            params["timeZone"] = (
                timezone.strip()
            )

        return await self._request(
            "GET",
            (
                "/calendars/"
                f"{self._encode(calendar_id)}"
                "/events/"
                f"{self._encode(normalized_event_id)}"
            ),
            params=params or None,
        )

    async def create_event(
        self,
        *,
        event: dict[str, Any],
        calendar_id: str = "primary",
        send_updates: str = "none",
    ) -> dict[str, Any]:
        self._validate_send_updates(
            send_updates
        )

        return await self._request(
            "POST",
            (
                "/calendars/"
                f"{self._encode(calendar_id)}"
                "/events"
            ),
            params={
                "sendUpdates": send_updates,
            },
            json_body=event,
        )

    async def update_event(
        self,
        *,
        event_id: str,
        event_patch: dict[str, Any],
        calendar_id: str = "primary",
        send_updates: str = "none",
    ) -> dict[str, Any]:
        normalized_event_id = (
            event_id.strip()
        )

        if not normalized_event_id:
            raise ValueError(
                "event_id cannot be empty"
            )

        if not event_patch:
            raise ValueError(
                "event_patch cannot be empty"
            )

        self._validate_send_updates(
            send_updates
        )

        return await self._request(
            "PATCH",
            (
                "/calendars/"
                f"{self._encode(calendar_id)}"
                "/events/"
                f"{self._encode(normalized_event_id)}"
            ),
            params={
                "sendUpdates": send_updates,
            },
            json_body=event_patch,
        )

    async def query_free_busy(
        self,
        *,
        time_min: datetime,
        time_max: datetime,
        timezone: str,
        calendar_ids: tuple[
            str,
            ...,
        ] = ("primary",),
    ) -> dict[str, Any]:
        if time_max <= time_min:
            raise ValueError(
                "time_max must be after time_min"
            )

        normalized_timezone = (
            timezone.strip()
        )

        if not normalized_timezone:
            raise ValueError(
                "timezone cannot be empty"
            )

        normalized_calendars = [
            calendar_id.strip()
            for calendar_id
            in calendar_ids
            if calendar_id.strip()
        ]

        if not normalized_calendars:
            raise ValueError(
                "At least one calendar ID "
                "is required"
            )

        if len(
            normalized_calendars
        ) > 50:
            raise ValueError(
                "A maximum of 50 calendars "
                "can be checked at once"
            )

        return await self._request(
            "POST",
            "/freeBusy",
            json_body={
                "timeMin": (
                    time_min.isoformat()
                ),
                "timeMax": (
                    time_max.isoformat()
                ),
                "timeZone": (
                    normalized_timezone
                ),
                "items": [
                    {
                        "id": calendar_id,
                    }
                    for calendar_id
                    in normalized_calendars
                ],
            },
        )

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: (
            dict[
                str,
                str | int,
            ]
            | None
        ) = None,
        json_body: (
            dict[
                str,
                Any,
            ]
            | None
        ) = None,
    ) -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(
                base_url=(
                    GOOGLE_CALENDAR_API_BASE_URL
                ),
                timeout=self._timeout,
                headers={
                    "Authorization": (
                        "Bearer "
                        f"{self._access_token}"
                    ),
                    "Accept": (
                        "application/json"
                    ),
                },
            ) as client:
                response = (
                    await client.request(
                        method,
                        path,
                        params=params,
                        json=json_body,
                    )
                )
        except httpx.TimeoutException as exc:
            raise GoogleCalendarError(
                "Google Calendar request "
                "timed out"
            ) from exc
        except httpx.RequestError as exc:
            raise GoogleCalendarError(
                "Unable to reach "
                "Google Calendar"
            ) from exc

        if not response.is_success:
            self._raise_api_error(
                response
            )

        if response.status_code == 204:
            return {}

        try:
            payload = response.json()
        except ValueError as exc:
            raise GoogleCalendarError(
                "Google Calendar returned "
                "an invalid response"
            ) from exc

        if not isinstance(
            payload,
            dict,
        ):
            raise GoogleCalendarError(
                "Google Calendar returned "
                "an unexpected response"
            )

        return payload

    @staticmethod
    def _raise_api_error(
        response: httpx.Response,
    ) -> None:
        reason = ""
        message = ""

        try:
            payload = response.json()
        except ValueError:
            payload = {}

        if isinstance(
            payload,
            dict,
        ):
            error = payload.get(
                "error"
            )

            if isinstance(
                error,
                dict,
            ):
                raw_message = (
                    error.get(
                        "message"
                    )
                )

                if isinstance(
                    raw_message,
                    str,
                ):
                    message = (
                        raw_message.strip()
                    )

                errors = error.get(
                    "errors"
                )

                if (
                    isinstance(
                        errors,
                        list,
                    )
                    and errors
                    and isinstance(
                        errors[0],
                        dict,
                    )
                ):
                    raw_reason = (
                        errors[0].get(
                            "reason"
                        )
                    )

                    if isinstance(
                        raw_reason,
                        str,
                    ):
                        reason = (
                            raw_reason.strip()
                        )

        if response.status_code == 401:
            raise (
                OAuthReauthorizationRequiredError(
                    "Google authorization is "
                    "invalid or expired. "
                    "Reconnect your Google account."
                )
            )

        if response.status_code == 403:
            if reason in {
                "insufficientPermissions",
                "forbiddenForNonOrganizer",
            } or "scope" in message.lower():
                raise (
                    OAuthInsufficientScopeError(
                        message
                        or (
                            "The Google account "
                            "does not grant the "
                            "required Calendar "
                            "permission"
                        )
                    )
                )

            raise GoogleCalendarError(
                message
                or (
                    "Google denied the "
                    "Calendar operation"
                )
            )

        if response.status_code == 404:
            raise NotFoundError(
                message
                or (
                    "Google Calendar event "
                    "was not found"
                )
            )

        if response.status_code == 429:
            raise GoogleCalendarError(
                "Google Calendar rate limit "
                "was reached. Try again later."
            )

        if (
            500
            <= response.status_code
            < 600
        ):
            raise GoogleCalendarError(
                "Google Calendar is temporarily "
                "unavailable"
            )

        raise GoogleCalendarError(
            message
            or (
                "Google Calendar rejected "
                "the request"
            )
        )

    @staticmethod
    def _encode(
        value: str,
    ) -> str:
        normalized = value.strip()

        if not normalized:
            raise ValueError(
                "Google Calendar identifier "
                "cannot be empty"
            )

        return quote(
            normalized,
            safe="",
        )

    @staticmethod
    def _validate_send_updates(
        value: str,
    ) -> None:
        if value not in {
            "all",
            "externalOnly",
            "none",
        }:
            raise ValueError(
                "send_updates must be one of: "
                "all, externalOnly, none"
            )