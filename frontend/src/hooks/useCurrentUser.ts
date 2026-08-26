import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from '@/api/users'
import { useAuth } from '@/auth/AuthProvider'

export function useCurrentUser() {
  const { isAuthenticated, getAccessToken } = useAuth()
  return useQuery({
    queryKey: ['current-user'],
    enabled: isAuthenticated,
    queryFn: async () => getCurrentUser(await getAccessToken()),
    staleTime: 60_000,
  })
}
