import studentDashboardData from '../data/student/studentDashboardData.json'
import studentAttendanceData from '../data/student/studentAttendanceData.json'
import studentEventsData from '../data/student/studentEventsData.json'
import studentCertificatesData from '../data/student/studentCertificatesData.json'
import studentNotificationsData from '../data/student/studentNotificationsData.json'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL

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
async function apiFetchAttendanceData() {
  try {
    const res = await fetch(`${API_BASE}/student/attendance`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        'ngrok-skip-browser-warning': 'true'
      }
    })
    const data = await res.json()
    if (!res.ok) return mockFetchAttendanceData()
    return { success: true, data }
  } catch {
    return mockFetchAttendanceData()
  }
}

async function apiScanAttendanceQR(qrCodeContent) {
  try {
    const res = await fetch(`${API_BASE}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ qrCode: qrCodeContent, qrCodeContent })
    })
    const data = await res.json()
    if (!res.ok) return mockScanAttendanceQR(qrCodeContent)
    return { success: true, data }
  } catch {
    return mockScanAttendanceQR(qrCodeContent)
  }
}

function formatEventDate(dateTimeStr, fallbackDateStr) {
  if (!dateTimeStr && !fallbackDateStr) return 'TBD'
  try {
    const d = new Date(dateTimeStr || fallbackDateStr)
    if (!isNaN(d.getTime())) {
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
    const d = new Date(dateTimeStr)
    if (!isNaN(d.getTime())) {
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
      console.log('[studentService] certificates response:', certRes)
      if (certRes.success && Array.isArray(certRes.data)) {
        certificatesCount = certRes.data.length
      }
    } catch (e) {
      console.error('[studentService] Dashboard overview failed to fetch certificates:', e)
    }

    // Fetch all events to map registrations to their details
    let eventsList = []
    try {
      const evRes = await apiFetchEventsData()
      if (evRes.success && Array.isArray(evRes.data)) {
        eventsList = evRes.data
      }
    } catch (e) {
      console.error('[studentService] Dashboard overview failed to fetch events:', e)
    }

    let registeredEventsList = []
    let rawRegs = []
    try {
      const regRes = await apiFetchMyRegistrations()
      console.log('[studentService] registrations response:', regRes)
      if (regRes.success && Array.isArray(regRes.data)) {
        rawRegs = regRes.data
        registeredEventsList = regRes.data.map(r => {
          const matchedEvent = eventsList.find(ev => String(ev.id) === String(r.event_id))
          return mapRegisteredEvent(r, matchedEvent)
        }).filter(Boolean)
      }
    } catch (e) {
      console.error('[studentService] Dashboard overview failed to fetch registrations:', e)
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

    console.log('[studentService] apiFetchDashboardOverview final data:', data)
    return { success: true, data }
  } catch (err) {
    console.error('[studentService] apiFetchDashboardOverview error:', err)
    return { success: false, message: err.message || 'Error fetching dashboard data' }
  }
}

async function apiFetchEventsData() {
  try {
    const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token')
    const res = await fetch(`${API_BASE}/events/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      }
    })
    const data = await res.json()
    if (!res.ok) return mockFetchEventsData()

    const rawEvents = data.data || data
    const eventsArray = Array.isArray(rawEvents) ? rawEvents : []

    // Fetch user registrations to cross-reference
    let registeredEventIds = new Set()
    try {
      const regRes = await fetch(`${API_BASE}/registrations/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      })
      if (regRes.ok) {
        const regData = await regRes.json()
        const regs = regData.data || regData || []
        if (Array.isArray(regs)) {
          regs.forEach(r => {
            if (r.eventId) registeredEventIds.add(r.eventId)
            if (r.event_id) registeredEventIds.add(r.event_id)
            if (r.event?.id) registeredEventIds.add(r.event.id)
            if (r.event?.event_id) registeredEventIds.add(r.event.event_id)
          })
        }
      }
    } catch (e) {
      console.error('[studentService] failed to fetch student registrations:', e)
    }

    const mapped = eventsArray.map(e => {
      const mappedEvent = mapStudentEvent(e)
      if (registeredEventIds.has(mappedEvent.id)) {
        mappedEvent.registered = true
        mappedEvent.status = 'Registered'
      }
      return mappedEvent
    })

    return { success: true, data: mapped }
  } catch (err) {
    console.error('[studentService] apiFetchEventsData error:', err)
    return mockFetchEventsData()
  }
}

async function apiFetchCertificatesData() {
  try {
    const res = await fetch(`${API_BASE}/certificates/my`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        'ngrok-skip-browser-warning': 'true'
      }
    })
    const data = await res.json()
    if (!res.ok) return mockFetchCertificatesData()
    return { success: true, data: data.data || data }
  } catch {
    return mockFetchCertificatesData()
  }
}

async function apiFetchNotifications() {
  try {
    const res = await fetch(`${API_BASE}/notifications/`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        'ngrok-skip-browser-warning': 'true'
      }
    })
    const data = await res.json()
    if (!res.ok) return mockFetchNotifications()
    const rawData = data.data || data
    const list = Array.isArray(rawData) ? rawData : (rawData?.notifications || [])
    return { success: true, data: list }
  } catch {
    return mockFetchNotifications()
  }
}

async function apiMarkNotificationAsRead(id) {
  try {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        'ngrok-skip-browser-warning': 'true'
      }
    })
    const data = await res.json()
    if (!res.ok) return mockMarkNotificationAsRead(id)
    const rawData = data.data || data
    const list = Array.isArray(rawData) ? rawData : (rawData?.notifications || [])
    return { success: true, data: list }
  } catch {
    return mockMarkNotificationAsRead(id)
  }
}

async function apiMarkAllNotificationsAsRead() {
  try {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        'ngrok-skip-browser-warning': 'true'
      }
    })
    const data = await res.json()
    if (!res.ok) return mockMarkAllNotificationsAsRead()
    const rawData = data.data || data
    const list = Array.isArray(rawData) ? rawData : (rawData?.notifications || [])
    return { success: true, data: list }
  } catch {
    return mockMarkAllNotificationsAsRead()
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

    const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token')
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(backendPayload)
    })
    const data = await res.json()
    if (!res.ok) {
      console.error('[studentService] apiUpdateStudentProfile failed status:', res.status, data)
      return { success: false, message: data.message || 'Failed to update profile.' }
    }
    
    // Map backend user object back to frontend naming convention
    const rawUser = data.data || data.user || data
    const mappedUser = {
      ...rawUser,
      name: rawUser.full_name || rawUser.name || '',
      mobile: rawUser.phone || rawUser.mobile || '',
      college: rawUser.college_id || rawUser.college || '',
      course: rawUser.course || '',
    }
    return { success: true, message: data.message || 'Profile updated successfully!', data: mappedUser }
  } catch (err) {
    console.error('[studentService] apiUpdateStudentProfile error:', err)
    return mockUpdateStudentProfile(updatedData)
  }
}

async function mockFetchProfile() {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, data: studentProfileStore }
}

async function apiFetchProfile() {
  try {
    const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token')
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      }
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
    const mappedUser = {
      ...profile,
      name: profile.full_name || profile.name || profile.fullName || profile.username || profile.email?.split('@')[0] || 'User',
      mobile: profile.phone || profile.mobile || '',
      college: profile.college_id || profile.college || '',
      course: profile.course || '',
      role,
    }
    return { success: true, data: mappedUser }
  } catch (err) {
    console.error('[studentService] apiFetchProfile error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiChangeStudentPassword(payload) {
  try {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        current_password: payload.currentPassword || payload.oldPassword,
        new_password: payload.newPassword,
        confirm_password: payload.confirmPassword
      })
    })
    const data = await res.json()
    if (!res.ok) return mockChangeStudentPassword(payload)
    return { success: true, message: data.message || 'Password changed successfully!' }
  } catch {
    return mockChangeStudentPassword(payload)
  }
}

/* ── PUBLIC STUDENT SERVICE API ── */
async function apiRegisterEvent(eventId, payload) {
  try {
    const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token')

    // Build API-spec compliant payload
    const apiPayload = {
      event_id: eventId,
      registration_type: payload.registration_type || 'individual',
    }
    if (apiPayload.registration_type === 'team') {
      apiPayload.team_name = payload.team_name || ''
      apiPayload.team_members = Array.isArray(payload.team_members) ? payload.team_members : []
    }

    const res = await fetch(`${API_BASE}/registrations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(apiPayload),
    })
    const data = await res.json()
    if (!res.ok) {
      // Extract most specific error message from backend
      let errMsg = data.message || data.detail || 'Registration failed.'
      if (Array.isArray(data.data) && data.data.length > 0) {
        errMsg = data.data.map(e => e.message || e).join(', ')
      } else if (data.errors && typeof data.errors === 'object') {
        errMsg = Object.values(data.errors).flat().join(', ')
      }
      return { success: false, message: errMsg }
    }
    return { success: true, message: data.message || 'Registered successfully!', data: data.data || data }
  } catch {
    return { success: false, message: 'Server unreachable. Please try again.' }
  }
}

