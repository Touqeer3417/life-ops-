import {
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Pencil,
  RefreshCw,
  Search,
} from 'lucide-react'
import {
  Link,
} from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import {
  useCalendarAvailability,
  useCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
} from '@/hooks/useCalendar'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useGoogleIntegration } from '@/hooks/useGoogleIntegration'

import type {
  CalendarEvent,
  CalendarEventCreateInput,
} from '@/types/calendar'


const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-200 '
  + 'px-3.5 py-2.5 text-sm outline-none transition '
  + 'focus:border-slate-400 focus:ring-2 focus:ring-slate-100'


export function CalendarPage() {
  const currentUser =
    useCurrentUser()

  const google =
    useGoogleIntegration()

  const timezone =
    currentUser.data?.preferences
      .timezone
    ?? 'UTC'

  const defaultWindow =
    useMemo(
      () => createDefaultEventWindow(),
      [],
    )

  const events =
    useCalendarEvents(
      {
        time_min:
          defaultWindow.timeMin,
        time_max:
          defaultWindow.timeMax,
        timezone,
        max_results: 100,
      },
      Boolean(
        google.data?.connected
        && google.data
          .can_read_calendar
        && currentUser.data,
      ),
    )

  const createMutation =
    useCreateCalendarEvent()

  const updateMutation =
    useUpdateCalendarEvent()

  const availabilityMutation =
    useCalendarAvailability()

  const [
    selectedEvent,
    setSelectedEvent,
  ] = useState<
    CalendarEvent | null
  >(
    null
  )

  const [
    summary,
    setSummary,
  ] = useState('')

  const [
    description,
    setDescription,
  ] = useState('')

  const [
    location,
    setLocation,
  ] = useState('')

  const [
    start,
    setStart,
  ] = useState(
    defaultDateTimeLocal(
      1
    )
  )

  const [
    end,
    setEnd,
  ] = useState(
    defaultDateTimeLocal(
      2
    )
  )

  const [
    availabilityStart,
    setAvailabilityStart,
  ] = useState(
    defaultDateTimeLocal(
      1
    )
  )

  const [
    availabilityEnd,
    setAvailabilityEnd,
  ] = useState(
    defaultDateTimeLocal(
      2
    )
  )

  if (
    currentUser.isLoading
    || google.isLoading
  ) {
    return (
      <LoadingScreen
        label="Loading Calendar…"
      />
    )
  }

  if (currentUser.isError) {
    return (
      <ErrorState
        message={
          currentUser.error.message
        }
        onRetry={() => {
          void currentUser.refetch()
        }}
      />
    )
  }

  if (google.isError) {
    return (
      <ErrorState
        message={
          google.error.message
        }
        onRetry={() => {
          void google.refetch()
        }}
      />
    )
  }

  if (
    !currentUser.data
    || !google.data
  ) {
    return null
  }

  if (
    !google.data.connected
    || google.data
      .reauthorization_required
  ) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <CalendarClock
              className="h-7 w-7 text-slate-600"
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-950">
            Connect Google Calendar
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Calendar access is not currently
            available for this account.
            Connect or reconnect Google before
            reading and managing events.
          </p>

          <Link
            to="/app/integrations"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open integrations
          </Link>
        </Card>
      </div>
    )
  }

  function resetEventForm() {
    setSelectedEvent(
      null
    )

    setSummary(
      ''
    )

    setDescription(
      ''
    )

    setLocation(
      ''
    )

    setStart(
      defaultDateTimeLocal(
        1
      )
    )

    setEnd(
      defaultDateTimeLocal(
        2
      )
    )

    createMutation.reset()
    updateMutation.reset()
  }

  function selectEventForEditing(
    event: CalendarEvent,
  ) {
    setSelectedEvent(
      event
    )

    setSummary(
      event.summary
    )

    setDescription(
      event.description
      ?? ''
    )

    setLocation(
      event.location
      ?? ''
    )

    setStart(
      event.start.date_time
        ? isoToDateTimeLocal(
            event.start
              .date_time
          )
        : ''
    )

    setEnd(
      event.end.date_time
        ? isoToDateTimeLocal(
            event.end
              .date_time
          )
        : ''
    )

    createMutation.reset()
    updateMutation.reset()
  }

  function handleEventSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const normalizedSummary =
      summary.trim()

    if (
      !normalizedSummary
      || !start
      || !end
    ) {
      return
    }

    if (
      new Date(
        end
      ).getTime()
      <= new Date(
        start
      ).getTime()
    ) {
      return
    }

    if (selectedEvent) {
      updateMutation.mutate(
        {
          eventId:
            selectedEvent.id,

          input: {
            summary:
              normalizedSummary,

            description:
              description.trim()
              || null,

            location:
              location.trim()
              || null,

            start,
            end,
            timezone,
            send_updates:
              'none',
          },
        },
        {
          onSuccess: (
            updatedEvent,
          ) => {
            selectEventForEditing(
              updatedEvent
            )

            void events.refetch()
          },
        },
      )

      return
    }

    const input:
      CalendarEventCreateInput = {
        summary:
          normalizedSummary,

        description:
          description.trim()
          || null,

        location:
          location.trim()
          || null,

        start,
        end,
        timezone,
        attendees: [],
        send_updates:
          'none',
      }

    createMutation.mutate(
      input,
      {
        onSuccess: () => {
          resetEventForm()

          void events.refetch()
        },
      },
    )
  }

  function handleAvailabilityCheck(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      !availabilityStart
      || !availabilityEnd
    ) {
      return
    }

    availabilityMutation.mutate({
      time_min:
        availabilityStart,

      time_max:
        availabilityEnd,

      timezone,

      calendar_ids: [
        'primary',
      ],
    })
  }

  const canWrite =
    google.data
      .can_write_calendar

  const mutationError =
    createMutation.error
    ?? updateMutation.error

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-sky-700">
            Phase 3 · Google Calendar
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Calendar workspace
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Read upcoming events, check
            availability, and manage calendar
            events from LifeOps AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {timezone}
          </span>

          <Button
            type="button"
            variant="secondary"
            disabled={
              events.isFetching
            }
            onClick={() => {
              void events.refetch()
            }}
          >
            <RefreshCw
              className={[
                'mr-2 h-4 w-4',
                events.isFetching
                  ? 'animate-spin'
                  : '',
              ].join(' ')}
              aria-hidden="true"
            />
            Refresh
          </Button>
        </div>
      </div>

      {!canWrite ? (
        <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Calendar is currently
              read-only
            </p>

            <p className="mt-1 text-sm text-amber-700">
              Enable Calendar write access
              before creating or updating
              events.
            </p>
          </div>

          <Link
            to="/app/integrations"
            className="shrink-0 text-sm font-semibold text-amber-900 hover:text-amber-950"
          >
            Manage permissions
          </Link>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Upcoming events
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Next seven days from your
                  primary Google Calendar.
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 p-2.5">
                <CalendarClock
                  className="h-5 w-5 text-slate-700"
                  aria-hidden="true"
                />
              </div>
            </div>

            {events.isLoading ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Loading events…
              </div>
            ) : null}

            {events.isError ? (
              <div className="mt-5">
                <ErrorState
                  message={
                    events.error.message
                  }
                  onRetry={() => {
                    void events.refetch()
                  }}
                />
              </div>
            ) : null}

            {events.data
              && events.data.events
                .length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
                    <CalendarClock
                      className="mx-auto h-8 w-8 text-slate-400"
                      aria-hidden="true"
                    />

                    <p className="mt-3 font-semibold text-slate-800">
                      No upcoming events
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Your primary calendar
                      has no events in this
                      seven-day window.
                    </p>
                  </div>
                ) : null}

            {events.data?.events
              .length ? (
                <div className="mt-6 divide-y divide-slate-100">
                  {events.data.events.map(
                    (event) => (
                      <EventRow
                        key={
                          event.id
                        }
                        event={
                          event
                        }
                        timezone={
                          timezone
                        }
                        canWrite={
                          canWrite
                        }
                        onEdit={() => {
                          selectEventForEditing(
                            event
                          )
                        }}
                      />
                    ),
                  )}
                </div>
              ) : null}
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2.5">
                <Search
                  className="h-5 w-5 text-slate-700"
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2 className="font-bold text-slate-950">
                  Check availability
                </h2>

                <p className="text-sm text-slate-500">
                  Query Google FreeBusy for
                  your primary calendar.
                </p>
              </div>
            </div>

            <form
              className="mt-6"
              onSubmit={
                handleAvailabilityCheck
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Start
                  <input
                    type="datetime-local"
                    required
                    value={
                      availabilityStart
                    }
                    onChange={(
                      event,
                    ) => {
                      setAvailabilityStart(
                        event.target
                          .value
                      )
                    }}
                    className={
                      inputClassName
                    }
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  End
                  <input
                    type="datetime-local"
                    required
                    value={
                      availabilityEnd
                    }
                    onChange={(
                      event,
                    ) => {
                      setAvailabilityEnd(
                        event.target
                          .value
                      )
                    }}
                    className={
                      inputClassName
                    }
                  />
                </label>
              </div>

              <div className="mt-4">
                <Button
                  type="submit"
                  disabled={
                    availabilityMutation
                      .isPending
                  }
                >
                  <Clock3
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                  />
                  {
                    availabilityMutation
                      .isPending
                      ? 'Checking…'
                      : 'Check availability'
                  }
                </Button>
              </div>
            </form>

            {availabilityMutation.isError ? (
              <div className="mt-5">
                <ErrorState
                  message={
                    availabilityMutation
                      .error.message
                  }
                />
              </div>
            ) : null}

            {availabilityMutation.data ? (
              <AvailabilityResult
                isFree={
                  availabilityMutation
                    .data.is_free
                }
                busyCount={
                  availabilityMutation
                    .data.calendars
                    .reduce(
                      (
                        total,
                        calendar,
                      ) => (
                        total
                        + calendar
                          .busy.length
                      ),
                      0,
                    )
                }
              />
            ) : null}
          </Card>
        </div>

        <Card className="h-fit">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                {
                  selectedEvent
                    ? 'Update event'
                    : 'Create event'
                }
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {
                  selectedEvent
                    ? 'Edit the selected Google Calendar event.'
                    : 'Add a new event to your primary calendar.'
                }
              </p>
            </div>

            <div className="rounded-xl bg-slate-100 p-2.5">
              {
                selectedEvent
                  ? (
                    <Pencil
                      className="h-5 w-5 text-slate-700"
                      aria-hidden="true"
                    />
                  )
                  : (
                    <CalendarPlus
                      className="h-5 w-5 text-slate-700"
                      aria-hidden="true"
                    />
                  )
              }
            </div>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={
              handleEventSubmit
            }
          >
            <label className="block text-sm font-medium text-slate-700">
              Title
              <input
                value={summary}
                onChange={(
                  event,
                ) => {
                  setSummary(
                    event.target
                      .value
                  )
                }}
                required
                maxLength={1024}
                placeholder="Project meeting"
                className={
                  inputClassName
                }
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Description
              <textarea
                value={description}
                onChange={(
                  event,
                ) => {
                  setDescription(
                    event.target
                      .value
                  )
                }}
                rows={3}
                maxLength={16384}
                placeholder="Optional notes"
                className={
                  inputClassName
                }
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Location
              <input
                value={location}
                onChange={(
                  event,
                ) => {
                  setLocation(
                    event.target
                      .value
                  )
                }}
                maxLength={1024}
                placeholder="Online or physical location"
                className={
                  inputClassName
                }
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Start
                <input
                  type="datetime-local"
                  value={start}
                  onChange={(
                    event,
                  ) => {
                    setStart(
                      event.target
                        .value
                    )
                  }}
                  required
                  className={
                    inputClassName
                  }
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                End
                <input
                  type="datetime-local"
                  value={end}
                  onChange={(
                    event,
                  ) => {
                    setEnd(
                      event.target
                        .value
                    )
                  }}
                  required
                  className={
                    inputClassName
                  }
                />
              </label>
            </div>

            <p className="text-xs text-slate-500">
              Times are interpreted using
              your saved timezone:{' '}
              <span className="font-semibold text-slate-700">
                {timezone}
              </span>
            </p>

            {mutationError ? (
              <ErrorState
                message={
                  mutationError.message
                }
              />
            ) : null}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="submit"
                disabled={
                  !canWrite
                  || createMutation
                    .isPending
                  || updateMutation
                    .isPending
                }
              >
                {
                  createMutation
                    .isPending
                  || updateMutation
                    .isPending
                    ? 'Saving…'
                    : selectedEvent
                      ? 'Update event'
                      : 'Create event'
                }
              </Button>

              {selectedEvent ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={
                    resetEventForm
                  }
                >
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}


interface EventRowProps {
  event: CalendarEvent
  timezone: string
  canWrite: boolean
  onEdit: () => void
}


function EventRow({
  event,
  timezone,
  canWrite,
  onEdit,
}: EventRowProps) {
  return (
    <div className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="font-semibold text-slate-950">
            {event.summary}
          </p>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center">
              <Clock3
                className="mr-1.5 h-4 w-4"
                aria-hidden="true"
              />

              {formatEventTime(
                event,
                timezone
              )}
            </span>

            {event.location ? (
              <span className="inline-flex items-center">
                <MapPin
                  className="mr-1.5 h-4 w-4"
                  aria-hidden="true"
                />

                {event.location}
              </span>
            ) : null}
          </div>

          {event.description ? (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
              {event.description}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2">
          {event.html_link ? (
            <a
              href={
                event.html_link
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ExternalLink
                className="mr-1.5 h-3.5 w-3.5"
                aria-hidden="true"
              />
              Google
            </a>
          ) : null}

          {canWrite
            && event.start.date_time
            && event.end.date_time ? (
              <button
                type="button"
                onClick={
                  onEdit
                }
                className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil
                  className="mr-1.5 h-3.5 w-3.5"
                  aria-hidden="true"
                />
                Edit
              </button>
            ) : null}
        </div>
      </div>
    </div>
  )
}


interface AvailabilityResultProps {
  isFree: boolean
  busyCount: number
}


function AvailabilityResult({
  isFree,
  busyCount,
}: AvailabilityResultProps) {
  return (
    <div
      className={[
        'mt-5 flex gap-3 rounded-xl border p-4',
        isFree
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-amber-200 bg-amber-50',
      ].join(' ')}
    >
      <CheckCircle2
        className={[
          'mt-0.5 h-5 w-5 shrink-0',
          isFree
            ? 'text-emerald-700'
            : 'text-amber-700',
        ].join(' ')}
        aria-hidden="true"
      />

      <div>
        <p
          className={[
            'text-sm font-semibold',
            isFree
              ? 'text-emerald-900'
              : 'text-amber-900',
          ].join(' ')}
        >
          {
            isFree
              ? 'You are available'
              : 'Busy time found'
          }
        </p>

        <p
          className={[
            'mt-1 text-sm',
            isFree
              ? 'text-emerald-700'
              : 'text-amber-700',
          ].join(' ')}
        >
          {
            isFree
              ? 'Google Calendar reports no busy periods in this window.'
              : `${busyCount} busy period${busyCount === 1 ? '' : 's'} overlap this window.`
          }
        </p>
      </div>
    </div>
  )
}


function createDefaultEventWindow() {
  const now =
    new Date()

  const end =
    new Date(
      now
    )

  end.setDate(
    end.getDate()
    + 7
  )

  return {
    timeMin:
      now.toISOString(),

    timeMax:
      end.toISOString(),
  }
}


function defaultDateTimeLocal(
  hoursFromNow: number,
): string {
  const date =
    new Date()

  date.setMinutes(
    0,
    0,
    0,
  )

  date.setHours(
    date.getHours()
    + hoursFromNow
  )

  return toDateTimeLocal(
    date
  )
}


function isoToDateTimeLocal(
  value: string,
): string {
  const date =
    new Date(
      value
    )

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return ''
  }

  return toDateTimeLocal(
    date
  )
}


function toDateTimeLocal(
  date: Date,
): string {
  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth()
      + 1
    ).padStart(
      2,
      '0',
    )

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0',
    )

  const hours =
    String(
      date.getHours()
    ).padStart(
      2,
      '0',
    )

  const minutes =
    String(
      date.getMinutes()
    ).padStart(
      2,
      '0',
    )

  return (
    `${year}-${month}-${day}`
    + `T${hours}:${minutes}`
  )
}


function formatEventTime(
  event: CalendarEvent,
  timezone: string,
): string {
  if (
    event.start.date
    && event.end.date
  ) {
    return (
      event.start.date
      === event.end.date
        ? event.start.date
        : `${event.start.date} – ${event.end.date}`
    )
  }

  if (!event.start.date_time) {
    return 'Time unavailable'
  }

  const start =
    new Date(
      event.start.date_time
    )

  if (
    Number.isNaN(
      start.getTime()
    )
  ) {
    return event.start.date_time
  }

  const formatter =
    new Intl.DateTimeFormat(
      undefined,
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timezone,
      },
    )

  const startText =
    formatter.format(
      start
    )

  if (!event.end.date_time) {
    return startText
  }

  const end =
    new Date(
      event.end.date_time
    )

  if (
    Number.isNaN(
      end.getTime()
    )
  ) {
    return startText
  }

  const endFormatter =
    new Intl.DateTimeFormat(
      undefined,
      {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timezone,
      },
    )

  return (
    `${startText} – `
    + endFormatter.format(
      end
    )
  )
}