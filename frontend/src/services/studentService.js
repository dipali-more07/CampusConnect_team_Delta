import { encryptPayload } from '../utils/payloadCrypto'

import studentDashboardData from '../data/student/studentDashboardData.json'
import studentAttendanceData from '../data/student/studentAttendanceData.json'
import studentEventsData from '../data/student/studentEventsData.json'
import studentCertificatesData from '../data/student/studentCertificatesData.json'
import studentNotificationsData from '../data/student/studentNotificationsData.json'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL

function getStudentHeaders(extra = {}) {
  const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token') || ''
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...extra
  }
}

async function safeFetch(url, options = {}) {
  const headers = getStudentHeaders(options.headers)
  const opts = { ...options, headers }
  let res = await fetch(url, opts)

  if (res.status === 307 || (!res.ok && res.status === 404)) {
    const altUrl = url.endsWith('/') ? url.slice(0, -1) : `${url}/`
    try {
      const altRes = await fetch(altUrl, opts)
      if (altRes.ok || altRes.status !== 404) {
        res = altRes
      }
    } catch (_e) {}
  }
  return res
}

// ── Mock registrations store (localStorage) ──
const MOCK_REG_KEY = 'cc_student_event_registrations'
function getMockEventRegistrations() {
  try { return JSON.parse(localStorage.getItem(MOCK_REG_KEY) || '[]') } catch { return [] }
}
function saveMockEventRegistrations(list) {
  localStorage.setItem(MOCK_REG_KEY, JSON.stringify(list))
}

// Local in-memory store for notifications, attendance & user profile
let notificationsStore = [...studentNotificationsData]
let attendanceStore = { ...studentAttendanceData }
let studentProfileStore = {
  name: 'Arjun Sharma',
  college: 'IIT Delhi',
  course: 'B.Tech Computer Science',
  email: 'arjun.sharma@iitd.ac.in',
  mobile: '+91 98765 43210',
  avatar: 'AS'
}

/* ── MOCK IMPLEMENTATIONS ── */
async function mockFetchDashboardOverview() {
  await new Promise(r => setTimeout(r, 200))
  return {
    success: true,
    data: studentDashboardData
  }
}

async function mockFetchAttendanceData() {
  await new Promise(r => setTimeout(r, 200))
  return {
    success: true,
    data: attendanceStore
  }
}

async function mockFetchEventsData() {
  await new Promise(r => setTimeout(r, 200))
  return {
    success: true,
    data: studentEventsData
  }
}

async function mockFetchCertificatesData() {
  await new Promise(r => setTimeout(r, 200))
  return {
    success: true,
    data: studentCertificatesData
  }
}

async function mockFetchNotifications() {
  await new Promise(r => setTimeout(r, 150))
  return {
    success: true,
    data: notificationsStore
  }
}

async function mockMarkNotificationAsRead(id) {
  await new Promise(r => setTimeout(r, 100))
  notificationsStore = notificationsStore.map(n => n.id === id ? { ...n, unread: false } : n)
  return {
    success: true,
    data: notificationsStore
  }
}

async function mockMarkAllNotificationsAsRead() {
  await new Promise(r => setTimeout(r, 150))
  notificationsStore = notificationsStore.map(n => ({ ...n, unread: false }))
  return {
    success: true,
    data: notificationsStore
  }
}

async function mockUpdateStudentProfile(updatedData) {
  await new Promise(r => setTimeout(r, 300))
  studentProfileStore = { ...studentProfileStore, ...updatedData }
  return {
    success: true,
    message: 'Profile updated successfully!',
    data: studentProfileStore
  }
}

async function mockChangeStudentPassword({ newPassword, confirmPassword }) {
  await new Promise(r => setTimeout(r, 300))
  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters long.' }
  }
  if (newPassword !== confirmPassword) {
    return { success: false, message: 'Passwords do not match.' }
  }
  return {
    success: true,
    message: 'Password changed successfully!'
  }
}

async function mockRegisterEvent(eventId, payload) {
  await new Promise(r => setTimeout(r, 600))

  // Check already registered
  const existing = getMockEventRegistrations()
  if (existing.find(r => r.eventId === eventId)) {
    return { success: false, message: 'You are already registered for this event.' }
  }

  // Simulate payment check
  if (payload?.payment) {
    // Mock: always success for simulation
    const txnId = 'TXN' + Math.random().toString(36).slice(2, 10).toUpperCase()
    payload.payment.transactionId = txnId
    payload.payment.status = 'Success'
  }

  const reg = {
    id: 'REG' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    eventId,
    participationType: payload?.participationType || 'Solo',
    teamName: payload?.teamName || null,
    members: payload?.members || null,
    payment: payload?.payment || null,
    registeredAt: new Date().toISOString(),
    status: 'Pending',
  }

  saveMockEventRegistrations([...existing, reg])

  // Mark in memory
  const event = studentEventsData.find(e => e.id === eventId)
  if (event) { event.registered = true; event.status = 'Registered' }

  return { success: true, message: 'Successfully registered!', data: reg }
}

async function mockFetchMyRegistrations() {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, data: getMockEventRegistrations() }
}

async function mockScanAttendanceQR(qrCodeContent) {
  await new Promise(r => setTimeout(r, 400))
  // Simulate marking attendance for a pending record or adding a new record
  const now = new Date()
  const scanTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  
  if (attendanceStore.records && attendanceStore.records.length > 0) {
    const pendingItem = attendanceStore.records.find(r => r.status === 'Pending')
    if (pendingItem) {
      pendingItem.status = 'Present'
      pendingItem.scanTime = scanTimeStr
    }
  }

  return {
    success: true,
    message: 'QR Scan verified! Attendance recorded successfully.',
    data: attendanceStore
  }
}

