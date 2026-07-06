import React from 'react'
import { Bell, X, CheckCheck, ExternalLink } from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'

export default function NotificationPanel({ open, onClose, notifications, onMarkRead, onDelete, onNavigate, tokens }) {
  const { accentColor } = useTheme()
  const BRAND = tokens?.brand || accentColor || '#615FFF'
  const { dark } = tokens
  const unreadCount = notifications.filter(n => n.unread).length

  const markAllRead = () => onMarkRead(notifications.filter(n => n.unread).map(n => n.id))
  const markRead = id => onMarkRead([id])
  const deleteNotif = id => onDelete(id)

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-49 bg-black/40 backdrop-blur-sm"
        />
      )}

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-screen w-[380px] z-50 flex flex-col border-l transition-[transform,visibility] duration-350 ease-in-out"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          visibility: open ? 'visible' : 'hidden',
          pointerEvents: open ? 'auto' : 'none',
          background: dark ? '#0c1829' : '#ffffff',
          borderColor: dark ? '#1a3050' : '#e2e8f0',
          boxShadow: dark ? '-12px 0 40px rgba(0,0,0,0.5)' : '-8px 0 40px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-[18px] shrink-0"
          style={{ borderBottom: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                style={{ background: `${BRAND}20` }}
              >
                <Bell size={17} style={{ color: BRAND }} />
              </div>
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center"
                  style={{ border: `2px solid ${dark ? '#0c1829' : '#fff'}` }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-[16px] font-extrabold m-0" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>Notifications</h2>
              <p className="text-[11px] m-0" style={{ color: dark ? '#4a6a8a' : '#64748b' }}>
                {unreadCount > 0 ? `${unreadCount} new` : 'All caught up!'}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {unreadCount > 0 && (
              <button
                className="w-8 h-8 rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
                style={{ border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`, color: dark ? '#4a6a8a' : '#94a3b8' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#4a6a8a' : '#94a3b8' }}
                onClick={markAllRead}
                title="Mark all read"
              >
                <CheckCheck size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
              style={{ border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`, color: dark ? '#7a98bb' : '#64748b' }}
              onMouseEnter={e => { e.currentTarget.style.background = dark ? '#162640' : '#f1f5f9' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell size={36} className="block mx-auto mb-3" style={{ color: dark ? '#3d5470' : '#94a3b8' }} />
              <p className="text-[14px]" style={{ color: dark ? '#7a98bb' : '#64748b' }}>No notifications yet</p>
            </div>
          ) : (
            notifications.slice(0, 10).map((n, i) => {
              const Icon = n.icon
              return (
                <div
                  key={n.id}
                  className="flex gap-3 px-4 py-3.5 relative cursor-pointer transition-colors duration-200 group"
                  style={{
                    borderBottom: i < notifications.length - 1 ? `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` : 'none',
                    background: n.unread ? (dark ? `${BRAND}10` : `${BRAND}06`) : 'transparent',
                  }}
                  onClick={() => markRead(n.id)}
                  onMouseEnter={e => { if (!n.unread) e.currentTarget.style.background = dark ? '#162640' : '#f8fafc' }}
                  onMouseLeave={e => { if (!n.unread) e.currentTarget.style.background = 'transparent' }}
                >
                  {n.unread && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: BRAND }} />
                  )}

                  <div className="w-[34px] h-[34px] rounded-[9px] shrink-0 flex items-center justify-center" style={{ background: n.iconBg }}>
                    <Icon size={15} style={{ color: n.iconColor }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className="text-[13px] overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{ fontWeight: n.unread ? 700 : 600, color: dark ? '#e8f0fe' : '#0f172a' }}
                      >
                        {n.title}
                      </span>
                      <span className="text-[11px] shrink-0" style={{ color: dark ? '#3d5470' : '#94a3b8' }}>{n.time}</span>
                    </div>
                    <p
                      className="text-[12px] mt-0.5 leading-[1.4] overflow-hidden"
                      style={{
                        color: n.unread ? (dark ? '#7a98bb' : '#64748b') : (dark ? '#3d5470' : '#94a3b8'),
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {n.message}
                    </p>
                  </div>

                  <button
                    onClick={e => { e.stopPropagation(); deleteNotif(n.id) }}
                    className="notif-delete-btn w-6 h-6 rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-150 hover:text-red-400"
                    style={{ color: dark ? '#3d5470' : '#94a3b8' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 shrink-0" style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}>
          <button
            onClick={() => { onNavigate('Notifications'); onClose() }}
            className="w-full px-4 py-2.5 rounded-[10px] text-[13px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
            style={{
              background: `${BRAND}18`,
              color: BRAND,
              border: `1px solid ${BRAND}35`,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${BRAND}28`; e.currentTarget.style.boxShadow = `0 4px 16px ${BRAND}35` }}
            onMouseLeave={e => { e.currentTarget.style.background = `${BRAND}18`; e.currentTarget.style.boxShadow = 'none' }}
          >
            <ExternalLink size={13} /> View All Notifications
          </button>
        </div>
      </div>
    </>
  )
}