async function apiFetchMyRegistrations() {
  try {
    const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token')
    console.log('[studentService] apiFetchMyRegistrations token:', token)
    const res = await fetch(`${API_BASE}/registrations/my`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
    })
    console.log('[studentService] apiFetchMyRegistrations response status:', res.status)
    const data = await res.json()
    console.log('[studentService] apiFetchMyRegistrations response body:', data)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch registrations.' }
    return { success: true, data: data.data || data }
  } catch (err) {
    console.error('[studentService] apiFetchMyRegistrations network error:', err)
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

/* ── API PAYMENT IMPLEMENTATIONS ── */
async function apiInitiatePayment(registrationId) {
  try {
    const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token')
    const res = await fetch(`${API_BASE}/payments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        registration_id: registrationId,
        payment_gateway: 'razorpay',
        payment_method: 'upi'
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, message: data.message || 'Payment initiation failed.' }
    }
    return { success: true, data: data.data || data }
  } catch (err) {
    console.error('[studentService] apiInitiatePayment error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiConfirmPayment(paymentId, payload) {
  try {
    const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token')
    const res = await fetch(`${API_BASE}/payments/${paymentId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, message: data.message || 'Payment confirmation failed.' }
    }
    return { success: true, data: data.data || data }
  } catch (err) {
    console.error('[studentService] apiConfirmPayment error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiFailPayment(paymentId) {
  try {
    const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token')
    const res = await fetch(`${API_BASE}/payments/${paymentId}/fail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to mark payment as failed.' }
    }
    return { success: true, data: data.data || data }
  } catch (err) {
    console.error('[studentService] apiFailPayment error:', err)
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

    console.log('[studentService] selfCheckIn payload:', payload)

    const res = await fetch(`${API_BASE}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    console.log('[studentService] selfCheckIn response:', res.status, data)
    if (!res.ok) {
      const errMsg = data.message || data.detail || 'Check-in failed.'
      return { success: false, message: errMsg }
    }
    return { success: true, data: data.data || data }
  } catch (err) {
    console.error('[studentService] apiSelfCheckIn error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

const studentService = {

  fetchDashboardOverview: () => (USE_MOCK ? mockFetchDashboardOverview() : apiFetchDashboardOverview()),
  fetchAttendanceData: () => (USE_MOCK ? mockFetchAttendanceData() : apiFetchAttendanceData()),
  fetchEventsData: () => (USE_MOCK ? mockFetchEventsData() : apiFetchEventsData()),
  fetchCertificatesData: () => (USE_MOCK ? mockFetchCertificatesData() : apiFetchCertificatesData()),
  fetchNotifications: () => (USE_MOCK ? mockFetchNotifications() : apiFetchNotifications()),
  markNotificationAsRead: (id) => (USE_MOCK ? mockMarkNotificationAsRead(id) : apiMarkNotificationAsRead(id)),
  markAllNotificationsAsRead: () => (USE_MOCK ? mockMarkAllNotificationsAsRead() : apiMarkAllNotificationsAsRead()),
  updateStudentProfile: (data) => (USE_MOCK ? mockUpdateStudentProfile(data) : apiUpdateStudentProfile(data)),
  fetchProfile: () => (USE_MOCK ? mockFetchProfile() : apiFetchProfile()),
  changeStudentPassword: (data) => (USE_MOCK ? mockChangeStudentPassword(data) : apiChangeStudentPassword(data)),
  registerEvent: (eventId, payload) => USE_MOCK ? mockRegisterEvent(eventId, payload) : apiRegisterEvent(eventId, payload),
  fetchMyRegistrations: () => USE_MOCK ? mockFetchMyRegistrations() : apiFetchMyRegistrations(),
  scanAttendanceQR: (code) => (USE_MOCK ? mockScanAttendanceQR(code) : apiScanAttendanceQR(code)),
  selfCheckIn: (registrationId, eventId) => (USE_MOCK ? mockSelfCheckIn(registrationId, eventId) : apiSelfCheckIn(registrationId, eventId)),

  initiatePayment: (registrationId) => (USE_MOCK ? mockInitiatePayment(registrationId) : apiInitiatePayment(registrationId)),
  confirmPayment: (paymentId, payload) => (USE_MOCK ? mockConfirmPayment(paymentId, payload) : apiConfirmPayment(paymentId, payload)),
  failPayment: (paymentId) => (USE_MOCK ? mockFailPayment(paymentId) : apiFailPayment(paymentId)),
}

export default studentService
