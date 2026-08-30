import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  KeyRound,
  Link2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Unplug,
} from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from 'motion/react'
import {
  Link,
  useSearchParams,
} from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import {
  useConnectGoogle,
  useDisconnectGoogle,
  useGoogleIntegration,
} from '@/hooks/useGoogleIntegration'

import type {
  GoogleCalendarAccessLevel,
} from '@/types/integration'

const easeOut = [0.22, 1, 0.36, 1] as const

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.52,
      ease: easeOut,
    },
  },
}

export function IntegrationsPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams()

  const integration =
    useGoogleIntegration()

  const connectMutation =
    useConnectGoogle()

  const disconnectMutation =
    useDisconnectGoogle()

  const shouldReduceMotion =
    useReducedMotion()

  const callbackConnected =
    searchParams.get('google')
    === 'connected'

  function clearCallbackMessage() {
    const next =
      new URLSearchParams(
        searchParams
      )

    next.delete(
      'google'
    )

    setSearchParams(
      next,
      {
        replace: true,
      },
    )
  }

  function startConnection(
    accessLevel: GoogleCalendarAccessLevel,
    forceConsent = false,
  ) {
    connectMutation.mutate({
      access_level: accessLevel,
      force_consent: forceConsent,
    })
  }

  function reconnectGoogle() {
    const accessLevel: GoogleCalendarAccessLevel =
      integration.data
        ?.can_write_calendar
        ? 'write'
        : 'read'

    startConnection(
      accessLevel,
      true,
    )
  }

  function handleDisconnect() {
    const confirmed =
      window.confirm(
        'Disconnect Google Calendar from LifeOps AI? '
        + 'LifeOps will remove its stored Google OAuth credentials.',
      )

    if (!confirmed) {
      return
    }

    disconnectMutation.mutate()
  }

  if (integration.isLoading) {
    return (
      <LoadingScreen
        label="Loading integrations…"
      />
    )
  }

  if (integration.isError) {
    return (
      <ErrorState
        message={
          integration.error.message
        }
        onRetry={() => {
          void integration.refetch()
        }}
      />
    )
  }

  const google =
    integration.data

  if (!google) {
    return null
  }

  const isBusy =
    connectMutation.isPending
    || disconnectMutation.isPending

  const statusLabel =
    google.reauthorization_required
      ? 'Reconnect required'
      : google.connected
        ? 'Connected'
        : 'Not connected'

  const enabledPermissionCount = [
    google.can_read_calendar,
    google.can_check_availability,
    google.can_write_calendar,
  ].filter(Boolean).length

  return (
    <motion.div
      variants={containerVariants}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
      className="relative mx-auto w-full max-w-[1360px] overflow-hidden rounded-[30px] border border-white/[0.07] bg-[#05070b] px-4 py-5 text-white shadow-[0_34px_120px_-48px_rgba(2,6,23,0.95)] sm:px-6 sm:py-7 lg:px-8 lg:py-9"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(34,211,238,0.13),transparent_28%),radial-gradient(circle_at_92%_12%,rgba(139,92,246,0.16),transparent_28%),linear-gradient(to_bottom,#05070b_0%,#070a11_60%,#05070b_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px] opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-7"
      >
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-violet-500/10 blur-3xl"
        />
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-xs font-semibold text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Phase 3 · Connected intelligence
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl lg:text-[2.65rem]">
              Connected services,
              <span className="block bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">
                controlled by you.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-[15px]">
              Connect external services to LifeOps while keeping your LifeOps login and provider authorization separate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3.5 py-2.5 text-xs text-slate-300">
              <span
                className={`h-2 w-2 rounded-full ${
                  google.connected
                    ? 'bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.75)]'
                    : google.reauthorization_required
                      ? 'bg-amber-300'
                      : 'bg-slate-500'
                }`}
              />
              {statusLabel}
            </div>

            {google.connected ? (
              <Link
                to="/app/calendar"
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_12px_34px_rgba(255,255,255,0.09)] outline-none transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Open Calendar
                <ArrowUpRight
                  className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ) : null}
          </div>
        </div>
      </motion.section>

      <AnimatePresence initial={false}>
        {callbackConnected ? (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.32, ease: easeOut }}
            className="relative mt-5 overflow-hidden rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.07]"
          >
            <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/10 text-emerald-200">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-emerald-100">
                    Google Calendar connected
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-100/60">
                    Google returned successfully to LifeOps AI.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={clearCallbackMessage}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-100/70 transition hover:bg-emerald-300/10 hover:text-emerald-100"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        variants={itemVariants}
        className="relative mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]"
      >
        <section className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#0a0d13]/88 shadow-[0_22px_70px_-46px_rgba(0,0,0,0.95)] backdrop-blur-xl">
          <div className="relative border-b border-white/[0.07] p-5 sm:p-6">
            <div
              aria-hidden="true"
              className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-500/[0.08] blur-3xl"
            />

            <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div className="flex min-w-0 gap-4">
                <motion.div
                  whileHover={shouldReduceMotion ? undefined : { rotate: 4, scale: 1.04 }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-300/15 bg-gradient-to-br from-blue-400/15 to-violet-400/10 text-blue-200 shadow-[0_0_40px_rgba(59,130,246,0.08)]"
                >
                  <CalendarDays className="h-6 w-6" aria-hidden="true" />
                </motion.div>

                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-lg font-semibold tracking-[-0.02em] text-white">
                      Google Calendar
                    </h2>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        google.connected
                          ? 'border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-200'
                          : google.reauthorization_required
                            ? 'border-amber-300/15 bg-amber-300/[0.08] text-amber-200'
                            : 'border-white/[0.08] bg-white/[0.04] text-slate-400'
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    Read upcoming events, inspect event details, check free/busy availability, and optionally grant write access to create and update events.
                  </p>
                </div>
              </div>

              <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                {enabledPermissionCount}/3 capabilities
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {google.reauthorization_required ? (
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.07] p-4"
              >
                <CircleAlert
                  className="mt-0.5 h-5 w-5 shrink-0 text-amber-200"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-amber-100">
                    Google authorization needs attention
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-100/60">
                    The existing Google authorization may have expired or been revoked. Reconnect to continue using Calendar.
                  </p>
                  {google.last_error_message ? (
                    <p className="mt-2 rounded-lg border border-amber-300/10 bg-black/15 px-3 py-2 text-xs leading-5 text-amber-100/60">
                      {google.last_error_message}
                    </p>
                  ) : null}
                </div>
              </motion.div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-3">
              <PermissionCard
                title="Read events"
                description="Upcoming events and event details."
                enabled={google.can_read_calendar}
              />
              <PermissionCard
                title="Free / busy"
                description="Check availability without reading event content."
                enabled={google.can_check_availability}
              />
              <PermissionCard
                title="Write events"
                description="Create and update Calendar events."
                enabled={google.can_write_calendar}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {!google.connected ? (
                <>
                  <Button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      startConnection('read')
                    }}
                    className="min-h-11 bg-white text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.08)] hover:bg-cyan-50 focus:ring-cyan-300"
                  >
                    <Link2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    Connect Google
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isBusy}
                    onClick={() => {
                      startConnection('write')
                    }}
                    className="min-h-11 border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.09] focus:ring-violet-300"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4 text-violet-200" aria-hidden="true" />
                    Connect with write access
                  </Button>
                </>
              ) : (
                <>
                  {!google.can_write_calendar ? (
                    <Button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        startConnection('write')
                      }}
                      className="min-h-11 bg-white text-slate-950 hover:bg-cyan-50 focus:ring-cyan-300"
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                      Enable write access
                    </Button>
                  ) : null}

                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isBusy}
                    onClick={reconnectGoogle}
                    className="min-h-11 border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.09] focus:ring-cyan-300"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${connectMutation.isPending ? 'animate-spin motion-reduce:animate-none' : ''}`}
                      aria-hidden="true"
                    />
                    Reconnect
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isBusy}
                    onClick={handleDisconnect}
                    className="min-h-11 text-rose-200 hover:bg-rose-400/10 hover:text-rose-100 focus:ring-rose-300"
                  >
                    <Unplug className="mr-2 h-4 w-4" aria-hidden="true" />
                    Disconnect
                  </Button>
                </>
              )}
            </div>

            {connectMutation.isError ? (
              <div className="mt-5">
                <ErrorState message={connectMutation.error.message} />
              </div>
            ) : null}

            {disconnectMutation.isError ? (
              <div className="mt-5">
                <ErrorState message={disconnectMutation.error.message} />
              </div>
            ) : null}

            {google.connected_at ? (
              <div className="mt-6 flex items-center gap-2 border-t border-white/[0.06] pt-4 text-xs text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                Connected {formatDateTime(google.connected_at)}
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl">
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/[0.08] blur-3xl"
            />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Security model</h2>
                <p className="mt-0.5 text-xs text-slate-500">Provider access stays server-side.</p>
              </div>
            </div>

            <div className="relative mt-5 space-y-3">
              <SecurityRow
                icon={KeyRound}
                title="LifeOps identity"
                description="Auth0 continues to authenticate your LifeOps account."
              />
              <SecurityRow
                icon={CalendarDays}
                title="Scoped Google OAuth"
                description="Google OAuth is used only for Calendar permissions."
              />
              <SecurityRow
                icon={ShieldCheck}
                title="Encrypted credentials"
                description="Google tokens stay encrypted in the backend and are never sent to the frontend."
              />
            </div>
          </section>

          <section className="rounded-[24px] border border-white/[0.08] bg-[#0a0d13]/88 p-5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Permission ledger
                </p>
                <h2 className="mt-1.5 font-semibold text-white">Granted scopes</h2>
              </div>
              <span className="rounded-lg border border-white/[0.07] bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-slate-400">
                {google.granted_scopes.length}
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Permissions currently recorded for this Google connection.
            </p>

            <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
              {google.granted_scopes.length > 0 ? (
                google.granted_scopes.map((scope) => (
                  <div
                    key={scope}
                    className="break-all rounded-xl border border-white/[0.06] bg-white/[0.035] px-3 py-2.5 font-mono text-[11px] leading-5 text-slate-400"
                  >
                    {scope}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-5 text-center text-sm text-slate-500">
                  No Google permissions have been granted yet.
                </div>
              )}
            </div>

            {google.connected ? (
              <Link
                to="/app/calendar"
                className="group mt-5 inline-flex items-center text-sm font-semibold text-cyan-200 outline-none transition hover:text-cyan-100 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Use Google Calendar
                <ExternalLink
                  className="ml-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ) : null}
          </section>
        </aside>
      </motion.div>
    </motion.div>
  )
}

interface PermissionCardProps {
  title: string
  description: string
  enabled: boolean
}

function PermissionCard({
  title,
  description,
  enabled,
}: PermissionCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-4 transition duration-300 ${
        enabled
          ? 'border-emerald-300/15 bg-emerald-300/[0.055] hover:border-emerald-300/25'
          : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        <span
          className={`relative flex h-6 w-6 items-center justify-center rounded-full border ${
            enabled
              ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200'
              : 'border-white/[0.08] bg-white/[0.035] text-slate-600'
          }`}
          aria-label={enabled ? 'Enabled' : 'Not enabled'}
        >
          {enabled ? (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
          )}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent transition-opacity ${
          enabled ? 'via-emerald-300/30 opacity-100' : 'via-white/10 opacity-0 group-hover:opacity-100'
        }`}
      />
    </div>
  )
}

type IconComponent = typeof ShieldCheck

function SecurityRow({
  icon: Icon,
  title,
  description,
}: {
  icon: IconComponent
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-white/[0.055] bg-black/10 p-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-slate-400">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-300">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  )
}

function formatDateTime(
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
    return value
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(
    date
  )
}
