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
  let token = sessionStorage.getItem(TOKEN_KEY) ||
              sessionStorage.getItem('token') ||
              sessionStorage.getItem('cc_token') ||
              localStorage.getItem(TOKEN_KEY) ||
              localStorage.getItem('token') ||
              localStorage.getItem('cc_token')
  if (!token) {
    const keys = [SESSION_KEY, 'cc_session', 'cc_user', 'user', 'cc_auth']
    for (const key of keys) {
      try {
        const raw = sessionStorage.getItem(key) || localStorage.getItem(key)
        if (raw) {
          const parsed = JSON.parse(raw)
          const found = parsed.token || parsed.access_token || parsed.accessToken || parsed.user?.token || parsed.user?.access_token
          if (found) {
            token = found
            break
          }
        }
      } catch {
        /* ignore */
      }
    }
  }
  return (token || '').trim()
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_KEY) || sessionStorage.getItem('refresh_token') || localStorage.getItem(REFRESH_KEY) || localStorage.getItem('refresh_token') || ''
}

// ── Listener system for reactive state sync ──────────────────────
const tokenListeners = new Set()

export function addTokenListener(listener) {
  if (typeof listener === 'function') {
    tokenListeners.add(listener)
  }
  return () => tokenListeners.delete(listener)
}

export function saveTokens(accessToken, refreshToken) {
  if (accessToken) {
    sessionStorage.setItem(TOKEN_KEY, accessToken)
    sessionStorage.setItem('token', accessToken)
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
    sessionStorage.setItem(REFRESH_KEY, refreshToken)
    sessionStorage.setItem('refresh_token', refreshToken)
  }
  // Notify listeners
  tokenListeners.forEach(listener => {
    try {
      listener(accessToken, refreshToken)
    } catch {
      /* ignore */
    }
  })
}

export function clearTokens() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem('token')
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(REFRESH_KEY)
  sessionStorage.removeItem('refresh_token')
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem('refresh_token')
}

// ── Refresh token call ───────────────────────────────────────────
let _refreshPromise = null // prevent multiple simultaneous refreshes

async function tryFetchToken(attempt, currentRefreshToken) {
  try {
    let res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: attempt.headers,
      ...(attempt.body ? { body: attempt.body } : {})
    })

    if (res.status === 307 || (!res.ok && res.status === 404)) {
      res = await fetch(`${API_BASE}/auth/refresh/`, {
        method: 'POST',
        headers: attempt.headers,
        ...(attempt.body ? { body: attempt.body } : {})
      })
    }

    if (!res.ok) return null
    const data = await res.json().catch(() => ({}))
    const newAccessToken = data.data?.access_token || data.access_token || data.token || data.accessToken || data.data?.token || null
    const newRefreshToken = data.data?.refresh_token || data.refresh_token || data.refreshToken || currentRefreshToken

    if (newAccessToken) {
      saveTokens(newAccessToken, newRefreshToken)
      return newAccessToken
    }
    return null
  } catch {
    return null
  }
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  if (_refreshPromise) return _refreshPromise

  _refreshPromise = (async () => {
    const attempts = [
      {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        }
      }
    ]

    for (const attempt of attempts) {
      const token = await tryFetchToken(attempt, refreshToken)
      if (token) return token
    }
    return null
  })().finally(() => {
    _refreshPromise = null
  })

  return _refreshPromise
}

export const doRefresh = refreshAccessToken

// ── Main fetch wrapper ───────────────────────────────────────────
export { encryptPayload, decryptPayload } from './payloadCrypto'

export async function fetchWithAuth(url, options = {}) {
  const makeHeaders = (token) => ({
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  })

  const token = getAccessToken()
  let res = await fetch(url, { ...options, headers: makeHeaders(token) })

  // Handle FastAPI 307 Temporary Redirect / trailing slash mismatch
  if (res.status === 307 || (!res.ok && res.status === 404)) {
    const altUrl = url.endsWith('/') ? url.slice(0, -1) : `${url}/`
    try {
      const altRes = await fetch(altUrl, { ...options, headers: makeHeaders(token) })
      if (altRes.ok || altRes.status !== 404) {
        res = altRes
      }
    } catch {
      /* ignore */
    }
  }

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
