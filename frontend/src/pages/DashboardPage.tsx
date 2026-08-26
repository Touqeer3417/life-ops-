import { Database, KeyRound, Server, UserRound } from 'lucide-react'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Card } from '@/components/ui/Card'
import { StatusCard } from '@/components/dashboard/StatusCard'
import { useDashboard } from '@/hooks/useDashboard'
import { formatDateTime } from '@/utils/date'

export function DashboardPage() {
  const dashboard = useDashboard()

  if (dashboard.isLoading) return <LoadingScreen label="Loading your dashboard…" />
  if (dashboard.isError) {
    return <ErrorState message={dashboard.error.message} onRetry={() => void dashboard.refetch()} />
  }
  if (!dashboard.data) return null

  const { user, foundation, upcoming_modules: upcomingModules, generated_at: generatedAt } = dashboard.data

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section>
        <p className="text-sm font-semibold text-sky-700">Foundation dashboard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Welcome{user.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}.
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Your Phase 1 account, API, authentication, and database foundation are connected. Later AI modules remain intentionally outside this build.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatusCard title="FastAPI" value={foundation.api} icon={Server} />
        <StatusCard title="PostgreSQL" value={foundation.database} icon={Database} />
        <StatusCard title="Authentication" value={foundation.authentication} icon={KeyRound} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold">Your LifeOps account</h2>
              <p className="text-sm text-slate-500">Persisted in PostgreSQL</p>
            </div>
          </div>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <dt className="text-slate-500">Timezone</dt>
              <dd className="font-medium text-slate-900">{user.preferences.timezone}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Account created</dt>
              <dd className="font-medium text-slate-900">{formatDateTime(user.created_at)}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="font-bold">Next SRS phases</h2>
          <p className="mt-1 text-sm text-slate-500">Not implemented in this Phase 1 archive.</p>
          <div className="mt-5 space-y-3">
            {upcomingModules.map((module) => (
              <div key={module.name} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{module.name}</p>
                  <p className="text-xs text-slate-500">Phase {module.phase}</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                  Planned
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <p className="text-xs text-slate-400">Dashboard generated {formatDateTime(generatedAt)}</p>
    </div>
  )
}
