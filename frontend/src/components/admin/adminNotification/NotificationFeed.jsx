import React from 'react'
import { Bell, Check, Trash2 } from 'lucide-react'
import { NOTIFICATION_CATEGORIES } from '../../../data/notificationsData'

const getFilterBg = (f, filter, dark) => {
  if (filter !== f) return 'transparent'
  return dark ? '#0f1e30' : '#fff'
}

const getFilterColor = (f, filter, dark) => {
  if (filter === f) {
    return dark ? '#e8f0fe' : '#0f172a'
  }
  return dark ? '#3d5470' : '#94a3b8'
}

const getCategoryColor = (cat, activeCategory, BRAND, dark) => {
  if (activeCategory === cat) return BRAND
  return dark ? '#4a6a8a' : '#64748b'
}

const getFeedItemBorderBottom = (isLast, dark) => {
  if (isLast) return 'none'
  return dark ? '1px solid #1a3050' : '1px solid #e2e8f0'
}

const getFeedItemBg = (unread, dark, BRAND) => {
  if (!unread) return 'transparent'
  return dark ? `${BRAND}0c` : `${BRAND}06`
}

const getFeedItemMessageColor = (unread, dark) => {
  if (unread) {
    return dark ? '#7a98bb' : '#64748b'
  }
  return dark ? '#3d5470' : '#94a3b8'
}

function FeedItem({ n, idx, total, onMarkRead, onDelete, dark, BRAND }) {
  const Icon = n.icon
  const isLast = idx === total - 1

  const borderBottom = getFeedItemBorderBottom(isLast, dark)
  const background = getFeedItemBg(n.unread, dark, BRAND)
  const messageColor = getFeedItemMessageColor(n.unread, dark)

  return (
    <div
      className="flex items-start gap-3.5 px-5 py-3.5 relative transition-colors duration-200"
      style={{ borderBottom, background }}
    >
      {n.unread && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: BRAND }} />
      )}
      <div className="w-9 h-9 rounded-[10px] shrink-0 flex items-center justify-center" style={{ background: n.iconBg }}>
        <Icon size={16} style={{ color: n.iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px]" style={{ fontWeight: n.unread ? 700 : 600, color: dark ? '#e8f0fe' : '#0f172a' }}>{n.title}</span>
          {n.priority === 'high' && (
            <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-red-500/10 text-red-500">HIGH</span>
          )}
          <span className="text-[11px] ml-auto" style={{ color: dark ? '#3d5470' : '#94a3b8' }}>{n.time}</span>
        </div>
        <p className="text-[13px] mt-0.5 leading-relaxed font-sans" style={{ color: messageColor }}>
          {n.message}
        </p>
        <span className="text-[11px] font-semibold mt-1 inline-block px-2 py-0.5 rounded-md" style={{ color: dark ? '#4a6a8a' : '#94a3b8', background: dark ? '#162640' : '#f1f5f9' }}>
          {n.category}
        </span>
      </div>
      <div className="flex gap-1 shrink-0">
        {n.unread && (
          <button
            type="button"
            onClick={() => onMarkRead([n.id])}
            title="Mark as read"
            className="w-[30px] h-[30px] rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 p-0 border"
            style={{ borderColor: dark ? '#1a3050' : '#e2e8f0', color: dark ? '#4a6a8a' : '#94a3b8' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#4a6a8a' : '#94a3b8' }}
          >
            <Check size={13} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(n.id)}
          title="Delete"
          className="w-[30px] h-[30px] rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 p-0 border"
          style={{ borderColor: dark ? '#1a3050' : '#e2e8f0', color: dark ? '#4a6a8a' : '#94a3b8' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#4a6a8a' : '#94a3b8' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function FeedContent({ loading, filtered, onMarkRead, onDelete, dark, BRAND }) {
  if (loading) {
    return [1, 2, 3].map(i => (
      <div key={i} className="flex gap-3.5 px-5 py-4" style={{ borderBottom: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}>
        <div className="w-[38px] h-[38px] rounded-[10px] shrink-0" style={{ background: dark ? '#162640' : '#e2e8f0' }} />
        <div className="flex-1 flex flex-col gap-2">
          <div className="w-2/5 h-3 rounded-md" style={{ background: dark ? '#162640' : '#e2e8f0' }} />
          <div className="w-[70%] h-2.5 rounded-md" style={{ background: dark ? '#0f1e30' : '#f1f5f9' }} />
        </div>
      </div>
    ))
  }

  if (filtered.length === 0) {
    return (
      <div className="p-12 text-center">
        <Bell size={36} className="block mx-auto mb-3" style={{ color: dark ? '#3d5470' : '#94a3b8' }} />
        <p className="text-[14px] font-medium" style={{ color: dark ? '#7a98bb' : '#64748b' }}>No notifications found</p>
      </div>
    )
  }

  return filtered.map((n, i) => (
    <FeedItem
      key={n.id}
      n={n}
      idx={i}
      total={filtered.length}
      onMarkRead={onMarkRead}
      onDelete={onDelete}
      dark={dark}
      BRAND={BRAND}
    />
  ))
}

export default function NotificationFeed({
  loading,
  filtered,
  unreadCount,
  filter,
  setFilter,
  activeCategory,
  setActiveCategory,
  onMarkRead,
  onDelete,
  tokens,
  dark,
  BRAND,
  cardStyle
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={cardStyle}>
      {/* Feed Header */}
      <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}>
        <span className="text-[15px] font-bold" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>Notification Feed</span>
        <div className="flex rounded-lg p-0.5" style={{ background: dark ? '#060e1c' : '#f1f5f9' }}>
          {['all', 'unread'].map(f => (
            <button
              type="button"
              key={f}
              onClick={() => setFilter(f)}
              className="px-3.5 py-1.5 rounded-md text-[12px] font-semibold border-none cursor-pointer transition-all duration-200"
              style={{
                background: getFilterBg(f, filter, dark),
                color: getFilterColor(f, filter, dark),
                boxShadow: filter === f ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {f === 'all' ? 'All' : 'Unread'}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 text-[10px] text-white px-1.5 py-px rounded-full" style={{ background: BRAND }}>{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 px-5 py-2.5 overflow-x-auto" style={{ borderBottom: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}>
        {NOTIFICATION_CATEGORIES.map(cat => (
          <button
            type="button"
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border-none cursor-pointer whitespace-nowrap transition-all duration-200"
            style={{
              background: activeCategory === cat ? `${BRAND}18` : 'transparent',
              color: getCategoryColor(cat, activeCategory, BRAND, dark),
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items */}
      <div>
        <FeedContent
          loading={loading}
          filtered={filtered}
          onMarkRead={onMarkRead}
          onDelete={onDelete}
          dark={dark}
          BRAND={BRAND}
        />
      </div>
    </div>
  )
}
