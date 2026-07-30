import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { saveTokens, clearTokens, getRefreshToken, fetchWithAuth, addTokenListener, refreshAccessToken } from '../utils/apiClient'
import authService from '../services/authService'

const AuthContext = createContext(null)

const SESSION_KEY = 'cc_session'

function getInitials(nm) {
  if (!nm) return 'CC'
  const parts = nm.trim().split(/\s+/)
  if (parts.length > 0 && parts[0]) {
    if (parts.length > 1 && parts[parts.length - 1]) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0][0].toUpperCase()
  }
  return 'CC'
}

function computeUserRole(rawRole, userEmail, profileEmail, existingRole = 'student') {
  const norm = (rawRole || '').toString().toLowerCase()
  if (['admin', 'superadmin', 'super_admin'].includes(norm)) return 'admin'
  if (['organizer', 'event_organizer'].includes(norm)) return 'organizer'
  if (['student', 'participant'].includes(norm)) return 'student'
  const emailStr = (userEmail || profileEmail || '').toLowerCase()
  if (emailStr.includes('admin')) return 'admin'
  if (emailStr.includes('organizer')) return 'organizer'
  return existingRole
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s?.token) {
        sessionStorage.setItem('token', s.token)
        sessionStorage.setItem('cc_token', s.token)
      }
      return s
    }
    return null
  } catch {
    return null
  }
}

/**
 * Wrap your app with <AuthProvider>.
 * Then call useAuth() in any component.
 *
 * useAuth() returns:
 *   { user, token, isLoggedIn, login, logout, updateToken }
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession)
  // Track which token we've already fetched /auth/me for, to prevent infinite loop
  const lastFetchedToken = useRef(null)

  const hasSessionToken = Boolean(session?.token)

  // ── 1. Reactive Token Listener & Proactive Auto-Refresh ──────────
  useEffect(() => {
    // Listen for silent token updates from apiClient (e.g. 401 retry or background refresh)
    const unsubscribe = addTokenListener((newToken) => {
      if (newToken) {
        setSession(prev => {
          if (!prev) return null
          const updated = { ...prev, token: newToken }
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated))
          sessionStorage.setItem('token', newToken)
          sessionStorage.setItem('cc_token', newToken)
          return updated
        })
      }
    })

    // If logged in and refresh token exists, proactively refresh immediately on load and then every 4 minutes
    const rToken = getRefreshToken()
    if (hasSessionToken && rToken) {
      refreshAccessToken()
    }

    const intervalId = setInterval(() => {
      const currentRefreshToken = getRefreshToken()
      if (currentRefreshToken) {
        refreshAccessToken()
      }
    }, 4 * 60 * 1000) // Every 4 minutes

    return () => {
      unsubscribe()
      clearInterval(intervalId)
    }
  }, [hasSessionToken])

  // Fetch and sync complete user info from /auth/me on mount/token change
  useEffect(() => {
    const token = session?.token
    // Only call /auth/me if we have a token AND it's a different token than last time
    if (!token || token === lastFetchedToken.current) return
    lastFetchedToken.current = token

    fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/auth/me`)
      .then(res => {
        if (res.ok) return res.json()
        throw new Error('Failed to fetch /auth/me')
      })
      .then(data => {
        const profile = data.data?.user || data.user || data.data || data
        const rawRole = (
          profile.role || profile.role_name || profile.roleName ||
          profile.userType || profile.user_type || data.data?.role || data.role || ''
        )

        setSession(prev => {
          if (!prev) return null
          const existingRole = prev.user?.role || 'student'
          const role = computeUserRole(rawRole, prev.user?.email, profile.email, existingRole)
          const rawName = profile.full_name || profile.name || profile.fullName || profile.username || prev.user?.name || 'User'
          const formattedName = rawName.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
          const avatarImg = profile.profile_image || profile.avatar_url || profile.avatarUrl || null

          const updatedUser = {
            ...prev.user,
            ...profile,
            name: formattedName,
            role,
            avatarUrl: avatarImg,
            profile_image: avatarImg,
            avatar: avatarImg || profile.avatar || getInitials(formattedName)
          }

          const latestToken = sessionStorage.getItem('token') || prev.token
          const s = { ...prev, token: latestToken, user: updatedUser }
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
          return s
        })
      })
      .catch(() => {
        /* Fail gracefully if /auth/me is unreachable */
      })
  }, [session?.token])

  const login = useCallback((user, token, refreshToken) => {
    const rawName = user?.full_name || user?.name || user?.fullName || user?.username || 'User'
    const formattedName = rawName.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')

    const formattedUser = {
      ...user,
      name: formattedName,
      avatar: user?.avatar || getInitials(formattedName)
    }

    const s = { user: formattedUser, token }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
    // Save both tokens via apiClient helper
    saveTokens(token, refreshToken)
    setSession(s)
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await authService.logout(refreshToken)
      } catch {
        // fail gracefully to ensure user is logged out locally
      }
    }
    clearTokens()
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
  }, [])

  // Called after silent token refresh to update stored access token
  const updateToken = useCallback((newToken) => {
    setSession(prev => {
      if (!prev) return null
      const updated = { ...prev, token: newToken }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated))
      sessionStorage.setItem('token', newToken)
      sessionStorage.setItem('cc_token', newToken)
      return updated
    })
  }, [])

  const updateUser = useCallback((updatedUserInfo) => {
    setSession(prev => {
      if (!prev) return null
      const updatedUser = { ...prev.user, ...updatedUserInfo }
      const s = { ...prev, user: updatedUser }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
      return s
    })
  }, [])

  const value = useMemo(() => ({
    user: session?.user ?? null,
    token: session?.token ?? null,
    isLoggedIn: !!session,
    login,
    logout,
    updateToken,
    updateUser,
  }), [session, login, logout, updateToken, updateUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
