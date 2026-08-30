import type {
  LucideIcon,
} from 'lucide-react'
import {
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import {
  motion,
  useReducedMotion,
} from 'motion/react'

import { Card } from '@/components/ui/Card'


interface StatusCardProps {
  title: string
  value: string
  icon: LucideIcon
}


export function StatusCard({
  title,
  value,
  icon: Icon,
}: StatusCardProps) {
  const shouldReduceMotion =
    useReducedMotion()

  return (
    <motion.div
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -4,
            }
      }
      whileTap={
        shouldReduceMotion
          ? undefined
          : {
              scale: 0.995,
            }
      }
      transition={{
        duration: 0.2,
      }}
      className="h-full"
    >
      <Card className="group h-full overflow-hidden border-white/[0.075] bg-[#0a0d13]/88 p-0 shadow-[0_22px_65px_-44px_rgba(0,0,0,0.95)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/30 to-transparent opacity-60"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-emerald-400/[0.07] blur-3xl transition duration-500 group-hover:bg-cyan-400/[0.09]"
        />

        <div className="relative p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                  {title}
                </p>

                <Sparkles
                  className="h-3 w-3 text-slate-700 transition group-hover:text-cyan-300/70"
                  aria-hidden="true"
                />
              </div>

              <p className="mt-3 truncate text-xl font-semibold capitalize tracking-[-0.025em] text-white">
                {value}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/[0.12] bg-emerald-300/[0.07] text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-300 group-hover:border-cyan-300/[0.15] group-hover:bg-cyan-300/[0.08] group-hover:text-cyan-200">
              <Icon
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-25 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              </span>

              Phase 1 check passed
            </div>

            <CheckCircle2
              className="h-4 w-4 text-emerald-300/70"
              aria-hidden="true"
            />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
