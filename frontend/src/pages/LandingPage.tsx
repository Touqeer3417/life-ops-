import { ArrowRight, CalendarDays, FileSearch, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

const capabilities = [
  { icon: CalendarDays, label: 'Calendar intelligence' },
  { icon: Mail, label: 'Email intelligence' },
  { icon: FileSearch, label: 'Personal document RAG' },
]

export function LandingPage() {
  const { isAuthenticated, isLoading, login, signup } = useAuth()

  if (isLoading) return <LoadingScreen label="Loading LifeOps AI…" />
  if (isAuthenticated) return <Navigate to="/app" replace />

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_60%)]" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-950">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-bold tracking-tight">LifeOps AI</p>
            <p className="text-xs text-slate-400">Personal life admin agent</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => void login()}>
          Sign in
        </Button>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-20 lg:px-8 lg:pt-28">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Secure Phase 1 foundation
          </div>
          <h1 className="mt-7 max-w-4xl text-5xl font-bold tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
            One intelligent control layer for your digital life.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
            LifeOps AI is being built to combine your schedule, important email, personal tasks, documents, and safe AI actions in one place.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button className="bg-black text-slate-950 hover:bg-slate-100" onClick={() => void signup()}>
              Create account
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>

            <Button
              onClick={() => void login()}
              className="
            rounded-xl
    border border-white/15
    bg-white/10
    px-5 py-2.5
    font-medium text-white
    shadow-sm
    backdrop-blur-md
    transition-all duration-300
    hover:bg-white/20
    hover:border-white/30
    hover:shadow-lg
    hover:-translate-y-0.5
    active:translate-y-0
        "
            >
              Sign in
            </Button>




          </div>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          {capabilities.map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <Icon className="h-5 w-5 text-sky-300" aria-hidden="true" />
              <p className="mt-5 font-semibold">{label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Planned in the SRS for later phases after the secure foundation is complete.
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
