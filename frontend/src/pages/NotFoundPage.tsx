import {
  ArrowLeft,
  Home,
  Orbit,
  Sparkles,
} from 'lucide-react'
import {
  motion,
  useReducedMotion,
} from 'motion/react'
import {
  Link,
} from 'react-router-dom'


const easeOut =
  [0.22, 1, 0.36, 1] as const


export function NotFoundPage() {
  const shouldReduceMotion =
    useReducedMotion()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05070b] px-5 py-16 text-white selection:bg-cyan-300 selection:text-slate-950 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(34,211,238,0.11),transparent_28%),radial-gradient(circle_at_72%_38%,rgba(139,92,246,0.11),transparent_24%),linear-gradient(to_bottom,#05070b_0%,#070a11_55%,#05070b_100%)]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.20] [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]"
      />

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
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full border border-white/[0.04] sm:h-[540px] sm:w-[540px]"
      >
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/70 shadow-[0_0_24px_rgba(103,232,249,0.75)]" />
      </motion.div>

      <motion.main
        initial={
          shouldReduceMotion
            ? false
            : {
                opacity: 0,
                y: 22,
                scale: 0.985,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.7,
          ease: easeOut,
        }}
        className="relative z-10 w-full max-w-2xl text-center"
      >
        <motion.div
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                  scale: 0.9,
                }
          }
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 0.55,
            delay: shouldReduceMotion ? 0 : 0.08,
            ease: easeOut,
          }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-cyan-300/[0.14] bg-gradient-to-br from-cyan-300/[0.10] via-white/[0.045] to-violet-400/[0.10] shadow-[0_0_60px_rgba(34,211,238,0.08)] backdrop-blur-xl"
        >
          <Orbit
            className="h-7 w-7 text-cyan-200"
            aria-hidden="true"
          />
        </motion.div>

        <motion.div
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 10,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            delay: shouldReduceMotion ? 0 : 0.14,
            ease: easeOut,
          }}
          className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-slate-400 backdrop-blur-xl"
        >
          <Sparkles
            className="h-3.5 w-3.5 text-violet-300"
            aria-hidden="true"
          />
          LifeOps navigation
        </motion.div>

        <motion.p
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 12,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.55,
            delay: shouldReduceMotion ? 0 : 0.18,
            ease: easeOut,
          }}
          className="mt-7 bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-7xl font-semibold leading-none tracking-[-0.07em] text-transparent sm:text-8xl"
        >
          404
        </motion.p>

        <motion.h1
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 14,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.58,
            delay: shouldReduceMotion ? 0 : 0.23,
            ease: easeOut,
          }}
          className="mt-5 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-5xl"
        >
          This page drifted
          <span className="block text-slate-400">
            outside your workspace.
          </span>
        </motion.h1>

        <motion.p
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 14,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.58,
            delay: shouldReduceMotion ? 0 : 0.28,
            ease: easeOut,
          }}
          className="mx-auto mt-5 max-w-lg text-sm leading-7 text-slate-500 sm:text-base"
        >
          The LifeOps page you requested does not exist,
          may have moved, or the address may be incorrect.
          Return to the main workspace and continue from there.
        </motion.p>

        <motion.div
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 14,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.58,
            delay: shouldReduceMotion ? 0 : 0.34,
            ease: easeOut,
          }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            to="/"
            className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 shadow-[0_16px_48px_-22px_rgba(255,255,255,0.32)] outline-none transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070b] sm:w-auto"
          >
            <Home
              className="h-4 w-4"
              aria-hidden="true"
            />
            Return to LifeOps AI
          </Link>

          <button
            type="button"
            onClick={() =>
              window.history.back()
            }
            className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-5 text-sm font-semibold text-slate-300 outline-none backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.065] hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/75 sm:w-auto"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            Go back
          </button>
        </motion.div>
      </motion.main>
    </div>
  )
}
