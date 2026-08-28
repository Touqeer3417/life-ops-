import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Database,
  KeyRound,
  Layers3,
  MessageSquareText,
  Server,
  ShieldCheck,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import {
  motion,
  useReducedMotion,
  type Variants,
} from 'motion/react'
import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { useDashboard } from '@/hooks/useDashboard'
import { formatDateTime } from '@/utils/date'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
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

const HEALTHY_SERVICE_STATES = new Set<string>([
  'online',
  'connected',
  'active',
])

interface ServiceItem {
  title: string
  value: string
  description: string
  icon: LucideIcon
}

function DashboardSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[1360px] space-y-6 pb-10"
      aria-label="Loading dashboard"
      aria-busy="true"
    >
      <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.28)] sm:p-8">
        <div className="animate-pulse motion-reduce:animate-none">
          <div className="h-7 w-40 rounded-full bg-slate-100" />
          <div className="mt-6 h-10 w-full max-w-xl rounded-xl bg-slate-100" />
          <div className="mt-3 h-10 w-full max-w-md rounded-xl bg-slate-100" />
          <div className="mt-6 h-4 w-full max-w-2xl rounded bg-slate-100" />
          <div className="mt-2 h-4 w-3/5 max-w-xl rounded bg-slate-100" />
          <div className="mt-7 flex gap-3">
            <div className="h-11 w-44 rounded-xl bg-slate-100" />
            <div className="h-11 w-36 rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl border border-slate-200/80 bg-white motion-reduce:animate-none"
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-[24px] border border-slate-200/80 bg-white motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  )
}

function ServiceStatusCard({
  title,
  value,
  description,
  icon: Icon,
}: ServiceItem) {
  return (
    <Card className="group relative overflow-hidden border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_36px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Healthy
        </span>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          {title}
        </p>

        <div className="mt-2 flex items-end justify-between gap-4">
          <p className="text-xl font-semibold capitalize tracking-[-0.02em] text-slate-950">
            {value}
          </p>

          <CheckCircle2
            className="h-4 w-4 shrink-0 text-emerald-500"
            aria-hidden="true"
          />
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </Card>
  )
}

