import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary } from '@/api/dashboard'
import { useAuth } from '@/auth/AuthProvider'

export function useDashboard() {
  const { getAccessToken } = useAuth()
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => getDashboardSummary(await getAccessToken()),
    staleTime: 30_000,
  })
}
