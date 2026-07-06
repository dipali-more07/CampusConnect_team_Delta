import React from 'react'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/Admin/AdminDashboard'
import StudentDashboard from './pages/Student/StudentDashboard'

import PageTransition from './components/common/PageTransition'

/**
 * Router — simple role-based conditional render.
 * Replace with react-router-dom when routes grow.
 */
function AppRouter() {
  const { isLoggedIn, user } = useAuth()

  const userRole = (user?.role || user?.userType || '').toLowerCase()
  const routeKey = !isLoggedIn ? 'login' : userRole || 'authenticated'

  return (
    <PageTransition pageKey={routeKey}>
      {!isLoggedIn ? (
        <LoginPage />
      ) : userRole === 'student' ? (
        <StudentDashboard />
      ) : (
        <AdminDashboard />
      )}
    </PageTransition>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}