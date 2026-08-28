import {
  ArrowRight,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileSearch,
  FileText,
  Fingerprint,
  Inbox,
  LockKeyhole,
  Mail,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react'
import {
  motion,
  useReducedMotion,
  type Variants,
} from 'motion/react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '@/auth/AuthProvider'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

const easeOut = [0.22, 1, 0.36, 1] as const

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: easeOut,
    },
  },
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
}

const liveFeatures = [
  {
    icon: FileSearch,
    eyebrow: 'Knowledge base',
    title: 'Turn your documents into usable memory.',
    description:
      'Upload PDF, DOCX, TXT, and Markdown files, index them, search them, and give LifeOps a grounded knowledge layer to work from.',
    accent: 'from-sky-400/20 via-cyan-400/10 to-transparent',
  },
  {
    icon: MessageSquareText,
    eyebrow: 'Grounded AI',
    title: 'Ask questions. Get answers with sources.',
    description:
      'LifeOps retrieves relevant context from your knowledge base before answering, so responses stay connected to your own information.',
    accent: 'from-violet-400/20 via-fuchsia-400/10 to-transparent',
  },
]

const roadmapFeatures = [
  {
    icon: CalendarDays,
    title: 'Calendar intelligence',
    description:
      'Bring upcoming commitments, deadlines, and scheduling context into the same personal command center.',
  },
  {
    icon: Mail,
    title: 'Email intelligence',
    description:
      'Surface high-signal messages, follow-ups, and important life admin without living inside your inbox.',
  },
  {
    icon: Workflow,
    title: 'Safe AI actions',
    description:
      'Progress from answering questions to controlled, permission-aware actions with clear user approval.',
  },
]

const trustItems = [
  'Auth0 authentication',
  'Protected app routes',
  'PostgreSQL-backed accounts',
  'Source-cited RAG answers',
]

function SectionGlow({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
    />
  )
}

