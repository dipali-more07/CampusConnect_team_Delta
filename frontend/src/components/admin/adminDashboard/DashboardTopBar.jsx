import React, { useState, useEffect, useRef } from 'react'
import { Search, Moon, Sun, Bell, MessageSquare, ChevronRight, ChevronDown, User, Settings, Key, LogOut, GraduationCap } from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'

export default function DashboardTopBar({
  activeNav,
  dark,
  toggleDark,
  user,
  panelOpen,
  setPanelOpen,
  unreadCount,
  tokens,
  setActiveNav,
  onLogout,
  setSidebarOpen,
  isMobile
}) {
  const { accentColor } = useTheme()
  const BRAND = tokens?.brand || accentColor || '#615FFF'
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [logoHover, setLogoHover] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavClick = (tabName) => {
    setDropdownOpen(false)
    if (setActiveNav) {
      setActiveNav('Settings')
      // Store tab name in both localStorage and sessionStorage so SettingsPage can auto-switch to it
      localStorage.setItem('settings_active_tab', tabName)
      sessionStorage.setItem('settings_active_tab', tabName)
      // Trigger event or fast state change so SettingsPage updates if already mounted
      window.dispatchEvent(new Event('settings_tab_change'))
    }
  }

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-[#0c1829] border-b border-slate-200 dark:border-[#1a3050] px-4 sm:px-6 py-3 flex items-center transition-all duration-300 shadow-sm dark:shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
      
      {/* Mobile Sidebar Hamburger Toggle & Logo */}
      {isMobile && (
        <div className="flex items-center gap-2.5 mr-3 shrink-0">
          <button
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
              className="text-[14.5px] font-extrabold leading-none"
              style={{
                color: logoHover ? BRAND : undefined,
                transition: 'color 0.25s ease',
              }}
            >
              CampusConnect
            </span>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="hidden sm:flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-[#4a6a8a] font-medium">
        <span>CampusConnect</span>
        <ChevronRight size={12} className="text-slate-300 dark:text-[#2a4060]" />
        <span className="text-slate-900 dark:text-[#e8f0fe] font-bold">{activeNav}</span>
      </div>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">

        {/* Theme toggle */}
        <button
          onClick={toggleDark}
          title={dark ? 'Switch to Light' : 'Switch to Dark'}
          className="w-[38px] h-[38px] rounded-[10px] border border-slate-200 dark:border-[#1a3050] flex items-center justify-center cursor-pointer shrink-0 transition-all duration-200 bg-slate-100 dark:bg-[#162640] text-slate-500 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-[#1c3050]"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Bell — triggers slide-in panel */}
        <button
          onClick={() => setPanelOpen(prev => !prev)}
          title="Notifications"
          className="relative w-[38px] h-[38px] rounded-[10px] flex items-center justify-center cursor-pointer transition-all duration-200 border border-slate-200 dark:border-[#1a3050] text-slate-500 dark:text-[#7a98bb] hover:border-brand hover:text-brand dark:hover:border-brand dark:hover:text-brand"
          style={{
            border: panelOpen ? `1px solid ${BRAND}` : undefined,
            background: panelOpen ? `${BRAND}18` : undefined,
            color: panelOpen ? BRAND : undefined,
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

        {/* User pill / Dropdown trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 pl-1.5 pr-1.5 sm:pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1a3050] bg-transparent cursor-pointer hover:bg-slate-50 dark:hover:bg-[#162640] transition-all duration-150"
          >
            <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0 overflow-hidden">
              {(user?.avatarUrl || user?.profile_image || (typeof user?.avatar === 'string' && (user.avatar.startsWith('data:') || user.avatar.startsWith('http')))) ? (
                <img src={user?.avatarUrl || user?.profile_image || user?.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.avatar || (user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'DP')
              )}
            </div>
            <span className="hidden sm:inline text-[13px] font-semibold text-slate-800 dark:text-[#e8f0fe] max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
              {user?.name || 'Dr. Priya Sharma'}
            </span>
            <ChevronDown size={14} className="hidden sm:block text-slate-400 dark:text-[#3d5470]" />
          </button>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-[220px] rounded-2xl overflow-hidden border z-50"
              style={{
                background: tokens.card,
                borderColor: tokens.border,
                boxShadow: dark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.08)',
                animation: 'slideUp 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Header inside dropdown */}
              <div className="px-4 py-3.5 border-b" style={{ borderColor: tokens.border }}>
                <p className="text-[13.5px] font-extrabold m-0" style={{ color: tokens.txtPri }}>
                  {user?.name || 'Dr. Priya Sharma'}
                </p>
                <p className="text-[11px] font-medium m-0 mt-0.5 truncate" style={{ color: tokens.txtSec }}>
                  {user?.email || 'admin@university.edu'}
                </p>
              </div>

              {/* Items */}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => handleNavClick('Profile')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-bold border-none bg-transparent cursor-pointer text-left transition-all duration-150"
                  style={{ color: tokens.txtPri }}
                  onMouseEnter={e => e.currentTarget.style.background = tokens.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <User size={14} style={{ color: tokens.txtMuted }} />
                  Profile
                </button>

                <button
                  onClick={() => handleNavClick('Appearance')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-bold border-none bg-transparent cursor-pointer text-left transition-all duration-150"
                  style={{ color: tokens.txtPri }}
                  onMouseEnter={e => e.currentTarget.style.background = tokens.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Settings size={14} style={{ color: tokens.txtMuted }} />
                  Settings
                </button>

                <button
                  onClick={() => handleNavClick('Security')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-bold border-none bg-transparent cursor-pointer text-left transition-all duration-150"
                  style={{ color: tokens.txtPri }}
                  onMouseEnter={e => e.currentTarget.style.background = tokens.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Key size={14} style={{ color: tokens.txtMuted }} />
                  Security
                </button>
              </div>

              {/* Sign out */}
              <div className="p-1.5 border-t" style={{ borderColor: tokens.border }}>
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    if (onLogout) onLogout()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-bold border-none bg-transparent cursor-pointer text-left transition-all duration-150"
                  style={{ color: '#ef4444' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = dark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2'
                  }}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
