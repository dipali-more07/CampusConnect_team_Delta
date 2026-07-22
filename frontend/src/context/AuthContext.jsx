import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { saveTokens, clearTokens, getRefreshToken } from '../utils/apiClient'
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

  // Fetch and sync complete user info from /auth/me on mount/token load
  useEffect(() => {
    const token = session?.token
    if (token) {
      fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      .then(res => {
        if (res.ok) return res.json()
        throw new Error('Failed to fetch /auth/me')
      })
      .then(data => {
        const profile = data.data || data
        let role = (profile.role || profile.userType || profile.roleName || 'student').toString().toLowerCase()
        if (role === 'participant') {
          role = 'student'
        }
        const avatarImg = profile.profile_image || profile.avatar_url || profile.avatarUrl || null
        const updatedUser = {
          ...profile,
          name: profile.full_name || profile.name || profile.fullName || profile.username || profile.email?.split('@')[0] || 'User',
          role,
          avatarUrl: avatarImg,
          profile_image: avatarImg,
          avatar: avatarImg || profile.avatar || (profile.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'CC')
        }
        setSession(prev => {
          if (!prev) return null
          const s = { ...prev, user: updatedUser }
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
          return s
        })
      })
      .catch(err => {
              })
    }
  }, [session?.token])

  const login = useCallback((user, token, refreshToken) => {
    const s = { user, token }
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
