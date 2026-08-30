import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Settings2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import {
  motion,
  useReducedMotion,
} from 'motion/react'
import {
  NavLink,
  Outlet,
  useLocation,
} from 'react-router-dom'

import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { cn } from '@/utils/cn'


const navItems = [
  {
    to: '/app',
    label: 'Dashboard',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/app/documents',
    label: 'Documents',
    icon: BookOpen,
    end: false,
  },
  {
    to: '/app/chat',
    label: 'RAG Chat',
    icon: MessageSquareText,
    end: false,
  },
  {
    to: '/app/calendar',
    label: 'Calendar',
    icon: CalendarDays,
    end: false,
  },
  {
    to: '/app/integrations',
    label: 'Integrations',
    icon: ShieldCheck,
    end: false,
  },
  {
    to: '/app/profile',
    label: 'Profile & preferences',
    icon: Settings2,
    end: false,
  },
]


const easeOut = [0.22, 1, 0.36, 1] as const


export function AppShell() {
  const {
    logout,
    identity,
  } = useAuth()

  const currentUser =
    useCurrentUser()

  const location =
    useLocation()

  const shouldReduceMotion =
    useReducedMotion()

  const displayName =
    currentUser.data?.full_name ??
    identity?.name ??
    'LifeOps user'

  const email =
    currentUser.data?.email ??
    identity?.email ??
    ''

  const avatarInitial =
    displayName
      .trim()
      .charAt(0)
      .toUpperCase() || 'L'

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05070b] text-white selection:bg-cyan-300 selection:text-slate-950">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_5%,rgba(34,211,238,0.08),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(139,92,246,0.10),transparent_30%),linear-gradient(to_bottom,#05070b_0%,#070a10_50%,#05070b_100%)]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[520px] opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1680px]">
        <motion.aside
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                  x: -18,
                }
          }
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.55,
            ease: easeOut,
          }}
          className="sticky top-0 hidden h-screen w-[286px] shrink-0 border-r border-white/[0.07] bg-[#070a10]/78 p-4 backdrop-blur-2xl lg:flex lg:flex-col"
        >
          <div className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.9)]">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl"
            />

            <div className="relative flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_0_34px_rgba(34,211,238,0.08)]">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/20 via-blue-400/10 to-violet-400/20" />
                <Sparkles
                  className="relative h-5 w-5 text-cyan-200"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-[-0.015em] text-white">
                  LifeOps AI
                </p>

                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-30 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  </span>
                  Personal life admin
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 px-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Workspace
            </p>
          </div>

          <nav className="mt-3 space-y-1" aria-label="Application navigation">
            {navItems.map(
              ({
                to,
                label,
                icon: Icon,
                end,
              }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-cyan-300/70',
                      isActive
                        ? 'text-white'
                        : 'text-slate-500 hover:bg-white/[0.045] hover:text-slate-200',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? (
                        <motion.span
                          layoutId={
                            shouldReduceMotion
                              ? undefined
                              : 'desktop-active-navigation'
                          }
                          className="absolute inset-0 rounded-xl border border-cyan-300/[0.12] bg-gradient-to-r from-cyan-300/[0.10] via-white/[0.055] to-violet-400/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                          transition={{
                            duration: 0.28,
                            ease: easeOut,
                          }}
                        />
                      ) : null}

                      <span
                        className={cn(
                          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition duration-200',
                          isActive
                            ? 'border-cyan-300/[0.14] bg-cyan-300/[0.08] text-cyan-200'
                            : 'border-transparent bg-white/[0.025] text-slate-500 group-hover:bg-white/[0.05] group-hover:text-slate-300',
                        )}
                      >
                        <Icon
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </span>

                      <span className="relative z-10 truncate">
                        {label}
                      </span>

                      {isActive ? (
                        <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.65)]" />
                      ) : null}
                    </>
                  )}
                </NavLink>
              ),
            )}
          </nav>

          <div className="mt-auto pt-5">
            <div className="overflow-hidden rounded-[20px] border border-white/[0.07] bg-white/[0.03] p-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.055] text-sm font-semibold text-slate-200">
                  {avatarInitial}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">
                    {displayName}
                  </p>

                  <p className="mt-0.5 truncate text-[11px] text-slate-600">
                    {email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void logout()
                }
                className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-xs font-semibold text-slate-400 outline-none transition hover:border-white/[0.12] hover:bg-white/[0.055] hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/70"
              >
                <LogOut
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
                Sign out
              </button>
            </div>
          </div>
        </motion.aside>

        <div className="min-w-0 flex-1">
          <motion.header
            initial={
              shouldReduceMotion
                ? false
                : {
                    opacity: 0,
                    y: -12,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
              ease: easeOut,
            }}
            className="sticky top-0 z-40 border-b border-white/[0.065] bg-[#05070b]/82 backdrop-blur-2xl"
          >
            <div className="flex min-h-[70px] items-center justify-between gap-4 px-4 sm:px-5 md:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.05] lg:hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/15 to-violet-400/15" />
                  <Sparkles
                    className="relative h-4 w-4 text-cyan-200"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold tracking-[-0.01em] text-slate-100">
                      {displayName}
                    </p>

                    <span className="hidden rounded-full border border-emerald-300/[0.12] bg-emerald-300/[0.06] px-2 py-0.5 text-[10px] font-semibold text-emerald-300 sm:inline-flex">
                      Active
                    </span>
                  </div>

                  <p className="mt-0.5 hidden truncate text-xs text-slate-600 sm:block">
                    {email}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  void logout()
                }
                className="min-h-10 border border-white/[0.07] bg-white/[0.025] px-3.5 text-slate-400 hover:bg-white/[0.06] hover:text-white focus:ring-cyan-300/70 focus:ring-offset-0"
              >
                <LogOut
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                />

                <span className="hidden sm:inline">
                  Sign out
                </span>
              </Button>
            </div>
          </motion.header>

          <div className="sticky top-[70px] z-30 border-b border-white/[0.06] bg-[#05070b]/90 px-3 py-2.5 backdrop-blur-2xl lg:hidden">
            <nav
              className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Mobile application navigation"
            >
              {navItems.map(
                ({
                  to,
                  label,
                  icon: Icon,
                  end,
                }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'relative inline-flex min-h-10 shrink-0 items-center gap-2 overflow-hidden rounded-xl border px-3 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300/70',
                        isActive
                          ? 'border-cyan-300/[0.14] text-cyan-100'
                          : 'border-white/[0.055] bg-white/[0.025] text-slate-500 hover:border-white/[0.10] hover:bg-white/[0.05] hover:text-slate-300',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive ? (
                          <motion.span
                            layoutId={
                              shouldReduceMotion
                                ? undefined
                                : 'mobile-active-navigation'
                            }
                            className="absolute inset-0 bg-gradient-to-r from-cyan-300/[0.09] to-violet-400/[0.07]"
                            transition={{
                              duration: 0.26,
                              ease: easeOut,
                            }}
                          />
                        ) : null}

                        <Icon
                          className="relative z-10 h-3.5 w-3.5"
                          aria-hidden="true"
                        />

                        <span className="relative z-10">
                          {label}
                        </span>
                      </>
                    )}
                  </NavLink>
                ),
              )}
            </nav>
          </div>

          <main className="relative px-3 py-5 sm:px-5 sm:py-6 md:px-8 md:py-8">
            <motion.div
              key={location.pathname}
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
                duration: 0.34,
                ease: easeOut,
              }}
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  )
}
