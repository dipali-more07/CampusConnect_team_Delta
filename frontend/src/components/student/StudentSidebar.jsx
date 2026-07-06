import React, { useState } from 'react'
import {
  LayoutDashboard,
  CalendarDays,
  SquareCheckBig,
  Award,
  ChevronLeft,
  LogOut,
  GraduationCap,
  TextAlignJustify,
  Bell
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export const STUDENT_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: SquareCheckBig,  label: 'Attendance' },
  { icon: CalendarDays,    label: 'Events' },
  { icon: Award,           label: 'Certificates' },
]

export default function StudentSidebar({
  collapsed,
  setCollapsed,
  activeNav,
  setActiveNav,
  dark,
  onLogout,
  user,
  sidebarOpen,
  setSidebarOpen,
  isMobile
}) {
  const { accentColor } = useTheme()
  const BRAND = accentColor || '#615FFF'
  const [logoHover, setLogoHover] = useState(false)

  return (
    <aside
      style={{
        width: isMobile ? 240 : (collapsed ? 70 : 240),
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        left: 0,
      }}
      className="
        fixed h-full z-40 flex flex-col overflow-hidden
        bg-white dark:bg-[#0c1829]
        border-r border-slate-200 dark:border-[#1a3050]
        transition-all duration-300 ease-in-out
        shadow-sm dark:shadow-[2px_0_20px_rgba(0,0,0,0.4)]
      "
    >
      {/* Logo + Collapse Toggle */}
      <div
        className="flex items-center border-b border-slate-200 dark:border-[#1a3050] shrink-0 overflow-hidden"
        style={{
          justifyContent: (collapsed && !isMobile) ? 'center' : 'space-between',
          padding: (collapsed && !isMobile) ? '16px 0' : '16px 20px',
          minHeight: 64,
        }}
      >
        <div
          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
          onMouseEnter={() => setLogoHover(true)}
          onMouseLeave={() => setLogoHover(false)}
          onClick={() => setActiveNav('Dashboard')}
        >
          <div
            className="w-[38px] h-[38px] rounded-[10px] shrink-0 flex items-center justify-center shadow-md"
            style={{
              background: BRAND,
              marginLeft: (collapsed && !isMobile) ? 'auto' : 0,
              marginRight: (collapsed && !isMobile) ? 'auto' : 0,
              transform: logoHover ? 'scale(1.18) rotate(-8deg)' : 'scale(1) rotate(0deg)',
              boxShadow: logoHover ? `0 0 0 6px ${BRAND}30, 0 6px 20px ${BRAND}50` : '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
            }}
          >
            <GraduationCap
              size={20}
              color="#fff"
              style={{
                transform: logoHover ? 'rotate(8deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            />
          </div>
          <div
            className="flex flex-col gap-0.5 overflow-hidden whitespace-nowrap transition-[opacity,width] duration-300"
            style={{ opacity: (collapsed && !isMobile) ? 0 : 1, width: (collapsed && !isMobile) ? 0 : 'auto' }}
          >
            <span
              className="text-[15px] font-extrabold leading-none text-slate-900 dark:text-slate-100"
              style={{
                color: logoHover ? BRAND : undefined,
                transition: 'color 0.25s ease',
              }}
            >
              EventHub
            </span>
            <span className="text-[11px] font-medium leading-none text-slate-400 dark:text-[#4a6a8a]">
              Student Portal
            </span>
          </div>
        </div>

        {!collapsed && !isMobile && (
          <button
            onClick={() => setCollapsed(true)}
            className="flex items-center justify-center shrink-0 text-slate-400 dark:text-[#4a6a8a] cursor-pointer p-1 rounded-md border-none bg-transparent hover:text-slate-700 dark:hover:text-[#e8f0fe] transition-all duration-150"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center shrink-0 text-slate-400 dark:text-[#4a6a8a] cursor-pointer p-1 rounded-md border-none bg-transparent hover:text-slate-700 dark:hover:text-[#e8f0fe] transition-all duration-150"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav
        className="flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden transition-[padding] duration-300"
        style={{ padding: (collapsed && !isMobile) ? '12px 10px' : '16px 14px' }}
      >
        {collapsed && !isMobile && (
          <button
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            className="flex items-center justify-center p-2.5 rounded-[10px] border-none cursor-pointer bg-transparent text-slate-400 dark:text-[#4a6a8a] w-full mb-2 hover:bg-slate-100 dark:hover:bg-[#162640] transition-all duration-150"
          >
            <TextAlignJustify size={18} />
          </button>
        )}

        {STUDENT_NAV.map(({ icon: Icon, label }) => {
          const active = activeNav === label
          const isCollapsedView = collapsed && !isMobile
          return (
            <button
              key={label}
              onClick={() => {
                setActiveNav(label)
                if (isMobile) setSidebarOpen(false)
              }}
              title={isCollapsedView ? label : ''}
              className="flex items-center rounded-[12px] text-[13.5px] font-semibold border-none cursor-pointer w-full relative transition-all duration-150"
              style={{
                justifyContent: isCollapsedView ? 'center' : 'flex-start',
                gap: isCollapsedView ? 0 : 12,
                padding: isCollapsedView ? '11px' : '11px 14px',
                background: active ? `${BRAND}18` : 'transparent',
                color: active ? BRAND : undefined,
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = dark ? '#162640' : '#f1f5f9' } }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={19} className="shrink-0" style={{ color: active ? BRAND : (dark ? '#7a98bb' : '#64748b') }} />
              {!isCollapsedView && (
                <span
                  className="whitespace-nowrap overflow-hidden text-ellipsis text-slate-600 dark:text-[#7a98bb]"
                  style={{ color: active ? BRAND : undefined }}
                >
                  {label}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Profile / Logout Footer */}
      <div
        className="shrink-0 border-t border-slate-200 dark:border-[#1a3050] flex items-center transition-[padding] duration-300 overflow-hidden"
        style={{
          justifyContent: (collapsed && !isMobile) ? 'center' : 'space-between',
          padding: (collapsed && !isMobile) ? '12px 10px' : '12px 16px',
        }}
      >
        {(collapsed && !isMobile) ? (
          <button
            onClick={onLogout}
            title="Logout"
            className="w-[38px] h-[38px] rounded-full shrink-0 flex items-center justify-center text-white text-[12px] font-bold border-none cursor-pointer hover:opacity-85 transition-opacity"
            style={{ background: BRAND }}
          >
            {user?.avatar || (user?.name ? user.name.substring(0, 2).toUpperCase() : 'ST')}
          </button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-[38px] h-[38px] rounded-full shrink-0 flex items-center justify-center text-white text-[13px] font-bold shadow-xs"
                style={{ background: BRAND }}
              >
                {user?.avatar || (user?.name ? user.name.substring(0, 2).toUpperCase() : 'ST')}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13.5px] font-bold text-slate-800 dark:text-[#e8f0fe] truncate">
                  {user?.name || 'Arjun Sharma'}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-[#4a6a8a] truncate">
                  {user?.department || 'Student'}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="flex items-center justify-center w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer text-slate-400 dark:text-[#4a6a8a] hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-[#162640] transition-all duration-150"
            >
              <LogOut size={17} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
