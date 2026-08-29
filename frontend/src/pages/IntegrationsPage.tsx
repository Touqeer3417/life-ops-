import {
  CalendarDays,
  Check,
  CircleAlert,
  ExternalLink,
  Link2,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from 'lucide-react'
import {
  Link,
  useSearchParams,
} from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-sky-700">
            Phase 3 integrations
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Connected services
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Connect external services to
            LifeOps while keeping your
            LifeOps login and provider
            authorization separate.
          </p>
        </div>

        {google.connected ? (
          <Link
            to="/app/calendar"
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <CalendarDays
              className="mr-2 h-4 w-4"
              aria-hidden="true"
            />
            Open Calendar
          </Link>
        ) : null}
      </div>

      {callbackConnected ? (
        <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex gap-3">
            <div className="mt-0.5 rounded-full bg-emerald-100 p-1">
              <Check
                className="h-4 w-4 text-emerald-700"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Google Calendar connected
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                Google returned successfully
                to LifeOps AI.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              clearCallbackMessage
            }
            className="text-sm font-semibold text-emerald-800 hover:text-emerald-950"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                <CalendarDays
                  className="h-6 w-6 text-blue-600"
                  aria-hidden="true"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-950">
                    Google Calendar
                  </h2>

                  <span
                    className={[
                      'rounded-full px-2.5 py-1 text-xs font-semibold',
                      google.connected
                        ? 'bg-emerald-50 text-emerald-700'
                        : google.reauthorization_required
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600',
                    ].join(' ')}
                  >
                    {statusLabel}
                  </span>
                </div>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Read upcoming events,
                  inspect event details,
                  check free/busy
                  availability, and optionally
                  grant write access to create
                  and update events.
                </p>
              </div>
            </div>
          </div>

          {google.reauthorization_required ? (
            <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <CircleAlert
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Google authorization needs
                  attention
                </p>

                <p className="mt-1 text-sm text-amber-700">
                  The existing Google
                  authorization may have
                  expired or been revoked.
                  Reconnect to continue using
                  Calendar.
                </p>

                {google.last_error_message ? (
                  <p className="mt-2 text-xs text-amber-700">
                    {
                      google.last_error_message
                    }
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <PermissionCard
              title="Read events"
              description="Upcoming events and event details."
              enabled={
                google.can_read_calendar
              }
            />

            <PermissionCard
              title="Free / busy"
              description="Check availability without reading event content."
              enabled={
                google.can_check_availability
              }
            />

            <PermissionCard
              title="Write events"
              description="Create and update Calendar events."
              enabled={
                google.can_write_calendar
              }
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {!google.connected ? (
              <>
                <Button
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    startConnection(
                      'read'
                    )
                  }}
                >
                  <Link2
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                  />
                  Connect Google
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  disabled={isBusy}
                  onClick={() => {
                    startConnection(
                      'write'
                    )
                  }}
                >
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
                      startConnection(
                        'write'
                      )
                    }}
                  >
                    <ShieldCheck
                      className="mr-2 h-4 w-4"
                      aria-hidden="true"
                    />
                    Enable write access
                  </Button>
                ) : null}

                <Button
                  type="button"
                  variant="secondary"
                  disabled={isBusy}
                  onClick={
                    reconnectGoogle
                  }
                >
                  <RefreshCw
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                  />
                  Reconnect
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  disabled={isBusy}
                  onClick={
                    handleDisconnect
                  }
                >
                  <Unplug
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                  />
                  Disconnect
                </Button>
              </>
            )}
          </div>

          {connectMutation.isError ? (
            <div className="mt-5">
              <ErrorState
                message={
                  connectMutation.error
                    .message
                }
              />
            </div>
          ) : null}

          {disconnectMutation.isError ? (
            <div className="mt-5">
              <ErrorState
                message={
                  disconnectMutation.error
                    .message
                }
              />
            </div>
          ) : null}

          {google.connected_at ? (
            <p className="mt-6 text-xs text-slate-500">
              Connected{' '}
              {formatDateTime(
                google.connected_at
              )}
            </p>
          ) : null}
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2.5">
                <ShieldCheck
                  className="h-5 w-5 text-slate-700"
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2 className="font-bold text-slate-950">
                  Security model
                </h2>

                <p className="text-sm text-slate-500">
                  Provider access stays
                  server-side.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
              <p>
                Auth0 continues to authenticate
                your LifeOps account.
              </p>

              <p>
                Google OAuth is used only for
                Calendar permissions.
              </p>

              <p>
                Google access and refresh
                tokens are encrypted before
                database storage and are never
                sent to the frontend.
              </p>
            </div>
          </Card>

          <Card>
            <h2 className="font-bold text-slate-950">
              Granted scopes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Permissions currently recorded
              for this Google connection.
            </p>

            <div className="mt-4 space-y-2">
              {google.granted_scopes.length
                > 0 ? (
                  google.granted_scopes.map(
                    (scope) => (
                      <div
                        key={scope}
                        className="break-all rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600"
                      >
                        {scope}
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-sm text-slate-500">
                    No Google permissions have
                    been granted yet.
                  </p>
                )}
            </div>

            {google.connected ? (
              <Link
                to="/app/calendar"
                className="mt-5 inline-flex items-center text-sm font-semibold text-sky-700 hover:text-sky-900"
              >
                Use Google Calendar
                <ExternalLink
                  className="ml-2 h-4 w-4"
                  aria-hidden="true"
                />
              </Link>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
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
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>

        <span
          className={[
            'h-2.5 w-2.5 rounded-full',
            enabled
              ? 'bg-emerald-500'
              : 'bg-slate-300',
          ].join(' ')}
          aria-label={
            enabled
              ? 'Enabled'
              : 'Not enabled'
          }
        />
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
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