import { env } from '@/utils/env'

interface ApiErrorBody {
  error?: {
    code?: string
    message?: string
  }
  detail?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code = 'api_error') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export async function apiRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers)

  headers.set('Authorization', `Bearer ${accessToken}`)
  headers.set('Accept', 'application/json')

  const isFormData =
    typeof FormData !== 'undefined' &&
    init.body instanceof FormData

  if (
    init.body &&
    !isFormData &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response

  try {
    response = await fetch(
      `${env.apiUrl}${path}`,
      {
        ...init,
        headers,
      },
    )
  } catch (error) {
    throw new ApiError(
      error instanceof Error
        ? `Unable to reach API: ${error.message}`
        : 'Unable to reach API',
      0,
      'network_error',
    )
  }

  if (!response.ok) {
    let body: ApiErrorBody = {}

    try {
      body = (await response.json()) as ApiErrorBody
    } catch {
      body = {}
    }

    throw new ApiError(
      body.error?.message ??
        body.detail ??
        `API request failed with status ${response.status}`,
      response.status,
      body.error?.code ?? 'api_error',
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}