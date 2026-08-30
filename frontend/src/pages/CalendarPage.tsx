import { useMemo, useState, type FormEvent } from 'react'
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
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { Link } from 'react-router-dom'

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

import type { CalendarEvent, CalendarEventCreateInput } from '@/types/calendar'

const easeOut = [0.22, 1, 0.36, 1] as const

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
}

const inputClassName =
  'mt-2 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/15 focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/[0.07] [color-scheme:dark]'

const darkCardClass =
  '!rounded-[24px] !border-white/[0.08] !bg-white/[0.035] !text-white !shadow-[0_24px_80px_-45px_rgba(0,0,0,0.95)] backdrop-blur-xl'

export function CalendarPage() {
  const currentUser = useCurrentUser()
  const google = useGoogleIntegration()
  const shouldReduceMotion = useReducedMotion()

  const timezone = currentUser.data?.preferences.timezone ?? 'UTC'
  const defaultWindow = useMemo(() => createDefaultEventWindow(), [])

  const events = useCalendarEvents(
    {
      time_min: defaultWindow.timeMin,
      time_max: defaultWindow.timeMax,
      timezone,
      max_results: 100,
    },
    Boolean(
      google.data?.connected &&
        google.data.can_read_calendar &&
        currentUser.data,
    ),
  )

  const createMutation = useCreateCalendarEvent()
  const updateMutation = useUpdateCalendarEvent()
  const availabilityMutation = useCalendarAvailability()

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [start, setStart] = useState(defaultDateTimeLocal(1))
  const [end, setEnd] = useState(defaultDateTimeLocal(2))
  const [availabilityStart, setAvailabilityStart] = useState(defaultDateTimeLocal(1))
  const [availabilityEnd, setAvailabilityEnd] = useState(defaultDateTimeLocal(2))

  if (currentUser.isLoading || google.isLoading) {
    return <LoadingScreen label="Loading Calendar…" />
  }

  if (currentUser.isError) {
    return (
      <ErrorState
        message={currentUser.error.message}
        onRetry={() => void currentUser.refetch()}
      />
    )
  }

  if (google.isError) {
    return (
      <ErrorState
        message={google.error.message}
        onRetry={() => void google.refetch()}
      />
    )
  }

  if (!currentUser.data || !google.data) {
    return null
  }

  if (!google.data.connected || google.data.reauthorization_required) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: easeOut }}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#05070b] p-4 text-white shadow-[0_35px_120px_-45px_rgba(0,0,0,0.95)] sm:p-6"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.13),transparent_34%),radial-gradient(circle_at_92%_18%,rgba(139,92,246,0.12),transparent_30%)]" />
        <Card className={`${darkCardClass} relative overflow-hidden !p-7 text-center sm:!p-10`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] shadow-[0_0_45px_rgba(34,211,238,0.08)]">
            <CalendarClock className="h-7 w-7 text-cyan-200" aria-hidden="true" />
          </div>
          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-3 py-1.5 text-xs font-semibold text-amber-100">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Calendar permission required
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
            Connect Google Calendar
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400 sm:text-[15px]">
            Calendar access is not currently available for this account. Connect or reconnect Google before reading and managing events.
          </p>
          <Link
            to="/app/integrations"
            className="group mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_12px_38px_rgba(255,255,255,0.1)] transition hover:-translate-y-0.5 hover:bg-cyan-50"
          >
            Open integrations
            <ExternalLink className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </Card>
      </motion.div>
    )
  }

  function resetEventForm() {
    setSelectedEvent(null)
    setSummary('')
    setDescription('')
    setLocation('')
    setStart(defaultDateTimeLocal(1))
    setEnd(defaultDateTimeLocal(2))
    createMutation.reset()
    updateMutation.reset()
  }

  function selectEventForEditing(event: CalendarEvent) {
    setSelectedEvent(event)
    setSummary(event.summary)
    setDescription(event.description ?? '')
    setLocation(event.location ?? '')
    setStart(event.start.date_time ? isoToDateTimeLocal(event.start.date_time) : '')
    setEnd(event.end.date_time ? isoToDateTimeLocal(event.end.date_time) : '')
    createMutation.reset()
    updateMutation.reset()
  }

  function handleEventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedSummary = summary.trim()

    if (!normalizedSummary || !start || !end) {
      return
    }

    if (new Date(end).getTime() <= new Date(start).getTime()) {
      return
    }

    if (selectedEvent) {
      updateMutation.mutate(
        {
          eventId: selectedEvent.id,
          input: {
            summary: normalizedSummary,
            description: description.trim() || null,
            location: location.trim() || null,
            start,
            end,
            timezone,
            send_updates: 'none',
          },
        },
        {
          onSuccess: (updatedEvent) => {
            selectEventForEditing(updatedEvent)
            void events.refetch()
          },
        },
      )
      return
    }

    const input: CalendarEventCreateInput = {
      summary: normalizedSummary,
      description: description.trim() || null,
      location: location.trim() || null,
      start,
      end,
      timezone,
      attendees: [],
      send_updates: 'none',
    }

    createMutation.mutate(input, {
      onSuccess: () => {
        resetEventForm()
        void events.refetch()
      },
    })
  }

  function handleAvailabilityCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!availabilityStart || !availabilityEnd) {
      return
    }

    availabilityMutation.mutate({
      time_min: availabilityStart,
      time_max: availabilityEnd,
      timezone,
      calendar_ids: ['primary'],
    })
  }

  const canWrite = google.data.can_write_calendar
  const mutationError = createMutation.error ?? updateMutation.error

  return (
    <motion.div
      variants={containerVariants}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
      className="relative mx-auto w-full max-w-[1360px] overflow-hidden rounded-[32px] border border-white/[0.07] bg-[#05070b] p-4 text-white shadow-[0_35px_120px_-50px_rgba(0,0,0,0.95)] sm:p-6 lg:p-7"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(139,92,246,0.11),transparent_28%),linear-gradient(to_bottom,#05070b,#070a11_55%,#05070b)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-7"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-400/[0.07] blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-xs font-semibold text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Phase 3 · Google Calendar
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl lg:text-[2.65rem]">
              Calendar workspace
              <span className="mt-1 block bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">
                time, context, and control in one view.
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-[15px]">
              Read upcoming events, check availability, and manage Google Calendar events without leaving your LifeOps workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3.5 text-xs font-semibold text-slate-300">
              <Clock3 className="h-3.5 w-3.5 text-cyan-200" aria-hidden="true" />
              {timezone}
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={events.isFetching}
              onClick={() => void events.refetch()}
              className="!border-white/10 !bg-white/[0.05] !text-slate-200 hover:!bg-white/[0.09] focus:!ring-cyan-300/30 focus:!ring-offset-[#05070b]"
            >
              <RefreshCw
                className={['mr-2 h-4 w-4', events.isFetching ? 'animate-spin' : ''].join(' ')}
                aria-hidden="true"
              />
              Refresh
            </Button>
          </div>
        </div>
      </motion.section>

      {!canWrite ? (
        <motion.div
          variants={itemVariants}
          className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.055] p-4 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-100">Calendar is currently read-only</p>
              <p className="mt-1 text-sm leading-6 text-amber-100/60">
                Enable Calendar write access before creating or updating events.
              </p>
            </div>
          </div>
          <Link to="/app/integrations" className="shrink-0 text-sm font-semibold text-amber-100 transition hover:text-white">
            Manage permissions
          </Link>
        </motion.div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          <motion.div variants={itemVariants}>
            <Card className={`${darkCardClass} !p-5 sm:!p-6`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Schedule</p>
                  <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-white">Upcoming events</h2>
                  <p className="mt-1 text-sm text-slate-500">Next seven days from your primary Google Calendar.</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.055] text-cyan-200">
                  <CalendarClock className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>

              {events.isLoading ? (
                <div className="mt-6 space-y-3" aria-label="Loading events" aria-busy="true">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 motion-reduce:animate-none">
                      <div className="h-4 w-44 rounded bg-white/[0.08]" />
                      <div className="mt-3 h-3 w-64 max-w-full rounded bg-white/[0.05]" />
                    </div>
                  ))}
                </div>
              ) : null}

              {events.isError ? (
                <div className="mt-5 overflow-hidden rounded-2xl border border-rose-300/10 bg-rose-300/[0.04] p-1">
                  <ErrorState message={events.error.message} onRetry={() => void events.refetch()} />
                </div>
              ) : null}

              {events.data && events.data.events.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
                  <CalendarClock className="mx-auto h-8 w-8 text-slate-600" aria-hidden="true" />
                  <p className="mt-3 font-semibold text-slate-200">No upcoming events</p>
                  <p className="mt-1 text-sm text-slate-500">Your primary calendar has no events in this seven-day window.</p>
                </div>
              ) : null}

              {events.data?.events.length ? (
                <div className="mt-6 space-y-3">
                  {events.data.events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : index * 0.035 }}
                    >
                      <EventRow
                        event={event}
                        timezone={timezone}
                        canWrite={canWrite}
                        onEdit={() => selectEventForEditing(event)}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : null}
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className={`${darkCardClass} !p-5 sm:!p-6`}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/10 bg-violet-300/[0.055] text-violet-200">
                  <Search className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">FreeBusy</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-white">Check availability</h2>
                  <p className="mt-1 text-sm text-slate-500">Query Google FreeBusy for your primary calendar.</p>
                </div>
              </div>

              <form className="mt-6" onSubmit={handleAvailabilityCheck}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-300">
                    Start
                    <input
                      type="datetime-local"
                      required
                      value={availabilityStart}
                      onChange={(event) => setAvailabilityStart(event.target.value)}
                      className={inputClassName}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-300">
                    End
                    <input
                      type="datetime-local"
                      required
                      value={availabilityEnd}
                      onChange={(event) => setAvailabilityEnd(event.target.value)}
                      className={inputClassName}
                    />
                  </label>
                </div>

                <div className="mt-4">
                  <Button
                    type="submit"
                    disabled={availabilityMutation.isPending}
                    className="!bg-white !text-slate-950 hover:!bg-cyan-50 focus:!ring-cyan-300 focus:!ring-offset-[#05070b]"
                  >
                    <Clock3 className="mr-2 h-4 w-4" aria-hidden="true" />
                    {availabilityMutation.isPending ? 'Checking…' : 'Check availability'}
                  </Button>
                </div>
              </form>

              {availabilityMutation.isError ? (
                <div className="mt-5">
                  <ErrorState message={availabilityMutation.error.message} />
                </div>
              ) : null}

              {availabilityMutation.data ? (
                <AvailabilityResult
                  isFree={availabilityMutation.data.is_free}
                  busyCount={availabilityMutation.data.calendars.reduce(
                    (total, calendar) => total + calendar.busy.length,
                    0,
                  )}
                />
              ) : null}
            </Card>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="h-fit xl:sticky xl:top-5">
          <Card className={`${darkCardClass} !p-5 sm:!p-6`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  {selectedEvent ? 'Edit mode' : 'New event'}
                </p>
                <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-white">
                  {selectedEvent ? 'Update event' : 'Create event'}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {selectedEvent ? 'Edit the selected Google Calendar event.' : 'Add a new event to your primary calendar.'}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/10 bg-violet-300/[0.055] text-violet-200">
                {selectedEvent ? <Pencil className="h-5 w-5" aria-hidden="true" /> : <CalendarPlus className="h-5 w-5" aria-hidden="true" />}
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleEventSubmit}>
              <label className="block text-sm font-medium text-slate-300">
                Title
                <input value={summary} onChange={(event) => setSummary(event.target.value)} required maxLength={1024} placeholder="Project meeting" className={inputClassName} />
              </label>

              <label className="block text-sm font-medium text-slate-300">
                Description
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={16384} placeholder="Optional notes" className={inputClassName} />
              </label>

              <label className="block text-sm font-medium text-slate-300">
                Location
                <input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={1024} placeholder="Online or physical location" className={inputClassName} />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <label className="block text-sm font-medium text-slate-300">
                  Start
                  <input type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} required className={inputClassName} />
                </label>
                <label className="block text-sm font-medium text-slate-300">
                  End
                  <input type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} required className={inputClassName} />
                </label>
              </div>

              <p className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-xs leading-5 text-slate-500">
                Times are interpreted using your saved timezone:{' '}
                <span className="font-semibold text-slate-300">{timezone}</span>
              </p>

              {mutationError ? <ErrorState message={mutationError.message} /> : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={!canWrite || createMutation.isPending || updateMutation.isPending}
                  className="!bg-white !text-slate-950 hover:!bg-cyan-50 focus:!ring-cyan-300 focus:!ring-offset-[#05070b]"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving…'
                    : selectedEvent
                      ? 'Update event'
                      : 'Create event'}
                </Button>

                {selectedEvent ? (
                  <Button type="button" variant="secondary" onClick={resetEventForm} className="!border-white/10 !bg-white/[0.05] !text-slate-200 hover:!bg-white/[0.09]">
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

interface EventRowProps {
  event: CalendarEvent
  timezone: string
  canWrite: boolean
  onEdit: () => void
}

function EventRow({ event, timezone, canWrite, onEdit }: EventRowProps) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition-colors hover:border-cyan-300/15 hover:bg-white/[0.045]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="font-semibold tracking-[-0.01em] text-slate-100">{event.summary}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center">
              <Clock3 className="mr-1.5 h-4 w-4 text-cyan-300/70" aria-hidden="true" />
              {formatEventTime(event, timezone)}
            </span>
            {event.location ? (
              <span className="inline-flex items-center">
                <MapPin className="mr-1.5 h-4 w-4 text-violet-300/70" aria-hidden="true" />
                {event.location}
              </span>
            ) : null}
          </div>
          {event.description ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{event.description}</p> : null}
        </div>

        <div className="flex shrink-0 gap-2">
          {event.html_link ? (
            <a href={event.html_link} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Google
            </a>
          ) : null}

          {canWrite && event.start.date_time && event.end.date_time ? (
            <button type="button" onClick={onEdit} className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-violet-300/20 hover:bg-violet-300/[0.07] hover:text-violet-100">
              <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}

interface AvailabilityResultProps {
  isFree: boolean
  busyCount: number
}

function AvailabilityResult({ isFree, busyCount }: AvailabilityResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={[
        'mt-5 flex gap-3 rounded-2xl border p-4',
        isFree ? 'border-emerald-300/15 bg-emerald-300/[0.055]' : 'border-amber-300/15 bg-amber-300/[0.055]',
      ].join(' ')}
    >
      <CheckCircle2 className={['mt-0.5 h-5 w-5 shrink-0', isFree ? 'text-emerald-300' : 'text-amber-300'].join(' ')} aria-hidden="true" />
      <div>
        <p className={['text-sm font-semibold', isFree ? 'text-emerald-100' : 'text-amber-100'].join(' ')}>{isFree ? 'You are available' : 'Busy time found'}</p>
        <p className={['mt-1 text-sm leading-6', isFree ? 'text-emerald-100/60' : 'text-amber-100/60'].join(' ')}>
          {isFree ? 'Google Calendar reports no busy periods in this window.' : `${busyCount} busy period${busyCount === 1 ? '' : 's'} overlap this window.`}
        </p>
      </div>
    </motion.div>
  )
}

function createDefaultEventWindow() {
  const now = new Date()
  const end = new Date(now)
  end.setDate(end.getDate() + 7)
  return { timeMin: now.toISOString(), timeMax: end.toISOString() }
}

function defaultDateTimeLocal(hoursFromNow: number): string {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + hoursFromNow)
  return toDateTimeLocal(date)
}

function isoToDateTimeLocal(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return toDateTimeLocal(date)
}

function toDateTimeLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function formatEventTime(event: CalendarEvent, timezone: string): string {
  if (event.start.date && event.end.date) {
    return event.start.date === event.end.date ? event.start.date : `${event.start.date} – ${event.end.date}`
  }

  if (!event.start.date_time) return 'Time unavailable'

  const start = new Date(event.start.date_time)
  if (Number.isNaN(start.getTime())) return event.start.date_time

  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  })

  const startText = formatter.format(start)
  if (!event.end.date_time) return startText

  const end = new Date(event.end.date_time)
  if (Number.isNaN(end.getTime())) return startText

  const endFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  })

  return `${startText} – ${endFormatter.format(end)}`
}
