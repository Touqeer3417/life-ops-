import {
  useMemo,
  useState,
} from 'react'
import type {
  FormEvent,
  ReactNode,
} from 'react'

import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  GraduationCap,
  Inbox,
  Mail,
  RefreshCw,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import {
  motion,
} from 'framer-motion'
import {
  Link,
} from 'react-router-dom'

import {
  useEmailSearch,
  useEmailSummary,
  useImportantEmails,
  useRefreshEmailIntelligence,
} from '@/hooks/useEmail'
import {
  useGoogleIntegration,
} from '@/hooks/useGoogleIntegration'

import type {
  EmailCategory,
  EmailMetadata,
  EmailSearchResponse,
} from '@/types/email'


const CATEGORY_OPTIONS: Array<{
  value: EmailCategory | ''
  label: string
}> = [
  {
    value: '',
    label: 'All categories',
  },
  {
    value: 'important',
    label: 'Important',
  },
  {
    value: 'bill',
    label: 'Bills',
  },
  {
    value: 'subscription',
    label: 'Subscriptions',
  },
  {
    value: 'deadline',
    label: 'Deadlines',
  },
  {
    value: 'booking',
    label: 'Bookings',
  },
  {
    value: 'university',
    label: 'University',
  },
  {
    value: 'receipt',
    label: 'Receipts',
  },
  {
    value: 'other',
    label: 'Other',
  },
]


function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}


function formatDate(
  value: string | null,
): string {
  if (!value) {
    return 'Date unavailable'
  }

  const date = new Date(value)

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
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date)
}


function formatMoney(
  amount:
    | string
    | number
    | null,
  currency: string | null,
): string | null {
  if (
    amount === null ||
    amount === undefined
  ) {
    return null
  }

  const numericAmount =
    typeof amount === 'number'
      ? amount
      : Number(amount)

  if (
    Number.isNaN(
      numericAmount,
    )
  ) {
    return (
      `${currency ?? ''} ${amount}`
    ).trim()
  }

  if (!currency) {
    return String(
      numericAmount,
    )
  }

  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: 'currency',
        currency,
      },
    ).format(
      numericAmount,
    )
  } catch {
    return (
      `${currency} ${numericAmount}`
    )
  }
}


function categoryLabel(
  category: EmailCategory,
): string {
  const found =
    CATEGORY_OPTIONS.find(
      item =>
        item.value === category,
    )

  return (
    found?.label ??
    category
  )
}


function categoryClasses(
  category: EmailCategory,
): string {
  switch (category) {
    case 'important':
      return (
        'border-rose-200 ' +
        'bg-rose-50 ' +
        'text-rose-700'
      )

    case 'bill':
      return (
        'border-amber-200 ' +
        'bg-amber-50 ' +
        'text-amber-700'
      )

    case 'subscription':
      return (
        'border-violet-200 ' +
        'bg-violet-50 ' +
        'text-violet-700'
      )

    case 'deadline':
      return (
        'border-orange-200 ' +
        'bg-orange-50 ' +
        'text-orange-700'
      )

    case 'booking':
      return (
        'border-sky-200 ' +
        'bg-sky-50 ' +
        'text-sky-700'
      )

    case 'university':
      return (
        'border-indigo-200 ' +
        'bg-indigo-50 ' +
        'text-indigo-700'
      )

    case 'receipt':
      return (
        'border-emerald-200 ' +
        'bg-emerald-50 ' +
        'text-emerald-700'
      )

    default:
      return (
        'border-slate-200 ' +
        'bg-slate-50 ' +
        'text-slate-600'
      )
  }
}


function categoryIcon(
  category: EmailCategory,
): ReactNode {
  const iconClassName =
    'h-4 w-4'

  switch (category) {
    case 'bill':
      return (
        <CreditCard
          className={
            iconClassName
          }
        />
      )

    case 'subscription':
      return (
        <RefreshCw
          className={
            iconClassName
          }
        />
      )

    case 'deadline':
      return (
        <CalendarClock
          className={
            iconClassName
          }
        />
      )

    case 'booking':
      return (
        <CalendarClock
          className={
            iconClassName
          }
        />
      )

    case 'university':
      return (
        <GraduationCap
          className={
            iconClassName
          }
        />
      )

    case 'receipt':
      return (
        <Receipt
          className={
            iconClassName
          }
        />
      )

    case 'important':
      return (
        <AlertTriangle
          className={
            iconClassName
          }
        />
      )

    default:
      return (
        <Mail
          className={
            iconClassName
          }
        />
      )
  }
}


