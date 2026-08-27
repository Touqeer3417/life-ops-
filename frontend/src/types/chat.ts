export interface RagChatRequest {
  question: string
}

export interface RagCitation {
  document_id: string
  chunk_id: string
  filename: string
  chunk_index: number
  page_number: number | null
  source: string | null
  similarity: number
  excerpt: string
}

export interface RagChatResponse {
  answer: string
  citations: RagCitation[]
  context_found: boolean
}

export type ChatMessageRole =
  | 'user'
  | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
  citations: RagCitation[]
  context_found?: boolean
  created_at: string
}