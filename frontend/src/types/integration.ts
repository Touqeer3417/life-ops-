export type GoogleIntegrationStatus =
  | 'pending'
  | 'connected'
  | 'reauth_required'
  | 'disconnected'


export type GoogleCalendarAccessLevel =
  | 'read'
  | 'write'


export type GoogleService =
  | 'calendar'
  | 'gmail'


export interface GoogleConnectInput {
  /**
   * Calendar permission requested when Calendar is included
   * in services.
   *
   * Gmail-only flows may leave this as "read".
   */
  access_level: GoogleCalendarAccessLevel

  /**
   * Google services to authorize during this incremental
   * OAuth flow.
   *
   * Omitted by older Phase 3 callers, in which case the
   * backend defaults to Calendar.
   */
  services?: GoogleService[]

  /**
   * Force Google's consent screen when reauthorization or
   * a new refresh token is required.
   */
  force_consent?: boolean
}


export interface GoogleConnectResponse {
  authorization_url: string
  expires_at: string
  requested_scopes: string[]
}


export interface GoogleIntegration {
  provider: 'google'

  status: GoogleIntegrationStatus

  connected: boolean

  reauthorization_required: boolean

  /**
   * Backend-owned capability evidence.
   *
   * The frontend may display scope-derived capabilities,
   * but it must never handle Google access/refresh tokens.
   */
  granted_scopes: string[]

  can_read_calendar: boolean

  can_check_availability: boolean

  can_write_calendar: boolean

  /**
   * True only when the shared Google connection contains
   * the Phase 4 Gmail read permission.
   */
  can_read_gmail: boolean

  connected_at: string | null

  last_refreshed_at: string | null

  last_error_code: string | null

  last_error_message: string | null
}


export interface GoogleDisconnectResponse {
  status: GoogleIntegrationStatus

  disconnected: boolean

  revocation_confirmed: boolean
}