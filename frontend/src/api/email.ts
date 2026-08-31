import { apiRequest } from './client'

import type {
  EmailSearchInput,
  EmailSearchResponse,
  EmailSummaryResponse,
  ImportantEmailInput,
  ImportantEmailResponse,
} from '@/types/email'


/**
 * Search the authenticated user's authorized Gmail
 * account.
 *
 * Search remains metadata-first on the backend.
 */
export function searchEmails(
  accessToken: string,
  input: EmailSearchInput,
): Promise<EmailSearchResponse> {
  return apiRequest<EmailSearchResponse>(
    '/email/search',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(
        input,
      ),
    },
  )
}


/**
 * Retrieve LifeOps-important Gmail messages.
 *
 * Importance combines Gmail signals with LifeOps
 * classification such as:
 *
 * - bills
 * - renewals
 * - deadlines
 * - university notices
 * - internship/job communication
 * - receipts
 */
export function getImportantEmails(
  accessToken: string,
  input: ImportantEmailInput = {},
): Promise<ImportantEmailResponse> {
  return apiRequest<ImportantEmailResponse>(
    '/email/important',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(
        input,
      ),
    },
  )
}


/**
 * Analyze one selected Gmail message.
 *
 * The backend may fetch that message body internally for
 * safe summarization/extraction, but raw body content is
 * never returned by this API contract.
 */
export function getEmailSummary(
  accessToken: string,
  messageId: string,
): Promise<EmailSummaryResponse> {
  const normalizedMessageId = (
    messageId.trim()
  )

  if (!normalizedMessageId) {
    return Promise.reject(
      new Error(
        'Gmail message ID cannot be empty.',
      ),
    )
  }

  return apiRequest<EmailSummaryResponse>(
    (
      '/email/messages/'
      + `${encodeURIComponent(
        normalizedMessageId,
      )}/summary`
    ),
    accessToken,
  )
}