function EmailRow({
  email,
  selected,
  analyzing,
  onAnalyze,
}: {
  email: EmailMetadata
  selected: boolean
  analyzing: boolean
  onAnalyze: (
    email: EmailMetadata,
  ) => void
}) {
  const importance =
    Math.round(
      email.importance_score *
      100,
    )

  return (
    <motion.button
      type="button"
      whileHover={{
        y: -2,
      }}
      whileTap={{
        scale: 0.995,
      }}
      onClick={() =>
        onAnalyze(email)
      }
      className={[
        'group w-full rounded-2xl',
        'border p-4 text-left',
        'transition-all duration-200',
        selected
          ? (
            'border-slate-900 ' +
            'bg-slate-950 ' +
            'text-white ' +
            'shadow-xl ' +
            'shadow-slate-900/10'
          )
          : (
            'border-slate-200/80 ' +
            'bg-white ' +
            'hover:border-slate-300 ' +
            'hover:shadow-lg ' +
            'hover:shadow-slate-200/40'
          ),
      ].join(' ')}
    >
      <div
        className={
          'flex items-start ' +
          'justify-between gap-4'
        }
      >
        <div
          className={
            'min-w-0 flex-1'
          }
        >
          <div
            className={
              'flex flex-wrap ' +
              'items-center gap-2'
            }
          >
            <span
              className={[
                'inline-flex items-center',
                'gap-1.5 rounded-full',
                'border px-2.5 py-1',
                'text-[11px]',
                'font-semibold',
                selected
                  ? (
                    'border-white/15 ' +
                    'bg-white/10 ' +
                    'text-white'
                  )
                  : categoryClasses(
                      email.category,
                    ),
              ].join(' ')}
            >
              {
                categoryIcon(
                  email.category,
                )
              }

              {
                categoryLabel(
                  email.category,
                )
              }
            </span>

            {
              email.is_important && (
                <span
                  className={[
                    'inline-flex',
                    'items-center gap-1',
                    'rounded-full px-2',
                    'py-1 text-[11px]',
                    'font-semibold',
                    selected
                      ? (
                        'bg-rose-400/15 ' +
                        'text-rose-200'
                      )
                      : (
                        'bg-rose-50 ' +
                        'text-rose-600'
                      ),
                  ].join(' ')}
                >
                  <Sparkles
                    className={
                      'h-3 w-3'
                    }
                  />
                  Important
                </span>
              )
            }
          </div>

          <h3
            className={[
              'mt-3 truncate',
              'text-sm font-semibold',
              selected
                ? 'text-white'
                : 'text-slate-900',
            ].join(' ')}
          >
            {
              email.subject ||
              '(No subject)'
            }
          </h3>

          <p
            className={[
              'mt-1 truncate',
              'text-xs',
              selected
                ? 'text-slate-300'
                : 'text-slate-500',
            ].join(' ')}
          >
            {
              email.sender ||
              'Unknown sender'
            }
          </p>

          {
            email.snippet && (
              <p
                className={[
                  'mt-3 line-clamp-2',
                  'text-sm leading-6',
                  selected
                    ? 'text-slate-300'
                    : 'text-slate-600',
                ].join(' ')}
              >
                {email.snippet}
              </p>
            )
          }

          <div
            className={[
              'mt-4 flex',
              'flex-wrap items-center',
              'gap-x-4 gap-y-2',
              'text-xs',
              selected
                ? 'text-slate-400'
                : 'text-slate-500',
            ].join(' ')}
          >
            <span>
              {
                formatDate(
                  email.received_at,
                )
              }
            </span>

            <span>
              Importance {importance}%
            </span>
          </div>
        </div>

        <div
          className={[
            'flex h-9 w-9',
            'shrink-0 items-center',
            'justify-center',
            'rounded-xl',
            selected
              ? 'bg-white/10'
              : 'bg-slate-50',
          ].join(' ')}
        >
          {
            analyzing ? (
              <RefreshCw
                className={[
                  'h-4 w-4',
                  'animate-spin',
                  selected
                    ? 'text-white'
                    : 'text-slate-500',
                ].join(' ')}
              />
            ) : (
              <ArrowRight
                className={[
                  'h-4 w-4',
                  'transition-transform',
                  'group-hover:translate-x-0.5',
                  selected
                    ? 'text-white'
                    : 'text-slate-500',
                ].join(' ')}
              />
            )
          }
        </div>
      </div>
    </motion.button>
  )
}


