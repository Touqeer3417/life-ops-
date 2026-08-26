import type { LucideIcon } from 'lucide-react'
import { CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface StatusCardProps {
  title: string
  value: string
  icon: LucideIcon
}

export function StatusCard({ title, value, icon: Icon }: StatusCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-xl font-bold capitalize tracking-tight text-slate-950">{value}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Phase 1 check passed
      </div>
    </Card>
  )
}
