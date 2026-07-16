import {
  UserPlus, CheckSquare, Calendar, Award, Bell,
  AlertTriangle, Users, RefreshCw, Star, XCircle,
} from 'lucide-react'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL 

// ─── Helper — get auth token from sessionStorage ───────────────────
function getToken() {
  return sessionStorage.getItem('token') || ''
}

// ─── Helper — build common headers ────────────────────────────────
function authHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
    'ngrok-skip-browser-warning': 'true',
    ...extra,
  }
}

// ─── Helper — parse response safely ───────────────────────────────
async function parseJSON(res) {
  try { return await res.json() }
  catch { return {} }
}

// ─────────────────────────────────────────────────────────────────
// TYPE CONFIG — maps API `type` string → icon + colors
// API sends only type string; icon/color is added by frontend
// ─────────────────────────────────────────────────────────────────
export const TYPE_CONFIG = {
  registration:      { icon: UserPlus,      iconColor: '#615FFF', iconBg: '#615FFF18' },
  bulk_registration: { icon: Users,         iconColor: '#8E51FF', iconBg: '#8E51FF18' },
  attendance:        { icon: CheckSquare,   iconColor: '#00BC7D', iconBg: '#00BC7D18' },
  event:             { icon: Calendar,      iconColor: '#2B7FFF', iconBg: '#2B7FFF18' },
  certificate:       { icon: Award,         iconColor: '#FE9A00', iconBg: '#FE9A0018' },
  warning:           { icon: AlertTriangle, iconColor: '#ef4444', iconBg: '#ef444418' },
  cancelled:         { icon: XCircle,       iconColor: '#ef4444', iconBg: '#ef444418' },
  trending:          { icon: Star,          iconColor: '#F6339A', iconBg: '#F6339A18' },
  system:            { icon: RefreshCw,     iconColor: '#0284c7', iconBg: '#0284c718' },
  default:           { icon: Bell,          iconColor: '#615FFF', iconBg: '#615FFF18' },
}

/**
 * Enriches a raw notification with icon + color from TYPE_CONFIG.
 * Call this on every notification before rendering.
 */
export function enrichNotification(n) {
  const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.default
  return { ...n, ...config }
}

// ─────────────────────────────────────────────────────────────────
// MOCK DATA (matches exact shape backend would send)
// ─────────────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'registration',      title: 'New Registration',       message: 'Arjun Patel registered for TechFest 2025',               time: '2 min ago',  unread: true,  category: 'Events',        priority: 'normal' },
  { id: 2, type: 'attendance',        title: 'Attendance Marked',      message: 'QR Scan completed for National Hackathon — 198 entries', time: '15 min ago', unread: true,  category: 'Attendance',    priority: 'normal' },
  { id: 3, type: 'event',             title: 'Event Published',        message: 'Industry Connect Summit is now live',                    time: '1 hr ago',   unread: false, category: 'Events',        priority: 'normal' },
  { id: 4, type: 'certificate',       title: 'Certificates Generated', message: '143 certificates issued for Research Symposium',        time: '3 hr ago',   unread: false, category: 'Certificates',  priority: 'normal' },
  { id: 5, type: 'warning',           title: 'Low Capacity Warning',   message: 'Entrepreneurship Bootcamp has only 56 spots left',      time: '5 hr ago',   unread: false, category: 'Events',        priority: 'high'   },
  { id: 6, type: 'bulk_registration', title: 'Bulk Registration',      message: '32 students from CSE dept registered for Sports Meet',  time: 'Yesterday',  unread: false, category: 'Registrations', priority: 'normal' },
  { id: 7, type: 'system',            title: 'System Update',          message: 'Dashboard analytics refreshed successfully',            time: 'Yesterday',  unread: false, category: 'System',        priority: 'low'    },
  { id: 8, type: 'trending',          title: 'Event Trending',         message: 'Cultural Fest 2025 is trending — 876 registrations!',   time: '2 days ago', unread: false, category: 'Events',        priority: 'normal' },
  { id: 9, type: 'cancelled',         title: 'Event Cancelled',        message: 'Entrepreneurship Bootcamp cancelled by organizer',      time: '2 days ago', unread: false, category: 'Events',        priority: 'high'   },
]

const MOCK_STATS = { email: 1243, sms: 892, push: 3421, announcements: 28 }

