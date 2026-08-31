import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  getEmailSummary,
  getImportantEmails,
  searchEmails,
} from '@/api/email'
import { useAuth } from '@/auth/AuthProvider'

import type {
  EmailSearchInput,
  ImportantEmailInput,
} from '@/types/email'


export const EMAIL_QUERY_KEY = [
  'email',
] as const


export function useImportantEmails(
  input: ImportantEmailInput = {},
  enabled = true,
) {
  const {
    isAuthenticated,
    getAccessToken,
  } = useAuth()

  return useQuery({
    queryKey: [
      ...EMAIL_QUERY_KEY,
      'important',
      input,
    ],

    enabled:
      isAuthenticated &&
      enabled,

    queryFn: async () => {
      const accessToken =
        await getAccessToken()

      return getImportantEmails(
        accessToken,
        input,
      )
    },

    staleTime: 30_000,

    refetchOnWindowFocus: false,
  })
}


export function useEmailSearch() {
  const {
    getAccessToken,
  } = useAuth()

  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: async (
      input: EmailSearchInput,
    ) => {
      const accessToken =
        await getAccessToken()

      const normalizedInput: EmailSearchInput = {
        ...input,

        query:
          input.query?.trim() ||
          null,

        sender:
          input.sender?.trim() ||
          null,

        subject:
          input.subject?.trim() ||
          null,

        label_ids:
          input.label_ids ?? [],

        categories:
          input.categories ?? [],

        important_only:
          input.important_only ??
          false,

        include_spam_trash:
          input.include_spam_trash ??
          false,

        max_results:
          input.max_results ?? 20,

        page_token:
          input.page_token ?? null,
      }

      return searchEmails(
        accessToken,
        normalizedInput,
      )
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          ...EMAIL_QUERY_KEY,
          'important',
        ],
      })
    },
  })
}


export function useEmailSummary() {
  const {
    getAccessToken,
  } = useAuth()

  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: async (
      messageId: string,
    ) => {
      const normalizedMessageId =
        messageId.trim()

      if (!normalizedMessageId) {
        throw new Error(
          'Gmail message ID is required.',
        )
      }

      const accessToken =
        await getAccessToken()

      return getEmailSummary(
        accessToken,
        normalizedMessageId,
      )
    },

    onSuccess: async () => {
      /**
       * The backend persists only sanitized structured
       * intelligence after a selected email is analyzed.
       *
       * Refresh list queries so any updated category,
       * importance score or summary becomes visible.
       */
      await queryClient.invalidateQueries({
        queryKey:
          EMAIL_QUERY_KEY,
      })
    },
  })
}


export function useRefreshEmailIntelligence() {
  const queryClient =
    useQueryClient()

  return async () => {
    await queryClient.invalidateQueries({
      queryKey:
        EMAIL_QUERY_KEY,
    })
  }
}