export function EmailIntelligencePage() {
  const integrationQuery =
    useGoogleIntegration()

  const gmailConnected =
    integrationQuery.data
      ?.can_read_gmail === true

  const importantQuery =
    useImportantEmails(
      {
        max_results: 20,
        include_spam_trash:
          false,
      },
      gmailConnected,
    )

  const searchMutation =
    useEmailSearch()

  const summaryMutation =
    useEmailSummary()

  const refreshIntelligence =
    useRefreshEmailIntelligence()

  const [
    searchResponse,
    setSearchResponse,
  ] = useState<
    EmailSearchResponse | null
  >(null)

  const [
    selectedMessageId,
    setSelectedMessageId,
  ] = useState<
    string | null
  >(null)

  const [
    query,
    setQuery,
  ] = useState('')

  const [
    sender,
    setSender,
  ] = useState('')

  const [
    after,
    setAfter,
  ] = useState('')

  const [
    before,
    setBefore,
  ] = useState('')

  const [
    category,
    setCategory,
  ] = useState<
    EmailCategory | ''
  >('')

  const [
    importantOnly,
    setImportantOnly,
  ] = useState(false)

  const [
    includeSpamTrash,
    setIncludeSpamTrash,
  ] = useState(false)

  const emails =
    searchResponse?.messages ??
    importantQuery.data
      ?.messages ??
    []

  const showingSearch =
    searchResponse !== null

  const stats = useMemo(
    () => {
      const important =
        emails.filter(
          email =>
            email.is_important,
        ).length

      const financial =
        emails.filter(
          email =>
            email.category ===
              'bill' ||
            email.category ===
              'subscription' ||
            email.category ===
              'receipt',
        ).length

      const timeSensitive =
        emails.filter(
          email =>
            email.category ===
              'deadline' ||
            email.category ===
              'booking',
        ).length

      return {
        total: emails.length,
        important,
        financial,
        timeSensitive,
      }
    },
    [emails],
  )

  const handleSearch =
    async (
      event: FormEvent,
    ) => {
      event.preventDefault()

      if (!gmailConnected) {
        return
      }

      summaryMutation.reset()
      setSelectedMessageId(
        null,
      )

      try {
        const result =
          await searchMutation
            .mutateAsync({
              query:
                query.trim() ||
                null,

              sender:
                sender.trim() ||
                null,

              subject: null,

              after:
                after || null,

              before:
                before || null,

              label_ids: [],

              categories:
                category
                  ? [category]
                  : [],

              important_only:
                importantOnly,

              include_spam_trash:
                includeSpamTrash,

              max_results: 30,

              page_token: null,
            })

        setSearchResponse(
          result,
        )
      } catch {
        // Mutation state renders
        // the API error below.
      }
    }

  const handleAnalyze =
    async (
      email: EmailMetadata,
    ) => {
      if (
        summaryMutation.isPending
      ) {
        return
      }

      summaryMutation.reset()

      setSelectedMessageId(
        email.gmail_message_id,
      )

      try {
        await summaryMutation
          .mutateAsync(
            email.gmail_message_id,
          )
      } catch {
        // Mutation state renders
        // the API error.
      }
    }

  const handleResetSearch =
    () => {
      setSearchResponse(
        null,
      )

      setQuery('')
      setSender('')
      setAfter('')
      setBefore('')
      setCategory('')
      setImportantOnly(false)
      setIncludeSpamTrash(false)

      searchMutation.reset()
      summaryMutation.reset()

      setSelectedMessageId(
        null,
      )
    }

  const handleRefresh =
    async () => {
      setSearchResponse(
        null,
      )

      summaryMutation.reset()

      setSelectedMessageId(
        null,
      )

      await refreshIntelligence()

      await importantQuery.refetch()
    }

  const intelligence =
    summaryMutation.data
      ?.intelligence

  const selectedMessage =
    summaryMutation.data
      ?.message

  const money =
    intelligence
      ? formatMoney(
          intelligence.amount,
          intelligence.currency,
        )
      : null

  return (
    <div
      className={
        'mx-auto w-full ' +
        'max-w-[1500px] ' +
        'space-y-6 pb-10'
      }
    >
      <motion.section
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
        }}
        className={[
          'relative overflow-hidden',
          'rounded-[28px]',
          'border border-slate-200/80',
          'bg-white',
          'p-6 md:p-8',
          'shadow-sm',
        ].join(' ')}
      >
        <div
          className={
            'pointer-events-none ' +
            'absolute -right-20 ' +
            '-top-24 h-64 w-64 ' +
            'rounded-full ' +
            'bg-violet-100/60 blur-3xl'
          }
        />

        <div
          className={
            'pointer-events-none ' +
            'absolute -left-20 ' +
            '-bottom-24 h-56 w-56 ' +
            'rounded-full ' +
            'bg-sky-100/70 blur-3xl'
          }
        />

        <div
          className={
            'relative flex flex-col ' +
            'gap-6 lg:flex-row ' +
            'lg:items-end ' +
            'lg:justify-between'
          }
        >
          <div
            className={
              'max-w-3xl'
            }
          >
            <div
              className={[
                'inline-flex items-center',
                'gap-2 rounded-full',
                'border border-violet-200',
                'bg-violet-50',
                'px-3 py-1.5',
                'text-xs font-semibold',
                'text-violet-700',
              ].join(' ')}
            >
              <Sparkles
                className={
                  'h-3.5 w-3.5'
                }
              />
              Phase 4 · Gmail Intelligence
            </div>

            <h1
              className={[
                'mt-4 text-3xl',
                'font-semibold tracking-tight',
                'text-slate-950',
                'md:text-4xl',
              ].join(' ')}
            >
              Understand the emails
              that actually matter.
            </h1>

            <p
              className={[
                'mt-3 max-w-2xl',
                'text-sm leading-6',
                'text-slate-600',
                'md:text-base',
              ].join(' ')}
            >
              Search your authorized
              Gmail account, surface
              important messages and
              safely extract bills,
              renewals, deadlines,
              bookings and actions
              without storing raw email
              bodies.
            </p>
          </div>

          <div
            className={
              'flex flex-wrap ' +
              'items-center gap-3'
            }
          >
            <div
              className={[
                'inline-flex items-center',
                'gap-2 rounded-xl',
                'border px-3 py-2',
                'text-xs font-medium',
                gmailConnected
                  ? (
                    'border-emerald-200 ' +
                    'bg-emerald-50 ' +
                    'text-emerald-700'
                  )
                  : (
                    'border-amber-200 ' +
                    'bg-amber-50 ' +
                    'text-amber-700'
                  ),
              ].join(' ')}
            >
              {
                gmailConnected ? (
                  <CheckCircle2
                    className={
                      'h-4 w-4'
                    }
                  />
                ) : (
                  <AlertTriangle
                    className={
                      'h-4 w-4'
                    }
                  />
                )
              }

              {
                gmailConnected
                  ? 'Gmail connected'
                  : 'Gmail access required'
              }
            </div>

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={
                !gmailConnected ||
                importantQuery
                  .isFetching
              }
              className={[
                'inline-flex items-center',
                'gap-2 rounded-xl',
                'border border-slate-200',
                'bg-white px-3.5 py-2',
                'text-xs font-semibold',
                'text-slate-700',
                'shadow-sm',
                'transition',
                'hover:border-slate-300',
                'hover:bg-slate-50',
                'disabled:cursor-not-allowed',
                'disabled:opacity-50',
              ].join(' ')}
            >
              <RefreshCw
                className={[
                  'h-4 w-4',
                  importantQuery
                    .isFetching
                    ? 'animate-spin'
                    : '',
                ].join(' ')}
              />
              Refresh
            </button>
          </div>
        </div>
      </motion.section>

      {
        !integrationQuery.isPending &&
        !gmailConnected && (
          <section
            className={[
              'rounded-2xl border',
              'border-amber-200',
              'bg-amber-50 p-5',
            ].join(' ')}
          >
            <div
              className={
                'flex flex-col gap-4 ' +
                'sm:flex-row ' +
                'sm:items-center ' +
                'sm:justify-between'
              }
            >
              <div
                className={
                  'flex gap-3'
                }
              >
                <div
                  className={[
                    'flex h-10 w-10',
                    'shrink-0 items-center',
                    'justify-center',
                    'rounded-xl',
                    'bg-amber-100',
                    'text-amber-700',
                  ].join(' ')}
                >
                  <Mail
                    className={
                      'h-5 w-5'
                    }
                  />
                </div>

                <div>
                  <h2
                    className={
                      'font-semibold ' +
                      'text-amber-950'
                    }
                  >
                    Connect Gmail first
                  </h2>

                  <p
                    className={
                      'mt-1 text-sm ' +
                      'leading-6 ' +
                      'text-amber-800'
                    }
                  >
                    LifeOps needs the
                    Gmail read capability
                    before it can search
                    and analyze your
                    authorized messages.
                  </p>
                </div>
              </div>

              <Link
                to="/app/integrations"
                className={[
                  'inline-flex items-center',
                  'justify-center gap-2',
                  'rounded-xl',
                  'bg-amber-950',
                  'px-4 py-2.5',
                  'text-sm font-semibold',
                  'text-white',
                  'transition',
                  'hover:bg-amber-900',
                ].join(' ')}
              >
                Open integrations
                <ArrowRight
                  className={
                    'h-4 w-4'
                  }
                />
              </Link>
            </div>
          </section>
        )
      }

      <section
        className={
          'grid gap-4 ' +
          'sm:grid-cols-2 ' +
          'xl:grid-cols-4'
        }
      >
        {
          [
            {
              label:
                'Visible emails',
              value:
                stats.total,
              icon: (
                <Inbox
                  className={
                    'h-5 w-5'
                  }
                />
              ),
            },
            {
              label:
                'Important',
              value:
                stats.important,
              icon: (
                <Sparkles
                  className={
                    'h-5 w-5'
                  }
                />
              ),
            },
            {
              label:
                'Financial',
              value:
                stats.financial,
              icon: (
                <CreditCard
                  className={
                    'h-5 w-5'
                  }
                />
              ),
            },
            {
              label:
                'Time-sensitive',
              value:
                stats.timeSensitive,
              icon: (
                <CalendarClock
                  className={
                    'h-5 w-5'
                  }
                />
              ),
            },
          ].map(
            item => (
              <div
                key={
                  item.label
                }
                className={[
                  'rounded-2xl',
                  'border border-slate-200',
                  'bg-white p-4',
                  'shadow-sm',
                ].join(' ')}
              >
                <div
                  className={
                    'flex items-center ' +
                    'justify-between'
                  }
                >
                  <div
                    className={[
                      'flex h-10 w-10',
                      'items-center',
                      'justify-center',
                      'rounded-xl',
                      'bg-slate-100',
                      'text-slate-700',
                    ].join(' ')}
                  >
                    {item.icon}
                  </div>

                  <span
                    className={
                      'text-2xl ' +
                      'font-semibold ' +
                      'tracking-tight ' +
                      'text-slate-950'
                    }
                  >
                    {item.value}
                  </span>
                </div>

                <p
                  className={
                    'mt-3 text-xs ' +
                    'font-medium ' +
                    'text-slate-500'
                  }
                >
                  {item.label}
                </p>
              </div>
            ),
          )
        }
      </section>

      <section
        className={[
          'rounded-2xl',
          'border border-slate-200',
          'bg-white p-5',
          'shadow-sm',
        ].join(' ')}
      >
        <form
          onSubmit={
            handleSearch
          }
        >
          <div
            className={
              'flex flex-col gap-4'
            }
          >
            <div
              className={
                'flex items-center ' +
                'justify-between gap-4'
              }
            >
              <div>
                <h2
                  className={
                    'font-semibold ' +
                    'text-slate-950'
                  }
                >
                  Search Gmail
                </h2>

                <p
                  className={
                    'mt-1 text-xs ' +
                    'text-slate-500'
                  }
                >
                  Search is metadata-first
                  and bounded.
                </p>
              </div>

              {
                showingSearch && (
                  <button
                    type="button"
                    onClick={
                      handleResetSearch
                    }
                    className={[
                      'inline-flex',
                      'items-center gap-1.5',
                      'rounded-lg',
                      'px-2.5 py-2',
                      'text-xs',
                      'font-semibold',
                      'text-slate-500',
                      'transition',
                      'hover:bg-slate-100',
                      'hover:text-slate-900',
                    ].join(' ')}
                  >
                    <X
                      className={
                        'h-4 w-4'
                      }
                    />
                    Clear
                  </button>
                )
              }
            </div>

            <div
              className={
                'grid gap-3 ' +
                'lg:grid-cols-12'
              }
            >
              <div
                className={
                  'lg:col-span-5'
                }
              >
                <label
                  className={
                    'text-xs ' +
                    'font-medium ' +
                    'text-slate-600'
                  }
                >
                  Search
                </label>

                <div
                  className={
                    'relative mt-1.5'
                  }
                >
                  <Search
                    className={[
                      'absolute left-3',
                      'top-1/2 h-4 w-4',
                      '-translate-y-1/2',
                      'text-slate-400',
                    ].join(' ')}
                  />

                  <input
                    value={
                      query
                    }
                    onChange={
                      event =>
                        setQuery(
                          event.target
                            .value,
                        )
                    }
                    placeholder={
                      'Hostinger renewal, internship, invoice...'
                    }
                    disabled={
                      !gmailConnected
                    }
                    className={[
                      'h-11 w-full',
                      'rounded-xl',
                      'border border-slate-200',
                      'bg-slate-50/70',
                      'pl-10 pr-3',
                      'text-sm',
                      'text-slate-900',
                      'outline-none',
                      'transition',
                      'placeholder:text-slate-400',
                      'focus:border-slate-400',
                      'focus:bg-white',
                      'focus:ring-4',
                      'focus:ring-slate-100',
                      'disabled:opacity-50',
                    ].join(' ')}
                  />
                </div>
              </div>

              <div
                className={
                  'lg:col-span-3'
                }
              >
                <label
                  className={
                    'text-xs ' +
                    'font-medium ' +
                    'text-slate-600'
                  }
                >
                  Sender
                </label>

                <input
                  value={
                    sender
                  }
                  onChange={
                    event =>
                      setSender(
                        event.target
                          .value,
                      )
                  }
                  placeholder={
                    'billing@example.com'
                  }
                  disabled={
                    !gmailConnected
                  }
                  className={[
                    'mt-1.5 h-11',
                    'w-full rounded-xl',
                    'border border-slate-200',
                    'bg-slate-50/70',
                    'px-3 text-sm',
                    'outline-none',
                    'transition',
                    'focus:border-slate-400',
                    'focus:bg-white',
                    'focus:ring-4',
                    'focus:ring-slate-100',
                    'disabled:opacity-50',
                  ].join(' ')}
                />
              </div>

              <div
                className={
                  'lg:col-span-2'
                }
              >
                <label
                  className={
                    'text-xs ' +
                    'font-medium ' +
                    'text-slate-600'
                  }
                >
                  Category
                </label>

                <select
                  value={
                    category
                  }
                  onChange={
                    event =>
                      setCategory(
                        event.target
                          .value as
                          EmailCategory |
                          '',
                      )
                  }
                  disabled={
                    !gmailConnected
                  }
                  className={[
                    'mt-1.5 h-11',
                    'w-full rounded-xl',
                    'border border-slate-200',
                    'bg-slate-50/70',
                    'px-3 text-sm',
                    'outline-none',
                    'focus:border-slate-400',
                    'focus:ring-4',
                    'focus:ring-slate-100',
                    'disabled:opacity-50',
                  ].join(' ')}
                >
                  {
                    CATEGORY_OPTIONS.map(
                      option => (
                        <option
                          key={
                            option.value ||
                            'all'
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      ),
                    )
                  }
                </select>
              </div>

              <div
                className={
                  'flex items-end ' +
                  'lg:col-span-2'
                }
              >
                <button
                  type="submit"
                  disabled={
                    !gmailConnected ||
                    searchMutation
                      .isPending
                  }
                  className={[
                    'inline-flex h-11',
                    'w-full items-center',
                    'justify-center gap-2',
                    'rounded-xl',
                    'bg-slate-950',
                    'px-4',
                    'text-sm font-semibold',
                    'text-white',
                    'transition',
                    'hover:bg-slate-800',
                    'disabled:cursor-not-allowed',
                    'disabled:opacity-50',
                  ].join(' ')}
                >
                  {
                    searchMutation
                      .isPending ? (
                        <RefreshCw
                          className={
                            'h-4 w-4 ' +
                            'animate-spin'
                          }
                        />
                      ) : (
                        <Search
                          className={
                            'h-4 w-4'
                          }
                        />
                      )
                  }

                  Search
                </button>
              </div>
            </div>

            <div
              className={
                'grid gap-3 ' +
                'sm:grid-cols-2 ' +
                'lg:grid-cols-4'
              }
            >
              <div>
                <label
                  className={
                    'text-xs ' +
                    'font-medium ' +
                    'text-slate-600'
                  }
                >
                  After
                </label>

                <input
                  type="date"
                  value={
                    after
                  }
                  onChange={
                    event =>
                      setAfter(
                        event.target
                          .value,
                      )
                  }
                  disabled={
                    !gmailConnected
                  }
                  className={[
                    'mt-1.5 h-10',
                    'w-full rounded-xl',
                    'border border-slate-200',
                    'bg-white px-3',
                    'text-sm',
                    'outline-none',
                    'focus:border-slate-400',
                    'focus:ring-4',
                    'focus:ring-slate-100',
                  ].join(' ')}
                />
              </div>

              <div>
                <label
                  className={
                    'text-xs ' +
                    'font-medium ' +
                    'text-slate-600'
                  }
                >
                  Before
                </label>

                <input
                  type="date"
                  value={
                    before
                  }
                  onChange={
                    event =>
                      setBefore(
                        event.target
                          .value,
                      )
                  }
                  disabled={
                    !gmailConnected
                  }
                  className={[
                    'mt-1.5 h-10',
                    'w-full rounded-xl',
                    'border border-slate-200',
                    'bg-white px-3',
                    'text-sm',
                    'outline-none',
                    'focus:border-slate-400',
                    'focus:ring-4',
                    'focus:ring-slate-100',
                  ].join(' ')}
                />
              </div>

              <label
                className={[
                  'flex h-10',
                  'items-center gap-2',
                  'self-end rounded-xl',
                  'border border-slate-200',
                  'px-3',
                  'text-xs font-medium',
                  'text-slate-600',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={
                    importantOnly
                  }
                  onChange={
                    event =>
                      setImportantOnly(
                        event.target
                          .checked,
                      )
                  }
                  disabled={
                    !gmailConnected
                  }
                  className={
                    'h-4 w-4'
                  }
                />

                Important only
              </label>

              <label
                className={[
                  'flex h-10',
                  'items-center gap-2',
                  'self-end rounded-xl',
                  'border border-slate-200',
                  'px-3',
                  'text-xs font-medium',
                  'text-slate-600',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={
                    includeSpamTrash
                  }
                  onChange={
                    event =>
                      setIncludeSpamTrash(
                        event.target
                          .checked,
                      )
                  }
                  disabled={
                    !gmailConnected
                  }
                  className={
                    'h-4 w-4'
                  }
                />

                Include spam/trash
              </label>
            </div>
          </div>
        </form>

        {
          searchMutation.error && (
            <div
              className={[
                'mt-4 rounded-xl',
                'border border-rose-200',
                'bg-rose-50 px-4 py-3',
                'text-sm text-rose-700',
              ].join(' ')}
            >
              {
                getErrorMessage(
                  searchMutation.error,
                )
              }
            </div>
          )
        }
      </section>

      <div
        className={
          'grid gap-6 ' +
          'xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]'
        }
      >
        <section
          className={[
            'min-h-[480px]',
            'rounded-2xl',
            'border border-slate-200',
            'bg-slate-50/50',
            'p-4 md:p-5',
          ].join(' ')}
        >
          <div
            className={
              'flex items-center ' +
              'justify-between gap-4'
            }
          >
            <div>
              <h2
                className={
                  'font-semibold ' +
                  'text-slate-950'
                }
              >
                {
                  showingSearch
                    ? 'Search results'
                    : 'Important emails'
                }
              </h2>

              <p
                className={
                  'mt-1 text-xs ' +
                  'text-slate-500'
                }
              >
                {
                  showingSearch
                    ? (
                      `${emails.length} ` +
                      'matching messages'
                    )
                    : (
                      'LifeOps-ranked Gmail ' +
                      'messages'
                    )
                }
              </p>
            </div>

            <div
              className={[
                'rounded-full',
                'bg-white px-3 py-1.5',
                'text-xs font-semibold',
                'text-slate-600',
                'shadow-sm',
                'ring-1 ring-slate-200',
              ].join(' ')}
            >
              {emails.length}
            </div>
          </div>

          {
            (
              importantQuery.isPending &&
              !showingSearch &&
              gmailConnected
            ) ? (
              <div
                className={
                  'flex min-h-[380px] ' +
                  'items-center ' +
                  'justify-center'
                }
              >
                <div
                  className={
                    'text-center'
                  }
                >
                  <RefreshCw
                    className={
                      'mx-auto h-6 w-6 ' +
                      'animate-spin ' +
                      'text-slate-400'
                    }
                  />

                  <p
                    className={
                      'mt-3 text-sm ' +
                      'text-slate-500'
                    }
                  >
                    Reading Gmail
                    metadata...
                  </p>
                </div>
              </div>
            ) : emails.length > 0 ? (
              <div
                className={
                  'mt-4 space-y-3'
                }
              >
                {
                  emails.map(
                    email => (
                      <EmailRow
                        key={
                          email
                            .gmail_message_id
                        }
                        email={
                          email
                        }
                        selected={
                          selectedMessageId ===
                          email
                            .gmail_message_id
                        }
                        analyzing={
                          summaryMutation
                            .isPending &&
                          selectedMessageId ===
                            email
                              .gmail_message_id
                        }
                        onAnalyze={
                          handleAnalyze
                        }
                      />
                    ),
                  )
                }
              </div>
            ) : (
              <div
                className={
                  'flex min-h-[380px] ' +
                  'items-center ' +
                  'justify-center'
                }
              >
                <div
                  className={
                    'max-w-sm ' +
                    'text-center'
                  }
                >
                  <div
                    className={[
                      'mx-auto flex',
                      'h-12 w-12',
                      'items-center',
                      'justify-center',
                      'rounded-2xl',
                      'bg-white',
                      'text-slate-500',
                      'shadow-sm',
                      'ring-1',
                      'ring-slate-200',
                    ].join(' ')}
                  >
                    <Inbox
                      className={
                        'h-5 w-5'
                      }
                    />
                  </div>

                  <h3
                    className={
                      'mt-4 font-semibold ' +
                      'text-slate-900'
                    }
                  >
                    No emails found
                  </h3>

                  <p
                    className={
                      'mt-2 text-sm ' +
                      'leading-6 ' +
                      'text-slate-500'
                    }
                  >
                    Try a broader search,
                    remove filters or
                    verify Gmail access in
                    Integrations.
                  </p>
                </div>
              </div>
            )
          }

          {
            !showingSearch &&
            importantQuery.error && (
              <div
                className={[
                  'mt-4 rounded-xl',
                  'border border-rose-200',
                  'bg-rose-50 p-3',
                  'text-sm text-rose-700',
                ].join(' ')}
              >
                {
                  getErrorMessage(
                    importantQuery.error,
                  )
                }
              </div>
            )
          }
        </section>

        <section
          className={[
            'h-fit rounded-2xl',
            'border border-slate-200',
            'bg-white p-5',
            'shadow-sm',
            'xl:sticky xl:top-6',
          ].join(' ')}
        >
          <div
            className={
              'flex items-center ' +
              'justify-between'
            }
          >
            <div>
              <h2
                className={
                  'font-semibold ' +
                  'text-slate-950'
                }
              >
                Email intelligence
              </h2>

              <p
                className={
                  'mt-1 text-xs ' +
                  'text-slate-500'
                }
              >
                Analyze one selected
                message.
              </p>
            </div>

            <div
              className={[
                'flex h-10 w-10',
                'items-center',
                'justify-center',
                'rounded-xl',
                'bg-violet-50',
                'text-violet-700',
              ].join(' ')}
            >
              <Sparkles
                className={
                  'h-5 w-5'
                }
              />
            </div>
          </div>

          {
            summaryMutation.isPending ? (
              <div
                className={
                  'flex min-h-[360px] ' +
                  'items-center ' +
                  'justify-center'
                }
              >
                <div
                  className={
                    'text-center'
                  }
                >
                  <RefreshCw
                    className={
                      'mx-auto h-6 w-6 ' +
                      'animate-spin ' +
                      'text-violet-500'
                    }
                  />

                  <p
                    className={
                      'mt-3 text-sm ' +
                      'font-medium ' +
                      'text-slate-700'
                    }
                  >
                    Analyzing message...
                  </p>

                  <p
                    className={
                      'mt-1 text-xs ' +
                      'text-slate-500'
                    }
                  >
                    Extracting safe,
                    structured
                    intelligence.
                  </p>
                </div>
              </div>
            ) : (
              intelligence &&
              selectedMessage
            ) ? (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className={
                  'mt-5 space-y-5'
                }
              >
                <div>
                  <div
                    className={
                      'flex flex-wrap ' +
                      'items-center gap-2'
                    }
                  >
                    <span
                      className={[
                        'inline-flex',
                        'items-center gap-1.5',
                        'rounded-full',
                        'border px-2.5',
                        'py-1 text-xs',
                        'font-semibold',
                        categoryClasses(
                          intelligence.category,
                        ),
                      ].join(' ')}
                    >
                      {
                        categoryIcon(
                          intelligence.category,
                        )
                      }

                      {
                        categoryLabel(
                          intelligence.category,
                        )
                      }
                    </span>

                    {
                      intelligence
                        .is_important && (
                        <span
                          className={[
                            'rounded-full',
                            'bg-rose-50',
                            'px-2.5 py-1',
                            'text-xs',
                            'font-semibold',
                            'text-rose-600',
                          ].join(' ')}
                        >
                          Important
                        </span>
                      )
                    }
                  </div>

                  <h3
                    className={
                      'mt-3 text-lg ' +
                      'font-semibold ' +
                      'text-slate-950'
                    }
                  >
                    {
                      selectedMessage
                        .subject ||
                      '(No subject)'
                    }
                  </h3>

                  <p
                    className={
                      'mt-1 text-xs ' +
                      'text-slate-500'
                    }
                  >
                    {
                      selectedMessage
                        .sender ||
                      'Unknown sender'
                    }
                  </p>
                </div>

                {
                  intelligence.summary && (
                    <div
                      className={[
                        'rounded-2xl',
                        'bg-slate-950',
                        'p-4 text-white',
                      ].join(' ')}
                    >
                      <div
                        className={
                          'flex items-center ' +
                          'gap-2 text-xs ' +
                          'font-semibold ' +
                          'text-slate-300'
                        }
                      >
                        <Sparkles
                          className={
                            'h-4 w-4'
                          }
                        />
                        AI summary
                      </div>

                      <p
                        className={
                          'mt-3 text-sm ' +
                          'leading-6 ' +
                          'text-slate-200'
                        }
                      >
                        {
                          intelligence
                            .summary
                        }
                      </p>
                    </div>
                  )
                }

                {
                  intelligence
                    .what_happened && (
                    <div>
                      <p
                        className={
                          'text-xs ' +
                          'font-semibold ' +
                          'uppercase ' +
                          'tracking-wider ' +
                          'text-slate-400'
                        }
                      >
                        What happened
                      </p>

                      <p
                        className={
                          'mt-2 text-sm ' +
                          'leading-6 ' +
                          'text-slate-700'
                        }
                      >
                        {
                          intelligence
                            .what_happened
                        }
                      </p>
                    </div>
                  )
                }

                {
                  intelligence
                    .why_it_matters && (
                    <div>
                      <p
                        className={
                          'text-xs ' +
                          'font-semibold ' +
                          'uppercase ' +
                          'tracking-wider ' +
                          'text-slate-400'
                        }
                      >
                        Why it matters
                      </p>

                      <p
                        className={
                          'mt-2 text-sm ' +
                          'leading-6 ' +
                          'text-slate-700'
                        }
                      >
                        {
                          intelligence
                            .why_it_matters
                        }
                      </p>
                    </div>
                  )
                }

                <div
                  className={
                    'grid gap-3 ' +
                    'sm:grid-cols-2'
                  }
                >
                  {
                    money && (
                      <div
                        className={[
                          'rounded-xl',
                          'border',
                          'border-slate-200',
                          'p-3',
                        ].join(' ')}
                      >
                        <p
                          className={
                            'text-xs ' +
                            'text-slate-500'
                          }
                        >
                          Amount
                        </p>

                        <p
                          className={
                            'mt-1 font-semibold ' +
                            'text-slate-900'
                          }
                        >
                          {money}
                        </p>
                      </div>
                    )
                  }

                  {
                    intelligence
                      .deadline && (
                      <div
                        className={[
                          'rounded-xl',
                          'border',
                          'border-orange-200',
                          'bg-orange-50/70',
                          'p-3',
                        ].join(' ')}
                      >
                        <p
                          className={
                            'text-xs ' +
                            'text-orange-700'
                          }
                        >
                          Deadline
                        </p>

                        <p
                          className={
                            'mt-1 text-sm ' +
                            'font-semibold ' +
                            'text-orange-950'
                          }
                        >
                          {
                            formatDate(
                              intelligence
                                .deadline,
                            )
                          }
                        </p>
                      </div>
                    )
                  }

                  {
                    intelligence
                      .relevant_date && (
                      <div
                        className={[
                          'rounded-xl',
                          'border',
                          'border-slate-200',
                          'p-3',
                        ].join(' ')}
                      >
                        <p
                          className={
                            'text-xs ' +
                            'text-slate-500'
                          }
                        >
                          Relevant date
                        </p>

                        <p
                          className={
                            'mt-1 text-sm ' +
                            'font-semibold ' +
                            'text-slate-900'
                          }
                        >
                          {
                            formatDate(
                              intelligence
                                .relevant_date,
                            )
                          }
                        </p>
                      </div>
                    )
                  }

                  <div
                    className={[
                      'rounded-xl',
                      'border',
                      'border-slate-200',
                      'p-3',
                    ].join(' ')}
                  >
                    <p
                      className={
                        'text-xs ' +
                        'text-slate-500'
                      }
                    >
                      Importance
                    </p>

                    <p
                      className={
                        'mt-1 font-semibold ' +
                        'text-slate-900'
                      }
                    >
                      {
                        Math.round(
                          intelligence
                            .importance_score *
                          100,
                        )
                      }%
                    </p>
                  </div>
                </div>

                {
                  intelligence
                    .required_action && (
                    <div
                      className={[
                        'rounded-2xl',
                        'border',
                        'border-sky-200',
                        'bg-sky-50 p-4',
                      ].join(' ')}
                    >
                      <div
                        className={
                          'flex gap-3'
                        }
                      >
                        <CheckCircle2
                          className={
                            'mt-0.5 h-5 w-5 ' +
                            'shrink-0 ' +
                            'text-sky-600'
                          }
                        />

                        <div>
                          <p
                            className={
                              'text-xs ' +
                              'font-semibold ' +
                              'uppercase ' +
                              'tracking-wider ' +
                              'text-sky-700'
                            }
                          >
                            Action
                          </p>

                          <p
                            className={
                              'mt-1 text-sm ' +
                              'leading-6 ' +
                              'text-sky-950'
                            }
                          >
                            {
                              intelligence
                                .required_action
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }

                {
                  intelligence
                    .subscription && (
                    <div
                      className={[
                        'rounded-2xl',
                        'border',
                        'border-violet-200',
                        'bg-violet-50/60',
                        'p-4',
                      ].join(' ')}
                    >
                      <div
                        className={
                          'flex items-center ' +
                          'gap-2'
                        }
                      >
                        <RefreshCw
                          className={
                            'h-4 w-4 ' +
                            'text-violet-600'
                          }
                        />

                        <p
                          className={
                            'text-sm ' +
                            'font-semibold ' +
                            'text-violet-950'
                          }
                        >
                          Subscription
                          evidence
                        </p>
                      </div>

                      <div
                        className={
                          'mt-3 grid ' +
                          'gap-2 text-sm'
                        }
                      >
                        {
                          intelligence
                            .subscription
                            .provider && (
                            <p
                              className={
                                'text-slate-700'
                              }
                            >
                              Provider:{' '}
                              <strong>
                                {
                                  intelligence
                                    .subscription
                                    .provider
                                }
                              </strong>
                            </p>
                          )
                        }

                        {
                          intelligence
                            .subscription
                            .product_plan && (
                            <p
                              className={
                                'text-slate-700'
                              }
                            >
                              Plan:{' '}
                              <strong>
                                {
                                  intelligence
                                    .subscription
                                    .product_plan
                                }
                              </strong>
                            </p>
                          )
                        }

                        <p
                          className={
                            'text-slate-700'
                          }
                        >
                          Certainty:{' '}
                          <strong
                            className={
                              intelligence
                                .subscription
                                .certainty ===
                              'confirmed'
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }
                          >
                            {
                              intelligence
                                .subscription
                                .certainty
                            }
                          </strong>
                        </p>

                        <p
                          className={
                            'text-slate-700'
                          }
                        >
                          Confidence:{' '}
                          <strong>
                            {
                              Math.round(
                                intelligence
                                  .subscription
                                  .confidence *
                                100,
                              )
                            }%
                          </strong>
                        </p>
                      </div>
                    </div>
                  )
                }

                <div
                  className={[
                    'flex items-start',
                    'gap-3 rounded-xl',
                    'border border-emerald-200',
                    'bg-emerald-50/60',
                    'p-3',
                  ].join(' ')}
                >
                  <ShieldCheck
                    className={
                      'mt-0.5 h-4 w-4 ' +
                      'shrink-0 ' +
                      'text-emerald-600'
                    }
                  />

                  <p
                    className={
                      'text-xs leading-5 ' +
                      'text-emerald-800'
                    }
                  >
                    Raw email bodies and
                    attachments are not
                    persisted by this
                    metadata view.
                  </p>
                </div>
              </motion.div>
            ) : summaryMutation.error ? (
              <div
                className={[
                  'mt-5 rounded-xl',
                  'border border-rose-200',
                  'bg-rose-50 p-4',
                ].join(' ')}
              >
                <div
                  className={
                    'flex gap-3'
                  }
                >
                  <AlertTriangle
                    className={
                      'h-5 w-5 ' +
                      'shrink-0 ' +
                      'text-rose-600'
                    }
                  />

                  <div>
                    <p
                      className={
                        'text-sm ' +
                        'font-semibold ' +
                        'text-rose-800'
                      }
                    >
                      Unable to analyze
                      email
                    </p>

                    <p
                      className={
                        'mt-1 text-xs ' +
                        'leading-5 ' +
                        'text-rose-700'
                      }
                    >
                      {
                        getErrorMessage(
                          summaryMutation
                            .error,
                        )
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={
                  'flex min-h-[360px] ' +
                  'items-center ' +
                  'justify-center'
                }
              >
                <div
                  className={
                    'max-w-xs ' +
                    'text-center'
                  }
                >
                  <div
                    className={[
                      'mx-auto flex',
                      'h-12 w-12',
                      'items-center',
                      'justify-center',
                      'rounded-2xl',
                      'bg-slate-100',
                      'text-slate-500',
                    ].join(' ')}
                  >
                    <FileText
                      className={
                        'h-5 w-5'
                      }
                    />
                  </div>

                  <h3
                    className={
                      'mt-4 font-semibold ' +
                      'text-slate-900'
                    }
                  >
                    Select an email
                  </h3>

                  <p
                    className={
                      'mt-2 text-sm ' +
                      'leading-6 ' +
                      'text-slate-500'
                    }
                  >
                    Click a message to
                    generate its summary,
                    importance,
                    dates, financial
                    details and required
                    actions.
                  </p>
                </div>
              </div>
            )
          }
        </section>
      </div>
    </div>
  )
}