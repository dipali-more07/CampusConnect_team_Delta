import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Sun, Moon, Bell, LogOut, Pencil, Lock, ChevronDown, ChevronUp, CheckCheck, Trash2,
  GraduationCap, ChevronRight, HelpCircle
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import studentService from '../../services/studentService'
import EditProfileModal from './EditProfileModal'
import ChangePasswordModal from './ChangePasswordModal'

function getInitials(name) {
  if (!name || typeof name !== 'string') return 'CC'
  const parts = name.trim().split(/\s+/)
  const lastPart = parts.at(-1)
  if (parts.length >= 2 && lastPart) {
    return (parts[0][0] + lastPart[0]).toUpperCase()
  }
  return parts[0] ? parts[0].slice(0, 2).toUpperCase() : 'CC'
}

function getMarkAllStyle(unreadCount, dark) {
  if (unreadCount > 0) {
    return {
      background: 'rgba(99,95,255,0.10)',
      color: '#615FFF',
      borderColor: 'rgba(99,95,255,0.25)',
      cursor: 'pointer'
    }
  }
  return {
    background: 'transparent',
    color: dark ? '#3d5470' : '#c0cad8',
    borderColor: dark ? '#1a3050' : '#e2e8f0',
    cursor: 'not-allowed'
  }
}

let sharedAudioCtx = null;

const initAudioContext = () => {
  if (!sharedAudioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      sharedAudioCtx = new AudioContext();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

if (typeof window !== 'undefined') {
  window.addEventListener('click', initAudioContext, { passive: true });
  window.addEventListener('keydown', initAudioContext, { passive: true });
}

const playNotificationSound = () => {
  try {
    const ctx = initAudioContext();
    if (!ctx) return;
    
    // First chime (ding)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5 note
    gain1.gain.setValueAtTime(0.15, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.4)
    
    // Second chime (higher ding, slightly offset)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08) // A5 note
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.08)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.48)
    
    osc2.start(ctx.currentTime + 0.08)
    osc2.stop(ctx.currentTime + 0.48)
  } catch {
    /* ignore */
  }
}

