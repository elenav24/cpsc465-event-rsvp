/**
 * Base API client — attaches the Cognito JWT to every request.
 * All service modules import `apiFetch` from here.
 *
 * VITE_EVENTS_API_URL should be the full base including the service path,
 * e.g. https://xxx.lambda-url.us-east-1.on.aws/events
 *
 * apiFetch('events', '/events') would produce .../events/events — wrong.
 * So the path passed to apiFetch must NOT repeat the service prefix.
 * Use apiFetch('events', '') for the list endpoint, apiFetch('events', '/123') etc.
 *
 * Alternatively, set VITE_EVENTS_API_URL to the root (without /events) and
 * keep full paths. We do the latter: strip any trailing slash from the base
 * and callers pass full paths like /events, /events/123, /users/me.
 */

// Strip trailing slash so we never get double-slashes
const EVENTS_BASE = (import.meta.env.VITE_EVENTS_API_URL ?? '').replace(/\/$/, '')
const USERS_BASE = (import.meta.env.VITE_USERS_API_URL ?? '').replace(/\/$/, '')

// Token getter is injected at startup by AuthContext
let _getToken: (() => string | null) | null = null

export function setTokenGetter(fn: () => string | null) {
  _getToken = fn
}

function authHeaders(): Record<string, string> {
  const token = _getToken?.()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      detail = body.detail ?? body.message ?? detail
    } catch {
      // ignore parse errors
    }
    throw new Error(detail)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

/**
 * @param base   - which service to call ('events' | 'users')
 * @param path   - path relative to the service root, e.g. '' | '/123' | '/me'
 *                 Do NOT include the service name again — the base URL already has it.
 */
export async function apiFetch<T>(
  base: 'events' | 'users',
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = base === 'events' ? EVENTS_BASE : USERS_BASE
  const url = `${baseUrl}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  })
  return handleResponse<T>(res)
}

export { EVENTS_BASE, USERS_BASE }
