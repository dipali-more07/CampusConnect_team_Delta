import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { saveTokens, clearTokens, getRefreshToken, fetchWithAuth } from '../utils/apiClient'
import authService from '../services/authService'

const AuthContext = createContext(null)

const SESSION_KEY = 'cc_session'
const REFRESH_KEY = 'cc_refresh_token'

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s && s.token) {
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
        ).toString().toLowerCase()

        const existingRole = session?.user?.role || 'student'
        let role = existingRole
        if (['admin', 'superadmin', 'super_admin'].includes(rawRole)) role = 'admin'
        else if (['organizer', 'event_organizer'].includes(rawRole)) role = 'organizer'
        else if (['student', 'participant'].includes(rawRole)) {
          role = (existingRole === 'admin' || existingRole === 'organizer') ? existingRole : 'student'
        }
        else if (session?.user?.email?.toLowerCase().includes('admin') || profile.email?.toLowerCase().includes('admin')) role = 'admin'
        else if (session?.user?.email?.toLowerCase().includes('organizer') || profile.email?.toLowerCase().includes('organizer')) role = 'organizer'

        const rawName = profile.full_name || profile.name || profile.fullName || profile.username || session?.user?.name || 'User'
        const formattedName = rawName.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')

        const getInitials = (nm) => {
          const parts = nm.trim().split(/\s+/)
          if (parts.length > 0 && parts[0]) {
            if (parts.length > 1 && parts[parts.length - 1]) {
              return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            }
            return parts[0][0].toUpperCase()
          }
          return 'CC'
        }

        const avatarImg = profile.profile_image || profile.avatar_url || profile.avatarUrl || null
        const updatedUser = {
          ...session?.user,
          ...profile,
          name: formattedName,
          role,
          avatarUrl: avatarImg,
          profile_image: avatarImg,
          avatar: avatarImg || profile.avatar || getInitials(formattedName)
        }
        setSession(prev => {
          if (!prev) return null
          const latestToken = sessionStorage.getItem('token') || prev.token
          const s = { ...prev, token: latestToken, user: updatedUser }
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
          return s
        })
      })
      .catch(err => {
      })
  }, [session?.token])

  const login = useCallback((user, token, refreshToken) => {
    const rawName = user?.full_name || user?.name || user?.fullName || user?.username || 'User'
    const formattedName = rawName.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')

    const getInitials = (nm) => {
      const parts = nm.trim().split(/\s+/)
      if (parts.length > 0 && parts[0]) {
        if (parts.length > 1 && parts[parts.length - 1]) {
          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        }
        return parts[0][0].toUpperCase()
      }
      return 'CC'
    }

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
      } catch (err) {
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

  const value = {
    user: session?.user ?? null,
    token: session?.token ?? null,
    isLoggedIn: !!session,
    login,
    logout,
    updateToken,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
