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
  Mail,
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

import {
  Button,
} from '@/components/ui/Button'
import {
  ErrorState,
} from '@/components/ui/ErrorState'
import {
  LoadingScreen,
} from '@/components/ui/LoadingScreen'
import {
  useConnectGoogle,
  useDisconnectGoogle,
  useGoogleIntegration,
} from '@/hooks/useGoogleIntegration'

import type {
  GoogleCalendarAccessLevel,
  GoogleService,
} from '@/types/integration'


const easeOut = [
  0.22,
  1,
  0.36,
  1,
] as const


const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,

    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
}


const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },

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
    searchParams.get(
      'google',
    ) === 'connected'

  function clearCallbackMessage() {
    const next =
      new URLSearchParams(
        searchParams,
      )

    next.delete(
      'google',
    )

    setSearchParams(
      next,
      {
        replace: true,
      },
    )
  }

  function startConnection(
    services: GoogleService[],
    accessLevel: GoogleCalendarAccessLevel,
    forceConsent = false,
  ) {
    connectMutation.mutate({
      services,
      access_level:
        accessLevel,
      force_consent:
        forceConsent,
    })
  }

  function enableCalendarRead() {
    startConnection(
      [
        'calendar',
      ],
      'read',
    )
  }

  function enableCalendarWrite() {
    startConnection(
      [
        'calendar',
      ],
      'write',
    )
  }

  function enableGmail() {
    const accessLevel:
      GoogleCalendarAccessLevel =
      integration.data
        ?.can_write_calendar
        ? 'write'
        : 'read'

    startConnection(
      [
        'gmail',
      ],
      accessLevel,
    )
  }

  function connectCalendarAndGmail() {
    startConnection(
      [
        'calendar',
        'gmail',
      ],
      'read',
    )
  }

  function reconnectGoogle() {
    const google =
      integration.data

    const services:
      GoogleService[] = []

    if (
      google?.can_read_calendar ||
      google?.can_check_availability ||
      google?.can_write_calendar
    ) {
      services.push(
        'calendar',
      )
    }

    if (
      google?.can_read_gmail
    ) {
      services.push(
        'gmail',
      )
    }

    if (
      services.length === 0
    ) {
      services.push(
        'calendar',
        'gmail',
      )
    }

    startConnection(
      services,
      google?.can_write_calendar
        ? 'write'
        : 'read',
      true,
    )
  }

  function handleDisconnect() {
    const confirmed =
      window.confirm(
        [
          'Disconnect Google from LifeOps AI?',
          '',
          'This shared Google authorization may contain',
          'both Calendar and Gmail permissions.',
          '',
          'LifeOps will remove its stored Google OAuth',
          'credentials and both integrations will stop',
          'working until you reconnect.',
        ].join(' '),
      )

    if (!confirmed) {
      return
    }

    disconnectMutation.mutate()
  }

  if (
    integration.isLoading
  ) {
    return (
      <LoadingScreen
        label="Loading integrations…"
      />
    )
  }

  if (
    integration.isError
  ) {
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
    connectMutation.isPending ||
    disconnectMutation.isPending

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
    google.can_read_gmail,
  ].filter(
    Boolean,
  ).length

  const calendarEnabled = Boolean(
    google.can_read_calendar ||
    google.can_check_availability ||
    google.can_write_calendar,
  )

  const gmailEnabled =
    google.can_read_gmail

  return (
    <motion.div
      variants={
        containerVariants
      }
      initial={
        shouldReduceMotion
          ? false
          : 'hidden'
      }
      animate="visible"
      className={[
        'relative mx-auto',
        'w-full max-w-[1360px]',
        'overflow-hidden',
        'rounded-[30px]',
        'border border-white/[0.07]',
        'bg-[#05070b]',
        'px-4 py-5',
        'text-white',
        'shadow-[0_34px_120px_-48px_rgba(2,6,23,0.95)]',
        'sm:px-6 sm:py-7',
        'lg:px-8 lg:py-9',
      ].join(' ')}
    >
      <div
        aria-hidden="true"
        className={[
          'pointer-events-none',
          'absolute inset-0',
          'bg-[radial-gradient(circle_at_8%_0%,rgba(34,211,238,0.13),transparent_28%),radial-gradient(circle_at_92%_12%,rgba(139,92,246,0.16),transparent_28%),linear-gradient(to_bottom,#05070b_0%,#070a11_60%,#05070b_100%)]',
        ].join(' ')}
      />

      <div
        aria-hidden="true"
        className={[
          'pointer-events-none',
          'absolute inset-x-0 top-0',
          'h-[500px]',
          'opacity-25',
          '[background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]',
          '[background-size:56px_56px]',
          '[mask-image:linear-gradient(to_bottom,black,transparent)]',
        ].join(' ')}
      />

      <motion.section
        variants={
          itemVariants
        }
        className={[
          'relative overflow-hidden',
          'rounded-[26px]',
          'border border-white/[0.08]',
          'bg-white/[0.035]',
          'p-5',
          'backdrop-blur-xl',
          'sm:p-7',
        ].join(' ')}
      >
        <div
          aria-hidden="true"
          className={[
            'absolute',
            '-right-16 -top-20',
            'h-60 w-60',
            'rounded-full',
            'bg-violet-500/10',
            'blur-3xl',
          ].join(' ')}
        />

        <div
          className={[
            'relative flex',
            'flex-col',
            'justify-between',
            'gap-7',
            'lg:flex-row',
            'lg:items-end',
          ].join(' ')}
        >
          <div
            className="max-w-3xl"
          >
            <div
              className={[
                'inline-flex',
                'items-center gap-2',
                'rounded-full',
                'border',
                'border-cyan-300/15',
                'bg-cyan-300/[0.06]',
                'px-3 py-1.5',
                'text-xs font-semibold',
                'text-cyan-100',
              ].join(' ')}
            >
              <Sparkles
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />

              Phase 4 · Connected intelligence
            </div>

            <h1
              className={[
                'mt-5',
                'text-3xl',
                'font-semibold',
                'tracking-[-0.045em]',
                'text-white',
                'sm:text-4xl',
                'lg:text-[2.65rem]',
              ].join(' ')}
            >
              One Google connection,

              <span
                className={[
                  'block',
                  'bg-gradient-to-r',
                  'from-cyan-200',
                  'via-sky-300',
                  'to-violet-300',
                  'bg-clip-text',
                  'text-transparent',
                ].join(' ')}
              >
                permissions controlled by you.
              </span>
            </h1>

            <p
              className={[
                'mt-4 max-w-2xl',
                'text-sm leading-7',
                'text-slate-400',
                'sm:text-[15px]',
              ].join(' ')}
            >
              Calendar and Gmail share one secure
              Google OAuth connection. LifeOps requests
              only the capabilities you enable and keeps
              provider credentials server-side.
            </p>
          </div>

          <div
            className={[
              'flex flex-wrap',
              'items-center gap-3',
            ].join(' ')}
          >
            <div
              className={[
                'inline-flex',
                'items-center gap-2',
                'rounded-xl',
                'border border-white/[0.08]',
                'bg-black/20',
                'px-3.5 py-2.5',
                'text-xs',
                'text-slate-300',
              ].join(' ')}
            >
              <span
                className={[
                  'h-2 w-2',
                  'rounded-full',
                  google.connected
                    ? [
                      'bg-emerald-300',
                      'shadow-[0_0_14px_rgba(110,231,183,0.75)]',
                    ].join(' ')
                    : google
                      .reauthorization_required
                      ? 'bg-amber-300'
                      : 'bg-slate-500',
                ].join(' ')}
              />

              {statusLabel}
            </div>

            {calendarEnabled && (
              <ServiceLink
                to="/app/calendar"
                icon={
                  CalendarDays
                }
                label="Calendar"
              />
            )}

            {gmailEnabled && (
              <ServiceLink
                to="/app/email"
                icon={
                  Mail
                }
                label="Email"
              />
            )}
          </div>
        </div>
      </motion.section>

      <AnimatePresence
        initial={false}
      >
        {callbackConnected ? (
          <motion.div
            initial={
              shouldReduceMotion
                ? false
                : {
                  opacity: 0,
                  y: -8,
                  height: 0,
                }
            }
            animate={{
              opacity: 1,
              y: 0,
              height: 'auto',
            }}
            exit={
              shouldReduceMotion
                ? {
                  opacity: 0,
                }
                : {
                  opacity: 0,
                  y: -8,
                  height: 0,
                }
            }
            transition={{
              duration: 0.32,
              ease: easeOut,
            }}
            className={[
              'relative mt-5',
              'overflow-hidden',
              'rounded-2xl',
              'border',
              'border-emerald-300/15',
              'bg-emerald-300/[0.07]',
            ].join(' ')}
          >
            <div
              className={[
                'flex items-start',
                'justify-between',
                'gap-4',
                'p-4 sm:p-5',
              ].join(' ')}
            >
              <div
                className={[
                  'flex gap-3',
                ].join(' ')}
              >
                <div
                  className={[
                    'mt-0.5 flex',
                    'h-9 w-9',
                    'shrink-0',
                    'items-center justify-center',
                    'rounded-xl',
                    'border',
                    'border-emerald-300/15',
                    'bg-emerald-300/10',
                    'text-emerald-200',
                  ].join(' ')}
                >
                  <Check
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p
                    className={[
                      'text-sm font-semibold',
                      'text-emerald-100',
                    ].join(' ')}
                  >
                    Google authorization updated
                  </p>

                  <p
                    className={[
                      'mt-1',
                      'text-sm leading-6',
                      'text-emerald-100/60',
                    ].join(' ')}
                  >
                    Google returned successfully. Your
                    granted Calendar and Gmail
                    capabilities are shown below.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  clearCallbackMessage
                }
                className={[
                  'shrink-0',
                  'rounded-lg',
                  'px-2.5 py-1.5',
                  'text-xs font-semibold',
                  'text-emerald-100/70',
                  'transition',
                  'hover:bg-emerald-300/10',
                  'hover:text-emerald-100',
                ].join(' ')}
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {google.reauthorization_required && (
        <motion.div
          variants={
            itemVariants
          }
          className={[
            'relative mt-5',
            'flex gap-3',
            'rounded-2xl',
            'border',
            'border-amber-300/15',
            'bg-amber-300/[0.07]',
            'p-4',
          ].join(' ')}
        >
          <CircleAlert
            className={[
              'mt-0.5 h-5 w-5',
              'shrink-0',
              'text-amber-200',
            ].join(' ')}
            aria-hidden="true"
          />

          <div
            className="flex-1"
          >
            <p
              className={[
                'text-sm font-semibold',
                'text-amber-100',
              ].join(' ')}
            >
              Google authorization needs attention
            </p>

            <p
              className={[
                'mt-1',
                'text-sm leading-6',
                'text-amber-100/60',
              ].join(' ')}
            >
              The shared authorization may have expired,
              been revoked, or lost a required scope.
              Reconnect Google to restore authorized
              services.
            </p>

            {google.last_error_message && (
              <p
                className={[
                  'mt-2',
                  'rounded-lg',
                  'border',
                  'border-amber-300/10',
                  'bg-black/15',
                  'px-3 py-2',
                  'text-xs leading-5',
                  'text-amber-100/60',
                ].join(' ')}
              >
                {google.last_error_message}
              </p>
            )}

            <Button
              type="button"
              variant="secondary"
              disabled={
                isBusy
              }
              onClick={
                reconnectGoogle
              }
              className="mt-4"
            >
              <RefreshCw
                className={[
                  'mr-2 h-4 w-4',
                  connectMutation.isPending
                    ? 'animate-spin motion-reduce:animate-none'
                    : '',
                ].join(' ')}
                aria-hidden="true"
              />

              Reconnect Google
            </Button>
          </div>
        </motion.div>
      )}

      <motion.div
        variants={
          itemVariants
        }
        className={[
          'relative mt-6',
          'grid gap-5',
          'xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]',
        ].join(' ')}
      >
        <div
          className="space-y-5"
        >
          <IntegrationCard
            icon={
              CalendarDays
            }
            title="Google Calendar"
            description="Read upcoming events, inspect event details, check availability, and optionally create or update events."
            enabled={
              calendarEnabled
            }
            badge={
              calendarEnabled
                ? 'Authorized'
                : 'Not authorized'
            }
          >
            <div
              className={[
                'grid gap-3',
                'md:grid-cols-3',
              ].join(' ')}
            >
              <PermissionCard
                title="Read events"
                description="Upcoming events and event details."
                enabled={
                  google.can_read_calendar
                }
              />

              <PermissionCard
                title="Free / busy"
                description="Check availability with least-privilege access."
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

            <div
              className={[
                'mt-6 flex',
                'flex-wrap gap-3',
              ].join(' ')}
            >
              {!calendarEnabled ? (
                <Button
                  type="button"
                  disabled={
                    isBusy
                  }
                  onClick={
                    enableCalendarRead
                  }
                >
                  <Link2
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                  />

                  Enable Calendar
                </Button>
              ) : null}

              {calendarEnabled &&
                !google.can_write_calendar ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={
                    isBusy
                  }
                  onClick={
                    enableCalendarWrite
                  }
                >
                  <ShieldCheck
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                  />

                  Enable write access
                </Button>
              ) : null}

              {calendarEnabled && (
                <Link
                  to="/app/calendar"
                  className={[
                    'inline-flex min-h-10',
                    'items-center justify-center',
                    'gap-2 rounded-xl',
                    'border',
                    'border-white/[0.09]',
                    'bg-white/[0.04]',
                    'px-4 py-2.5',
                    'text-sm font-semibold',
                    'text-slate-300',
                    'transition',
                    'hover:bg-white/[0.07]',
                    'hover:text-white',
                  ].join(' ')}
                >
                  Open Calendar

                  <ArrowUpRight
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </Link>
              )}
            </div>
          </IntegrationCard>

          <IntegrationCard
            icon={
              Mail
            }
            title="Gmail Intelligence"
            description="Search authorized Gmail metadata, identify important messages, detect bills and renewals, and summarize selected emails."
            enabled={
              gmailEnabled
            }
            badge={
              gmailEnabled
                ? 'Read-only enabled'
                : 'Not authorized'
            }
          >
            <div
              className={[
                'grid gap-3',
                'sm:grid-cols-2',
              ].join(' ')}
            >
              <PermissionCard
                title="Read Gmail"
                description="Read-only access for authorized inbox search and selected-message analysis."
                enabled={
                  google.can_read_gmail
                }
              />

              <div
                className={[
                  'relative overflow-hidden',
                  'rounded-2xl',
                  'border',
                  'border-cyan-300/10',
                  'bg-cyan-300/[0.035]',
                  'p-4',
                ].join(' ')}
              >
                <ShieldCheck
                  className={[
                    'h-4 w-4',
                    'text-cyan-200',
                  ].join(' ')}
                  aria-hidden="true"
                />

                <p
                  className={[
                    'mt-3',
                    'text-sm font-semibold',
                    'text-slate-100',
                  ].join(' ')}
                >
                  Metadata-first
                </p>

                <p
                  className={[
                    'mt-2',
                    'text-xs leading-5',
                    'text-slate-500',
                  ].join(' ')}
                >
                  Search fetches message metadata first.
                  Full content is processed only when a
                  specific email is selected for deeper
                  intelligence.
                </p>
              </div>
            </div>

            <div
              className={[
                'mt-6 flex',
                'flex-wrap gap-3',
              ].join(' ')}
            >
              {!gmailEnabled ? (
                <Button
                  type="button"
                  disabled={
                    isBusy
                  }
                  onClick={
                    enableGmail
                  }
                >
                  <Mail
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                  />

                  Enable Gmail read access
                </Button>
              ) : (
                <Link
                  to="/app/email"
                  className={[
                    'inline-flex min-h-10',
                    'items-center justify-center',
                    'gap-2 rounded-xl',
                    'bg-white',
                    'px-4 py-2.5',
                    'text-sm font-semibold',
                    'text-slate-950',
                    'transition',
                    'hover:bg-cyan-50',
                  ].join(' ')}
                >
                  Open Email Intelligence

                  <ArrowUpRight
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </Link>
              )}
            </div>
          </IntegrationCard>

          {!calendarEnabled &&
            !gmailEnabled && (
              <section
                className={[
                  'rounded-[24px]',
                  'border',
                  'border-cyan-300/[0.10]',
                  'bg-cyan-300/[0.035]',
                  'p-5',
                ].join(' ')}
              >
                <div
                  className={[
                    'flex flex-col gap-4',
                    'sm:flex-row',
                    'sm:items-center',
                    'sm:justify-between',
                  ].join(' ')}
                >
                  <div>
                    <p
                      className={[
                        'text-sm font-semibold',
                        'text-white',
                      ].join(' ')}
                    >
                      Enable both Google services
                    </p>

                    <p
                      className={[
                        'mt-1',
                        'text-sm leading-6',
                        'text-slate-500',
                      ].join(' ')}
                    >
                      Authorize Calendar read access and
                      Gmail read-only access in one Google
                      consent flow.
                    </p>
                  </div>

                  <Button
                    type="button"
                    disabled={
                      isBusy
                    }
                    onClick={
                      connectCalendarAndGmail
                    }
                  >
                    <Link2
                      className="mr-2 h-4 w-4"
                      aria-hidden="true"
                    />

                    Connect both
                  </Button>
                </div>
              </section>
            )}

          {(google.connected ||
            google.reauthorization_required) && (
              <section
                className={[
                  'rounded-[24px]',
                  'border',
                  'border-white/[0.08]',
                  'bg-[#0a0d13]/88',
                  'p-5',
                  'backdrop-blur-xl',
                ].join(' ')}
              >
                <div
                  className={[
                    'flex flex-col gap-4',
                    'sm:flex-row',
                    'sm:items-center',
                    'sm:justify-between',
                  ].join(' ')}
                >
                  <div>
                    <h2
                      className={[
                        'text-sm font-semibold',
                        'text-white',
                      ].join(' ')}
                    >
                      Shared Google connection
                    </h2>

                    <p
                      className={[
                        'mt-1 max-w-xl',
                        'text-xs leading-5',
                        'text-slate-500',
                      ].join(' ')}
                    >
                      Calendar and Gmail use the same
                      encrypted Google OAuth connection.
                      Disconnecting Google disables both.
                    </p>
                  </div>

                  <div
                    className={[
                      'flex flex-wrap gap-2',
                    ].join(' ')}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={
                        isBusy
                      }
                      onClick={
                        reconnectGoogle
                      }
                    >
                      <RefreshCw
                        className={[
                          'mr-2 h-4 w-4',
                          connectMutation.isPending
                            ? 'animate-spin motion-reduce:animate-none'
                            : '',
                        ].join(' ')}
                        aria-hidden="true"
                      />

                      Reconnect
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      disabled={
                        isBusy
                      }
                      onClick={
                        handleDisconnect
                      }
                      className={[
                        'text-rose-200',
                        'hover:bg-rose-400/10',
                        'hover:text-rose-100',
                        'focus:ring-rose-300',
                      ].join(' ')}
                    >
                      <Unplug
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                      />

                      Disconnect
                    </Button>
                  </div>
                </div>

                {google.connected_at && (
                  <div
                    className={[
                      'mt-4 flex',
                      'items-center gap-2',
                      'border-t',
                      'border-white/[0.06]',
                      'pt-4',
                      'text-xs',
                      'text-slate-500',
                    ].join(' ')}
                  >
                    <CheckCircle2
                      className={[
                        'h-3.5 w-3.5',
                        'text-emerald-300',
                      ].join(' ')}
                      aria-hidden="true"
                    />

                    Connected{' '}
                    {formatDateTime(
                      google.connected_at,
                    )}
                  </div>
                )}
              </section>
            )}

          {connectMutation.isError && (
            <ErrorState
              message={
                connectMutation.error.message
              }
            />
          )}

          {disconnectMutation.isError && (
            <ErrorState
              message={
                disconnectMutation.error.message
              }
            />
          )}
        </div>

        <aside
          className="space-y-5"
        >

         
        </aside>
      </motion.div>
    </motion.div>
  )
}


