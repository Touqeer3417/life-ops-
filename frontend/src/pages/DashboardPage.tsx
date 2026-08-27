import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Database,
  KeyRound,
  MessageSquareText,
  Server,
  Sparkles,
  UserRound,
} from 'lucide-react'
import {
  motion,
  useReducedMotion,
  type Variants,
} from 'motion/react'
import { Link } from 'react-router-dom'

import { StatusCard } from '@/components/dashboard/StatusCard'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useDashboard } from '@/hooks/useDashboard'
import { formatDateTime } from '@/utils/date'

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
    y: 14,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

export function DashboardPage() {
  const dashboard = useDashboard()
  const shouldReduceMotion = useReducedMotion()

  if (dashboard.isLoading) {
    return (
      <LoadingScreen label="Loading your dashboard…" />
    )
  }

  if (dashboard.isError) {
    return (
      <ErrorState
        message={dashboard.error.message}
        onRetry={() => void dashboard.refetch()}
      />
    )
  }

  if (!dashboard.data) {
    return null
  }

  const {
    user,
    foundation,
    upcoming_modules: upcomingModules,
    generated_at: generatedAt,
  } = dashboard.data

  const firstName = user.full_name
    ? user.full_name.split(' ')[0]
    : null

  return (
    <motion.div
      variants={containerVariants}
      initial={
        shouldReduceMotion
          ? false
          : 'hidden'
      }
      animate="visible"
      className="mx-auto w-full max-w-7xl space-y-8 pb-10"
    >
      {/* Hero */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_40px_rgba(15,23,42,0.04)] sm:px-7 sm:py-8 lg:px-9 lg:py-9"
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-slate-950/10"
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <Sparkles
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />

              LifeOps AI · Standard RAG
            </div>

            <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl lg:text-[2.7rem] lg:leading-[1.08]">
              Welcome
              {firstName
                ? `, ${firstName}`
                : ''}
              .
              <span className="block text-slate-500">
                Your knowledge workspace is ready.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              Upload and index your documents, retrieve
              relevant knowledge, and ask grounded questions
              through your Standard RAG pipeline.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>

                Workspace operational
              </div>

              <div className="flex items-center gap-2">
                <Clock3
                  className="h-3.5 w-3.5 text-slate-400"
                  aria-hidden="true"
                />

                Updated {formatDateTime(generatedAt)}
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col xl:flex-row">
            <Link
              to="/app/documents"
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 active:bg-slate-900"
            >
              Open knowledge base

              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>

            <Link
              to="/app/chat"
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:bg-slate-100"
            >
              <MessageSquareText
                className="h-4 w-4"
                aria-hidden="true"
              />

              Ask LifeOps
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Foundation status */}
      <motion.section variants={itemVariants}>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              System status
            </p>

            <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-slate-950">
              Foundation services
            </h2>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-700 sm:mt-0">
            <CheckCircle2
              className="h-4 w-4"
              aria-hidden="true"
            />

            Core services connected
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'FastAPI',
              value: foundation.api,
              icon: Server,
            },
            {
              title: 'PostgreSQL',
              value: foundation.database,
              icon: Database,
            },
            {
              title: 'Authentication',
              value: foundation.authentication,
              icon: KeyRound,
            },
          ].map((status, index) => (
            <motion.div
              key={status.title}
              initial={
                shouldReduceMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 10,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay:
                  shouldReduceMotion
                    ? 0
                    : 0.18 + index * 0.06,
                duration: 0.35,
              }}
            >
              <StatusCard
                title={status.title}
                value={status.value}
                icon={status.icon}
              />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Primary workspace */}
      <motion.section variants={itemVariants}>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Workspace
          </p>

          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950">
            Work with your knowledge
          </h2>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            Manage the information available to LifeOps and
            interact with it through grounded AI responses.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Link
            to="/app/documents"
            className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <motion.div
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : { y: -4 }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : { scale: 0.995 }
              }
              transition={{
                duration: 0.2,
              }}
              className="h-full"
            >
              <Card className="relative h-full overflow-hidden border-slate-200/80 p-0 transition-[border-color,box-shadow] duration-300 group-hover:border-indigo-200 group-hover:shadow-[0_14px_40px_rgba(15,23,42,0.07)]">
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700">
                      <BookOpen
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all duration-200 group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700">
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                        Documents & Knowledge Base
                      </h3>

                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Manage
                      </span>
                    </div>

                    <p className="mt-2.5 max-w-xl text-sm leading-6 text-slate-500">
                      Upload PDF, DOCX, TXT, and Markdown
                      documents, monitor indexing, search
                      files, test semantic retrieval, and
                      manage stored knowledge.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:px-6">
                  <span className="text-xs font-medium text-slate-500 transition-colors group-hover:text-indigo-700">
                    Open document workspace
                  </span>
                </div>
              </Card>
            </motion.div>
          </Link>

          <Link
            to="/app/chat"
            className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            <motion.div
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : { y: -4 }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : { scale: 0.995 }
              }
              transition={{
                duration: 0.2,
              }}
              className="h-full"
            >
              <Card className="relative h-full overflow-hidden border-slate-200/80 p-0 transition-[border-color,box-shadow] duration-300 group-hover:border-violet-200 group-hover:shadow-[0_14px_40px_rgba(15,23,42,0.07)]">
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-700">
                      <MessageSquareText
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all duration-200 group-hover:border-violet-200 group-hover:bg-violet-50 group-hover:text-violet-700">
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                        RAG Chat
                      </h3>

                      <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-600">
                        AI
                      </span>
                    </div>

                    <p className="mt-2.5 max-w-xl text-sm leading-6 text-slate-500">
                      Ask questions about indexed documents
                      and receive answers grounded in
                      retrieved context with source
                      citations.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:px-6">
                  <span className="text-xs font-medium text-slate-500 transition-colors group-hover:text-violet-700">
                    Start a grounded conversation
                  </span>
                </div>
              </Card>
            </motion.div>
          </Link>
        </div>
      </motion.section>

      {/* Secondary information */}
      <motion.section
        variants={itemVariants}
        className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]"
      >
        <Card className="border-slate-200/80">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                <UserRound
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2 className="font-semibold tracking-tight text-slate-950">
                  Your LifeOps account
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Persisted securely in PostgreSQL
                </p>
              </div>
            </div>

            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:inline-flex">
              Active
            </span>
          </div>

          <dl className="mt-6 divide-y divide-slate-100">
            <div className="grid gap-1 py-3.5 first:pt-0 sm:grid-cols-[130px_1fr] sm:items-center">
              <dt className="text-xs font-medium text-slate-400">
                Email
              </dt>

              <dd className="break-all text-sm font-medium text-slate-800 sm:text-right">
                {user.email}
              </dd>
            </div>

            <div className="grid gap-1 py-3.5 sm:grid-cols-[130px_1fr] sm:items-center">
              <dt className="text-xs font-medium text-slate-400">
                Timezone
              </dt>

              <dd className="text-sm font-medium text-slate-800 sm:text-right">
                {user.preferences.timezone}
              </dd>
            </div>

            <div className="grid gap-1 py-3.5 last:pb-0 sm:grid-cols-[130px_1fr] sm:items-center">
              <dt className="text-xs font-medium text-slate-400">
                Account created
              </dt>

              <dd className="text-sm font-medium text-slate-800 sm:text-right">
                {formatDateTime(user.created_at)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="border-slate-200/80">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Roadmap
            </p>

            <h2 className="mt-1.5 font-semibold tracking-tight text-slate-950">
              Next SRS phases
            </h2>

            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Later capabilities remain intentionally
              outside the current Standard RAG scope.
            </p>
          </div>

          <div className="mt-5 space-y-2.5">
            {upcomingModules.map(
              (module, index) => (
                <motion.div
                  key={module.name}
                  initial={
                    shouldReduceMotion
                      ? false
                      : {
                          opacity: 0,
                          x: 8,
                        }
                  }
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    delay:
                      shouldReduceMotion
                        ? 0
                        : 0.32 +
                          index * 0.045,
                    duration: 0.3,
                  }}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-transparent bg-slate-50 px-4 py-3 transition-colors hover:border-slate-200 hover:bg-white"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {module.name}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Phase {module.phase}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                    Planned
                  </span>
                </motion.div>
              ),
            )}
          </div>
        </Card>
      </motion.section>
    </motion.div>
  )
}