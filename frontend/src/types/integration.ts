export type GoogleIntegrationStatus =
  | 'pending'
  | 'connected'
  | 'reauth_required'
  | 'disconnected'

export type GoogleCalendarAccessLevel =
  | 'read'
  | 'write'


export interface GoogleConnectInput {
  access_level: GoogleCalendarAccessLevel
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

  granted_scopes: string[]

  can_read_calendar: boolean
  can_check_availability: boolean
  can_write_calendar: boolean

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