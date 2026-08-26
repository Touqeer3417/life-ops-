import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center">
      <div>
        <p className="text-sm font-semibold text-sky-700">404</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Page not found</h1>
        <p className="mt-3 text-slate-600">The page you requested does not exist.</p>
        <Link className="mt-6 inline-block font-semibold text-slate-950 underline" to="/">
          Return to LifeOps AI
        </Link>
      </div>
    </div>
  )
}
