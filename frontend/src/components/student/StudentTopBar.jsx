import React, { useState, useEffect } from 'react'
import { Sun, Moon, Bell, Menu, LogOut, Pencil, Lock, ChevronDown, ChevronUp, CheckCheck} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import studentService from '../../services/studentService'
import EditProfileModal from './EditProfileModal'
import ChangePasswordModal from './ChangePasswordModal'

export default function StudentTopBar({
  activeNav,
  dark,
  toggleDark,
  user,
  onLogout,
  sidebarOpen,
  setSidebarOpen,
  isMobile
}) {
  const { accentColor } = useTheme()
  const { updateUser } = useAuth()
  const BRAND = accentColor || '#615FFF'
  const [userDropdown, setUserDropdown] = useState(false)
  const [notifDropdown, setNotifDropdown] = useState(false)
  const [notifications, setNotifications] = useState([])

  // Modal states
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  // Local user profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || user?.full_name || 'Arjun Sharma',
    college: user?.college || user?.college_id || 'IIT Delhi',
    course: user?.course || 'B.Tech Computer Science',
    email: user?.email || 'arjun.sharma@iitd.ac.in',
    mobile: user?.mobile || user?.phone || '+91 98765 43210',
    avatar: user?.avatar || 'AS'
  })

  // Sync profileData when user prop changes from parent
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || user.full_name || 'Arjun Sharma',
        college: user.college || user.college_id || 'IIT Delhi',
        course: user.course || 'B.Tech Computer Science',
        email: user.email || 'arjun.sharma@iitd.ac.in',
        mobile: user.mobile || user.phone || '+91 98765 43210',
        avatar: user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : (user.full_name ? user.full_name.substring(0,2).toUpperCase() : 'AS')),
        gender: user.gender || 'male',
        department: user.department || '',
        yearOfStudy: user.year_of_study || user.yearOfStudy || 1,
        bio: user.bio || '',
      })
    }
  }, [user])

  // Fetch fresh profile from API on mount
  useEffect(() => {
    studentService.fetchProfile().then(res => {
      if (res.success && res.data) {
        const p = res.data
        setProfileData({
          name: p.name || p.full_name || '',
          college: p.college || p.college_id || '',
          course: p.course || '',
          email: p.email || '',
          mobile: p.mobile || p.phone || '',
          avatar: p.avatar || (p.name ? p.name.substring(0, 2).toUpperCase() : (p.full_name ? p.full_name.substring(0, 2).toUpperCase() : 'AS')),
          gender: p.gender || 'male',
          department: p.department || '',
          yearOfStudy: p.year_of_study || p.yearOfStudy || 1,
          bio: p.bio || '',
        })
      }
    })
  }, [])

  useEffect(() => {
    studentService.fetchNotifications().then(res => {
      if (res.success) {
        setNotifications(res.data)
      }
    })
  }, [])

  const unreadCount = notifications.filter(n => n.unread).length

  const handleMarkAsRead = (id, e) => {
    e.stopPropagation()
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    )
    studentService.markNotificationAsRead(id)
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, unread: false }))
    )
    studentService.markAllNotificationsAsRead()
  }

  const handleProfileUpdated = (updatedUser) => {
    setProfileData(prev => ({ ...prev, ...updatedUser }))
    updateUser(updatedUser)
  }

  return (
    <header className="h-[64px] shrink-0 border-b border-slate-200 dark:border-[#1a3050] bg-white dark:bg-[#0c1829] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300">
      
      {/* Left section: Hamburger mobile trigger + title */}
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#1e2d45] text-slate-600 dark:text-[#7a98bb] hover:bg-slate-100 dark:hover:bg-[#162640] transition-colors"
          >
            <Menu size={19} />
          </button>
        )}

        <div>
          <h1 className="text-[17px] sm:text-[19px] font-extrabold text-slate-800 dark:text-[#e8f0fe] m-0 tracking-tight flex items-center gap-2">
            {activeNav}
          </h1>
        </div>
      </div>

      {/* Right section: Theme Toggle, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Theme Mode Toggle Button */}
        <button
          onClick={toggleDark}
          title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-[#1e2d45] text-slate-600 dark:text-[#7a98bb] bg-slate-50 dark:bg-[#162640] hover:bg-slate-100 dark:hover:bg-[#1e2d45] cursor-pointer transition-all duration-150"
        >
          {dark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
        </button>

        {/* ── NOTIFICATION BELL BUTTON & POPUP PANEL ── */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifDropdown(!notifDropdown)
              setUserDropdown(false)
            }}
            title="Notifications"
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-[#1e2d45] text-slate-600 dark:text-[#7a98bb] bg-slate-50 dark:bg-[#162640] hover:bg-slate-100 dark:hover:bg-[#1e2d45] cursor-pointer transition-all duration-150"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-[#0c1829] animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Panel matching Figma layout */}
          {notifDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifDropdown(false)} />
              <div
                className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#0b1424] border border-slate-200 dark:border-[#182842] shadow-2xl z-50 overflow-hidden text-slate-700 dark:text-slate-200 animate-fadeIn"
                style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}
              >
                {/* Header */}
                <div className="px-4 py-3.5 border-b border-slate-100 dark:border-[#16263e] flex items-center justify-between bg-slate-50/50 dark:bg-[#0f1b30]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold m-0 text-slate-900 dark:text-white">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  {/* Read All button — always visible, disabled when nothing unread */}
                  <button
                    id="notif-read-all-btn"
                    onClick={unreadCount > 0 ? handleMarkAllAsRead : undefined}
                    disabled={unreadCount === 0}
                    className="w-8 h-8 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all bg-transparent cursor-pointer flex items-center justify-center duration-150"
                    style={{
                      background: unreadCount > 0 ? 'rgba(99,95,255,0.10)' : 'transparent',
                      color: unreadCount > 0 ? '#615FFF' : (dark ? '#3d5470' : '#c0cad8'),
                      borderColor: unreadCount > 0 ? 'rgba(99,95,255,0.25)' : (dark ? '#1a3050' : '#e2e8f0'),
                      cursor: unreadCount > 0 ? 'pointer' : 'not-allowed',
                    }}
                    title='Mark all read'
              >
                    <CheckCheck size={14} />
                  </button>
                </div>

                {/* Notification Items List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#16263e]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications right now.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={(e) => item.unread && handleMarkAsRead(item.id, e)}
                        className={`p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                          item.unread
                            ? 'bg-indigo-500/5 dark:bg-[#121f36]/80 hover:bg-indigo-500/10 dark:hover:bg-[#162846]'
                            : 'hover:bg-slate-50 dark:hover:bg-[#0e192c]'
                        }`}
                      >
                        {/* Indicator Dot */}
                        <div className="mt-1 shrink-0">
                          {item.unread ? (
                            <span className="block w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs shadow-indigo-500" />
                          ) : (
                            <span className="block w-2.5 h-2.5 rounded-full bg-transparent" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-[#e8f0fe] m-0 truncate">
                              {item.title}
                            </h4>
                          </div>

                          <p className="text-[11.5px] text-slate-600 dark:text-[#7a98bb] m-0 mt-0.5 leading-relaxed">
                            {item.message}
                          </p>

                          <p className="text-[10.5px] text-slate-400 dark:text-[#4d6a8f] m-0 mt-1 font-medium">
                            {item.time}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Action */}
                <div className="px-4 py-3 border-t border-slate-100 dark:border-[#16263e] bg-slate-50/50 dark:bg-[#0f1b30] text-center">
                  <button
                    id="notif-view-all-btn"
                    onClick={() => setNotifDropdown(false)}
                    className="text-xs font-extrabold bg-transparent border-none cursor-pointer transition-colors"
                    style={{ color: BRAND }}
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── STUDENT USER BADGE & DROPDOWN MATCHING FIGMA DESIGN ── */}
        <div className="relative">
          <button
            onClick={() => {
              setUserDropdown(!userDropdown)
              setNotifDropdown(false)
            }}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 dark:border-[#1e2d45] bg-slate-50 dark:bg-[#162640] hover:bg-slate-100 dark:hover:bg-[#1e2d45] cursor-pointer transition-all duration-150"
          >
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-bold overflow-hidden"
              style={{ background: BRAND }}
            >
              {(profileData.avatarUrl || profileData.profile_image || (typeof profileData.avatar === 'string' && (profileData.avatar.startsWith('data:') || profileData.avatar.startsWith('http')))) ? (
                <img src={profileData.avatarUrl || profileData.profile_image || profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profileData.avatar || profileData.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <span className="hidden sm:inline-block text-[13px] font-bold text-slate-800 dark:text-[#e8f0fe]">
              {profileData.name}
            </span>
            {userDropdown ? (
              <ChevronUp size={15} className="text-slate-400 dark:text-[#7a98bb] transition-transform" />
            ) : (
              <ChevronDown size={15} className="text-slate-400 dark:text-[#7a98bb] transition-transform" />
            )}
          </button>

          {/* Quick User Dropdown Popup (Matching Image 1) */}
          {userDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserDropdown(false)} />
              <div
                className="absolute right-0 mt-3 w-64 rounded-3xl bg-white dark:bg-[#0d1627] border border-slate-200 dark:border-[#182842] shadow-2xl z-50 p-3 text-slate-700 dark:text-slate-200 animate-fadeIn"
                style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}
              >
                {/* User Profile Header Card */}
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#121f36] mb-2">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-black shrink-0 shadow-md overflow-hidden"
                    style={{ background: BRAND }}
                  >
                    {(profileData.avatarUrl || profileData.profile_image || (typeof profileData.avatar === 'string' && (profileData.avatar.startsWith('data:') || profileData.avatar.startsWith('http')))) ? (
                      <img src={profileData.avatarUrl || profileData.profile_image || profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profileData.avatar || profileData.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white m-0 truncate">
                      {profileData.name}
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 dark:text-[#6c85a8] m-0 truncate">
                      {profileData.email}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-[#182842] my-2" />

                {/* Dropdown Menu Items */}
                <div className="flex flex-col gap-1">
                  {/* Edit Profile */}
                  <button
                    onClick={() => {
                      setUserDropdown(false)
                      setEditProfileOpen(true)
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-[#e8f0fe] hover:bg-slate-100 dark:hover:bg-[#15243e] border-none bg-transparent cursor-pointer transition-colors"
                  >
                    <Pencil size={16} className="text-slate-400 dark:text-[#7a98bb]" />
                    <span>Edit Profile</span>
                  </button>

                  {/* Change Password */}
                  <button
                    onClick={() => {
                      setUserDropdown(false)
                      setChangePasswordOpen(true)
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-[#e8f0fe] hover:bg-slate-100 dark:hover:bg-[#15243e] border-none bg-transparent cursor-pointer transition-colors"
                  >
                    <Lock size={16} className="text-slate-400 dark:text-[#7a98bb]" />
                    <span>Change Password</span>
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-[#182842] my-1" />

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      setUserDropdown(false)
                      onLogout()
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border-none bg-transparent cursor-pointer transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>

      {/* ── MODALS INTEGRATION ── */}
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        user={profileData}
        onProfileUpdated={handleProfileUpdated}
      />

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

    </header>
  )
}