export function LandingPage() {
  const { isAuthenticated, isLoading, login, signup } = useAuth()
  const shouldReduceMotion = useReducedMotion()

  if (isLoading) {
    return <LoadingScreen label="Loading LifeOps AI…" />
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  const revealInitial = shouldReduceMotion ? false : 'hidden'

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05070b] text-white selection:bg-cyan-300 selection:text-slate-950">
      <div className="relative isolate">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_-10%,rgba(56,189,248,0.14),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(139,92,246,0.12),transparent_28%),linear-gradient(to_bottom,#05070b_0%,#070a11_55%,#05070b_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[740px] opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />

        <header className="relative z-50 border-b border-white/[0.06] bg-[#05070b]/70 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
            <a
              href="#top"
              className="group inline-flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070b]"
              aria-label="LifeOps AI home"
            >
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] shadow-[0_0_40px_rgba(34,211,238,0.08)]">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/20 via-blue-400/10 to-violet-400/20" />
                <Sparkles className="relative h-5 w-5 text-cyan-200" aria-hidden="true" />
              </div>
              <div className="leading-none">
                <p className="text-sm font-semibold tracking-[-0.01em] text-white">LifeOps AI</p>
                <p className="mt-1 text-[11px] text-slate-500">Personal life admin agent</p>
              </div>
            </a>

            <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex" aria-label="Primary navigation">
              <a className="transition hover:text-white" href="#product">Product</a>
              <a className="transition hover:text-white" href="#capabilities">Capabilities</a>
              <a className="transition hover:text-white" href="#security">Security</a>
              <a className="transition hover:text-white" href="#roadmap">Roadmap</a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => void login()}
                className="hidden min-h-10 rounded-xl px-4 text-sm font-medium text-slate-300 outline-none transition hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/80 sm:inline-flex sm:items-center sm:justify-center"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => void signup()}
                className="group inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 shadow-[0_10px_35px_rgba(255,255,255,0.12)] outline-none transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070b] active:translate-y-0"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <main id="top">
          <section className="relative mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pb-32 lg:pt-28">
            <SectionGlow className="left-[-12rem] top-28 h-80 w-80 bg-cyan-400/10" />
            <SectionGlow className="right-[-10rem] top-40 h-96 w-96 bg-violet-500/10" />

            <div className="grid items-center gap-14 lg:grid-cols-[0.94fr_1.06fr] lg:gap-10 xl:gap-16">
              <motion.div
                variants={containerVariants}
                initial={revealInitial}
                animate="visible"
                className="relative z-10 max-w-3xl"
              >
                <motion.div variants={revealVariants}>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-xs font-medium text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40 motion-reduce:animate-none" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    </span>
                    Your personal AI operating layer
                  </div>
                </motion.div>

                <motion.h1
                  variants={revealVariants}
                  className="mt-7 text-[clamp(3rem,7vw,5.7rem)] font-semibold leading-[0.96] tracking-[-0.065em] text-white"
                >
                  Run your life with
                  <span className="block bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">
                    less admin.
                  </span>
                </motion.h1>

                <motion.p
                  variants={revealVariants}
                  className="mt-7 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg"
                >
                  LifeOps AI turns your personal documents and everyday information into one intelligent workspace—so you can find what matters, ask grounded questions, and move toward safe AI-assisted actions.
                </motion.p>

                <motion.div
                  variants={revealVariants}
                  className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <button
                    type="button"
                    onClick={() => void signup()}
                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 shadow-[0_18px_55px_rgba(255,255,255,0.12)] outline-none transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070b] active:translate-y-0"
                  >
                    Create your workspace
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </button>

                  <a
                    href="#product"
                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-5 text-sm font-semibold text-slate-200 outline-none transition duration-300 hover:border-white/20 hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-cyan-300/80"
                  >
                    See the product
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </a>
                </motion.div>

                <motion.div variants={revealVariants} className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs text-slate-500">
                  {['Secure sign-in', 'Private workspace', 'Grounded answers'].map((item) => (
                    <div key={item} className="inline-flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                      {item}
                    </div>
                  ))}
                </motion.div>
              </motion.div>

              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.18, ease: easeOut }}
                className="relative mx-auto w-full max-w-[680px] lg:mx-0"
              >
                <motion.div
                  aria-hidden="true"
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : { y: [-8, 8, -8], rotate: [-1.5, 1.5, -1.5] }
                  }
                  transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -left-4 top-24 z-20 hidden rounded-2xl border border-white/10 bg-[#0d1118]/90 p-3 shadow-2xl backdrop-blur-xl sm:block"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Knowledge status</p>
                      <p className="mt-0.5 text-xs font-medium text-white">12 files indexed</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  aria-hidden="true"
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : { y: [8, -8, 8], x: [0, 5, 0] }
                  }
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                  className="absolute -right-2 bottom-20 z-20 hidden rounded-2xl border border-violet-300/15 bg-[#0d1118]/90 p-3 shadow-2xl backdrop-blur-xl sm:block"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Answer quality</p>
                      <p className="mt-0.5 text-xs font-medium text-white">Grounded + cited</p>
                    </div>
                  </div>
                </motion.div>

                <div className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-cyan-400/10 via-transparent to-violet-500/10 blur-2xl" />

                <div className="overflow-hidden rounded-[1.65rem] border border-white/10 bg-[#0a0d13]/90 p-2 shadow-[0_35px_120px_-35px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
                  <div className="rounded-[1.25rem] border border-white/[0.07] bg-[#0b0f16]">
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex gap-1.5" aria-hidden="true">
                          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                        </div>
                        <span className="ml-1 text-[11px] text-slate-500">app.lifeops.ai</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        Operational
                      </div>
                    </div>

                    <div className="grid min-h-[480px] grid-cols-[58px_minmax(0,1fr)] sm:grid-cols-[170px_minmax(0,1fr)]">
                      <aside className="border-r border-white/[0.06] bg-white/[0.015] p-3 sm:p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-950">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div className="hidden sm:block">
                            <p className="text-xs font-semibold">LifeOps</p>
                            <p className="mt-0.5 text-[9px] text-slate-600">Workspace</p>
                          </div>
                        </div>

                        <div className="mt-7 space-y-2">
                          {[
                            { icon: Zap, label: 'Overview', active: true },
                            { icon: FileText, label: 'Documents' },
                            { icon: Bot, label: 'Ask LifeOps' },
                          ].map(({ icon: Icon, label, active }) => (
                            <div
                              key={label}
                              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[10px] ${
                                active
                                  ? 'bg-white/[0.07] text-white'
                                  : 'text-slate-500'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              <span className="hidden sm:block">{label}</span>
                            </div>
                          ))}
                        </div>
                      </aside>

                      <div className="min-w-0 p-4 sm:p-5 lg:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">Command center</p>
                            <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white sm:text-xl">Good morning, Touqeer.</h2>
                            <p className="mt-1.5 max-w-sm text-[10px] leading-5 text-slate-500 sm:text-[11px]">
                              Your personal knowledge workspace is ready.
                            </p>
                          </div>
                          <div className="hidden rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[9px] text-slate-500 sm:block">
                            <Clock3 className="mr-1.5 inline h-3 w-3" /> Today
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-cyan-300/10 bg-gradient-to-br from-cyan-300/[0.07] to-transparent p-3.5">
                            <div className="flex items-center justify-between">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
                                <FileSearch className="h-4 w-4" />
                              </div>
                              <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[8px] font-medium text-emerald-300">Ready</span>
                            </div>
                            <p className="mt-4 text-xs font-semibold text-white">Knowledge base</p>
                            <p className="mt-1 text-[9px] leading-4 text-slate-500">Your documents are searchable and indexed.</p>
                          </div>

                          <div className="rounded-xl border border-violet-300/10 bg-gradient-to-br from-violet-300/[0.07] to-transparent p-3.5">
                            <div className="flex items-center justify-between">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-300/10 text-violet-200">
                                <MessageSquareText className="h-4 w-4" />
                              </div>
                              <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                            </div>
                            <p className="mt-4 text-xs font-semibold text-white">Ask LifeOps</p>
                            <p className="mt-1 text-[9px] leading-4 text-slate-500">Grounded answers with source citations.</p>
                          </div>
                        </div>

                        <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                          <div className="flex items-center gap-2 text-[9px] font-medium text-slate-500">
                            <Search className="h-3.5 w-3.5" />
                            Ask anything about your personal knowledge…
                          </div>
                          <div className="mt-4 rounded-lg border border-white/[0.06] bg-[#080b10] p-3">
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-300/10 text-violet-200">
                                <Bot className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] leading-4 text-slate-300">
                                  Your renewal date is <span className="font-medium text-white">September 18</span>. I found it in your subscription document.
                                </p>
                                <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-1 text-[8px] text-slate-500">
                                  <FileText className="h-2.5 w-2.5" />
                                  subscription-notes.pdf · source
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {[
                            ['12', 'Files'],
                            ['100%', 'Private'],
                            ['Cited', 'Answers'],
                          ].map(([value, label]) => (
                            <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-2.5 text-center">
                              <p className="text-[10px] font-semibold text-white">{value}</p>
                              <p className="mt-0.5 text-[8px] text-slate-600">{label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={revealInitial}
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={revealVariants}
              className="mt-20 border-y border-white/[0.06] py-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">Built on a serious foundation</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs font-medium text-slate-400 sm:grid-cols-4">
                  {['React + TypeScript', 'FastAPI', 'PostgreSQL', 'Auth0'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          <section id="product" className="relative border-y border-white/[0.06] bg-white/[0.018] py-24 sm:py-28">
            <SectionGlow className="left-1/2 top-20 h-72 w-72 -translate-x-1/2 bg-blue-500/10" />
            <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
              <motion.div
                variants={revealVariants}
                initial={revealInitial}
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                className="mx-auto max-w-3xl text-center"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Available now</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">
                  A personal knowledge layer that actually knows your context.
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                  LifeOps starts with the highest-leverage foundation: your own information. Upload it, retrieve it, and ask questions without relying on generic model memory.
                </p>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial={revealInitial}
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                className="mt-14 grid gap-5 lg:grid-cols-2"
              >
                {liveFeatures.map(({ icon: Icon, eyebrow, title, description, accent }) => (
                  <motion.article
                    key={title}
                    variants={revealVariants}
                    whileHover={shouldReduceMotion ? undefined : { y: -5 }}
                    transition={{ duration: 0.25 }}
                    className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0a0e15] p-6 shadow-[0_24px_70px_-35px_rgba(0,0,0,0.9)] sm:p-8"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-70 transition-opacity duration-500 group-hover:opacity-100`} />
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.09] bg-white/[0.05] text-cyan-200 shadow-inner">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{eyebrow}</p>
                      <h3 className="mt-3 max-w-md text-2xl font-semibold tracking-[-0.035em] text-white">{title}</h3>
                      <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">{description}</p>
                      <div className="mt-7 inline-flex items-center gap-2 text-xs font-medium text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Live in the current product
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            </div>
          </section>

          <section id="capabilities" className="relative py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
              <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
                <motion.div
                  variants={revealVariants}
                  initial={revealInitial}
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  className="lg:sticky lg:top-28"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
                    <Zap className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                    Designed for daily leverage
                  </div>
                  <h2 className="mt-5 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">
                    From scattered information to one calm command center.
                  </h2>
                  <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                    The product architecture is moving toward a single interface for personal knowledge, communication, scheduling, and permission-aware automation.
                  </p>
                </motion.div>

                <motion.div
                  variants={containerVariants}
                  initial={revealInitial}
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.15 }}
                  className="space-y-4"
                >
                  {[
                    {
                      icon: Inbox,
                      number: '01',
                      title: 'Capture what matters',
                      description: 'Bring important documents and personal information into a workspace LifeOps can retrieve from.',
                    },
                    {
                      icon: Search,
                      number: '02',
                      title: 'Find context instantly',
                      description: 'Use semantic retrieval to locate relevant knowledge even when you do not remember the exact filename or wording.',
                    },
                    {
                      icon: Bot,
                      number: '03',
                      title: 'Ask with confidence',
                      description: 'Get answers generated from retrieved context, paired with citations so you can inspect where the answer came from.',
                    },
                    {
                      icon: Workflow,
                      number: '04',
                      title: 'Evolve into safe action',
                      description: 'The roadmap extends this foundation into calendars, email, reminders, and controlled AI actions that remain user-approved.',
                    },
                  ].map(({ icon: Icon, number, title, description }) => (
                    <motion.article
                      key={number}
                      variants={revealVariants}
                      className="group grid gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] sm:grid-cols-[48px_1fr_auto] sm:items-center sm:p-6"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0c1119] text-slate-300">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-semibold tracking-[0.16em] text-slate-600">{number}</span>
                          <h3 className="text-base font-semibold text-white">{title}</h3>
                        </div>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
                      </div>
                      <ChevronRight className="hidden h-4 w-4 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-slate-500 sm:block" aria-hidden="true" />
                    </motion.article>
                  ))}
                </motion.div>
              </div>
            </div>
          </section>

          <section id="security" className="relative border-y border-white/[0.06] bg-[#070a10] py-24 sm:py-28">
            <SectionGlow className="right-[-6rem] top-10 h-80 w-80 bg-emerald-400/[0.07]" />
            <div className="relative mx-auto grid max-w-7xl gap-14 px-5 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:px-8">
              <motion.div
                variants={revealVariants}
                initial={revealInitial}
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] text-emerald-300">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Trust by design</p>
                <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">
                  Your life admin deserves more than a clever chatbot.
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                  LifeOps is built as an authenticated application with protected routes, persisted user accounts, and retrieval-grounded responses—not a public prompt box wrapped in a landing page.
                </p>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial={revealInitial}
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="grid gap-3 sm:grid-cols-2"
              >
                {[
                  { icon: Fingerprint, title: 'Auth0 identity', copy: 'Secure sign-in and signup flows already wired into the application.' },
                  { icon: LockKeyhole, title: 'Protected workspace', copy: 'Authenticated routes keep the private app experience behind access control.' },
                  { icon: FileText, title: 'Grounded context', copy: 'RAG answers are generated from retrieved personal document context.' },
                  { icon: ShieldCheck, title: 'Inspectable answers', copy: 'Source citations make important responses easier to verify.' },
                ].map(({ icon: Icon, title, copy }) => (
                  <motion.div key={title} variants={revealVariants} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                    <Icon className="h-5 w-5 text-slate-300" aria-hidden="true" />
                    <h3 className="mt-5 text-sm font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{copy}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          <section id="roadmap" className="relative py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
              <motion.div
                variants={revealVariants}
                initial={revealInitial}
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
              >
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Where LifeOps is going</p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">
                    Knowledge today. A true personal operations agent tomorrow.
                  </h2>
                </div>
                <p className="max-w-lg text-sm leading-7 text-slate-500">
                  The current product establishes the secure account + RAG foundation. The roadmap layers in the systems that create real daily leverage.
                </p>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial={revealInitial}
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                className="mt-12 grid gap-4 lg:grid-cols-3"
              >
                {roadmapFeatures.map(({ icon: Icon, title, description }, index) => (
                  <motion.article
                    key={title}
                    variants={revealVariants}
                    className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-300/10 bg-violet-300/[0.06] text-violet-200">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">Roadmap 0{index + 1}</span>
                    </div>
                    <h3 className="mt-7 text-lg font-semibold tracking-[-0.02em] text-white">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
                  </motion.article>
                ))}
              </motion.div>
            </div>
          </section>

          <section className="relative px-5 pb-24 sm:px-6 sm:pb-28 lg:px-8">
            <motion.div
              initial={revealInitial}
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={revealVariants}
              className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] px-6 py-14 text-center shadow-[0_35px_100px_-40px_rgba(34,211,238,0.18)] sm:px-10 sm:py-16 lg:px-16 lg:py-20"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.14),transparent_38%)]" />
              <div className="relative mx-auto max-w-3xl">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-cyan-200">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="mt-6 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-5xl">
                  Stop searching through your life. Start asking it.
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                  Create your LifeOps workspace and turn your personal information into something organized, searchable, and genuinely useful.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void signup()}
                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 outline-none transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0d13] active:translate-y-0"
                  >
                    Get started free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void login()}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white outline-none transition hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-cyan-300/80"
                  >
                    Sign in to LifeOps
                  </button>
                </div>
              </div>
            </motion.div>
          </section>
        </main>

        <footer className="border-t border-white/[0.06] bg-[#040609]">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-cyan-200">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">LifeOps AI</p>
                  <p className="mt-0.5 text-[11px] text-slate-600">Personal Life Admin Agent</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500">
                <a className="transition hover:text-slate-300" href="#product">Product</a>
                <a className="transition hover:text-slate-300" href="#capabilities">Capabilities</a>
                <a className="transition hover:text-slate-300" href="#security">Security</a>
                <a className="transition hover:text-slate-300" href="#roadmap">Roadmap</a>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-white/[0.05] pt-6 text-[11px] text-slate-700 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} LifeOps AI. Built for calmer digital life administration.</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {trustItems.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
