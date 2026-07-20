import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useTheme } from '../../context/ThemeContext'
import { BRAND } from '../../data/dashboardData'
import studentService from '../../services/studentService'

import StudentSidebar from '../../components/student/StudentSidebar'
import StudentTopBar from '../../components/student/StudentTopBar'
import StudentWelcomeBanner from '../../components/student/StudentWelcomeBanner'
import StudentStatsCards from '../../components/student/StudentStatsCards'
import StudentPerformanceCard from '../../components/student/StudentPerformanceCard'
import StudentRegisteredEventsCard from '../../components/student/StudentRegisteredEventsCard'

import AttendancePage from './AttendancePage'
import EventsPage from './EventsPage'
import ResultsPage from './ResultsPage'
import CertificatesPage from './CertificatesPage'
import PaymentsPage from './PaymentsPage'
import PageTransition from '../../components/common/PageTransition'

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const showToast = useToast()
  const { dark, toggleDark, accentColor } = useTheme()

  const location = useLocation()
  const navigate = useNavigate()

  const getActiveNavFromPath = (pathname) => {
    const segment = pathname.split('/').pop()?.toLowerCase()
    switch (segment) {
      case 'attendance':
        return 'Attendance'
      case 'events':
        return 'Events'
      case 'results':
        return 'Results'
      case 'certificates':
        return 'Certificates'
      case 'payments':
        return 'Payments'
      case 'dashboard':
      default:
        return 'Dashboard'
    }
  }

  const activeNav = getActiveNavFromPath(location.pathname)

  const setActiveNav = (label) => {
    navigate(`/student/${label.toLowerCase()}`)
  }
  
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Service data states
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
        let cancelled = false
    setLoading(true)
    studentService.fetchDashboardOverview().then(res => {
            if (cancelled) return
      if (res.success) {
        setDashboardData(res.data)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) {
        setSidebarOpen(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    localStorage.removeItem('cc_student_active_nav')
    logout()
    showToast('Logged out successfully.', 'info')
  }

  const cancelLogout = () => {
    setShowLogoutModal(false)
  }

  /* ── Unified Theme Tokens matching app theme ── */
  const tokens = {
    dark,
    brand: accentColor || BRAND,
    bg: dark ? '#060e1c' : '#f4f6fa',
    sidebar: dark ? '#0c1829' : '#ffffff',
    header: dark ? '#0c1829' : '#ffffff',
    card: dark ? '#0f1e30' : '#ffffff',
    border: dark ? '#1a3050' : '#e2e8f0',
    shadow: dark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.04)',
    txtPri: dark ? '#e8f0fe' : '#0f172a',
    txtSec: dark ? '#7a98bb' : '#64748b',
    txtMuted: dark ? '#3d5470' : '#94a3b8',
    inputBg: dark ? '#060e1c' : '#ffffff',
    hoverBg: dark ? '#162640' : '#f1f5f9',
  }

  return (
    <div className="h-screen w-full max-w-full flex bg-[#f4f6fa] dark:bg-[#060e1c] font-[Manrope,sans-serif] transition-colors duration-300 relative overflow-hidden">

      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 transition-opacity duration-300"
        />
      )}

      {/* Student Navigation Sidebar */}
      <StudentSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        dark={dark}
        onLogout={handleLogout}
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
      />

      {/* Main Content Workspace */}
      <main
        className="flex-1 flex flex-col h-screen overflow-hidden transition-[margin-left,width] duration-300"
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? 70 : 240),
          width: isMobile ? '100%' : `calc(100% - ${collapsed ? 70 : 240}px)`,
        }}
      >
        <StudentTopBar
          activeNav={activeNav}
          dark={dark}
          toggleDark={toggleDark}
          user={user}
          onLogout={handleLogout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
        />

        {/* Dynamic Page Views from src/pages/Student/ */}
        <div className="flex-1 overflow-y-auto relative">
          <PageTransition pageKey={activeNav}>
            {activeNav === 'Attendance' ? (
              <AttendancePage tokens={tokens} user={user} />
            ) : activeNav === 'Events' ? (
              <EventsPage tokens={tokens} user={user} />
            ) : activeNav === 'Results' ? (
              <ResultsPage tokens={tokens} user={user} />
            ) : activeNav === 'Certificates' ? (
              <CertificatesPage tokens={tokens} user={user} />
            ) : activeNav === 'Payments' ? (
              <PaymentsPage tokens={tokens} user={user} />
            ) : (
              /* ── Default Main Student Dashboard Overview ── */
              <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
                {/* Welcome Banner */}
                <StudentWelcomeBanner user={user} tokens={tokens} />

                {/* 3 Metric Cards */}
                <StudentStatsCards
                  tokens={tokens}
                  onNavigate={setActiveNav}
                  statsData={dashboardData?.stats}
                />

                {/* Main Grid: Performance Donut & Bars (Left) + Registered Events (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7">
                    <StudentPerformanceCard
                      tokens={tokens}
                      performanceData={dashboardData?.performance}
                    />
                  </div>
                  <div className="lg:col-span-5">
                    <StudentRegisteredEventsCard
                      tokens={tokens}
                      onNavigate={setActiveNav}
                      eventsList={dashboardData?.registeredEvents}
                    />
                  </div>
                </div>
              </div>
            )}
          </PageTransition>
        </div>
      </main>

      {/* ── LOGOUT CONFIRMATION MODAL ── */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={cancelLogout}
          />

          <div
            className="relative z-10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: dark ? '#0c1829' : '#ffffff',
              border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`,
              animation: 'logoutModalIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#ef4444,#f97316)' }} />

            <div className="p-7 flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md"
                style={{ background: dark ? 'rgba(239,68,68,0.15)' : '#fef2f2', border: dark ? '1px solid rgba(239,68,68,0.25)' : '1px solid #fecaca' }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>

              <h3
                className="text-[18px] font-black mb-2 m-0"
                style={{ color: dark ? '#e8f0fe' : '#0f172a' }}
              >
                Logout ?
              </h3>
              <p
                className="text-[13.5px] leading-relaxed m-0 mb-6"
                style={{ color: dark ? '#7a98bb' : '#64748b' }}
              >
                Are you sure you want to log out from Student Portal?
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelLogout}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border cursor-pointer transition-all duration-150 hover:bg-slate-50 dark:hover:bg-[#162640]"
                  style={{
                    color: dark ? '#7a98bb' : '#475569',
                    borderColor: dark ? '#1a3050' : '#e2e8f0',
                    background: 'transparent',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border-none cursor-pointer text-white transition-all duration-150 hover:opacity-90 hover:-translate-y-px"
                  style={{
                    background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                    boxShadow: '0 4px 14px rgba(239,68,68,0.35)',
                  }}
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes logoutModalIn {
              from { opacity: 0; transform: scale(0.88) translateY(12px); }
              to   { opacity: 1; transform: scale(1)    translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
