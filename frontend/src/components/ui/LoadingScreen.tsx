import { LoaderCircle } from 'lucide-react'

export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        {label}
      </div>
    </div>
  )
}
