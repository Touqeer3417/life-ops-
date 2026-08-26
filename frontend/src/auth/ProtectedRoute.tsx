import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useAuth } from './AuthProvider'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen label="Checking your secure session…" />
  }
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
