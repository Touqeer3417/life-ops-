import { apiRequest } from './client'

import type {
  CalendarAvailabilityInput,
  CalendarAvailabilityResponse,
  CalendarEvent,
  CalendarEventCreateInput,
  CalendarEventListParams,
  CalendarEventListResponse,
  CalendarEventUpdateInput,
} from '@/types/calendar'


export function getCalendarEvents(
  accessToken: string,
  params: CalendarEventListParams,
): Promise<CalendarEventListResponse> {
  const query = new URLSearchParams()

  query.set(
    'time_min',
    params.time_min,
  )

  query.set(
    'time_max',
    params.time_max,
  )

  if (params.timezone?.trim()) {
    query.set(
      'timezone',
      params.timezone.trim(),
    )
  }

  if (
    params.max_results !== undefined
  ) {
    query.set(
      'max_results',
      String(
        params.max_results,
      ),
    )
  }

  return apiRequest<CalendarEventListResponse>(
    `/calendar/events?${query.toString()}`,
    accessToken,
  )
}


export function getCalendarEvent(
  accessToken: string,
  eventId: string,
  timezone?: string,
): Promise<CalendarEvent> {
  const normalizedEventId =
    eventId.trim()

  if (!normalizedEventId) {
    return Promise.reject(
      new Error(
        'Event ID is required',
      ),
    )
  }

  const query = new URLSearchParams()

  if (timezone?.trim()) {
    query.set(
      'timezone',
      timezone.trim(),
    )
  }

  const queryString =
    query.toString()

  const path =
    `/calendar/events/${encodeURIComponent(
      normalizedEventId,
    )}` +
    (
      queryString
        ? `?${queryString}`
        : ''
    )

  return apiRequest<CalendarEvent>(
    path,
    accessToken,
  )
}


export function checkCalendarAvailability(
  accessToken: string,
  input: CalendarAvailabilityInput,
): Promise<CalendarAvailabilityResponse> {
  return apiRequest<CalendarAvailabilityResponse>(
    '/calendar/availability',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(
        input,
      ),
    },
  )
}


export function createCalendarEvent(
  accessToken: string,
  input: CalendarEventCreateInput,
): Promise<CalendarEvent> {
  return apiRequest<CalendarEvent>(
    '/calendar/events',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(
        input,
      ),
    },
  )
}


export function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  input: CalendarEventUpdateInput,
): Promise<CalendarEvent> {
  const normalizedEventId =
    eventId.trim()

  if (!normalizedEventId) {
    return Promise.reject(
      new Error(
        'Event ID is required',
      ),
    )
  }

  return apiRequest<CalendarEvent>(
    `/calendar/events/${encodeURIComponent(
      normalizedEventId,
    )}`,
    accessToken,
    {
      method: 'PATCH',
      body: JSON.stringify(
        input,
      ),
    },
  )
}