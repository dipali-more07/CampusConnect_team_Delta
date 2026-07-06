import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Check, CheckCheck, Send, Trash2, X, Mail, MessageSquare, Smartphone, Megaphone, Clock, Calendar } from 'lucide-react'
import { BRAND } from '../../data/dashboardData'
import { NOTIFICATION_CATEGORIES, buildStatsDisplay } from '../../data/notificationsData'
import notificationsService from '../../services/notificationsService'

const NOTIF_TYPES = [
  { key: 'email',        label: 'Email',        Icon: Mail },
  { key: 'sms',          label: 'SMS',          Icon: MessageSquare },
  { key: 'push',         label: 'Push',         Icon: Smartphone },
  { key: 'announcement', label: 'Announcement', Icon: Megaphone },
]

export default function NotificationsPage({ tokens, notifications = [], stats = {}, loading = false, onMarkRead, onDelete }) {
  const { dark } = tokens

  const [activeCategory, setActiveCategory] = useState('All')
  const [filter, setFilter] = useState('all')
  const [sendOpen, setSendOpen] = useState(false)
  const [sendForm, setSendForm] = useState({
    notifTypes: ['email'],
    sendTo: 'all',
    subject: '',
    message: '',
    schedule: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [scheduling, setScheduling] = useState(false)

  const unreadCount = notifications.filter(n => n.unread).length
  const statsDisplay = buildStatsDisplay(stats)

  const filtered = notifications.filter(n => {
    const catOk = activeCategory === 'All' || n.category === activeCategory
    const readOk = filter === 'all' || (filter === 'unread' && n.unread)
    return catOk && readOk
  })

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter(n => n.unread).map(n => n.id)
    if (unreadIds.length > 0) onMarkRead(unreadIds)
  }

  const toggleNotifType = (key) => {
    setSendForm(p => ({
      ...p,
      notifTypes: p.notifTypes.includes(key)
        ? p.notifTypes.filter(t => t !== key)
        : [...p.notifTypes, key],
    }))
  }

  const resetForm = () => {
    setSendForm({ notifTypes: ['email'], sendTo: 'all', subject: '', message: '', schedule: '' })
    setSending(false)
    setSent(false)
    setScheduling(false)
  }

  const handleSend = async (isSchedule = false) => {
    if (!sendForm.subject.trim() || !sendForm.message.trim()) return
    if (isSchedule) setScheduling(true); else setSending(true)
    const res = await notificationsService.send({
      ...sendForm,
      title: sendForm.subject,
      scheduled: isSchedule ? sendForm.schedule : null,
    })
    setScheduling(false)
    setSending(false)
    if (res.success) {
      setSent(true)
      setTimeout(() => { setSendOpen(false); resetForm() }, 1800)
    }
  }

  const cardStyle = {
    background: dark ? '#0f1e30' : '#ffffff',
    border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`,
    boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.04)',
  }

  const inputStyle = {
    border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`,
    color: dark ? '#e8f0fe' : '#0f172a',
    background: dark ? '#060e1c' : '#f8fafc',
  }

  return (
    <div className="p-5 px-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <h1 className="text-[28px] font-extrabold m-0 tracking-tight" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
            Notifications
          </h1>
          <p className="text-[13px] mt-1" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
            {loading ? 'Loading...' : unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : '0 unread notifications'}
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-transparent transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`, color: dark ? '#7a98bb' : '#64748b' }}
            onMouseEnter={e => { if (unreadCount > 0) { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#7a98bb' : '#64748b' }}
          >
            <CheckCheck size={15} /> Mark all read
          </button>
          <button
            onClick={() => setSendOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-px"
            style={{ background: BRAND, boxShadow: '0 4px 14px rgba(97,95,255,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(97,95,255,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(97,95,255,0.4)' }}
          >
            <Send size={14} /> Send Notification
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid gap-3.5 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {statsDisplay.map(s => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="rounded-xl px-4 py-3.5 flex items-center gap-3.5 transition-all duration-200 hover:shadow-lg"
              style={cardStyle}
            >
              <div className="w-[38px] h-[38px] rounded-[10px] shrink-0 flex items-center justify-center" style={{ background: `${s.color}20` }}>
                <Icon size={17} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-[20px] font-extrabold leading-none" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{s.value}</div>
                <div className="text-[12px] mt-0.5 font-medium" style={{ color: dark ? '#7a98bb' : '#64748b' }}>{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Notification Feed ── */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>

        {/* Feed Header */}
        <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}>
          <span className="text-[15px] font-bold" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>Notification Feed</span>
          <div className="flex rounded-lg p-0.5" style={{ background: dark ? '#060e1c' : '#f1f5f9' }}>
            {['all', 'unread'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3.5 py-1.5 rounded-md text-[12px] font-semibold border-none cursor-pointer transition-all duration-200"
                style={{
                  background: filter === f ? (dark ? '#0f1e30' : '#fff') : 'transparent',
                  color: filter === f ? (dark ? '#e8f0fe' : '#0f172a') : (dark ? '#3d5470' : '#94a3b8'),
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
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border-none cursor-pointer whitespace-nowrap transition-all duration-200"
              style={{
                background: activeCategory === cat ? `${BRAND}18` : 'transparent',
                color: activeCategory === cat ? BRAND : (dark ? '#4a6a8a' : '#64748b'),
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items */}
        <div>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="flex gap-3.5 px-5 py-4" style={{ borderBottom: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}>
                <div className="w-[38px] h-[38px] rounded-[10px] shrink-0" style={{ background: dark ? '#162640' : '#e2e8f0' }} />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="w-2/5 h-3 rounded-md" style={{ background: dark ? '#162640' : '#e2e8f0' }} />
                  <div className="w-[70%] h-2.5 rounded-md" style={{ background: dark ? '#0f1e30' : '#f1f5f9' }} />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Bell size={36} className="block mx-auto mb-3" style={{ color: dark ? '#3d5470' : '#94a3b8' }} />
              <p className="text-[14px] font-medium" style={{ color: dark ? '#7a98bb' : '#64748b' }}>No notifications found</p>
            </div>
          ) : (
            filtered.map((n, i) => {
              const Icon = n.icon
              return (
                <div
                  key={n.id}
                  className="flex items-start gap-3.5 px-5 py-3.5 relative transition-colors duration-200"
                  style={{
                    borderBottom: i < filtered.length - 1 ? `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` : 'none',
                    background: n.unread ? (dark ? `${BRAND}0c` : `${BRAND}06`) : 'transparent',
                  }}
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
                    <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: n.unread ? (dark ? '#7a98bb' : '#64748b') : (dark ? '#3d5470' : '#94a3b8') }}>
                      {n.message}
                    </p>
                    <span className="text-[11px] font-semibold mt-1 inline-block px-2 py-0.5 rounded-md" style={{ color: dark ? '#4a6a8a' : '#94a3b8', background: dark ? '#162640' : '#f1f5f9' }}>
                      {n.category}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {n.unread && (
                      <button
                        onClick={() => onMarkRead([n.id])}
                        title="Mark as read"
                        className="w-[30px] h-[30px] rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
                        style={{ border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`, color: dark ? '#4a6a8a' : '#94a3b8' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#4a6a8a' : '#94a3b8' }}
                      >
                        <Check size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(n.id)}
                      title="Delete"
                      className="w-[30px] h-[30px] rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
                      style={{ border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`, color: dark ? '#4a6a8a' : '#94a3b8' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#4a6a8a' : '#94a3b8' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Send Notification Modal ── */}
      {sendOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={e => { if (e.target === e.currentTarget) { setSendOpen(false); resetForm() } }}
        >
          <div
            className="rounded-[20px] w-full max-w-[500px] overflow-hidden"
            style={{
              background: dark ? '#0c1829' : '#ffffff',
              border: `1px solid ${dark ? '#1a3050' : '#e8edf5'}`,
              boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
              animation: 'slideUp 0.28s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${dark ? '#1a3050' : '#e8edf5'}` }}>
              <h2 className="text-[17px] font-extrabold m-0" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
                Send Notification
              </h2>
              <button
                onClick={() => { setSendOpen(false); resetForm() }}
                className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
                style={{ color: dark ? '#4a6a8a' : '#94a3b8' }}
                onMouseEnter={e => { e.currentTarget.style.background = dark ? '#162640' : '#f1f5f9'; e.currentTarget.style.color = dark ? '#e8f0fe' : '#475569' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dark ? '#4a6a8a' : '#94a3b8' }}
              >
                <X size={17} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">

              {/* Notification Type */}
              <div>
                <label className="text-[12px] font-bold block mb-3" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                  Notification Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {NOTIF_TYPES.map(({ key, label, Icon }) => {
                    const selected = sendForm.notifTypes.includes(key)
                    return (
                      <button
                        key={key}
                        onClick={() => toggleNotifType(key)}
                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-150 border"
                        style={{
                          background: selected ? `${BRAND}12` : (dark ? '#060e1c' : '#f8fafc'),
                          borderColor: selected ? `${BRAND}60` : (dark ? '#1a3050' : '#e2e8f0'),
                          color: selected ? BRAND : (dark ? '#7a98bb' : '#64748b'),
                          boxShadow: selected ? `0 0 0 3px ${BRAND}14` : 'none',
                        }}
                      >
                        <Icon size={15} />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="text-[12px] font-bold block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                  Recipients
                </label>
                <select
                  value={sendForm.sendTo}
                  onChange={e => setSendForm(p => ({ ...p, sendTo: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none cursor-pointer transition-all duration-200"
                  style={inputStyle}
                >
                  <option value="all">All Students</option>
                  <option value="registered">Registered Students</option>
                  <option value="organizers">Organizers Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="text-[12px] font-bold block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                  Subject
                </label>
                <input
                  placeholder="e.g. TechFest 2025 — Important Update"
                  value={sendForm.subject}
                  onChange={e => setSendForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none box-border transition-all duration-200"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                  onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-[12px] font-bold block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Type your message here..."
                  value={sendForm.message}
                  onChange={e => setSendForm(p => ({ ...p, message: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none resize-none box-border font-inherit transition-all duration-200"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                  onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {/* Schedule */}
              <div>
                <label className="text-[12px] font-bold block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                  Schedule
                  <span className="ml-1.5 font-medium normal-case" style={{ color: dark ? '#3d5470' : '#94a3b8' }}>(optional)</span>
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: dark ? '#3d5470' : '#94a3b8' }} />
                  <input
                    type="datetime-local"
                    value={sendForm.schedule}
                    onChange={e => setSendForm(p => ({ ...p, schedule: e.target.value }))}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-[10px] text-[13px] outline-none box-border transition-all duration-200"
                    style={{
                      ...inputStyle,
                      color: sendForm.schedule ? (dark ? '#e8f0fe' : '#0f172a') : (dark ? '#3d5470' : '#94a3b8'),
                      colorScheme: dark ? 'dark' : 'light',
                    }}
                    onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                    onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Footer — Schedule + Send Now */}
            <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#e8edf5'}` }}>
              <button
                onClick={() => handleSend(true)}
                disabled={sending || sent || scheduling || !sendForm.schedule}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`, background: 'transparent', color: dark ? '#7a98bb' : '#64748b' }}
                onMouseEnter={e => { if (sendForm.schedule && !sending && !sent) { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#7a98bb' : '#64748b' }}
              >
                <Clock size={14} />
                {scheduling ? 'Scheduling...' : 'Schedule'}
              </button>

              <button
                onClick={() => handleSend(false)}
                disabled={sending || sent || scheduling}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-300 disabled:cursor-default disabled:opacity-70"
                style={{
                  background: sent ? '#00BC7D' : BRAND,
                  boxShadow: `0 4px 14px ${sent ? 'rgba(0,188,125,0.4)' : 'rgba(97,95,255,0.4)'}`,
                }}
                onMouseEnter={e => { if (!sending && !sent) e.currentTarget.style.boxShadow = `0 6px 20px rgba(97,95,255,0.55)` }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 4px 14px ${sent ? 'rgba(0,188,125,0.4)' : 'rgba(97,95,255,0.4)'}` }}
              >
                {sent ? <><CheckCheck size={15} /> Sent!</>
                  : sending ? 'Sending...'
                  : <><Send size={14} /> Send Now</>}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
