import type { ReactNode } from 'react'
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
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { useDashboard } from '@/hooks/useDashboard'
import { formatDateTime } from '@/utils/date'

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

const HEALTHY_SERVICE_STATES = new Set<string>(['online', 'connected', 'active'])

const darkCardClass =
  '!rounded-[24px] !border-white/[0.08] !bg-white/[0.035] !text-white !shadow-[0_24px_80px_-45px_rgba(0,0,0,0.95)] backdrop-blur-xl'

interface ServiceItem {
  title: string
  value: string
  description: string
  icon: LucideIcon
}

function DashboardSkeleton() {
  return (
    <div
      className="relative mx-auto w-full max-w-[1360px] overflow-hidden rounded-[32px] border border-white/[0.07] bg-[#05070b] p-4 text-white sm:p-6 lg:p-7"
      aria-label="Loading dashboard"
      aria-busy="true"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(34,211,238,0.10),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(139,92,246,0.10),transparent_28%)]" />
      <div className="relative animate-pulse space-y-5 motion-reduce:animate-none">
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 sm:p-8">
          <div className="h-7 w-40 rounded-full bg-white/[0.08]" />
          <div className="mt-6 h-10 w-full max-w-xl rounded-xl bg-white/[0.08]" />
          <div className="mt-3 h-10 w-full max-w-md rounded-xl bg-white/[0.06]" />
          <div className="mt-6 h-4 w-full max-w-2xl rounded bg-white/[0.05]" />
          <div className="mt-2 h-4 w-3/5 max-w-xl rounded bg-white/[0.04]" />
          <div className="mt-7 flex gap-3">
            <div className="h-11 w-44 rounded-xl bg-white/[0.08]" />
            <div className="h-11 w-36 rounded-xl bg-white/[0.05]" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-40 rounded-2xl border border-white/[0.07] bg-white/[0.03]" />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-64 rounded-[24px] border border-white/[0.07] bg-white/[0.03]" />
          ))}
        </div>
      </div>
    </div>
  )
}

