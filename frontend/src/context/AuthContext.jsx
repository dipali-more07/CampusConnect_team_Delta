import React, { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const SESSION_KEY = 'cc_session'

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
 *   { user, token, isLoggedIn, login, logout }
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession)

  const login = useCallback((user, token) => {
    const s = { user, token }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('cc_token', token)
    setSession(s)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('cc_token')
    setSession(null)
  }, [])

  const value = {
    user: session?.user ?? null,
    token: session?.token ?? null,
    isLoggedIn: !!session,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
