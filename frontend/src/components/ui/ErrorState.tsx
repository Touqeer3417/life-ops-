import {
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import {
  motion,
  useReducedMotion,
} from 'motion/react'

import { Button } from './Button'


interface ErrorStateProps {
  message: string
  onRetry?: () => void
}


export function ErrorState({
  message,
  onRetry,
}: ErrorStateProps) {
  const shouldReduceMotion =
    useReducedMotion()

  return (
    <motion.div
      role="alert"
      initial={
        shouldReduceMotion
          ? false
          : {
              opacity: 0,
              y: 8,
              scale: 0.99,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.36,
        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
      }}
      className="relative overflow-hidden rounded-[22px] border border-rose-300/[0.14] bg-[#100a0d]/92 p-5 text-rose-100 shadow-[0_20px_60px_-38px_rgba(244,63,94,0.35)] backdrop-blur-xl"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-rose-500/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/35 to-transparent"
      />

      <div className="relative flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-300/[0.14] bg-rose-400/[0.08] text-rose-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <AlertTriangle
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold tracking-[-0.01em] text-rose-100">
              Something went wrong
            </p>

            <span className="rounded-full border border-rose-300/[0.12] bg-rose-300/[0.055] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-300/80">
              Error
            </span>
          </div>

          <p className="mt-2 break-words text-sm leading-6 text-rose-200/70">
            {message}
          </p>

          {onRetry ? (
            <Button
              type="button"
              className="mt-4 border border-rose-300/[0.14] bg-rose-300/[0.08] text-rose-100 shadow-none hover:bg-rose-300/[0.13] focus:ring-rose-300/60 focus:ring-offset-0"
              variant="secondary"
              onClick={onRetry}
            >
              <RefreshCw
                className="mr-2 h-4 w-4"
                aria-hidden="true"
              />
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}