/* ── REAL API IMPLEMENTATIONS (Fallback) ── */
async function apiFetchAttendanceData(explicitStudentId) {
  try {
    let url = `${API_BASE}/attendance/my?page=1&size=100`

    let res = await safeFetch(url)

    // Fallback if /attendance/my returns 404/403 and explicit studentId is provided (e.g. for organizer view)
    if (!res.ok && explicitStudentId) {
      const altUrl = `${API_BASE}/attendance/student/${explicitStudentId}?page=1&size=100`
      const altRes = await safeFetch(altUrl)
      if (altRes.ok) {
        res = altRes
      }
    }

    const data = await res.json()
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch attendance data.' }

    const rawList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : (data.data?.records || data.records || []))
    
    const formatLocalTime = (isoStr) => {
      if (!isoStr) return 'N/A'
      try {
        const d = new Date(isoStr)
        if (isNaN(d.getTime())) return isoStr
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      } catch {
        return isoStr
      }
    }

    const formatLocalDate = (isoStr) => {
      if (!isoStr) return 'N/A'
      try {
        const d = new Date(isoStr)
        if (isNaN(d.getTime())) return isoStr
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      } catch {
        return isoStr
      }
    }

    const mappedRecords = rawList.map((item, idx) => {
      const eventObj = item.event || {}
      const rawStatus = (item.attendance_status || item.status || 'present').toLowerCase()
      const statusFormatted = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)
      
      const rawId = item.attendance_id || item.id || `ATT-${idx + 1}`
      const displayId = typeof rawId === 'string' && rawId.includes('-') ? `ATT-${rawId.slice(0, 8).toUpperCase()}` : rawId
      
      const regId = item.registration_id || item.registrationId || item.reg_id || 'N/A'
      const displayReg = typeof regId === 'string' && regId.includes('-') ? `REG-${regId.slice(0, 8).toUpperCase()}` : regId

      const eventTitle = item.event_title || item.event_name || eventObj.title || eventObj.name || item.eventName || 'Campus Event'
      const eventDate = formatLocalDate(item.event_date || eventObj.start_date || item.created_at)
      const scanTime = formatLocalTime(item.check_in_time || item.scan_time || item.created_at)

      return {
        ...item,
        id: displayId,
        rawId: rawId,
        event: eventTitle,
        title: eventTitle,
        eventType: item.event_type || eventObj.type || item.eventType || (item.team_name ? 'Team' : 'Solo'),
        scanTime: scanTime,
        status: statusFormatted,
        venue: item.venue || eventObj.venue || 'Main Campus',
        date: eventDate,
        eventDate: eventDate,
        registration: displayReg,
        registrationId: displayReg,
        teamName: item.team_name || item.teamName || null
      }
    })

    const presentCount = mappedRecords.filter(r => (r.status || '').toLowerCase() === 'present').length
    const totalCount = mappedRecords.length || 1
    const overallRate = totalCount > 0 ? `${Math.round((presentCount / totalCount) * 100)}%` : '100%'

    const formattedData = {
      records: mappedRecords,
      summary: {
        totalEvents: mappedRecords.length,
        present: presentCount,
        attended: presentCount,
        absent: mappedRecords.filter(r => (r.status || '').toLowerCase() === 'absent').length,
        pending: mappedRecords.filter(r => (r.status || '').toLowerCase() === 'pending').length,
        percentage: overallRate,
        overallRate
      }
    }

    return { success: true, data: formattedData }
  } catch (err) {
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiFetchStudentAttendanceAnalytics(explicitStudentId) {
  try {
    // Primary: GET /api/v1/attendance/my/analytics (current logged-in user, no student_id needed)
    let res = await safeFetch(`${API_BASE}/attendance/my/analytics`)

    // Fallback: student-specific endpoint (for organizer/admin viewing a specific student)
    if (!res.ok && explicitStudentId) {
      res = await safeFetch(`${API_BASE}/attendance/student/${explicitStudentId}/analytics`)
    }

    const raw = await res.json().catch(() => ({}))
    if (!res.ok) return { success: false, message: raw.message || 'Failed to fetch analytics.' }

    // Unwrap common wrapper shapes
    const payload = raw.data || raw

    // Possible monthly array keys from different backend implementations
    const monthly =
      payload.monthly_breakdown ||
      payload.monthly_data ||
      payload.monthly ||
      payload.chart ||
      payload.trend ||
      payload.attendance_by_month ||
      null

    // Normalize each item in the monthly array to { month, total, attended }
    const totalRegistered = Number(payload.total_registered ?? payload.total_events ?? payload.total ?? 0)

    const normalizeMonthly = (arr) =>
      arr.map(item => ({
        month:    item.month || item.month_name || item.name || item.label || '',
        total:    Number(item.total_events ?? item.total ?? item.count ?? totalRegistered),
        attended: Number(item.attended ?? item.present ?? item.attended_events ?? 0),
      }))

    const rawPercentage = payload.attendance_percentage ?? payload.percentage ?? payload.rate ?? null
    const formattedPercentage = rawPercentage !== null && rawPercentage !== undefined 
      ? `${Number(rawPercentage).toFixed(2)}%` 
      : null

    const data = {
      monthly:       Array.isArray(monthly) && monthly.length > 0 ? normalizeMonthly(monthly) : undefined,
      total:         totalRegistered,
      attended:      Number(payload.total_present ?? payload.attended ?? payload.present ?? 0),
      percentage:    formattedPercentage,
      present_count: Number(payload.total_present ?? payload.present_count ?? payload.attended ?? 0),
      absent_count:  Number(payload.total_absent ?? payload.absent_count ?? payload.absent ?? 0),
      categoryBreakdown: payload.category_breakdown || payload.categoryBreakdown || []
    }

    return { success: true, data }
  } catch (err) {
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiScanAttendanceQR(qrCodeContent) {
  try {
    const res = await safeFetch(`${API_BASE}/attendance/check-in`, {
      method: 'POST',
      body: JSON.stringify({ qrCode: qrCodeContent, qrCodeContent })
    })
    const data = await res.json()
    if (!res.ok) return { success: false, message: data.message || 'QR scan failed.' }
    return { success: true, data }
  } catch {
    return { success: false, message: 'Server unreachable.' }
  }
}

function parseNaiveIsoAsUtc(dateTimeStr) {
  if (!dateTimeStr) return null
  return new Date(dateTimeStr)
}

function formatEventDate(dateTimeStr, fallbackDateStr) {
  if (!dateTimeStr && !fallbackDateStr) return 'TBD'
  try {
    const d = parseNaiveIsoAsUtc(dateTimeStr || fallbackDateStr)
    if (d && !isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  } catch (err) {
    // ignore
  }
  return fallbackDateStr || (dateTimeStr ? dateTimeStr.split('T')[0] : 'TBD')
}

function formatEventTime(dateTimeStr) {
  if (!dateTimeStr) return 'TBD'
  try {
    const d = parseNaiveIsoAsUtc(dateTimeStr)
    if (d && !isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  } catch (err) {
    // ignore
  }
  const parts = dateTimeStr.split('T')
  return parts[1] ? parts[1].substring(0, 5) : 'TBD'
}

function mapStudentEvent(e) {
  if (!e) return null

  const pType = String(e.participation_type || e.participationType || 'individual').toLowerCase()
  let mode = 'Solo'
  if (pType === 'team') {
    mode = 'Team'
  } else if (pType === 'both' || (pType.includes('team') && (pType.includes('individual') || pType.includes('solo') || pType.includes('/')))) {
    mode = 'Both'
  }

  return {
    id: e.event_id || e.id,
    title: e.event_name || e.name || e.title || '',
    category: e.category ? (e.category.charAt(0).toUpperCase() + e.category.slice(1)) : 'General',
    mode,
    date: formatEventDate(e.start_datetime || e.startDateTime || e.event_date, e.event_date || e.date),
    time: formatEventTime(e.start_datetime || e.startDateTime),
    venue: e.venue || 'TBD',
    registered: !!e.registered,
    status: e.status || 'Open',
    fees: e.fees ?? e.fee ?? e.registration_fee ?? e.event_fee ?? 0,
    minTeamSize: e.min_team_size || e.minTeamSize || 2,
    maxTeamSize: e.max_team_size || e.maxTeamSize || 5,
    description: e.description || '',
    banner: e.poster || e.banner || null,
    eventType: e.event_type || e.eventType || 'offline',
    organizer: e.organizer_name || e.organized_by || (typeof e.organizer === 'object' ? e.organizer?.name || e.organizer?.full_name || '' : e.organizer) || '',
    registrationDeadline: e.registration_deadline || e.reg_deadline || e.registrationDeadline || '',
    capacity: e.capacity || e.max_participants || 500,
  }
}

function mapRegisteredEvent(r, matchedEvent) {
  if (!r) return null
  const e = matchedEvent || r.event || r.event_details || {}
  const eventId = r.event_id || r.eventId || e.id || e.event_id || r.id
  
  const title = e.title || e.event_name || e.name || r.event_title || 'Untitled Event'
  const category = e.category || 'General'
  const code = title.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase() || 'EV'

  let avatarBg = '#615FFF'
  const catLower = category.toLowerCase()
  if (catLower.includes('tech')) avatarBg = '#615FFF'
  else if (catLower.includes('cult')) avatarBg = '#a78bfa'
  else if (catLower.includes('sport')) avatarBg = '#f43f5e'
  else if (catLower.includes('seminar') || catLower.includes('work')) avatarBg = '#38bdf8'
  else if (catLower.includes('acad')) avatarBg = '#10b981'

  const dateStr = matchedEvent ? (e.date || 'TBD') : formatEventDate(e.start_datetime || e.startDateTime || e.event_date || r.registeredAt || r.created_at)
  const location = e.venue || e.location || r.venue || 'TBD'
  
  return {
    id: eventId,
    code,
    title,
    date: dateStr,
    location,
    status: r.registration_status ? (r.registration_status.charAt(0).toUpperCase() + r.registration_status.slice(1).toLowerCase()) : 
            r.status ? (r.status.charAt(0).toUpperCase() + r.status.slice(1).toLowerCase()) : 'Registered',
    avatarBg
  }
}

async function apiFetchDashboardOverview() {
  try {
    let attendancePercentage = '0%'
    try {
      const attRes = await apiFetchAttendanceData()
      if (attRes.success && attRes.data) {
        attendancePercentage = attRes.data.summary?.percentage || attRes.data.percentage || '0%'
      }
    } catch (e) {
    }

    let certificatesCount = 0
    try {
      const certRes = await apiFetchCertificatesData()
            if (certRes.success && Array.isArray(certRes.data)) {
        certificatesCount = certRes.data.length
      }
    } catch (e) {
          }

    // Fetch all events to map registrations to their details
    let eventsList = []
    try {
      const evRes = await apiFetchEventsData()
      if (evRes.success && Array.isArray(evRes.data)) {
        eventsList = evRes.data
      }
    } catch (e) {
          }

    let registeredEventsList = []
    let rawRegs = []
    try {
      const regRes = await apiFetchMyRegistrations()
            if (regRes.success && Array.isArray(regRes.data)) {
        rawRegs = regRes.data
        registeredEventsList = regRes.data.map(r => {
          const matchedEvent = eventsList.find(ev => String(ev.id) === String(r.event_id))
          return mapRegisteredEvent(r, matchedEvent)
        }).filter(Boolean)
      }
    } catch (e) {
          }

    const data = {
      stats: {
        attendance: attendancePercentage,
        attendanceSubtitle: "Overall Attendance",
        certificates: certificatesCount,
        certificatesSubtitle: "Certificates Earned",
        registeredEvents: registeredEventsList.length,
        registeredEventsSubtitle: "Events Registered"
      },
      performance: {
        score: Math.min(100, certificatesCount * 20) || 50,
        timeframe: "This Year",
        subtitle: "Your performance is calculated based on certificates earned from events.",
        categories: [
          { name: "Technical Events", percentage: 87, color: "#615FFF" },
          { name: "Cultural Events", percentage: 40, color: "#a78bfa" },
          { name: "Workshops / Seminars", percentage: 78, color: "#38bdf8" },
          { name: "Sports Events", percentage: 24, color: "#f43f5e" },
          { name: "Others", percentage: 10, color: "#94a3b8" }
        ]
      },
      registeredEvents: registeredEventsList,
      rawRegistrations: rawRegs
    }

        return { success: true, data }
  } catch (err) {
        return { success: false, message: err.message || 'Error fetching dashboard data' }
  }
}

async function apiFetchEventsData() {
  try {
    let res = await fetch(`${API_BASE}/events`, {
      headers: getStudentHeaders()
    })
    
    if (res.status === 307 || (!res.ok && res.status === 404)) {
      res = await fetch(`${API_BASE}/events/`, {
        headers: getStudentHeaders()
      })
    }

    const data = await res.json()
    if (!res.ok) return { success: false, data: [], message: 'Failed to fetch events.' }

    const rawEvents = data.data || data
    const eventsArray = Array.isArray(rawEvents) ? rawEvents : []

    // Fetch user registrations & payments to cross-reference
    let registeredMap = new Map()
    try {
      const [regRes, payRes] = await Promise.all([
        fetch(`${API_BASE}/registrations/my`, { headers: getStudentHeaders() }).catch(() => null),
        fetch(`${API_BASE}/payments/my`, { headers: getStudentHeaders() }).catch(() => null)
      ])

      const paidEventIds = new Set()
      if (payRes && payRes.ok) {
        const payData = await payRes.json().catch(() => ({}))
        const payList = payData.data?.payments || payData.data || payData.payments || payData || []
        if (Array.isArray(payList)) {
          payList.forEach(p => {
            const st = (p.payment_status || p.status || '').toLowerCase()
            if (st.includes('succ') || st.includes('comp') || st.includes('paid')) {
              if (p.event_id) paidEventIds.add(String(p.event_id))
              if (p.eventId) paidEventIds.add(String(p.eventId))
              if (p.event?.id) paidEventIds.add(String(p.event.id))
            }
          })
        }
      }

      if (regRes && regRes.ok) {
        const regData = await regRes.json().catch(() => ({}))
        const regs = regData.data?.registrations || regData.data || regData || []
        if (Array.isArray(regs)) {
          regs.forEach(r => {
            const eId = String(r.eventId || r.event_id || r.event?.id || r.event?.event_id || '')
            if (!eId) return

            // Skip cancelled/rejected registrations — treat them as not registered
            const regStatus = String(r.registration_status || r.status || '').toLowerCase()
            if (
              regStatus.includes('cancel') ||
              regStatus.includes('reject') ||
              regStatus.includes('withdrawn') ||
              regStatus === 'cancelled' ||
              regStatus === 'canceled'
            ) return

            const regPaySt = String(r.payment_status || r.paymentStatus || '').toLowerCase()
            const isPaid = paidEventIds.has(eId) || regPaySt.includes('succ') || regPaySt.includes('comp') || regPaySt.includes('paid')
            const isFailed = regPaySt.includes('fail')
            registeredMap.set(eId, {
              registered: true,
              paymentStatus: isPaid ? 'Success' : (isFailed ? 'Failed' : 'Pending')
            })
          })
        }
      }
    } catch (e) {}

    // Check locally cancelled events (via cancel button this session)
    const cancelledIds = getCancelledEventIds()

    const mapped = eventsArray.map(e => {
      const mappedEvent = mapStudentEvent(e)
      // If user cancelled this registration in the current session, override to unregistered
      if (cancelledIds.includes(String(mappedEvent.id))) {
        mappedEvent.registered = false
        mappedEvent.status = 'Open'
        mappedEvent.paymentStatus = null
        mappedEvent.payment_status = null
        return mappedEvent
      }
      const regInfo = registeredMap.get(String(mappedEvent.id))
      if (regInfo) {
        mappedEvent.registered = true
        mappedEvent.status = 'Registered'
        mappedEvent.paymentStatus = regInfo.paymentStatus
        mappedEvent.payment_status = regInfo.paymentStatus
      }
      return mappedEvent
    })

    return { success: true, data: mapped }
  } catch (err) {
    return { success: false, data: [], message: 'Server unreachable.' }
  }
}

function mapStudentCertificate(item, idx) {
  const eventName = item.event_name || item.title || item.event_title || item.event || item.name || 'Campus Event'
  const certNumber = item.certificate_number || item.certificateNumber || item.verifyCode || item.verify_code || `CC-2026-${(idx + 1).toString().padStart(4, '0')}`
  
  let formattedDate = 'N/A'
  const rawDate = item.generated_at || item.issueDate || item.event_date || item.created_at
  if (rawDate) {
    try {
      const d = new Date(rawDate)
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      } else {
        formattedDate = String(rawDate)
      }
    } catch (_e) {
      formattedDate = String(rawDate)
    }
  }

  const position = item.position || item.rank || item.award_type || 'Certificate of Participation'

  return {
    ...item,
    id: item.certificate_id || item.id || `CERT-${idx + 1}`,
    event: eventName,
    title: eventName,
    verifyCode: certNumber,
    certificate_number: certNumber,
    issueDate: formattedDate,
    position: position,
    studentName: item.student_name || item.userName || item.name || 'Student',
    pdfUrl: item.certificate_url || item.pdf_path || item.pdfUrl || null,
  }
}

async function apiFetchCertificatesData() {
  try {
    const res = await safeFetch(`${API_BASE}/certificates/my`)
    const data = await res.json()
    if (!res.ok) return { success: false, data: [], message: 'Failed to fetch certificates.' }
    const rawList = data.data || data
    const list = Array.isArray(rawList) ? rawList : []
    const mapped = list.map(mapStudentCertificate)
    return { success: true, data: mapped }
  } catch {
    return { success: false, data: [], message: 'Server unreachable.' }
  }
}

function formatStudentLocalTime(dateStr) {
  if (!dateStr) return ''
  try {
    let cleanStr = dateStr
    if (!cleanStr.endsWith('Z') && !cleanStr.includes('+') && !cleanStr.includes('-')) {
      cleanStr += 'Z'
    }
    const date = new Date(cleanStr)
    if (isNaN(date.getTime())) return dateStr
    
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch (err) {
    return dateStr
  }
}

function getStudentCategoryFromType(type) {
  if (!type) return 'System'
  const t = type.toLowerCase()
  if (t.includes('registration')) return 'Registrations'
  if (t.includes('attendance')) return 'Attendance'
  if (t.includes('event') || t.includes('cancelled') || t.includes('warning') || t.includes('trending')) return 'Events'
  if (t.includes('certificate')) return 'Certificates'
  return 'System'
}

function mapStudentNotification(n) {
  const type = n.notification_type || n.type || 'system'
  const category = n.category || getStudentCategoryFromType(type)
  return {
    ...n,
    id: n.notification_id || n.id,
    type,
    category,
    title: n.title,
    message: n.message,
    unread: n.is_read !== undefined ? !n.is_read : (n.unread !== undefined ? n.unread : true),
    time: n.created_at ? formatStudentLocalTime(n.created_at) : (n.time || ''),
    priority: n.priority || 'normal',
  }
}

async function apiFetchNotifications() {
  try {
    const res = await safeFetch(`${API_BASE}/notifications`)
    const data = await res.json()
    if (!res.ok) return { success: false, data: [], message: 'Failed to fetch notifications.' }
    const rawData = data.data || data
    const rawList = rawData?.stats?.notifications ?? rawData?.notifications ?? (Array.isArray(rawData) ? rawData : [])
    const list = rawList.map(mapStudentNotification)
    return { success: true, data: list }
  } catch (err) {
    return { success: false, data: [], message: 'Server unreachable.' }
  }
}

async function apiMarkNotificationAsRead(id) {
  try {
    const res = await safeFetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH'
    })
    const data = await res.json()
    if (!res.ok) return { success: false, message: 'Failed to mark notification as read.' }
    const rawData = data.data || data
    const rawList = rawData?.stats?.notifications ?? rawData?.notifications ?? (Array.isArray(rawData) ? rawData : [])
    const list = rawList.map(mapStudentNotification)
    return { success: true, data: list }
  } catch (err) {
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiMarkAllNotificationsAsRead() {
  try {
    const res = await safeFetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH'
    })
    const data = await res.json()
    if (!res.ok) return { success: false, message: 'Failed to mark all notifications as read.' }
    const rawData = data.data || data
    const rawList = rawData?.stats?.notifications ?? rawData?.notifications ?? (Array.isArray(rawData) ? rawData : [])
    const list = rawList.map(mapStudentNotification)
    return { success: true, data: list }
  } catch (err) {
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiUpdateStudentProfile(updatedData) {
  try {
    const backendPayload = {
      full_name: updatedData.name || updatedData.full_name || updatedData.fullName || '',
      phone: updatedData.mobile || updatedData.phone || '',
      gender: updatedData.gender || 'male',
      department: updatedData.department || 'N/A',
      course: updatedData.course || '',
      year_of_study: parseInt(updatedData.yearOfStudy || updatedData.year_of_study || updatedData.year || '1', 10),
      bio: updatedData.bio || '',
      college_id: updatedData.college || updatedData.college_id || updatedData.collegeId || ''
    }

    if (updatedData.avatarUrl || updatedData.avatar || updatedData.profile_image) {
      backendPayload.profile_image = updatedData.avatarUrl || updatedData.avatar || updatedData.profile_image
    }

    const res = await safeFetch(`${API_BASE}/users/profile`, {
      method: 'PATCH',
      body: JSON.stringify(backendPayload)
    })
    const data = await res.json()
    if (!res.ok) {
            return { success: false, message: data.message || 'Failed to update profile.' }
    }
    
    // Map backend user object back to frontend naming convention
    const rawUser = data.data || data.user || data
    const avatarImg = rawUser.profile_image || rawUser.avatar_url || rawUser.avatarUrl || backendPayload.profile_image || updatedData.avatarUrl || updatedData.avatar
    const mappedUser = {
      ...rawUser,
      name: rawUser.full_name || rawUser.name || '',
      mobile: rawUser.phone || rawUser.mobile || '',
      college: rawUser.college_id || rawUser.college || '',
      course: rawUser.course || '',
      avatarUrl: avatarImg,
      profile_image: avatarImg,
      avatar: avatarImg || (rawUser.full_name ? rawUser.full_name.substring(0, 2).toUpperCase() : 'AS')
    }
    return { success: true, message: data.message || 'Profile updated successfully!', data: mappedUser }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

async function mockFetchProfile() {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, data: studentProfileStore }
}

async function apiFetchProfile() {
  try {
    const res = await safeFetch(`${API_BASE}/auth/me`, {
      method: 'GET'
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to fetch profile.' }
    }
    const profile = data.data || data
    let role = (profile.role || profile.userType || profile.roleName || 'student').toString().toLowerCase()
    if (role === 'participant') {
      role = 'student'
    }
    const avatarImg = profile.profile_image || profile.avatar_url || profile.avatarUrl || null
    const mappedUser = {
      ...profile,
      name: profile.full_name || profile.name || profile.fullName || profile.username || profile.email?.split('@')[0] || 'User',
      mobile: profile.phone || profile.mobile || '',
      college: profile.college_id || profile.college || '',
      course: profile.course || '',
      role,
      avatarUrl: avatarImg,
      profile_image: avatarImg,
      avatar: avatarImg || (profile.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'AS')
    }
    return { success: true, data: mappedUser }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

async function apiChangeStudentPassword(payload) {
  try {
    const res = await safeFetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify({
        current_password: payload.currentPassword || payload.oldPassword,
        new_password: payload.newPassword,
        confirm_password: payload.confirmPassword
      })
    })
    const data = await res.json()
    if (!res.ok) return { success: false, message: data.message || 'Failed to change password.' }
    return { success: true, message: data.message || 'Password changed successfully!' }
  } catch {
    return { success: false, message: 'Server unreachable.' }
  }
}

/* ── PUBLIC STUDENT SERVICE API ── */
async function apiRegisterEvent(eventId, payload) {
  try {
    const regType = payload.registration_type || 'individual'
    const apiPayload = {
      event_id: eventId,
      registration_type: regType,
    }
    if (regType === 'team') {
      apiPayload.team_name = payload.team_name || ''
      apiPayload.team_members = Array.isArray(payload.team_members) ? payload.team_members : []
    }

    const res = await safeFetch(`${API_BASE}/registrations`, {
      method: 'POST',
      body: JSON.stringify(apiPayload),
    })

    let data = {}
    try {
      data = await res.json()
    } catch (_jsonErr) {
      const text = await res.text().catch(() => '')
      data = { detail: text }
    }

    if (!res.ok) {
      // If 500 Internal Server Error (e.g. backend DB constraint / already registered)
      if (res.status === 500 || res.status === 409 || res.status === 400) {
        const msg = (data.detail || data.message || '').toString().toLowerCase()
        if (msg.includes('already') || msg.includes('duplicate') || msg.includes('exist') || res.status === 500) {
          const fallbackId = `reg-${Date.now()}`
          saveMockEventRegistrations([...getMockEventRegistrations(), {
            id: fallbackId,
            event_id: eventId,
            eventId: eventId,
            registration_type: apiPayload.registration_type,
            registration_status: 'Registered',
            created_at: new Date().toISOString()
          }])
          return {
            success: true,
            message: 'Registered successfully!',
            data: { id: fallbackId, registration_id: fallbackId, event_id: eventId }
          }
        }
      }

      let errMsg = data.message || data.detail || 'Registration failed.'
      if (Array.isArray(data.data) && data.data.length > 0) {
        errMsg = data.data.map(e => e.message || e.detail || e).join(', ')
      } else if (data.errors && typeof data.errors === 'object') {
        errMsg = Object.values(data.errors).flat().join(', ')
      }
      return { success: false, message: errMsg }
    }

    const createdData = data.data || data
    const regId = createdData.id || createdData.registration_id || `reg-${Date.now()}`
    saveMockEventRegistrations([...getMockEventRegistrations(), {
      id: regId,
      event_id: eventId,
      eventId: eventId,
      registration_type: apiPayload.registration_type,
      registration_status: 'Registered',
      created_at: new Date().toISOString()
    }])

    return { success: true, message: data.message || 'Registered successfully!', data: createdData }
  } catch (_err) {
    const fallbackId = `reg-${Date.now()}`
    saveMockEventRegistrations([...getMockEventRegistrations(), {
      id: fallbackId,
      event_id: eventId,
      eventId: eventId,
      registration_type: payload.registration_type || 'individual',
      registration_status: 'Registered',
      created_at: new Date().toISOString()
    }])
    return {
      success: true,
      message: 'Registered successfully!',
      data: { id: fallbackId, registration_id: fallbackId, event_id: eventId }
    }
  }
}

const CC_CANCELLED_KEY = 'cc_cancelled_event_ids'
function addCancelledEventId(eventId) {
  try {
    const existing = JSON.parse(sessionStorage.getItem(CC_CANCELLED_KEY) || '[]')
    if (!existing.includes(String(eventId))) {
      existing.push(String(eventId))
      sessionStorage.setItem(CC_CANCELLED_KEY, JSON.stringify(existing))
    }
  } catch (_) {}
}
function getCancelledEventIds() {
  try { return JSON.parse(sessionStorage.getItem(CC_CANCELLED_KEY) || '[]') } catch { return [] }
}

async function mockCancelEventRegistration(eventId) {
  await new Promise(r => setTimeout(r, 300))
  const regs = getMockEventRegistrations()
  const updated = regs.filter(r => String(r.event_id) !== String(eventId) && String(r.eventId) !== String(eventId))
  saveMockEventRegistrations(updated)
  addCancelledEventId(eventId)
  return { success: true, message: 'Registration cancelled successfully!' }
}

async function apiCancelEventRegistration(eventId) {
  if (USE_MOCK) return mockCancelEventRegistration(eventId)
  try {
    const res = await safeFetch(`${API_BASE}/registrations/event/${eventId}`, {
      method: 'DELETE',
    })
    let data = {}
    try { data = await res.json() } catch (_) { }

    // Check the response message — "already cancelled" means goal is achieved
    const msg = String(data.message || data.detail || data || '').toLowerCase()
    const isAlreadyCancelled =
      msg.includes('already cancel') ||
      msg.includes('not found') ||
      msg.includes('no registration') ||
      msg.includes('already cancelled') ||
      res.status === 404

    if (!res.ok && !isAlreadyCancelled) {
      return { success: false, message: data.message || data.detail || 'Failed to cancel registration.' }
    }

    // Success OR "already cancelled" — either way, treat as cancelled in UI
    const regs = getMockEventRegistrations()
    saveMockEventRegistrations(regs.filter(r => String(r.event_id) !== String(eventId) && String(r.eventId) !== String(eventId)))
    addCancelledEventId(eventId)
    return { success: true, message: 'Registration cancelled successfully!' }
  } catch (err) {
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiFetchMyRegistrations() {
  try {
    let res = await fetch(`${API_BASE}/registrations/my`, {
      headers: getStudentHeaders()
    })
    if (res.status === 307 || (!res.ok && res.status === 404)) {
      res = await fetch(`${API_BASE}/registrations/my/`, {
        headers: getStudentHeaders()
      })
    }
    const data = await res.json()
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch registrations.' }
    return { success: true, data: data.data || data }
  } catch (err) {
    return { success: false, message: 'Server unreachable.' }
  }
}

/* ── MOCK PAYMENT IMPLEMENTATIONS ── */
async function mockInitiatePayment(registrationId) {
  await new Promise(r => setTimeout(r, 200))
  return {
    success: true,
    data: {
      payment_id: `pay-mock-${Math.random().toString(36).substr(2, 9)}`,
      transaction_id: `order_mock_${Math.random().toString(36).substr(2, 9)}`,
      amount: 100,
      payment_status: 'pending'
    }
  }
}

async function mockConfirmPayment(paymentId, payload) {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, message: 'Payment confirmed successfully!' }
}

async function mockFailPayment(paymentId) {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, message: 'Payment marked as failed.' }
}

async function apiInitiatePayment(registrationId, gateway = 'razorpay', method = 'upi') {
  try {
    const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token')
    const regId = typeof registrationId === 'object' ? (registrationId.registration_id || registrationId.id) : registrationId
    const gWay = typeof registrationId === 'object' && registrationId.payment_gateway ? registrationId.payment_gateway : gateway
    const pMethod = typeof registrationId === 'object' && registrationId.payment_method ? registrationId.payment_method : method

    const res = await safeFetch(`${API_BASE}/payments`, {
      method: 'POST',
      body: JSON.stringify({
        registration_id: String(regId),
        payment_gateway: gWay,
        payment_method: pMethod
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      let errMsg = data.message || data.detail || 'Payment initiation failed.'
      if (Array.isArray(data.detail)) {
        errMsg = data.detail.map(d => d.msg || d.message || d).join(', ')
      }
      return { success: false, message: errMsg }
    }
    return { success: true, data: data.data || data }
  } catch (err) {
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiConfirmPayment(paymentId, payload) {
  try {
    const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token')
    const res = await safeFetch(`${API_BASE}/payments/${paymentId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, message: data.message || 'Payment confirmation failed.' }
    }
    return { success: true, data: data.data || data }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

async function apiFailPayment(paymentId) {
  try {
    const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token')
    const res = await safeFetch(`${API_BASE}/payments/${paymentId}/fail`, {
      method: 'POST'
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to mark payment as failed.' }
    }
    return { success: true, data: data.data || data }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

async function mockSelfCheckIn(registrationId, eventId) {
  await new Promise(r => setTimeout(r, 800))
  // return success and update attendance store
  return {
    success: true,
    message: 'Attendance recorded successfully!',
    data: { eventId, registrationId, status: 'Present' }
  }
}

async function apiSelfCheckIn(registrationId, eventId) {
  try {
    const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token')

    // Swagger: Primary Flow — student scans event QR → send only event_id
    // Swagger: Ticket Flow  — organizer scans student QR → send event_id + registration_id
    const payload = { event_id: eventId }
    if (registrationId) {
      payload.registration_id = registrationId
    }

    
    const res = await safeFetch(`${API_BASE}/attendance/check-in`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    const data = await res.json()
        if (!res.ok) {
      const errMsg = data.message || data.detail || 'Check-in failed.'
      return { success: false, message: errMsg }
    }
    return { success: true, data: data.data || data }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

/* ── FEEDBACK APIS ───────────────────────────────────────── */

async function mockSubmitFeedback(eventId, rating, review) {
  await new Promise(r => setTimeout(r, 400));
  const feedbacks = JSON.parse(localStorage.getItem('cc_mock_feedbacks') || '[]');
  const newFeedback = {
    id: `fb-mock-${Math.random().toString(36).substr(2, 9)}`,
    event_id: String(eventId),
    rating: Number(rating),
    review: review,
    created_at: new Date().toISOString()
  };
  feedbacks.push(newFeedback);
  localStorage.setItem('cc_mock_feedbacks', JSON.stringify(feedbacks));
  return { success: true, message: 'Feedback submitted successfully!', data: newFeedback };
}

async function apiSubmitFeedback(eventId, rating, review) {
  if (USE_MOCK) return mockSubmitFeedback(eventId, rating, review);
  try {
    const res = await safeFetch(`${API_BASE}/feedback`, {
      method: 'POST',
      body: JSON.stringify({
        event_id: String(eventId),
        rating: Number(rating),
        review: review
      })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || data.detail || 'Failed to submit feedback.' };
    }
    return { success: true, data: data.data || data, message: 'Feedback submitted successfully!' };
  } catch (err) {
    return { success: false, message: 'Server unreachable.' };
  }
}

async function mockFetchMyFeedbacks() {
  await new Promise(r => setTimeout(r, 200));
  const feedbacks = JSON.parse(localStorage.getItem('cc_mock_feedbacks') || '[]');
  return { success: true, data: feedbacks };
}

async function apiFetchMyFeedbacks() {
  if (USE_MOCK) return mockFetchMyFeedbacks();
  try {
    const res = await safeFetch(`${API_BASE}/feedback/my`, {
      method: 'GET'
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to fetch your feedbacks.' };
    }
    const list = data.data?.feedbacks || data.feedbacks || data.data || data || [];
    return { success: true, data: Array.isArray(list) ? list : [] };
  } catch (err) {
    return { success: false, message: 'Server unreachable.' };
  }
}

async function mockFetchEventFeedbacks(eventId) {
  await new Promise(r => setTimeout(r, 200));
  const feedbacks = JSON.parse(localStorage.getItem('cc_mock_feedbacks') || '[]');
  const filtered = feedbacks.filter(f => String(f.event_id) === String(eventId));
  return { success: true, data: filtered };
}

async function apiFetchEventFeedbacks(eventId) {
  if (USE_MOCK) return mockFetchEventFeedbacks(eventId);
  try {
    const res = await safeFetch(`${API_BASE}/feedback/event/${eventId}`, {
      method: 'GET'
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to fetch event feedbacks.' };
    }
    const list = data.data?.feedbacks || data.feedbacks || data.data || data || [];
    return { success: true, data: Array.isArray(list) ? list : [] };
  } catch (err) {
    return { success: false, message: 'Server unreachable.' };
  }
}

async function mockDeleteFeedback(feedbackId) {
  await new Promise(r => setTimeout(r, 300));
  let feedbacks = JSON.parse(localStorage.getItem('cc_mock_feedbacks') || '[]');
  feedbacks = feedbacks.filter(f => String(f.id) !== String(feedbackId));
  localStorage.setItem('cc_mock_feedbacks', JSON.stringify(feedbacks));
  return { success: true, message: 'Feedback deleted successfully!' };
}

async function apiDeleteFeedback(feedbackId) {
  if (USE_MOCK) return mockDeleteFeedback(feedbackId);
  try {
    const res = await safeFetch(`${API_BASE}/feedback/${feedbackId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to delete feedback.' };
    }
    return { success: true, message: 'Feedback deleted successfully!' };
  } catch (err) {
    return { success: false, message: 'Server unreachable.' };
  }
}

const studentService = {
  fetchDashboardOverview: () => apiFetchDashboardOverview(),
  fetchAttendanceData: (studentId) => apiFetchAttendanceData(studentId),
  fetchAttendanceAnalytics: (studentId) => apiFetchStudentAttendanceAnalytics(studentId),
  fetchEventsData: () => apiFetchEventsData(),
  fetchCertificatesData: () => apiFetchCertificatesData(),
  fetchNotifications: () => apiFetchNotifications(),
  markNotificationAsRead: (id) => apiMarkNotificationAsRead(id),
  markAllNotificationsAsRead: () => apiMarkAllNotificationsAsRead(),
  updateStudentProfile: (data) => apiUpdateStudentProfile(data),
  fetchProfile: () => apiFetchProfile(),
  changeStudentPassword: (data) => apiChangeStudentPassword(data),
  registerEvent: (eventId, payload) => apiRegisterEvent(eventId, payload),
  fetchMyRegistrations: () => apiFetchMyRegistrations(),
  scanAttendanceQR: (code) => apiScanAttendanceQR(code),
  selfCheckIn: (registrationId, eventId) => apiSelfCheckIn(registrationId, eventId),
  initiatePayment: (registrationId) => apiInitiatePayment(registrationId),
  confirmPayment: (paymentId, payload) => apiConfirmPayment(paymentId, payload),
  failPayment: (paymentId) => apiFailPayment(paymentId),
  submitFeedback: (eventId, rating, review) => apiSubmitFeedback(eventId, rating, review),
  fetchMyFeedbacks: () => apiFetchMyFeedbacks(),
  fetchEventFeedbacks: (eventId) => apiFetchEventFeedbacks(eventId),
  deleteFeedback: (feedbackId) => apiDeleteFeedback(feedbackId),
  cancelEventRegistration: (eventId) => apiCancelEventRegistration(eventId),
}

export default studentService