function ServiceStatusCard({ title, value, description, icon: Icon }: ServiceItem) {
  const isHealthy = HEALTHY_SERVICE_STATES.has(value.toLowerCase())

  return (
    <Card className={`${darkCardClass} group relative overflow-hidden !p-5 transition-colors hover:!border-emerald-300/15 hover:!bg-white/[0.045]`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.055] text-emerald-200">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <span
          className={[
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
            isHealthy
              ? 'border-emerald-300/10 bg-emerald-300/[0.055] text-emerald-200'
              : 'border-amber-300/10 bg-amber-300/[0.055] text-amber-200',
          ].join(' ')}
        >
          <span className={['h-1.5 w-1.5 rounded-full', isHealthy ? 'bg-emerald-300' : 'bg-amber-300'].join(' ')} />
          {isHealthy ? 'Healthy' : 'Attention'}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">{title}</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <p className="text-xl font-semibold capitalize tracking-[-0.02em] text-white">{value}</p>
          <CheckCircle2
            className={['h-4 w-4 shrink-0', isHealthy ? 'text-emerald-300' : 'text-amber-300'].join(' ')}
            aria-hidden="true"
          />
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
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
      <div className="mx-auto w-full max-w-3xl rounded-[30px] border border-white/[0.08] bg-[#05070b] p-5 text-white shadow-[0_30px_100px_-45px_rgba(0,0,0,0.95)] sm:p-7">
        <div className="mb-4 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">LifeOps workspace</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-white">We could not load your dashboard</h1>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Your data and authentication flow are unchanged. Retry the live dashboard request below.
          </p>
        </div>
        <ErrorState message={dashboard.error.message} onRetry={() => void dashboard.refetch()} />
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
      className="relative mx-auto w-full max-w-[1360px] overflow-hidden rounded-[32px] border border-white/[0.07] bg-[#05070b] p-4 text-white shadow-[0_35px_120px_-50px_rgba(0,0,0,0.95)] sm:p-6 lg:p-7"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_90%_8%,rgba(139,92,246,0.11),transparent_28%),linear-gradient(to_bottom,#05070b,#070a11_55%,#05070b)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <motion.section
        variants={itemVariants}
        className="relative isolate overflow-hidden rounded-[30px] border border-white/[0.08] bg-white/[0.035] px-5 py-6 shadow-[0_28px_90px_-42px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:px-7 sm:py-8 xl:px-9 xl:py-9"
        aria-labelledby="dashboard-heading"
      >
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(139,92,246,0.12),transparent_30%)]" />
        <motion.div
          aria-hidden="true"
          animate={shouldReduceMotion ? undefined : { y: [-8, 8, -8], x: [0, 6, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-violet-400/[0.075] blur-3xl"
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-stretch">
          <div className="flex min-w-0 flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
              
               
                  
              </div>

              <h1
                id="dashboard-heading"
                className="mt-6 max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[2.8rem] lg:leading-[1.08]"
              >
                {firstName ? `Good to see you, ${firstName}.` : 'Your LifeOps workspace is ready.'}
                <span className="mt-1 block bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">
                  Turn your knowledge into grounded answers.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-[15px]">
                Manage the documents LifeOps can use, then move directly into RAG chat for answers grounded in your indexed knowledge base.
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/app/documents"
                  className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_10px_35px_rgba(255,255,255,0.10)] outline-none transition hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070b] active:translate-y-0"
                >
                  Open knowledge base
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>

                <Link
                  to="/app/chat"
                  className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-slate-200 outline-none transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070b]"
                >
                  <MessageSquareText className="h-4 w-4 text-violet-200" aria-hidden="true" />
                  Ask LifeOps
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                Updated {formatDateTime(generatedAt)}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/[0.08] bg-black/10 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Agent readiness</p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-white">Foundation health</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.055] text-emerald-200">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2" aria-label="Core service health">
              {serviceItems.map((service) => {
                const isHealthy = HEALTHY_SERVICE_STATES.has(service.value.toLowerCase())
                return (
                  <div
                    key={service.title}
                    className={['h-1.5 rounded-full', isHealthy ? 'bg-emerald-300' : 'bg-amber-300'].join(' ')}
                    title={`${service.title}: ${service.value}`}
                  />
                )
              })}
            </div>

            <div className="mt-6 space-y-2.5">
              {serviceItems.map((service) => {
                const Icon = service.icon
                const isHealthy = HEALTHY_SERVICE_STATES.has(service.value.toLowerCase())
                return (
                  <div key={service.title} className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.065] bg-white/[0.025] px-3.5 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.045] text-slate-400">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className="truncate text-sm font-medium text-slate-300">{service.title}</span>
                    </div>
                    <span className={['shrink-0 text-xs font-semibold capitalize', isHealthy ? 'text-emerald-300' : 'text-amber-300'].join(' ')}>
                      {service.value}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="mt-5" aria-labelledby="workspace-heading">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">Workspace</p>
            <h2 id="workspace-heading" className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-white">
              Move from knowledge to action
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-500 sm:text-right">
            Two focused surfaces for managing your source material and querying it with grounded AI.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <WorkspaceCard
            to="/app/documents"
            icon={BookOpen}
            eyebrow="Documents"
            title="Knowledge base"
            description="Upload supported files, monitor indexing, search your document library, and manage the knowledge available to LifeOps."
            tags={['Upload', 'Index', 'Search', 'Retrieve']}
            footer="Open document workspace"
            accent="cyan"
            shouldReduceMotion={shouldReduceMotion}
          />

          <WorkspaceCard
            to="/app/chat"
            icon={MessageSquareText}
            eyebrow="Grounded AI"
            title="RAG chat"
            description="Ask questions across indexed documents and receive responses grounded in retrieved context with source citations."
            tags={['Retrieve', 'Ground', 'Answer', 'Cite']}
            footer="Start a grounded conversation"
            accent="violet"
            shouldReduceMotion={shouldReduceMotion}
          />
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="mt-5" aria-labelledby="health-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">System status</p>
            <h2 id="health-heading" className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-white">
              Foundation services
            </h2>
          </div>

          <div
            className={[
              'hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold sm:inline-flex',
              allServicesHealthy
                ? 'border-emerald-300/10 bg-emerald-300/[0.055] text-emerald-200'
                : 'border-amber-300/10 bg-amber-300/[0.055] text-amber-200',
            ].join(' ')}
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
              transition={{ delay: shouldReduceMotion ? 0 : 0.18 + index * 0.05, duration: 0.32 }}
              whileHover={shouldReduceMotion ? undefined : { y: -3 }}
            >
              <ServiceStatusCard {...service} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Card className={`${darkCardClass} !overflow-hidden !p-0`}>
          <div className="border-b border-white/[0.07] px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${displayName} avatar`}
                    className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.07] text-sm font-semibold text-cyan-100" aria-hidden="true">
                    {avatarInitial}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Account & workspace</p>
                  <h2 className="mt-1 truncate text-lg font-semibold tracking-tight text-white">{displayName}</h2>
                </div>
              </div>

              <span
                className={[
                  'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                  user.is_active
                    ? 'border-emerald-300/10 bg-emerald-300/[0.055] text-emerald-200'
                    : 'border-white/[0.07] bg-white/[0.035] text-slate-400',
                ].join(' ')}
              >
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <dl className="divide-y divide-white/[0.06] px-5 sm:px-6">
            <AccountRow label="Email"><span className="break-all">{user.email}</span></AccountRow>
            <AccountRow label="Role"><span className="capitalize">{user.role}</span></AccountRow>
            <AccountRow label="Timezone">{user.preferences.timezone}</AccountRow>
            <AccountRow label="Email status">
              <span
                className={[
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                  user.is_email_verified
                    ? 'bg-emerald-300/[0.055] text-emerald-200'
                    : 'bg-amber-300/[0.055] text-amber-200',
                ].join(' ')}
              >
                {user.is_email_verified ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
                {user.is_email_verified ? 'Verified' : 'Not verified'}
              </span>
            </AccountRow>
            <AccountRow label="Notifications">
              <span className="inline-flex items-center gap-1.5">
                <BellRing className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                {user.preferences.email_notifications ? 'Enabled' : 'Disabled'}
              </span>
            </AccountRow>
            <AccountRow label="Member since">{formatDateTime(user.created_at)}</AccountRow>
          </dl>

          <div className="border-t border-white/[0.07] bg-white/[0.02] px-5 py-4 sm:px-6">
            <Link to="/app/profile" className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white">
              Manage profile & preferences
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        <Card className={`${darkCardClass} relative !overflow-hidden !p-0`}>
          <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-violet-400/[0.07] blur-3xl" />
          <div className="relative border-b border-white/[0.07] px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Product roadmap</p>
                <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-white">What comes after Standard RAG</h2>
                <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">Upcoming LifeOps capabilities are shown directly from the dashboard API.</p>
              </div>
              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-300/10 bg-violet-300/[0.055] text-violet-200 sm:flex">
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
                    transition={{ delay: shouldReduceMotion ? 0 : 0.28 + index * 0.045, duration: 0.3 }}
                    className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 transition-colors hover:border-violet-300/12 hover:bg-white/[0.045]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.045] text-xs font-bold text-slate-300">
                      {module.phase}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-200">{module.name}</p>
                      <p className="mt-0.5 text-xs text-slate-600">Phase {module.phase}</p>
                    </div>
                    <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-500">
                      {module.status}
                    </span>
                  </motion.li>
                ))}
              </ol>
            ) : (
              <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-slate-500">
                  <Layers3 className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-200">No upcoming modules listed</p>
                <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-500">The dashboard API did not return any planned modules for this workspace.</p>
              </div>
            )}
          </div>
        </Card>
      </motion.section>

      <motion.footer
        variants={itemVariants}
        className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-xs text-slate-600 backdrop-blur sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-center gap-2">
          <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">Signed in as <span className="font-medium text-slate-400">{user.email}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
          Authenticated LifeOps workspace
        </div>
      </motion.footer>
    </motion.div>
  )
}

