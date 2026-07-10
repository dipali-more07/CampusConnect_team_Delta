import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/Admin/AdminDashboard'
import StudentDashboard from './pages/Student/StudentDashboard'
import OrganizerDashboard from './pages/Organizer/OrganizerDashboard'

function AdminProtectedRoute({ children }) {
  const { isLoggedIn, user } = useAuth()
  const userRole = (user?.role || user?.userType || '').toLowerCase()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  if (userRole !== 'admin') {
    return <Navigate to={`/${userRole}/dashboard`} replace />
  }
  return children
}

function OrganizerProtectedRoute({ children }) {
  const { isLoggedIn, user } = useAuth()
  const userRole = (user?.role || user?.userType || '').toLowerCase()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  if (userRole !== 'organizer') {
    return <Navigate to={`/${userRole}/dashboard`} replace />
  }
  return children
}

function StudentProtectedRoute({ children }) {
  const { isLoggedIn, user } = useAuth()
  const userRole = (user?.role || user?.userType || '').toLowerCase()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  if (userRole !== 'student') {
    return <Navigate to={`/${userRole}/dashboard`} replace />
  }
  return children
}

function AppRouter() {
  const { isLoggedIn, user } = useAuth()
  const userRole = (user?.role || user?.userType || '').toLowerCase()

  return (
    <Routes>
      <Route
        path="/login"
        element={
          !isLoggedIn ? (
            <LoginPage />
          ) : (
            <Navigate to={`/${userRole}/dashboard`} replace />
          )
        }
      />
      <Route
        path="/"
        element={
          !isLoggedIn ? (
            <Navigate to="/login" replace />
          ) : (
            <Navigate to={`/${userRole}/dashboard`} replace />
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