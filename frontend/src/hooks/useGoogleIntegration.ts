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
import {
  useAuth,
} from '@/auth/AuthProvider'

import type {
  GoogleConnectInput,
} from '@/types/integration'


export const GOOGLE_INTEGRATION_QUERY_KEY = [
  'integrations',
  'google',
] as const


const CALENDAR_QUERY_KEY = [
  'calendar',
] as const


const EMAIL_QUERY_KEY = [
  'email',
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

    staleTime:
      15_000,

    refetchOnWindowFocus:
      true,
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

      /**
       * The backend creates the Google authorization URL.
       *
       * Calendar and Gmail may be requested together or
       * incrementally through the same Google connection.
       *
       * OAuth credentials never become frontend state.
       */
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
      /**
       * Google is one shared authorization.
       *
       * Disconnecting it invalidates:
       *
       * - Google capability/status state
       * - Calendar state
       * - Gmail intelligence state
       */

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            GOOGLE_INTEGRATION_QUERY_KEY,
        }),

        queryClient.invalidateQueries({
          queryKey:
            CALENDAR_QUERY_KEY,
        }),

        queryClient.invalidateQueries({
          queryKey:
            EMAIL_QUERY_KEY,
        }),
      ])
    },
  })
}