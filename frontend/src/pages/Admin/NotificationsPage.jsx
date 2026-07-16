import { useState } from 'react'
import { CheckCheck, Send, Mail, MessageSquare, Smartphone, Megaphone } from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../data/dashboardData'
import { buildStatsDisplay } from '../../data/notificationsData'
import notificationsService from '../../services/notificationsService'

// Sub-components
import NotificationStats from '../../components/admin/adminNotification/NotificationStats'
import NotificationFeed from '../../components/admin/adminNotification/NotificationFeed'
import NotificationFormModal from '../../components/admin/adminNotification/NotificationFormModal'

const NOTIF_TYPES = [
  { key: 'email',        label: 'Email',        Icon: Mail },
  { key: 'sms',          label: 'SMS',          Icon: MessageSquare },
  { key: 'push',         label: 'Push',         Icon: Smartphone },
  { key: 'announcement', label: 'Announcement', Icon: Megaphone },
]

export default function NotificationsPage({ tokens, notifications = [], stats = {}, loading = false, onMarkRead, onDelete }) {
  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND

  const [activeCategory, setActiveCategory] = useState('All')
  const [filter, setFilter] = useState('all')
  const [sendOpen, setSendOpen] = useState(false)
  const [sendForm, setSendForm] = useState({
    notification_type: 'system',
    user_id: 'all',
    title: '',
    message: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

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

  const resetForm = () => {
    setSendForm({
      notification_type: 'system',
      user_id: 'all',
      title: '',
      message: '',
    })
    setSending(false)
    setSent(false)
  }

  const handleSend = async () => {
    if (!sendForm.title.trim() || !sendForm.message.trim()) return
    setSending(true)
    const res = await notificationsService.send(sendForm)
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

      {/* Page Header */}
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
            style={{ background: BRAND, boxShadow: `0 4px 14px ${BRAND}40` }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${BRAND}60` }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 4px 14px ${BRAND}40` }}
          >
            <Send size={14} /> Send Notification
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <NotificationStats
        statsDisplay={statsDisplay}
        cardStyle={cardStyle}
        dark={dark}
        tokens={tokens}
      />

      {/* Notification Feed */}
      <NotificationFeed
        loading={loading}
        filtered={filtered}
        unreadCount={unreadCount}
        filter={filter}
        setFilter={setFilter}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        onMarkRead={onMarkRead}
        onDelete={onDelete}
        tokens={tokens}
        dark={dark}
        BRAND={BRAND}
        cardStyle={cardStyle}
      />

      {/* Send Notification Modal */}
      <NotificationFormModal
        sendOpen={sendOpen}
        setSendOpen={setSendOpen}
        sendForm={sendForm}
        setSendForm={setSendForm}
        sending={sending}
        sent={sent}
        handleSend={handleSend}
        resetForm={resetForm}
        NOTIF_TYPES={NOTIF_TYPES}
        tokens={tokens}
        dark={dark}
        BRAND={BRAND}
        inputStyle={inputStyle}
      />
    </div>
  )
}
