export type DocumentStatus =
  | 'processing'
  | 'indexed'
  | 'failed'

export interface DocumentRecord {
  id: string
  original_filename: string
  mime_type: string
  file_extension: string
  file_size: number
  status: DocumentStatus
  processing_error: string | null
  indexed_at: string | null
  created_at: string
  updated_at: string
}

export interface DocumentDetail extends DocumentRecord {
  chunk_count: number
}

export interface DocumentListResponse {
  documents: DocumentRecord[]
  total: number
}

export interface DocumentUploadResponse {
  document: DocumentRecord
  message: string
}

export interface DocumentDeleteResponse {
  id: string
  message: string
}

export interface DocumentStatusResponse {
  id: string
  status: DocumentStatus
  processing_error: string | null
  indexed_at: string | null
}

export interface DocumentSearchInput {
  query: string
  top_k?: number
}

export interface DocumentSearchResult {
  chunk_id: string
  document_id: string
  filename: string
  chunk_index: number
  content: string
  page_number: number | null
  source: string | null
  similarity: number
}

export interface DocumentSearchResponse {
  query: string
  results: DocumentSearchResult[]
  total: number
}