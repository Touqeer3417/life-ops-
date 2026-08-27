import { apiRequest } from './client'

import type {
  RagChatRequest,
  RagChatResponse,
} from '@/types/chat'


export function askRagQuestion(
  accessToken: string,
  input: RagChatRequest,
): Promise<RagChatResponse> {
  return apiRequest<RagChatResponse>(
    '/chat',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}