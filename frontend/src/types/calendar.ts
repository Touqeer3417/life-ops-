export type CalendarSendUpdates =
  | 'all'
  | 'externalOnly'
  | 'none'


export interface CalendarAttendeeInput {
  email: string
  display_name?: string | null
}


export interface CalendarAttendee {
  email: string
  display_name: string | null
  response_status: string | null
  organizer: boolean
  optional: boolean
}


export interface CalendarEventTime {
  date_time: string | null
  date: string | null
  timezone: string | null
}


export interface CalendarEvent {
  id: string
  status: string

  summary: string
  description: string | null
  location: string | null

  start: CalendarEventTime
  end: CalendarEventTime

  html_link: string | null

  attendees: CalendarAttendee[]

  created_at: string | null
  updated_at: string | null
}


export interface CalendarEventListResponse {
  timezone: string
  events: CalendarEvent[]
}


export interface CalendarEventListParams {
  time_min: string
  time_max: string
  timezone?: string
  max_results?: number
}


export interface CalendarEventCreateInput {
  summary: string

  description?: string | null
  location?: string | null

  start: string
  end: string

  timezone?: string | null

  attendees?: CalendarAttendeeInput[]

  send_updates?: CalendarSendUpdates
}


export interface CalendarEventUpdateInput {
  summary?: string

  description?: string | null
  location?: string | null

  start?: string
  end?: string

  timezone?: string | null

  attendees?: CalendarAttendeeInput[] | null

  send_updates?: CalendarSendUpdates
}


export interface CalendarAvailabilityInput {
  time_min: string
  time_max: string

  timezone?: string | null

  calendar_ids?: string[]
}


export interface CalendarBusyPeriod {
  start: string
  end: string
}


export interface CalendarAvailabilityCalendar {
  calendar_id: string
  busy: CalendarBusyPeriod[]
  errors: string[]
}


export interface CalendarAvailabilityResponse {
  time_min: string
  time_max: string
  timezone: string

  calendars: CalendarAvailabilityCalendar[]

  is_free: boolean
}