function NotificationDropdown({ notifications, unreadCount, dark, handleMarkAllAsRead, handleMarkAsRead, handleDeleteNotification, isClosing, onClose }) {
  const markAllStyle = getMarkAllStyle(unreadCount, dark)

  return (
    <>
      <button
        type="button"
        aria-label="Close notifications"
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-none border-none p-0 cursor-default transition-all duration-200"
        onClick={onClose}
      />
      <div
        className={`absolute -right-[50px] sm:right-0 mt-3 w-[320px] sm:w-96 max-w-[calc(100vw-32px)] z-50 text-slate-700 dark:text-slate-200 ${
          isClosing ? 'animate-dropdown-out' : 'animate-dropdown-in'
        }`}
      >
        {/* Dropdown Indicator Pointer */}
        <div className="absolute -top-2 right-[62px] sm:right-3 w-4 h-4 bg-white dark:bg-[#0b1424] border-t border-l border-slate-200 dark:border-[#182842] transform rotate-45 z-0 rounded-tl-sm" />

        {/* Inner Container */}
        <div 
          className="relative z-10 w-full rounded-2xl bg-white dark:bg-[#0b1424] border border-slate-200 dark:border-[#182842] overflow-hidden"
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

          <button
            id="notif-read-all-btn"
            type="button"
            onClick={unreadCount > 0 ? handleMarkAllAsRead : undefined}
            disabled={unreadCount === 0}
            className="w-8 h-8 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all duration-150 flex items-center justify-center cursor-pointer"
            style={markAllStyle}
            title="Mark all read"
          >
            <CheckCheck size={14} />
          </button>
        </div>

        {/* Notification Items List */}
        <div className="max-h-[280px] sm:max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#16263e]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No notifications right now.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={(e) => item.unread && handleMarkAsRead(item.id, e)}
                className={`group w-full text-left p-3.5 sm:p-4 flex items-start justify-between gap-3 transition-colors border-b border-slate-100 dark:border-[#16263e]/50 cursor-pointer ${
                  item.unread
                    ? 'bg-indigo-500/5 dark:bg-[#121f36]/80 hover:bg-indigo-500/10 dark:hover:bg-[#162846]'
                    : 'hover:bg-slate-50 dark:hover:bg-[#0e192c] bg-transparent'
                }`}
              >
                <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
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

                    <p className="text-[10px] sm:text-[10.5px] text-slate-400 dark:text-[#4d6a8f] m-0 mt-1 font-medium">
                      {item.time}
                    </p>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteNotification(item.id)
                  }}
                  className="shrink-0 p-1.5 rounded-lg border border-slate-200 dark:border-[#1e2d45] text-slate-400 dark:text-[#4a6a8a] bg-slate-50 dark:bg-[#162640] hover:border-red-500 hover:text-red-500 dark:hover:border-red-500/50 dark:hover:text-red-400 transition-all sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 cursor-pointer flex items-center justify-center"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
      <style>{`
        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes dropdownOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(-8px);
          }
        }
        .animate-dropdown-in {
          transform-origin: top right;
          animation: dropdownIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-dropdown-out {
          transform-origin: top right;
          animation: dropdownOut 0.12s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  )
}

function UserMenuDropdown({ profileData, brandColor, isClosing, onClose, setEditProfileOpen, setChangePasswordOpen, onLogout }) {
  const avatarSrc = profileData.avatarUrl || profileData.profile_image || (typeof profileData.avatar === 'string' && (profileData.avatar.startsWith('data:') || profileData.avatar.startsWith('http')) ? profileData.avatar : null)

  return (
    <>
      <button
        type="button"
        aria-label="Close user menu"
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-none border-none p-0 cursor-default transition-all duration-200"
        onClick={onClose}
      />
      <div
        className={`absolute right-0 mt-3 w-64 rounded-3xl bg-white dark:bg-[#0d1627] border border-slate-200 dark:border-[#182842] shadow-2xl z-50 p-3 text-slate-700 dark:text-slate-200 ${
          isClosing ? 'animate-dropdown-out' : 'animate-dropdown-in'
        }`}
        style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}
      >
        {/* Dropdown Indicator Pointer */}
        <div className="absolute -top-2 right-8 w-4 h-4 bg-white dark:bg-[#0d1627] border-t border-l border-slate-200 dark:border-[#182842] transform rotate-45 z-0 rounded-tl-sm" />

        {/* User Profile Header Card */}
        <div className="relative z-10 flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#121f36] mb-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-black shrink-0 shadow-md overflow-hidden"
            style={{ background: brandColor }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              getInitials(profileData.name)
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
          <button
            type="button"
            onClick={() => {
              onClose()
              setEditProfileOpen(true)
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-[#e8f0fe] hover:bg-slate-100 dark:hover:bg-[#15243e] border-none bg-transparent cursor-pointer transition-colors"
          >
            <Pencil size={16} className="text-slate-400 dark:text-[#7a98bb]" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose()
              setChangePasswordOpen(true)
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-[#e8f0fe] hover:bg-slate-100 dark:hover:bg-[#15243e] border-none bg-transparent cursor-pointer transition-colors"
          >
            <Lock size={16} className="text-slate-400 dark:text-[#7a98bb]" />
            <span>Change Password</span>
          </button>

          <Link
            to="/faq"
            onClick={() => onClose()}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-[#e8f0fe] hover:bg-slate-100 dark:hover:bg-[#15243e] border-none bg-transparent cursor-pointer transition-colors no-underline"
          >
            <HelpCircle size={16} className="text-slate-400 dark:text-[#7a98bb]" />
            <span>FAQ & Help</span>
          </Link>

          <div className="h-px bg-slate-100 dark:bg-[#182842] my-1" />

          <button
            type="button"
            onClick={() => {
              onClose()
              onLogout()
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border-none bg-transparent cursor-pointer transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes dropdownOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(-8px);
          }
        }
        .animate-dropdown-in {
          transform-origin: top right;
          animation: dropdownIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-dropdown-out {
          transform-origin: top right;
          animation: dropdownOut 0.12s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  )
}

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
  const [logoHover, setLogoHover] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  const [notifDropdown, setNotifDropdown] = useState(false)
  const [notifications, setNotifications] = useState([])

  const triggerNotifClose = () => {
    setNotifDropdown('closing')
    setTimeout(() => {
      setNotifDropdown(false)
    }, 120)
  }

  const triggerUserClose = () => {
    setUserDropdown('closing')
    setTimeout(() => {
      setUserDropdown(false)
    }, 120)
  }

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
      const uName = user.name || user.full_name || 'Jayesh Nikumbh'
      queueMicrotask(() => {
        setProfileData({
          name: uName,
          college: user.college || user.college_id || 'IIT Delhi',
          course: user.course || 'B.Tech Computer Science',
          email: user.email || 'jnikumbh69@gmail.com',
          mobile: user.mobile || user.phone || '+91 98765 43210',
          avatar: user.avatar || getInitials(uName),
          gender: user.gender || 'male',
          department: user.department || '',
          yearOfStudy: user.year_of_study || user.yearOfStudy || 1,
          bio: user.bio || '',
        })
      })
    }
  }, [user])

  // Fetch fresh profile from API on mount
  useEffect(() => {
    studentService.fetchProfile().then(res => {
      if (res.success && res.data) {
        const p = res.data
        const pName = p.name || p.full_name || ''
        setProfileData({
          name: pName,
          college: p.college || p.college_id || '',
          course: p.course || '',
          email: p.email || '',
          mobile: p.mobile || p.phone || '',
          avatar: p.avatar || getInitials(pName),
          gender: p.gender || 'male',
          department: p.department || '',
          yearOfStudy: p.year_of_study || p.yearOfStudy || 1,
          bio: p.bio || '',
        })
      }
    })
  }, [])

  useEffect(() => {
    const getNotifs = () => {
      studentService.fetchNotifications().then(res => {
        if (res.success) {
          setNotifications(prev => {
            if (prev.length > 0) {
              const prevIds = new Set(prev.map(n => n.id))
              const hasNewUnread = res.data.some(n => n.unread && !prevIds.has(n.id))
              if (hasNewUnread) {
                playNotificationSound()
              }
            }
            return res.data
          })
        }
      })
    }
    getNotifs()

    // Listen to BroadcastChannel for real-time notification changes
    const channel = new BroadcastChannel('cc_notifications_channel')
    const handleMessage = (e) => {
      if (e.data === 'refresh_notifications') {
        getNotifs()
      }
    }
    channel.addEventListener('message', handleMessage)
    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [])

  const unreadCount = notifications.filter(n => n.unread).length

  const handleMarkAsRead = (id, e) => {
    e.stopPropagation()
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    )
    studentService.markNotificationAsRead(id)
    try {
      const channel = new BroadcastChannel('cc_notifications_channel')
      channel.postMessage('refresh_notifications')
      channel.close()
    } catch { /* ignore */ }
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, unread: false }))
    )
    studentService.markAllNotificationsAsRead()
    try {
      const channel = new BroadcastChannel('cc_notifications_channel')
      channel.postMessage('refresh_notifications')
      channel.close()
    } catch { /* ignore */ }
  }

  const handleDeleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    studentService.deleteNotification(id)
    try {
      const channel = new BroadcastChannel('cc_notifications_channel')
      channel.postMessage('refresh_notifications')
      channel.close()
    } catch { /* ignore */ }
  }

  const handleProfileUpdated = (updatedUser) => {
    setProfileData(prev => ({ ...prev, ...updatedUser }))
    updateUser(updatedUser)
  }

  const avatarSrc = profileData.avatarUrl || profileData.profile_image || (typeof profileData.avatar === 'string' && (profileData.avatar.startsWith('data:') || profileData.avatar.startsWith('http')) ? profileData.avatar : null)

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-[#0c1829] border-b border-slate-200 dark:border-[#1a3050] px-4 sm:px-6 py-3 flex items-center transition-all duration-300 shadow-sm dark:shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
      
      {/* Mobile Sidebar Hamburger Toggle & Logo */}
      {isMobile ? (
        <div className="flex items-center gap-2.5 mr-3 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1a3050] bg-transparent text-slate-500 dark:text-[#7a98bb] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#162640] transition-all duration-150"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div
            className="flex items-center gap-2 cursor-pointer"
            onMouseEnter={() => setLogoHover(true)}
            onMouseLeave={() => setLogoHover(false)}
          >
            <div
              className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shadow-sm"
              style={{
                background: BRAND,
                transform: logoHover ? 'scale(1.2) rotate(-8deg)' : 'scale(1) rotate(0deg)',
                boxShadow: logoHover ? `0 0 0 5px ${BRAND}30, 0 4px 16px ${BRAND}50` : undefined,
                transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
              }}
            >
              <GraduationCap
                size={16}
                color="#fff"
                style={{
                  transform: logoHover ? 'rotate(8deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              />
            </div>
            <span
              className="text-[14.5px] font-extrabold leading-none text-slate-900 dark:text-[#e8f0fe]"
              style={{
                color: logoHover ? BRAND : undefined,
                transition: 'color 0.25s ease',
              }}
            >
              CampusConnect
            </span>
          </div>
        </div>
      ) : (
        /* Breadcrumb on Desktop */
        <div className="flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-[#4a6a8a] font-medium">
          <span>CampusConnect</span>
          <ChevronRight size={12} className="text-slate-300 dark:text-[#2a4060]" />
          <span className="text-slate-900 dark:text-[#e8f0fe] font-bold">{activeNav}</span>
        </div>
      )}

      {/* Right section: Theme Toggle, Notifications, User Profile */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">

        {/* Theme Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleDark}
          title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-[38px] h-[38px] rounded-[10px] border border-slate-200 dark:border-[#1a3050] flex items-center justify-center cursor-pointer shrink-0 transition-all duration-200 bg-slate-100 dark:bg-[#162640] text-slate-500 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-[#1c3050]"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* ── NOTIFICATION BELL BUTTON & POPUP PANEL ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (notifDropdown === true) {
                triggerNotifClose()
              } else if (!notifDropdown) {
                setNotifDropdown(true)
                setUserDropdown(false)
              }
            }}
            title="Notifications"
            className="relative w-[38px] h-[38px] rounded-[10px] flex items-center justify-center cursor-pointer transition-all duration-200 border border-slate-200 dark:border-[#1a3050] text-slate-500 dark:text-[#7a98bb] hover:border-brand hover:text-brand dark:hover:border-brand dark:hover:text-brand"
            style={{
              border: notifDropdown && notifDropdown !== 'closing' ? `1px solid ${BRAND}` : undefined,
              background: notifDropdown && notifDropdown !== 'closing' ? `${BRAND}18` : undefined,
              color: notifDropdown && notifDropdown !== 'closing' ? BRAND : undefined,
            }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 rounded-full bg-red-500 text-white flex items-center justify-center border-[1.5px] border-white dark:border-[#0c1829] font-extrabold"
                style={{
                  width: unreadCount > 9 ? 14 : 8,
                  height: unreadCount > 9 ? 14 : 8,
                  fontSize: 9,
                }}
              >
                {unreadCount > 9 ? '9+' : ''}
              </span>
            )}
          </button>

          {notifDropdown && (
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              dark={dark}
              brandColor={BRAND}
              handleMarkAllAsRead={handleMarkAllAsRead}
              handleMarkAsRead={handleMarkAsRead}
              handleDeleteNotification={handleDeleteNotification}
              isClosing={notifDropdown === 'closing'}
              onClose={triggerNotifClose}
            />
          )}
        </div>

        {/* ── STUDENT USER BADGE & DROPDOWN ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (userDropdown === true) {
                triggerUserClose()
              } else if (!userDropdown) {
                setUserDropdown(true)
                setNotifDropdown(false)
              }
            }}
            className="flex items-center gap-1.5 pl-1.5 pr-2 sm:pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1a3050] bg-transparent cursor-pointer hover:bg-slate-50 dark:hover:bg-[#162640] transition-all duration-150"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold overflow-hidden"
              style={{ background: BRAND }}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(profileData.name)
              )}
            </div>
            <span className="hidden sm:inline text-[13px] font-semibold text-slate-800 dark:text-[#e8f0fe] max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
              {profileData.name}
            </span>
            {userDropdown && userDropdown !== 'closing' ? (
              <ChevronUp size={14} className="text-slate-400 dark:text-[#7a98bb] transition-transform shrink-0" />
            ) : (
              <ChevronDown size={14} className="text-slate-400 dark:text-[#7a98bb] transition-transform shrink-0" />
            )}
          </button>

          {userDropdown && (
            <UserMenuDropdown
              profileData={profileData}
              brandColor={BRAND}
              isClosing={userDropdown === 'closing'}
              onClose={triggerUserClose}
              setEditProfileOpen={setEditProfileOpen}
              setChangePasswordOpen={setChangePasswordOpen}
              onLogout={onLogout}
            />
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