function IntegrationCard({
  icon: Icon,
  title,
  description,
  enabled,
  badge,
  children,
}: {
  icon: typeof ShieldCheck
  title: string
  description: string
  enabled: boolean
  badge: string
  children: React.ReactNode
}) {
  return (
    <section
      className={[
        'overflow-hidden',
        'rounded-[26px]',
        'border',
        'border-white/[0.08]',
        'bg-[#0a0d13]/88',
        'shadow-[0_22px_70px_-46px_rgba(0,0,0,0.95)]',
        'backdrop-blur-xl',
      ].join(' ')}
    >
      <div
        className={[
          'relative',
          'border-b',
          'border-white/[0.07]',
          'p-5 sm:p-6',
        ].join(' ')}
      >
        <div
          className={[
            'relative flex',
            'flex-col',
            'justify-between',
            'gap-4',
            'sm:flex-row',
            'sm:items-start',
          ].join(' ')}
        >
          <div
            className={[
              'flex min-w-0',
              'gap-4',
            ].join(' ')}
          >
            <div
              className={[
                'flex h-12 w-12',
                'shrink-0',
                'items-center justify-center',
                'rounded-2xl',
                'border',
                enabled
                  ? 'border-cyan-300/15'
                  : 'border-white/[0.08]',
                enabled
                  ? 'bg-cyan-300/[0.07]'
                  : 'bg-white/[0.035]',
                enabled
                  ? 'text-cyan-200'
                  : 'text-slate-500',
              ].join(' ')}
            >
              <Icon
                className="h-6 w-6"
                aria-hidden="true"
              />
            </div>

            <div>
              <div
                className={[
                  'flex flex-wrap',
                  'items-center gap-2.5',
                ].join(' ')}
              >
                <h2
                  className={[
                    'text-lg font-semibold',
                    'tracking-[-0.02em]',
                    'text-white',
                  ].join(' ')}
                >
                  {title}
                </h2>

                <span
                  className={[
                    'rounded-full',
                    'border px-2.5 py-1',
                    'text-[11px]',
                    'font-semibold',
                    enabled
                      ? [
                        'border-emerald-300/15',
                        'bg-emerald-300/[0.08]',
                        'text-emerald-200',
                      ].join(' ')
                      : [
                        'border-white/[0.08]',
                        'bg-white/[0.04]',
                        'text-slate-400',
                      ].join(' '),
                  ].join(' ')}
                >
                  {badge}
                </span>
              </div>

              <p
                className={[
                  'mt-2 max-w-2xl',
                  'text-sm leading-6',
                  'text-slate-400',
                ].join(' ')}
              >
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="p-5 sm:p-6"
      >
        {children}
      </div>
    </section>
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
      className={[
        'group relative',
        'overflow-hidden',
        'rounded-2xl',
        'border p-4',
        'transition duration-300',
        enabled
          ? [
            'border-emerald-300/15',
            'bg-emerald-300/[0.055]',
            'hover:border-emerald-300/25',
          ].join(' ')
          : [
            'border-white/[0.07]',
            'bg-white/[0.025]',
            'hover:border-white/[0.12]',
          ].join(' '),
      ].join(' ')}
    >
      <div
        className={[
          'flex items-center',
          'justify-between',
          'gap-3',
        ].join(' ')}
      >
        <p
          className={[
            'text-sm font-semibold',
            'text-slate-100',
          ].join(' ')}
        >
          {title}
        </p>

        <span
          className={[
            'relative flex',
            'h-6 w-6',
            'items-center justify-center',
            'rounded-full',
            'border',
            enabled
              ? [
                'border-emerald-300/20',
                'bg-emerald-300/10',
                'text-emerald-200',
              ].join(' ')
              : [
                'border-white/[0.08]',
                'bg-white/[0.035]',
                'text-slate-600',
              ].join(' '),
          ].join(' ')}
          aria-label={
            enabled
              ? 'Enabled'
              : 'Not enabled'
          }
        >
          {enabled ? (
            <Check
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
          ) : (
            <span
              className={[
                'h-1.5 w-1.5',
                'rounded-full',
                'bg-slate-600',
              ].join(' ')}
            />
          )}
        </span>
      </div>

      <p
        className={[
          'mt-2',
          'text-xs leading-5',
          'text-slate-500',
        ].join(' ')}
      >
        {description}
      </p>
    </div>
  )
}