function WorkspaceCard({
  to,
  icon: Icon,
  eyebrow,
  title,
  description,
  tags,
  footer,
  accent,
  shouldReduceMotion,
}: {
  to: string
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  tags: string[]
  footer: string
  accent: 'cyan' | 'violet'
  shouldReduceMotion: boolean | null
}) {
  const isCyan = accent === 'cyan'

  return (
    <Link to={to} className="group block rounded-[24px] outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070b]">
      <motion.div
        className="h-full"
        whileHover={shouldReduceMotion ? undefined : { y: -4 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.995 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={[
            darkCardClass,
            'relative h-full !overflow-hidden !p-0 transition-colors',
            isCyan ? 'group-hover:!border-cyan-300/15' : 'group-hover:!border-violet-300/15',
          ].join(' ')}
        >
          <div
            className={[
              'pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b to-transparent',
              isCyan ? 'from-cyan-300/[0.055]' : 'from-violet-300/[0.055]',
            ].join(' ')}
          />
          <div className="relative p-5 sm:p-6">
            <div className="flex items-start justify-between gap-5">
              <div className={[
                'flex h-12 w-12 items-center justify-center rounded-2xl border',
                isCyan
                  ? 'border-cyan-300/10 bg-cyan-300/[0.055] text-cyan-200'
                  : 'border-violet-300/10 bg-violet-300/[0.055] text-violet-200',
              ].join(' ')}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035] text-slate-600 transition group-hover:border-white/15 group-hover:text-white">
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold tracking-[-0.025em] text-white">{title}</h3>
                <span className={[
                  'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
                  isCyan
                    ? 'border-cyan-300/10 bg-cyan-300/[0.055] text-cyan-200'
                    : 'border-violet-300/10 bg-violet-300/[0.055] text-violet-200',
                ].join(' ')}>
                  {eyebrow}
                </span>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">{description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {tags.map((label) => (
                  <span key={label} className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 text-xs font-medium text-slate-500">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative border-t border-white/[0.07] bg-white/[0.018] px-5 py-3.5 sm:px-6">
            <span className={['inline-flex items-center gap-2 text-xs font-semibold transition-colors', isCyan ? 'text-cyan-200/70 group-hover:text-cyan-100' : 'text-violet-200/70 group-hover:text-violet-100'].join(' ')}>
              {footer}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </div>
        </Card>
      </motion.div>
    </Link>
  )
}

function AccountRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-center">
      <dt className="text-xs font-medium text-slate-600">{label}</dt>
      <dd className="min-w-0 text-sm font-medium text-slate-300 sm:text-right">{children}</dd>
    </div>
  )
}
