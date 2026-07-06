/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useTheme } from '../../context/ThemeContext'
import { Plus, QrCode, Megaphone, Download } from 'lucide-react'
import { BRAND } from '../../data/dashboardData'
import notificationsService, { enrichNotification } from '../../services/notificationsService'
import dashboardService, { enrichStats } from '../../services/dashboardService'
import DashboardSidebar from '../../components/admin/adminDashboard/DashboardSidebar'
import DashboardTopBar from '../../components/admin/adminDashboard/DashboardTopBar'
import StatsCards from '../../components/admin/adminDashboard/StatsCards'
import ChartsRow from '../../components/admin/adminDashboard/ChartsRow'
import BottomRow from '../../components/admin/adminDashboard/BottomRow'
import NotificationsPage from '../Admin/NotificationsPage'
import EventsPage from '../Admin/EventsPage'
import AttendancePage from '../Admin/AttendancePage'
import ResultsPage from '../Admin/ResultsPage'
import AnalyticsPage from '../Admin/AnalyticsPage'
import CertificatesPage from '../Admin/CertificatesPage'
import StudentsPage from '../Admin/StudentsPage'
import OrganizersPage from '../Admin/OrganizersPage'
import SettingsPage from '../Admin/SettingsPage'
import NotificationPanel from '../../components/admin/adminDashboard/NotificationPanel'
import PageTransition from '../../components/common/PageTransition'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const showToast = useToast()
  const { dark, toggleDark, accentColor } = useTheme()
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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

  // ── Shared notifications state — raw from API, enriched before render
  const [rawNotifications, setRawNotifications] = useState([])
  const [notifStats, setNotifStats] = useState({})
  const [notifLoading, setNotifLoading] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)

  // ── Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)

  // Enriched = raw data + icon/color added by frontend (type mapping)
  const notifications = rawNotifications.map(enrichNotification)
  const unreadCount = notifications.filter(n => n.unread).length

  // ── Load notifications from service (mock or real API)
  useEffect(() => {
    let cancelled = false
    setNotifLoading(true)
    notificationsService.fetchAll().then(res => {
      if (cancelled) return
      if (res.success) {
        setRawNotifications(res.notifications)
        setNotifStats(res.stats)
      }
      setNotifLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  // ── Load dashboard stats from service
  useEffect(() => {
    let cancelled = false
    setStatsLoading(true)
    dashboardService.fetchStats().then(res => {
      if (cancelled) return
      if (res.success) {
        setDashboardStats(enrichStats(res.stats))
      }
      setStatsLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  // ── Optimistic mark-read (updates UI instantly, syncs to API)
  const handleMarkRead = (ids) => {
    setRawNotifications(prev =>
      prev.map(n => ids.includes(n.id) ? { ...n, unread: false } : n)
    )
    notificationsService.markRead(ids)
  }

  // ── Optimistic delete
  const handleDelete = (id) => {
    setRawNotifications(prev => prev.filter(n => n.id !== id))
    notificationsService.delete(id)
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    logout()
    showToast('Logged out successfully.', 'info')
  }

  const cancelLogout = () => {
    setShowLogoutModal(false)
  }

  /* ── Theme tokens (shared via prop) ── */
  const tokens = {
    dark,
    brand: accentColor || BRAND,
    bg: dark ? '#060e1c' : '#f4f6fa',        // deepest dark base
    sidebar: dark ? '#0c1829' : '#ffffff',          // sidebar — distinct from bg
    header: dark ? '#0c1829' : '#ffffff',
    card: dark ? '#0f1e30' : '#ffffff',          // cards — pop above bg
    border: dark ? '#1a3050' : '#e2e8f0',          // blue-tinted border
    shadow: dark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.04)',  // unified card shadow
    txtPri: dark ? '#e8f0fe' : '#0f172a',
    txtSec: dark ? '#7a98bb' : '#64748b',
    txtMuted: dark ? '#3d5470' : '#94a3b8',
    inputBg: dark ? '#060e1c' : '#ffffff',
    hoverBg: dark ? '#162640' : '#f1f5f9',
  }

  const isNotificationsPage = activeNav === 'Notifications'

  return (
    <div className="h-screen w-full max-w-full flex bg-[#f4f6fa] dark:bg-[#060e1c] font-[Manrope,sans-serif] transition-colors duration-300 relative overflow-hidden">

      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 transition-opacity duration-300"
        />
      )}

      <DashboardSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        dark={dark}
        onLogout={handleLogout}
        unreadCount={unreadCount}
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
      />

      {/* ── Notification Slide-in Panel ── */}
      <NotificationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onDelete={handleDelete}
        onNavigate={(page) => { setActiveNav(page); setPanelOpen(false) }}
        tokens={tokens}
      />

      <main
        className="flex-1 flex flex-col h-screen overflow-hidden transition-[margin-left,width] duration-300 min-w-0"
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? 70 : 240),
          width: isMobile ? '100%' : `calc(100% - ${collapsed ? 70 : 240}px)`,
        }}
      >

        <DashboardTopBar
          activeNav={activeNav}
          dark={dark}
          toggleDark={toggleDark}
          user={user}
          panelOpen={panelOpen}
          setPanelOpen={setPanelOpen}
          unreadCount={unreadCount}
          tokens={tokens}
          setActiveNav={setActiveNav}
          onLogout={handleLogout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
        />

        {/* ── PAGE BODY ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative min-w-0">
          <PageTransition pageKey={activeNav}>
            {activeNav === 'Events' ? (
              /* ─── Events Page ─── */
              <EventsPage tokens={tokens} />
            ) : activeNav === 'Results' ? (
              /* ─── Results Page ─── */
              <ResultsPage tokens={tokens} />
            ) : activeNav === 'Attendance' ? (
              /* ─── Attendance Page ─── */
              <AttendancePage tokens={tokens} />
            ) : activeNav === 'Analytics' ? (
              /* ─── Analytics Page ─── */
              <AnalyticsPage tokens={tokens} />
            ) : activeNav === 'Certificates' ? (
              /* ─── Certificates Page ─── */
              <CertificatesPage tokens={tokens} />
            ) : activeNav === 'Students' ? (
              /* ─── Students Page ─── */
              <StudentsPage tokens={tokens} />
            ) : activeNav === 'Organizers' ? (
              /* ─── Organizers Page ─── */
              <OrganizersPage tokens={tokens} />
            ) : activeNav === 'Settings' ? (
              /* ─── Settings Page ─── */
              <SettingsPage tokens={tokens} />
            ) : isNotificationsPage ? (
              /* ─── Notifications Page ─── */
              <NotificationsPage
                tokens={tokens}
                notifications={notifications}
                stats={notifStats}
                loading={notifLoading}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ) : (
              /* ─── Default Dashboard ─── */
              <div className="p-6">
                {/* Page title + action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-[28px] font-extrabold text-slate-900 dark:text-slate-100 m-0 tracking-tight">Admin Dashboard</h1>
                    <p className="text-[13px] text-slate-500 dark:text-[#7a98bb] mt-1">{today}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveNav('Events')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-px"
                      style={{ background: BRAND, boxShadow: '0 4px 12px rgba(97,95,255,0.25)' }}
                    >
                      <Plus size={15} /> Create Event
                    </button>
                    <button
                      onClick={() => setActiveNav('Attendance')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-white dark:bg-[#1a2236] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-[#1e2d45] cursor-pointer transition-all duration-150 hover:bg-slate-50 dark:hover:bg-[#1e2d45]"
                    >
                      <QrCode size={15} className="text-slate-400 dark:text-slate-500" /> Generate QR
                    </button>
                    <button
                      onClick={() => setActiveNav('Notifications')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-white dark:bg-[#1a2236] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-[#1e2d45] cursor-pointer transition-all duration-150 hover:bg-slate-50 dark:hover:bg-[#1e2d45]"
                    >
                      <Megaphone size={15} className="text-slate-400 dark:text-slate-500" /> Notify
                    </button>
                    <button
                      onClick={() => setActiveNav('Analytics')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-white dark:bg-[#1a2236] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-[#1e2d45] cursor-pointer transition-all duration-150 hover:bg-slate-50 dark:hover:bg-[#1e2d45]"
                    >
                      <Download size={15} className="text-slate-400 dark:text-slate-500" /> Report
                    </button>
                  </div>
                </div>

                <StatsCards tokens={tokens} stats={dashboardStats} loading={statsLoading} />
                <ChartsRow dark={dark} tokens={tokens} />
                <BottomRow dark={dark} tokens={tokens} />
              </div>
            )}
          </PageTransition>
        </div>
      </main>

      {/* ── LOGOUT CONFIRMATION MODAL ── */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelLogout}
          />

          {/* Modal */}
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: dark ? '#0c1829' : '#ffffff',
              border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`,
              animation: 'logoutModalIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Top accent bar */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#ef4444,#f97316)' }} />

            <div className="p-7 flex flex-col items-center text-center">
              {/* Icon */}
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
                Are you sure you want to log out?
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