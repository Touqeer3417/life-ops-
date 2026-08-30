import {
  LoaderCircle,
  Sparkles,
} from 'lucide-react'
import {
  motion,
  useReducedMotion,
} from 'motion/react'


export function LoadingScreen({
  label = 'Loading…',
}: {
  label?: string
}) {
  const shouldReduceMotion =
    useReducedMotion()

  return (
    <div
      className="relative flex min-h-[50vh] items-center justify-center overflow-hidden px-4"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-56 w-56 rounded-full bg-cyan-400/[0.07] blur-3xl"
      />

      <motion.div
        initial={
          shouldReduceMotion
            ? false
            : {
                opacity: 0,
                y: 10,
                scale: 0.98,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.45,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="relative min-w-[240px] overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#090d14]/88 px-5 py-5 shadow-[0_24px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent"
        />

        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <motion.div
              aria-hidden="true"
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      rotate: 360,
                    }
              }
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute inset-0 rounded-2xl border border-cyan-300/[0.16] border-r-violet-300/50 border-t-cyan-300/60"
            />

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.045]">
              <Sparkles
                className="h-4 w-4 text-cyan-200"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold tracking-[-0.01em] text-slate-100">
                {label}
              </p>

              <LoaderCircle
                className="h-3.5 w-3.5 animate-spin text-slate-500 motion-reduce:animate-none"
                aria-hidden="true"
              />
            </div>

            <p className="mt-1 text-xs text-slate-600">
              Preparing your LifeOps workspace
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-full bg-white/[0.05]">
          <motion.div
            aria-hidden="true"
            initial={{
              x: '-100%',
            }}
            animate={
              shouldReduceMotion
                ? {
                    x: '0%',
                  }
                : {
                    x: [
                      '-100%',
                      '220%',
                    ],
                  }
            }
            transition={{
              duration: 1.7,
              repeat:
                shouldReduceMotion
                  ? 0
                  : Infinity,
              ease: 'easeInOut',
            }}
            className="h-1 w-1/3 rounded-full bg-gradient-to-r from-cyan-300/60 via-sky-300 to-violet-300/70"
          />
        </div>
      </motion.div>
    </div>
  )
}
