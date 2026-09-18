import type { ApiError, ApiErrorCode } from '../types/api'

/**
 * A relative default, not a hard-coded host: in production the API is served from the same
 * origin as the app (see ADR-013), so there is nothing to configure. `VITE_API_BASE_URL`
 * overrides it when the two run on different origins, which is the case in local development.
 */
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

/**
 * The single error type leaving the service layer: whatever went wrong — a business rule, a
 * malformed body, a broken connection — reaches the hooks as a code the UI knows how to
 * translate.
 */
export class ApiRequestError extends Error {
  readonly code: ApiErrorCode

  constructor(code: ApiErrorCode, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.code = code
  }
}

async function readErrorCode(response: Response): Promise<ApiErrorCode> {
  try {
    const body = (await response.json()) as ApiError

    return body.code
  } catch {
    // A non-OK response without a contract body means the failure happened before the API
    // could answer, so it is reported as an unexpected one rather than guessed.
    return 'INTERNAL_ERROR'
  }
}

export async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  let response: Response

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new ApiRequestError('INTERNAL_ERROR', `the API could not be reached: ${error}`)
  }

  if (!response.ok) {
    const code = await readErrorCode(response)

    throw new ApiRequestError(code, `the API answered with ${response.status}`)
  }

  return (await response.json()) as TResponse
}
