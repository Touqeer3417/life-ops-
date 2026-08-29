import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  disconnectGoogle,
  getGoogleIntegration,
  startGoogleAuthorization,
} from '@/api/googleIntegrations'
import { useAuth } from '@/auth/AuthProvider'

import type {
  GoogleConnectInput,
} from '@/types/integration'


export const GOOGLE_INTEGRATION_QUERY_KEY = [
  'integrations',
  'google',
] as const


export function useGoogleIntegration() {
  const {
    isAuthenticated,
    getAccessToken,
  } = useAuth()

  return useQuery({
    queryKey:
      GOOGLE_INTEGRATION_QUERY_KEY,

    enabled:
      isAuthenticated,

    queryFn: async () => {
      const accessToken =
        await getAccessToken()

      return getGoogleIntegration(
        accessToken,
      )
    },

    staleTime: 15_000,

    refetchOnWindowFocus: true,
  })
}


export function useConnectGoogle() {
  const {
    getAccessToken,
  } = useAuth()

  return useMutation({
    mutationFn: async (
      input: GoogleConnectInput,
    ) => {
      const accessToken =
        await getAccessToken()

      await startGoogleAuthorization(
        accessToken,
        input,
      )
    },
  })
}


export function useDisconnectGoogle() {
  const {
    getAccessToken,
  } = useAuth()

  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const accessToken =
        await getAccessToken()

      return disconnectGoogle(
        accessToken,
      )
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          GOOGLE_INTEGRATION_QUERY_KEY,
      })

      await queryClient.invalidateQueries({
        queryKey: [
          'calendar',
        ],
      })
    },
  })
}