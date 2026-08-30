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


export interface DocumentDetail
  extends DocumentRecord {
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

  /**
   * Maximum final number of parent-level search results.
   *
   * Backend currently accepts 1..20.
   */
  top_k?: number
}


export interface DocumentSearchResult {
  /**
   * ID of the highest-ranked child chunk that caused
   * this parent context to be selected.
   */
  chunk_id: string

  document_id: string

  filename: string

  chunk_index: number

  /**
   * Parent-level content returned after child retrieval,
   * CrossEncoder reranking and parent expansion.
   */
  content: string

  page_number: number | null

  source: string | null

  /**
   * Initial pgvector cosine similarity.
   */
  similarity: number

  /**
   * Final CrossEncoder relevance score.
   *
   * null is possible when reranking is disabled.
   */
  rerank_score: number | null
}


export interface DocumentSearchResponse {
  query: string

  results: DocumentSearchResult[]

  total: number
}