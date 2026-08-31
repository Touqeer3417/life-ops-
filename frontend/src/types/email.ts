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


/**
 * Decimal values from FastAPI/Pydantic may be serialized
 * as JSON strings depending on provider/runtime behavior.
 */
export type ApiDecimal =
  | string
  | number


export interface EmailSearchInput {
  /**
   * Free-form Gmail-native search intent.
   *
   * Examples:
   * - Hostinger renewal
   * - internship
   * - invoice
   * - from:example.com
   */
  query?: string | null

  sender?: string | null

  subject?: string | null

  /**
   * Inclusive beginning date in YYYY-MM-DD form.
   */
  after?: string | null

  /**
   * Exclusive ending date in YYYY-MM-DD form.
   */
  before?: string | null

  label_ids?: string[]

  categories?: EmailCategory[]

  important_only?: boolean

  include_spam_trash?: boolean

  /**
   * Backend Phase 4 API currently limits this to 50.
   */
  max_results?: number

  page_token?: string | null
}


export interface ImportantEmailInput {
  /**
   * Inclusive beginning date in YYYY-MM-DD form.
   */
  after?: string | null

  /**
   * Exclusive ending date in YYYY-MM-DD form.
   */
  before?: string | null

  include_spam_trash?: boolean

  max_results?: number

  page_token?: string | null
}


export interface SubscriptionEvidence {
  provider: string | null

  plan: string | null

  amount: ApiDecimal | null

  currency: string | null

  frequency: BillingFrequency | null

  renewal_date: string | null

  next_payment_date: string | null

  status: string | null

  /**
   * Gmail message that supports this evidence.
   *
   * Keep this internal to application behavior. Normal UI
   * copy should not unnecessarily display technical IDs.
   */
  source_message_id: string

  source_subject: string | null

  evidence: string | null

  confidence: number

  certainty: EvidenceCertainty
}


export interface EmailIntelligence {
  category: EmailCategory

  importance_score: number

  summary: string

  what_happened: string | null

  why_it_matters: string | null

  dates: string[]

  amount: ApiDecimal | null

  currency: string | null

  action_required: string | null

  subscription: SubscriptionEvidence | null
}


export interface EmailMetadata {
  id: string

  gmail_message_id: string

  gmail_thread_id: string

  rfc822_message_id: string | null

  sender: string | null

  recipients: string[]

  subject: string | null

  received_at: string | null

  /**
   * Gmail-generated preview text.
   *
   * This is metadata, not the persisted raw email body.
   */
  snippet: string | null

  label_ids: string[]

  category: EmailCategory

  is_important: boolean

  importance_score: number

  summary: string | null

  /**
   * Sanitized structured intelligence persisted by LifeOps.
   * Raw email bodies and attachments are not stored here.
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