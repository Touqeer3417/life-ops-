import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'

import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useAuth } from './AuthProvider'


export function ProtectedRoute() {
  const {
    isAuthenticated,
    isLoading,
  } = useAuth()

  const location =
    useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05070b] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(34,211,238,0.08),transparent_30%),radial-gradient(circle_at_76%_28%,rgba(139,92,246,0.07),transparent_25%),linear-gradient(to_bottom,#05070b,#070a10,#05070b)]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 h-[480px] opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />

        <div className="relative">
          <LoadingScreen
            label="Checking your secure session…"
          />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    )
  }

  return <Outlet />
}
