/**
 * apiClient.js
 * Central fetch wrapper with automatic token refresh.
 * 
 * Flow:
 *   1. Make API call with current access token
 *   2. If 401 received → call POST /auth/refresh with refresh_token
 *   3. If refresh succeeds → update stored token → retry original request
 *   4. If refresh fails → clear session → redirect to login
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL

const TOKEN_KEY = 'cc_token'
const REFRESH_KEY = 'cc_refresh_token'
const SESSION_KEY = 'cc_session'

// ── Token helpers ────────────────────────────────────────────────
export function getAccessToken() {
  return sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem('token') || ''
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY) || ''
}

export function saveTokens(accessToken, refreshToken) {
  if (accessToken) {
    sessionStorage.setItem(TOKEN_KEY, accessToken)
    sessionStorage.setItem('token', accessToken)
    // Also update the stored session
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        const session = JSON.parse(raw)
        session.token = accessToken
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
      }
    } catch { /* ignore */ }
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken)
  }
}

export function clearTokens() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem('token')
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

// ── Refresh token call ───────────────────────────────────────────
let _refreshPromise = null // prevent multiple simultaneous refreshes

async function doRefresh() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  // We will try three different formats for maximum compatibility with the backend:
  // 1. Authorization: Bearer <refresh_token> (Standard)
  // 2. Authorization: <refresh_token> (Raw token in header)
  // 3. Body: { refresh_token: <refresh_token> } (Fallback)
  const formats = [
    {
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
        'authorization': `Bearer ${refreshToken}`,
      }
    },
    {
      headers: {
        'Authorization': refreshToken,
        'authorization': refreshToken,
      }
    },
    {
      headers: {},
      body: JSON.stringify({ refresh_token: refreshToken })
    }
  ]

  for (const format of formats) {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...format.headers,
        },
        ...(format.body ? { body: format.body } : {}),
      })

      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        const newAccessToken =
          data.data?.access_token ||
          data.access_token ||
          data.token ||
          data.accessToken ||
          data.data?.token ||
          null

        const newRefreshToken =
          data.data?.refresh_token ||
          data.refresh_token ||
          data.refreshToken ||
          refreshToken // fallback to current if not rotated

        if (newAccessToken) {
          saveTokens(newAccessToken, newRefreshToken)
          return newAccessToken
        }
      }
    } catch (err) {
          }
  }

  return null
}

// ── Main fetch wrapper ───────────────────────────────────────────
/**
 * fetchWithAuth(url, options)
 * Drop-in replacement for fetch() that:
 *   - Adds Authorization + Content-Type headers automatically
 *   - On 401: refreshes token and retries once
 *   - On refresh failure: clears session and redirects to /
 */
export async function fetchWithAuth(url, options = {}) {
  const makeHeaders = (token) => ({
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  })

  const token = getAccessToken()
  let res = await fetch(url, { ...options, headers: makeHeaders(token) })

  // Not 401 — return as-is
  if (res.status !== 401) return res

  // 401 — attempt token refresh (deduplicated)
  if (!_refreshPromise) {
    _refreshPromise = doRefresh().finally(() => { _refreshPromise = null })
  }
  const newToken = await _refreshPromise

  if (!newToken) {
    // Refresh failed → force logout
    clearTokens()
    window.location.href = '/'
    return res // return original 401 response
  }

  // Retry original request with new token
  res = await fetch(url, { ...options, headers: makeHeaders(newToken) })
  return res
}

/**
 * authHeaders()
 * Returns standard auth headers for services still using raw fetch.
 * Kept for backward compatibility.
 */
export function authHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAccessToken()}`,
    ...extra,
  }
}
