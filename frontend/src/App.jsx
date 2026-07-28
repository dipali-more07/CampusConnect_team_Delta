import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/Admin/AdminDashboard'
import StudentDashboard from './pages/Student/StudentDashboard'
import OrganizerDashboard from './pages/Organizer/OrganizerDashboard'

function getEffectiveRole(user) {
  const r = (user?.role || user?.userType || user?.user_type || '').toLowerCase()
  if (r) return r
  try {
    const raw = sessionStorage.getItem('cc_session')
    if (raw) {
      const parsed = JSON.parse(raw)
      const storedRole = (parsed?.user?.role || parsed?.user?.userType || parsed?.user?.user_type || '').toLowerCase()
      if (storedRole) return storedRole
    }
  } catch {}
  return ''
}

function AdminProtectedRoute({ children }) {
  const { isLoggedIn, user } = useAuth()
  const role = getEffectiveRole(user)

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  if (role && !['admin', 'superadmin', 'super_admin'].includes(role)) {
    return <Navigate to={`/${role}/dashboard`} replace />
  }
  return children
}

function OrganizerProtectedRoute({ children }) {
  const { isLoggedIn, user } = useAuth()
  const role = getEffectiveRole(user)

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  if (role && !['organizer', 'event_organizer'].includes(role)) {
    return <Navigate to={`/${role}/dashboard`} replace />
  }
  return children
}

function StudentProtectedRoute({ children }) {
  const { isLoggedIn, user } = useAuth()
  const role = getEffectiveRole(user)

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  if (role && !['student', 'participant'].includes(role)) {
    return <Navigate to={`/${role}/dashboard`} replace />
  }
  return children
}

function AppRouter() {
  const { isLoggedIn, user } = useAuth()
  const role = getEffectiveRole(user) || 'student'

  return (
    <Routes>
      <Route
        path="/login"
        element={
          !isLoggedIn ? (
            <LoginPage />
          ) : (
            <Navigate to={`/${role}/dashboard`} replace />
          )
        }
      />
      <Route
        path="/"
        element={
          !isLoggedIn ? (
            <Navigate to="/login" replace />
          ) : (
            <Navigate to={`/${role}/dashboard`} replace />
          )
        }
      />

      {/* Admin Portal */}
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <Navigate to="/admin/dashboard" replace />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        }
      />

      {/* Organizer Portal */}
      <Route
        path="/organizer"
        element={
          <OrganizerProtectedRoute>
            <Navigate to="/organizer/dashboard" replace />
          </OrganizerProtectedRoute>
        }
      />
      <Route
        path="/organizer/*"
        element={
          <OrganizerProtectedRoute>
            <OrganizerDashboard />
          </OrganizerProtectedRoute>
        }
      />

      {/* Student Portal */}
      <Route
        path="/student"
        element={
          <StudentProtectedRoute>
            <Navigate to="/student/dashboard" replace />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="/student/*"
        element={
          <StudentProtectedRoute>
            <StudentDashboard />
          </StudentProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}