function ServiceLink({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: typeof ShieldCheck
  label: string
}) {
  return (
    <Link
      to={to}
      className={[
        'group inline-flex',
        'min-h-11',
        'items-center justify-center',
        'gap-2',
        'rounded-xl',
        'bg-white',
        'px-4 py-2.5',
        'text-sm font-semibold',
        'text-slate-950',
        'outline-none',
        'transition duration-300',
        'hover:-translate-y-0.5',
        'hover:bg-cyan-50',
        'focus-visible:ring-2',
        'focus-visible:ring-cyan-300',
      ].join(' ')}
    >
      <Icon
        className="h-4 w-4"
        aria-hidden="true"
      />

      {label}

      <ArrowUpRight
        className={[
          'h-4 w-4',
          'transition-transform',
          'group-hover:-translate-y-0.5',
          'group-hover:translate-x-0.5',
        ].join(' ')}
        aria-hidden="true"
      />
    </Link>
  )
}


type IconComponent =
  typeof ShieldCheck


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
    <div
      className={[
        'flex gap-3',
        'rounded-xl',
        'border',
        'border-white/[0.055]',
        'bg-black/10',
        'p-3',
      ].join(' ')}
    >
      <div
        className={[
          'mt-0.5 flex',
          'h-8 w-8',
          'shrink-0',
          'items-center justify-center',
          'rounded-lg',
          'bg-white/[0.04]',
          'text-slate-400',
        ].join(' ')}
      >
        <Icon
          className="h-4 w-4"
          aria-hidden="true"
        />
      </div>

      <div>
        <p
          className={[
            'text-xs font-semibold',
            'text-slate-300',
          ].join(' ')}
        >
          {title}
        </p>

        <p
          className={[
            'mt-1',
            'text-xs leading-5',
            'text-slate-500',
          ].join(' ')}
        >
          {description}
        </p>
      </div>
    </div>
  )
}


function formatDateTime(
  value: string,
): string {
  const date =
    new Date(
      value,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle:
        'medium',
      timeStyle:
        'short',
    },
  ).format(
    date,
  )
}