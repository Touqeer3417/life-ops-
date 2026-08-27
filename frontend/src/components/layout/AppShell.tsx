import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Settings2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import {
  NavLink,
  Outlet,
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
    to: '/app/profile',
    label: 'Profile & preferences',
    icon: Settings2,
    end: false,
  },
]


export function AppShell() {
  const {
    logout,
    identity,
  } = useAuth()

  const currentUser =
    useCurrentUser()

  const displayName =
    currentUser.data?.full_name ??
    identity?.name ??
    'LifeOps user'

  const email =
    currentUser.data?.email ??
    identity?.email ??
    ''

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Sparkles
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="font-bold tracking-tight">
                LifeOps AI
              </p>

              <p className="text-xs text-slate-500">
                Phase 2 · Standard RAG
              </p>
            </div>
          </div>

          <nav className="mt-7 space-y-1">
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
                  className={({
                    isActive,
                  }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-slate-950 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                    )
                  }
                >
                  <Icon
                    className="h-4 w-4"
                    aria-hidden="true"
                  />

                  {label}
                </NavLink>
              ),
            )}
          </nav>

       
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 lg:hidden">
                <Sparkles
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  {displayName}
                </p>

                <p className="hidden text-xs text-slate-500 sm:block">
                  {email}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() =>
                void logout()
              }
            >
              <LogOut
                className="mr-2 h-4 w-4"
                aria-hidden="true"
              />
              Sign out
            </Button>
          </header>

          <div className="border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
            <nav className="flex gap-2 overflow-x-auto">
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
                    className={({
                      isActive,
                    }) =>
                      cn(
                        'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium',
                        isActive
                          ? 'bg-slate-950 text-white'
                          : 'text-slate-600',
                      )
                    }
                  >
                    <Icon
                      className="h-4 w-4"
                      aria-hidden="true"
                    />

                    {label}
                  </NavLink>
                ),
              )}
            </nav>
          </div>

          <main className="p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}