// ─────────────────────────────────────────────────────────────────
// MOCK FUNCTIONS
// ─────────────────────────────────────────────────────────────────
async function mockFetchNotifications() {
  await new Promise(r => setTimeout(r, 400))
  return { success: true, notifications: MOCK_NOTIFICATIONS, stats: MOCK_STATS }
}

async function mockMarkRead(ids) {
  await new Promise(r => setTimeout(r, 200))
  return { success: true }
}

async function mockDelete(id) {
  await new Promise(r => setTimeout(r, 200))
  return { success: true }
}

async function mockSend(payload) {
  const { notification_type, user_id, title, message } = payload
  await new Promise(r => setTimeout(r, 600))
  if (!title?.trim() || !message?.trim()) {
    return { success: false, message: 'Title and message are required.' }
  }
  return {
    success: true,
    message: `Notification (${notification_type || 'system'}) sent to "${user_id || 'all'}".`,
    sentAt: new Date().toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────────
// REAL API FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * GET /notifications
 * Fetches all notifications + stats from the backend.
 */
async function apiFetchNotifications() {
  try {
    const res = await fetch(`${API_BASE}/notifications`, {
      method: 'GET',
      headers: authHeaders(),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      console.error('[notificationsService] fetchAll failed:', res.status, data)
      return { success: false, notifications: [], stats: {} }
    }
    return { success: true, notifications: data.notifications ?? [], stats: data.stats ?? {} }
  } catch (err) {
    console.error('[notificationsService] fetchAll network error:', err)
    return { success: false, notifications: [], stats: {}, message: 'Server unreachable.' }
  }
}

/**
 * POST /notifications/mark-read
 * Marks one or more notifications as read.
 * @param {number[]} ids - array of notification IDs
 */
async function apiMarkRead(ids) {
  try {
    const res = await fetch(`${API_BASE}/notifications/mark-read`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ids }),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      console.error('[notificationsService] markRead failed:', res.status, data)
      return { success: false }
    }
    return { success: true }
  } catch (err) {
    console.error('[notificationsService] markRead network error:', err)
    return { success: false }
  }
}

/**
 * DELETE /notifications/:id
 * Deletes a single notification.
 * @param {number} id - notification ID
 */
async function apiDelete(id) {
  try {
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      console.error('[notificationsService] delete failed:', res.status, data)
      return { success: false }
    }
    return { success: true }
  } catch (err) {
    console.error('[notificationsService] delete network error:', err)
    return { success: false }
  }
}

/**
 * POST /notifications/send
 * Sends or schedules a notification.
 * @param {{
 *   notifTypes : string[],   - ['email','sms','push','announcement']
 *   sendTo     : string,     - 'all'|'registered'|'organizers'|'admins'
 *   subject    : string,     - notification subject/title
 *   message    : string,     - full message body
 *   scheduled  : string|null - ISO datetime string, or null to send immediately
 * }} payload
 */
async function apiSend(payload) {
  try {
    const res = await fetch(`${API_BASE}/notifications/broadcast`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      const errMsg = data?.error || data?.message || 'Failed to send notification.'
      console.error('[notificationsService] send failed:', res.status, errMsg)
      return { success: false, message: errMsg }
    }
    return {
      success: true,
      message: data.message || 'Notification broadcasted successfully.',
      sentAt: data.sentAt || null,
    }
  } catch (err) {
    console.error('[notificationsService] send network error:', err)
    return { success: false, message: 'Server unreachable. Please try again.' }
  }
}

// ─────────────────────────────────────────────────────────────────
// PUBLIC SERVICE — USE_MOCK toggle karo .env se
// ─────────────────────────────────────────────────────────────────
const notificationsService = {
  /** Fetch all notifications + stats */
  fetchAll: () =>
    USE_MOCK ? mockFetchNotifications() : apiFetchNotifications(),

  /** Mark one or more notifications as read. @param {number[]} ids */
  markRead: (ids) =>
    USE_MOCK ? mockMarkRead(ids) : apiMarkRead(ids),

  /** Delete a notification by id. @param {number} id */
  delete: (id) =>
    USE_MOCK ? mockDelete(id) : apiDelete(id),

  /** Send or schedule a notification. */
  send: (payload) =>
    USE_MOCK ? mockSend(payload) : apiSend(payload),
}

export default notificationsService
