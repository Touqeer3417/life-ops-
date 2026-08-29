import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  checkCalendarAvailability,
  createCalendarEvent,
  getCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
} from '@/api/calendar'
import { useAuth } from '@/auth/AuthProvider'

import type {
  CalendarAvailabilityInput,
  CalendarEventCreateInput,
  CalendarEventListParams,
  CalendarEventUpdateInput,
} from '@/types/calendar'


export const CALENDAR_QUERY_KEY = [
  'calendar',
] as const


export function useCalendarEvents(
  params: CalendarEventListParams,
  enabled = true,
) {
  const {
    isAuthenticated,
    getAccessToken,
  } = useAuth()

  return useQuery({
    queryKey: [
      ...CALENDAR_QUERY_KEY,
      'events',
      params.time_min,
      params.time_max,
      params.timezone ?? null,
      params.max_results ?? 50,
    ],

    enabled:
      isAuthenticated &&
      enabled &&
      Boolean(
        params.time_min,
      ) &&
      Boolean(
        params.time_max,
      ),

    queryFn: async () => {
      const accessToken =
        await getAccessToken()

      return getCalendarEvents(
        accessToken,
        params,
      )
    },

    staleTime: 30_000,
  })
}


export function useCalendarEvent(
  eventId: string | null,
  timezone?: string,
) {
  const {
    isAuthenticated,
    getAccessToken,
  } = useAuth()

  return useQuery({
    queryKey: [
      ...CALENDAR_QUERY_KEY,
      'event',
      eventId,
      timezone ?? null,
    ],

    enabled:
      isAuthenticated &&
      Boolean(
        eventId?.trim(),
      ),

    queryFn: async () => {
      if (!eventId) {
        throw new Error(
          'Event ID is required',
        )
      }

      const accessToken =
        await getAccessToken()

      return getCalendarEvent(
        accessToken,
        eventId,
        timezone,
      )
    },

    staleTime: 30_000,
  })
}


export function useCalendarAvailability() {
  const {
    getAccessToken,
  } = useAuth()

  return useMutation({
    mutationFn: async (
      input: CalendarAvailabilityInput,
    ) => {
      const accessToken =
        await getAccessToken()

      return checkCalendarAvailability(
        accessToken,
        input,
      )
    },
  })
}


export function useCreateCalendarEvent() {
  const {
    getAccessToken,
  } = useAuth()

  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: async (
      input: CalendarEventCreateInput,
    ) => {
      const accessToken =
        await getAccessToken()

      return createCalendarEvent(
        accessToken,
        input,
      )
    },

    onSuccess: async (
      event,
    ) => {
      queryClient.setQueryData(
        [
          ...CALENDAR_QUERY_KEY,
          'event',
          event.id,
          null,
        ],
        event,
      )

      await queryClient.invalidateQueries({
        queryKey:
          CALENDAR_QUERY_KEY,
      })
    },
  })
}


interface UpdateCalendarEventVariables {
  eventId: string
  input: CalendarEventUpdateInput
}


export function useUpdateCalendarEvent() {
  const {
    getAccessToken,
  } = useAuth()

  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: async ({
      eventId,
      input,
    }: UpdateCalendarEventVariables) => {
      const accessToken =
        await getAccessToken()

      return updateCalendarEvent(
        accessToken,
        eventId,
        input,
      )
    },

    onSuccess: async (
      event,
    ) => {
      await queryClient.invalidateQueries({
        queryKey: [
          ...CALENDAR_QUERY_KEY,
          'event',
          event.id,
        ],
      })

      await queryClient.invalidateQueries({
        queryKey: [
          ...CALENDAR_QUERY_KEY,
          'events',
        ],
      })
    },
  })
}