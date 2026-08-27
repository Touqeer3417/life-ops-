import { useMutation } from '@tanstack/react-query'

import { askRagQuestion } from '@/api/chat'
import { useAuth } from '@/auth/AuthProvider'

import type {
  RagChatRequest,
} from '@/types/chat'


export function useRagChat() {
  const {
    getAccessToken,
  } = useAuth()

  return useMutation({
    mutationFn: async (
      input: RagChatRequest,
    ) => {
      const question =
        input.question.trim()

      if (!question) {
        throw new Error(
          'Question cannot be empty',
        )
      }

      const accessToken =
        await getAccessToken()

      return askRagQuestion(
        accessToken,
        {
          question,
        },
      )
    },
  })
}