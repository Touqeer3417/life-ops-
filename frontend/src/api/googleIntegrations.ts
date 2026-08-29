import { apiRequest } from './client'

import type {
  GoogleConnectInput,
  GoogleConnectResponse,
  GoogleDisconnectResponse,
  GoogleIntegration,
} from '@/types/integration'


export function getGoogleIntegration(
  accessToken: string,
): Promise<GoogleIntegration> {
  return apiRequest<GoogleIntegration>(
    '/integrations/google',
    accessToken,
  )
}


export function connectGoogle(
  accessToken: string,
  input: GoogleConnectInput,
): Promise<GoogleConnectResponse> {
  return apiRequest<GoogleConnectResponse>(
    '/integrations/google/connect',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}


export function disconnectGoogle(
  accessToken: string,
): Promise<GoogleDisconnectResponse> {
  return apiRequest<GoogleDisconnectResponse>(
    '/integrations/google',
    accessToken,
    {
      method: 'DELETE',
    },
  )
}


/**
 * Starts the Google authorization flow.
 *
 * LifeOps first asks its own authenticated backend for a
 * server-generated Google authorization URL. The frontend
 * never receives Google's client secret, access token, or
 * refresh token.
 */
export async function startGoogleAuthorization(
  accessToken: string,
  input: GoogleConnectInput,
): Promise<void> {
  const response = await connectGoogle(
    accessToken,
    input,
  )

  window.location.assign(
    response.authorization_url,
  )
}