export function DashboardPage() {
  const dashboard = useDashboard()
  const shouldReduceMotion = useReducedMotion()

  if (dashboard.isLoading) {
    return <DashboardSkeleton />
  }

  if (dashboard.isError) {
    return (
      <div className="mx-auto w-full max-w-3xl py-10">
        <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            LifeOps workspace
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            We could not load your dashboard
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Your data and authentication flow are unchanged. Retry the live dashboard request below.
          </p>
        </div>

        <ErrorState
          message={dashboard.error.message}
          onRetry={() => void dashboard.refetch()}
        />
      </div>
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

  const firstName = user.full_name?.trim().split(/\s+/)[0] || null
  const displayName = user.full_name || user.email
  const avatarInitial = (user.full_name || user.email).charAt(0).toUpperCase()

  const serviceItems: ServiceItem[] = [
    {
      title: 'API',
      value: foundation.api,
      description: 'FastAPI application layer is responding and ready for authenticated requests.',
      icon: Server,
    },
    {
      title: 'Database',
      value: foundation.database,
      description: 'PostgreSQL persistence is connected to your LifeOps workspace.',
      icon: Database,
    },
    {
      title: 'Authentication',
      value: foundation.authentication,
      description: 'Auth0 identity and protected workspace access are active.',
      icon: KeyRound,
    },
  ]

  const healthyServiceCount = serviceItems.filter(({ value }) =>
    HEALTHY_SERVICE_STATES.has(value.toLowerCase()),
  ).length

  const allServicesHealthy = healthyServiceCount === serviceItems.length

  return (
    <motion.div
      variants={containerVariants}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
      className="mx-auto w-full max-w-[1360px] space-y-6 pb-10"
    >
      <motion.section
        variants={itemVariants}
        className="relative isolate overflow-hidden rounded-[30px] border border-slate-200/80 bg-slate-950 px-5 py-6 text-white shadow-[0_28px_90px_-42px_rgba(15,23,42,0.72)] sm:px-7 sm:py-8 xl:px-9 xl:py-9"
        aria-labelledby="dashboard-heading"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_0%,rgba(99,102,241,0.30),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(14,165,233,0.18),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_52%,#111827_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full border border-white/10 bg-white/[0.03] blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 -z-10 h-40 w-[44rem] -translate-x-1/2 bg-gradient-to-t from-indigo-500/10 to-transparent blur-3xl"
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-stretch">
          <div className="flex min-w-0 flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-300" aria-hidden="true" />
                  LifeOps AI · Standard RAG
                </span>

                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur ${
                    allServicesHealthy
                      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                      : 'border-amber-400/20 bg-amber-400/10 text-amber-200'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      allServicesHealthy ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  {healthyServiceCount}/{serviceItems.length} core services ready
                </span>
              </div>

              <h1
                id="dashboard-heading"
                className="mt-6 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl lg:text-[2.8rem] lg:leading-[1.08]"
              >
                {firstName ? `Good to see you, ${firstName}.` : 'Your LifeOps workspace is ready.'}
                <span className="mt-1 block bg-gradient-to-r from-slate-300 via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  Turn your knowledge into grounded answers.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-[15px]">
                Manage the documents LifeOps can use, then move directly into RAG chat for answers grounded in your indexed knowledge base.
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/app/documents"
                  className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_8px_24px_-12px_rgba(255,255,255,0.8)] outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.99]"
                >
                  Open knowledge base
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>

                <Link
                  to="/app/chat"
                  className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white outline-none backdrop-blur transition hover:border-white/20 hover:bg-white/[0.10] focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.99]"
                >
                  <MessageSquareText className="h-4 w-4 text-indigo-200" aria-hidden="true" />
                  Ask LifeOps
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                Updated {formatDateTime(generatedAt)}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.065] p-5 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Agent readiness
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-white">
                  Foundation health
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2" aria-label="Core service health">
              {serviceItems.map((service) => {
                const isHealthy = HEALTHY_SERVICE_STATES.has(service.value.toLowerCase())

                return (
                  <div
                    key={service.title}
                    className={`h-1.5 rounded-full ${
                      isHealthy ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    title={`${service.title}: ${service.value}`}
                  />
                )
              })}
            </div>

            <div className="mt-6 space-y-3">
              {serviceItems.map((service) => {
                const Icon = service.icon

                return (
                  <div
                    key={service.title}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-black/10 px-3.5 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-slate-300">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className="truncate text-sm font-medium text-slate-200">
                        {service.title}
                      </span>
                    </div>

                    <span className="shrink-0 text-xs font-semibold capitalize text-emerald-300">
                      {service.value}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} aria-labelledby="workspace-heading">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Workspace
            </p>
            <h2
              id="workspace-heading"
              className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-slate-950"
            >
              Move from knowledge to action
            </h2>
          </div>

          <p className="max-w-xl text-sm leading-6 text-slate-500 sm:text-right">
            Two focused surfaces for managing your source material and querying it with grounded AI.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Link
            to="/app/documents"
            className="group block rounded-[24px] outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <motion.div
              className="h-full"
              whileHover={shouldReduceMotion ? undefined : { y: -4 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.995 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="relative h-full overflow-hidden rounded-[24px] border-slate-200/80 bg-white p-0 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.42)] transition-[border-color,box-shadow] duration-300 group-hover:border-indigo-200 group-hover:shadow-[0_24px_60px_-36px_rgba(79,70,229,0.28)]">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-indigo-50/80 to-transparent"
                />

                <div className="relative p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-700 shadow-sm">
                      <BookOpen className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition group-hover:border-indigo-200 group-hover:text-indigo-700">
                      <ArrowUpRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold tracking-[-0.025em] text-slate-950">
                        Knowledge base
                      </h3>
                      <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700">
                        Documents
                      </span>
                    </div>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                      Upload supported files, monitor indexing, search your document library, and manage the knowledge available to LifeOps.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {['Upload', 'Index', 'Search', 'Retrieve'].map((label) => (
                        <span
                          key={label}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:px-6">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 transition-colors group-hover:text-indigo-700">
                    Open document workspace
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Card>
            </motion.div>
          </Link>

          <Link
            to="/app/chat"
            className="group block rounded-[24px] outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            <motion.div
              className="h-full"
              whileHover={shouldReduceMotion ? undefined : { y: -4 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.995 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="relative h-full overflow-hidden rounded-[24px] border-slate-200/80 bg-white p-0 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.42)] transition-[border-color,box-shadow] duration-300 group-hover:border-violet-200 group-hover:shadow-[0_24px_60px_-36px_rgba(124,58,237,0.28)]">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-violet-50/80 to-transparent"
                />

                <div className="relative p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-700 shadow-sm">
                      <MessageSquareText className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition group-hover:border-violet-200 group-hover:text-violet-700">
                      <ArrowUpRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold tracking-[-0.025em] text-slate-950">
                        RAG chat
                      </h3>
                      <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-700">
                        Grounded AI
                      </span>
                    </div>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                      Ask questions across indexed documents and receive responses grounded in retrieved context with source citations.
                    </p>

                    <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
                      <div className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 shadow-sm">
                        <Sparkles className="h-4 w-4 shrink-0 text-violet-600" aria-hidden="true" />
                        <span className="truncate text-xs text-slate-500">
                          Ask LifeOps about your indexed knowledge…
                        </span>
                        <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:px-6">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 transition-colors group-hover:text-violet-700">
                    Start a grounded conversation
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Card>
            </motion.div>
          </Link>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} aria-labelledby="health-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              System status
            </p>
            <h2
              id="health-heading"
              className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-slate-950"
            >
              Foundation services
            </h2>
          </div>

          <div
            className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold sm:inline-flex ${
              allServicesHealthy
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {healthyServiceCount}/{serviceItems.length} operational
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {serviceItems.map((service, index) => (
            <motion.div
              key={service.title}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: shouldReduceMotion ? 0 : 0.18 + index * 0.05,
                duration: 0.32,
              }}
            >
              <ServiceStatusCard {...service} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        variants={itemVariants}
        className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
      >
        <Card className="overflow-hidden border-slate-200/80 bg-white p-0 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.36)]">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${displayName} avatar`}
                    className="h-11 w-11 rounded-2xl object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white"
                    aria-hidden="true"
                  >
                    {avatarInitial}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Account & workspace
                  </p>
                  <h2 className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-950">
                    {displayName}
                  </h2>
                </div>
              </div>

              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  user.is_active
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <dl className="divide-y divide-slate-100 px-5 sm:px-6">
            <div className="grid gap-1 py-4 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-center">
              <dt className="text-xs font-medium text-slate-400">Email</dt>
              <dd className="min-w-0 break-all text-sm font-medium text-slate-800 sm:text-right">
                {user.email}
              </dd>
            </div>

            <div className="grid gap-1 py-4 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-center">
              <dt className="text-xs font-medium text-slate-400">Role</dt>
              <dd className="text-sm font-medium capitalize text-slate-800 sm:text-right">
                {user.role}
              </dd>
            </div>

            <div className="grid gap-1 py-4 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-center">
              <dt className="text-xs font-medium text-slate-400">Timezone</dt>
              <dd className="text-sm font-medium text-slate-800 sm:text-right">
                {user.preferences.timezone}
              </dd>
            </div>

            <div className="grid gap-1 py-4 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-center">
              <dt className="text-xs font-medium text-slate-400">Email status</dt>
              <dd className="sm:text-right">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    user.is_email_verified
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {user.is_email_verified ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {user.is_email_verified ? 'Verified' : 'Not verified'}
                </span>
              </dd>
            </div>

            <div className="grid gap-1 py-4 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-center">
              <dt className="text-xs font-medium text-slate-400">Notifications</dt>
              <dd className="sm:text-right">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800">
                  <BellRing className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  {user.preferences.email_notifications ? 'Enabled' : 'Disabled'}
                </span>
              </dd>
            </div>

            <div className="grid gap-1 py-4 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-center">
              <dt className="text-xs font-medium text-slate-400">Member since</dt>
              <dd className="text-sm font-medium text-slate-800 sm:text-right">
                {formatDateTime(user.created_at)}
              </dd>
            </div>
          </dl>

          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
            <Link
              to="/app/profile"
              className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-600 outline-none transition-colors hover:text-slate-950 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Manage profile & preferences
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-slate-200/80 bg-white p-0 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.36)]">
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 h-44 w-44 rounded-full bg-indigo-100/60 blur-3xl"
          />

          <div className="relative border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Product roadmap
                </p>
                <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-slate-950">
                  What comes after Standard RAG
                </h2>
                <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
                  Upcoming LifeOps capabilities are shown directly from the dashboard API.
                </p>
              </div>

              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-700 sm:flex">
                <Layers3 className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="relative p-5 sm:p-6">
            {upcomingModules.length > 0 ? (
              <ol className="space-y-3">
                {upcomingModules.map((module, index) => (
                  <motion.li
                    key={`${module.phase}-${module.name}`}
                    initial={shouldReduceMotion ? false : { opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: shouldReduceMotion ? 0 : 0.28 + index * 0.045,
                      duration: 0.3,
                    }}
                    className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3.5 transition-colors hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm">
                      {module.phase}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {module.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Phase {module.phase}
                      </p>
                    </div>

                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-500">
                      {module.status}
                    </span>
                  </motion.li>
                ))}
              </ol>
            ) : (
              <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                  <Layers3 className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-900">
                  No upcoming modules listed
                </p>
                <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-500">
                  The dashboard API did not return any planned modules for this workspace.
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.section>

      <motion.footer
        variants={itemVariants}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 text-xs text-slate-500 backdrop-blur sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-2">
          <UserRound className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          <span className="truncate">
            Signed in as <span className="font-medium text-slate-700">{user.email}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          Authenticated LifeOps workspace
        </div>
      </motion.footer>
    </motion.div>
  )
}
