export type EmailCategory =
  | 'important'
  | 'bill'
  | 'subscription'
  | 'deadline'
  | 'booking'
  | 'university'
  | 'receipt'
  | 'other'


export type EvidenceCertainty =
  | 'confirmed'
  | 'inferred'


export type BillingFrequency =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'other'


export type ApiDecimal =
  | string
  | number


export interface EmailSearchInput {
  query?: string | null

  sender?: string | null

  subject?: string | null

  /**
   * YYYY-MM-DD or ISO datetime.
   */
  after?: string | null

  /**
   * YYYY-MM-DD or ISO datetime.
   *
   * Gmail treats this as an exclusive
   * upper boundary.
   */
  before?: string | null

  label_ids?: string[]

  categories?: EmailCategory[]

  important_only?: boolean

  include_spam_trash?: boolean

  max_results?: number

  page_token?: string | null
}


export interface ImportantEmailInput {
  after?: string | null

  before?: string | null

  include_spam_trash?: boolean

  max_results?: number

  page_token?: string | null
}


export interface SubscriptionEvidence {
  provider: string | null

  product_plan: string | null

  amount: ApiDecimal | null

  currency: string | null

  billing_frequency:
    | BillingFrequency
    | null

  renewal_date: string | null

  payment_date: string | null

  status: string | null

  source_message_id: string

  source_subject: string | null

  evidence: string | null

  confidence: number

  certainty: EvidenceCertainty
}


export interface EmailIntelligence {
  category: EmailCategory

  is_important: boolean

  importance_score: number

  summary: string | null

  what_happened: string | null

  why_it_matters: string | null

  relevant_date: string | null

  deadline: string | null

  amount: ApiDecimal | null

  currency: string | null

  required_action: string | null

  subscription:
    | SubscriptionEvidence
    | null
}


export interface EmailMetadata {
  id: string | null

  gmail_message_id: string

  gmail_thread_id: string

  rfc822_message_id: string | null

  sender: string | null

  recipients: string[]

  subject: string | null

  received_at: string | null

  /**
   * Gmail-generated preview text.
   * Raw body content is not returned here.
   */
  snippet: string | null

  label_ids: string[]

  category: EmailCategory

  is_important: boolean

  importance_score: number

  summary: string | null

  /**
   * Sanitized structured intelligence.
   *
   * Raw Gmail body content and attachments
   * are never represented by this field.
   */
  extracted_metadata: Record<
    string,
    unknown
  >

  processed_at: string

  created_at: string

  updated_at: string
}


export interface EmailSearchResponse {
  messages: EmailMetadata[]

  next_page_token: string | null

  result_size_estimate: number
}


export interface ImportantEmailResponse {
  messages: EmailMetadata[]

  next_page_token: string | null

  result_size_estimate: number
}


export interface EmailSummaryResponse {
  message: EmailMetadata

  intelligence: EmailIntelligence
}