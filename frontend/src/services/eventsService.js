const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL
import { fetchWithAuth, getAccessToken } from '../utils/apiClient'
import defaultRegistrations from '../data/registrations.json'
import defaultEvents from '../data/events.json'
import defaultAttendance from '../data/attendance.json'

// ─── Helper — get auth token from sessionStorage ───────────────────
function getToken() {
  return sessionStorage.getItem('token') || ''
}

// ─── Helper — build common headers ────────────────────────────────
function authHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
    ...extra,
  }
}

// ─── Helper — parse response safely ───────────────────────────────
async function parseJSON(res) {
  try { return await res.json() }
  catch { return {} }
}

function getMockEvents() {
  const stored = localStorage.getItem('cc_mock_events')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      return parsed.map(e => ({
        ...e,
        eventType: e.eventType || 'Individual',
        approvalStatus: e.approvalStatus || 'Approved',
        time: e.time || '09:00',
        qrAttendance: e.qrAttendance || 'Enabled',
        description: e.description || `${e.name} is an interactive campus event designed to foster learning, collaboration, and networking among students and faculty members.`,
        schedule: e.schedule || [
          { time: '09:00 AM', title: 'Registration & Welcoming', description: 'Volunteers and Coordinators' },
          { time: '10:00 AM', title: 'Opening Remarks & Introductions', description: 'Event Organizer' },
          { time: '11:00 AM', title: 'Keynote Presentation', description: 'Invited Expert Speaker' },
          { time: '12:30 PM', title: 'Networking & Lunch', description: 'All Attendees' },
          { time: '01:30 PM', title: 'Interactive Workshop Session', description: 'Hands-on Activity' },
          { time: '03:30 PM', title: 'Q&A and Feedback', description: 'Interactive Discussion' },
          { time: '04:00 PM', title: 'Closing & Distribution of Certificates', description: 'Organizing Committee' }
        ]
      }))
    } catch (e) {
      // fallback
    }
  }
  localStorage.setItem('cc_mock_events', JSON.stringify(defaultEvents))
  return defaultEvents
}

function saveMockEvents(events) {
  localStorage.setItem('cc_mock_events', JSON.stringify(events))
}

// ─────────────────────────────────────────────────────────────────
// MOCK FUNCTIONS
// ─────────────────────────────────────────────────────────────────
async function mockFetchEvents() {
  await new Promise(r => setTimeout(r, 450))
  return { success: true, events: getMockEvents() }
}

async function mockFetchUpcomingEvents(limit = 10) {
  await new Promise(r => setTimeout(r, 200))
  const mockUpcoming = [
    { id: 1, month: 'AUG', day: '15', title: 'TechFest 2025', venue: 'Main Auditorium', time: '09:00', registered: 425, capacity: 500, color: '#615FFF' },
    { id: 2, month: 'JUL', day: '22', title: 'Annual Cultural Fest', venue: 'Open Air Theatre', time: '18:00', registered: 876, capacity: 1000, color: '#615FFF' },
    { id: 3, month: 'SEP', day: '5', title: 'Sports Meet 2025', venue: 'University Grounds', time: '07:00', registered: 612, capacity: 800, color: '#615FFF' }
  ]
  return { success: true, events: mockUpcoming.slice(0, limit) }
}

async function mockCreateEvent(payload) {
  await new Promise(r => setTimeout(r, 500))
  const events = getMockEvents()
  
  // Find highest numeric ID or generate sequential
  let nextNum = 88
  events.forEach(e => {
    const match = e.id.match(/^EVT0*(\d+)$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num >= nextNum) nextNum = num + 1
    }
  })
  
  const idStr = String(nextNum).padStart(3, '0')
  const newEvent = {
    id: `EVT${idStr}`,
    name: payload.name || 'Untitled Event',
    organizer: payload.organizer || 'Unknown Organizer',
    category: payload.category || 'General',
    eventType: payload.eventType || 'Individual',
    approvalStatus: payload.approvalStatus || 'Approved',
    venue: payload.venue || 'TBD',
    date: payload.date || new Date().toISOString().split('T')[0],
    time: payload.time || '09:00',
    capacity: parseInt(payload.capacity, 10) || 100,
    registrationsCount: parseInt(payload.registrationsCount, 10) || 0,
    status: payload.status || 'Upcoming',
    qrAttendance: payload.qrAttendance || 'Enabled',
    description: payload.description || `${payload.name || 'This event'} is an interactive campus event designed to foster learning, collaboration, and networking among students and faculty members.`,
    registrationDeadline: payload.registrationDeadline || '',
    banner: payload.banner || null,
    schedule: payload.schedule || [
      { time: '09:00 AM', title: 'Registration & Welcoming', description: 'Volunteers and Coordinators' },
      { time: '10:00 AM', title: 'Opening Remarks & Introductions', description: 'Event Organizer' },
      { time: '11:00 AM', title: 'Keynote Presentation', description: 'Invited Expert Speaker' },
      { time: '12:30 PM', title: 'Networking & Lunch', description: 'All Attendees' },
      { time: '01:30 PM', title: 'Interactive Workshop Session', description: 'Hands-on Activity' },
      { time: '03:30 PM', title: 'Q&A and Feedback', description: 'Interactive Discussion' },
      { time: '04:00 PM', title: 'Closing & Distribution of Certificates', description: 'Organizing Committee' }
    ]
  }
  
  events.unshift(newEvent) // Add to top
  saveMockEvents(events)
  return { success: true, event: newEvent }
}

async function mockUpdateEvent(id, payload) {
  await new Promise(r => setTimeout(r, 400))
  const events = getMockEvents()
  const idx = events.findIndex(e => e.id === id)
  if (idx === -1) {
    return { success: false, message: 'Event not found' }
  }
  
  const updatedEvent = {
    ...events[idx],
    name: payload.name !== undefined ? payload.name : events[idx].name,
    organizer: payload.organizer !== undefined ? payload.organizer : events[idx].organizer,
    category: payload.category !== undefined ? payload.category : events[idx].category,
    eventType: payload.eventType !== undefined ? payload.eventType : events[idx].eventType,
    approvalStatus: payload.approvalStatus !== undefined ? payload.approvalStatus : events[idx].approvalStatus,
    venue: payload.venue !== undefined ? payload.venue : events[idx].venue,
    date: payload.date !== undefined ? payload.date : events[idx].date,
    time: payload.time !== undefined ? payload.time : events[idx].time,
    capacity: payload.capacity !== undefined ? parseInt(payload.capacity, 10) : events[idx].capacity,
    registrationsCount: payload.registrationsCount !== undefined ? parseInt(payload.registrationsCount, 10) : events[idx].registrationsCount,
    status: payload.status !== undefined ? payload.status : events[idx].status,
    qrAttendance: payload.qrAttendance !== undefined ? payload.qrAttendance : events[idx].qrAttendance,
    description: payload.description !== undefined ? payload.description : events[idx].description,
    schedule: payload.schedule !== undefined ? payload.schedule : events[idx].schedule,
    registrationDeadline: payload.registrationDeadline !== undefined ? payload.registrationDeadline : events[idx].registrationDeadline,
    banner: payload.banner !== undefined ? payload.banner : events[idx].banner,
  }
  
  events[idx] = updatedEvent
  saveMockEvents(events)
  return { success: true, event: updatedEvent }
}

async function mockDeleteEvent(id) {
  await new Promise(r => setTimeout(r, 300))
  const events = getMockEvents()
  const filtered = events.filter(e => e.id !== id)
  saveMockEvents(filtered)
  return { success: true }
}

async function mockImportEvents(importedList) {
  await new Promise(r => setTimeout(r, 600))
  const events = getMockEvents()
  
  let nextNum = 88
  events.forEach(e => {
    const match = e.id.match(/^EVT0*(\d+)$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num >= nextNum) nextNum = num + 1
    }
  })

  const newItems = importedList.map((item, idx) => {
    const idStr = String(nextNum + idx).padStart(3, '0')
    return {
      id: `EVT${idStr}`,
      name: item.name || 'Imported Event',
      organizer: item.organizer || 'Dr. Priya Sharma',
      category: item.category || 'Technical',
      venue: item.venue || 'Main Auditorium',
      date: item.date || '2025-10-10',
      capacity: parseInt(item.capacity, 10) || 200,
      registrationsCount: parseInt(item.registrationsCount, 10) || 0,
      status: item.status || 'Upcoming'
    }
  })

  const updated = [...newItems, ...events]
  saveMockEvents(updated)
  return { success: true, count: newItems.length }
}

async function mockApproveEvent(eventId, approvalStatus) {
  await new Promise(r => setTimeout(r, 300))
  const events = getMockEvents()
  const idx = events.findIndex(e => e.id === eventId)
  if (idx !== -1) {
    events[idx].approvalStatus = approvalStatus
    saveMockEvents(events)
  }
  return { success: true }
}

// Helper to map backend event fields to frontend expected fields
function mapEvent(e) {
  if (!e) return null

  // 🔍 TEMP DEBUG — console mein dekho exact backend fields
  
  return {
    id: e.event_id || e.id,
    name: e.event_name || e.name || e.title || '',
    title: e.title || e.event_name || e.name || '',
    organizer: e.organizer_name || e.organized_by || (typeof e.organizer === 'object' ? e.organizer?.name || e.organizer?.full_name || '' : e.organizer) || '',
    category: e.category ? (e.category.charAt(0).toUpperCase() + e.category.slice(1)) : 'General',
    eventType: e.event_type || e.eventType || 'offline',
    participationType: e.participation_type || e.participationType || 'individual',
    venue: e.venue || 'TBD',
    date: e.event_date || (e.start_datetime ? e.start_datetime.split('T')[0] : ''),
    time: e.start_datetime ? e.start_datetime.split('T')[1]?.substring(0, 5) : '09:00',
    start_datetime: e.start_datetime,
    end_datetime: e.end_datetime,
    capacity: e.capacity || e.max_participants || 500,
    fees: e.fees ?? e.fee ?? e.registration_fee ?? e.event_fee ?? 0,
    registrationsCount: e.registrationsCount || e.total_registrations || e.registration_count || e.registrations_count || 0,
    status: e.status || 'Upcoming',
    approvalStatus: (() => {
      const raw = e.approval_status || e.approvalStatus || 'Approved'
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
    })(),
    description: e.description || '',
    registrationDeadline: e.registration_deadline || e.reg_deadline || e.registrationDeadline || '',
    regDateTime: e.registration_start_datetime || e.registration_start_date || e.reg_start_datetime || e.reg_date_time || e.regDateTime || e.registration_start || e.created_at || e.start_datetime || '',
    registrationStartDateTime: e.registration_start_datetime || e.registration_start_date || e.reg_start_datetime || e.reg_date_time || e.regDateTime || e.registration_start || e.created_at || e.start_datetime || '',
    banner: e.poster || e.banner || null,
    qr_code: e.qr_code || e.qrcode || null,
    qrCodeImage: (e.qr_code || e.qrcode) ? (
      (e.qr_code || e.qrcode).startsWith('http') || (e.qr_code || e.qrcode).startsWith('data:')
        ? (e.qr_code || e.qrcode)
        : `${(API_BASE || '').replace(/\/api\/v1\/?$/, '')}${(e.qr_code || e.qrcode).startsWith('/') ? '' : '/'}${e.qr_code || e.qrcode}`
    ) : null,
    created_at: e.created_at || e.createdAt || null,
  }
}


// ─────────────────────────────────────────────────────────────────
// REAL API FUNCTIONS
// ─────────────────────────────────────────────────────────────────
async function apiFetchEvents() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/events`, { method: 'GET' })
    const data = await parseJSON(res)
    if (!res.ok) {
            return { success: false, events: [] }
    }
    const eventsArray = Array.isArray(data.data) ? data.data : Array.isArray(data.events) ? data.events : []
    const mapped = eventsArray.map(e => mapEvent(e))
    return { success: true, events: mapped }
  } catch (err) {
        return { success: false, events: [], message: 'Server unreachable.' }
  }
}

async function apiFetchUpcomingEvents(limit = 10) {
  try {
    let res = await fetchWithAuth(`${API_BASE}/events/upcoming?limit=${limit}`, { method: 'GET' })
    if (res.ok) {
      const data = await parseJSON(res)
      const eventsArray = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : (data.events || []))
      if (eventsArray.length > 0) {
        const mapped = eventsArray.map(e => mapEvent(e))
        return { success: true, events: mapped }
      }
    }

    // Fallback: If /events/upcoming returns 500/404 on server, fetch main /events list
    const allRes = await apiFetchEvents()
    if (allRes.success && Array.isArray(allRes.events)) {
      const now = new Date()
      const upcoming = allRes.events
        .filter(e => !e.date || new Date(e.date) >= now || (e.status || '').toLowerCase() === 'upcoming' || (e.status || '').toLowerCase() === 'published')
        .slice(0, limit)
      return { success: true, events: upcoming.length > 0 ? upcoming : allRes.events.slice(0, limit) }
    }

    return { success: false, events: [] }
  } catch (err) {
    return { success: false, events: [], message: 'Server unreachable.' }
  }
}

async function apiCreateEvent(payload) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/events`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
            return { success: false, message: data.message || 'Failed to create event.' }
    }
    const rawEvent = data.data || data.event || data
    return { success: true, event: mapEvent(rawEvent) }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

async function apiUpdateEvent(id, payload) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
            return { success: false, message: data.message || 'Failed to update event.' }
    }
    const rawEvent = data.data || data.event || data
    return { success: true, event: mapEvent(rawEvent) }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

async function apiDeleteEvent(id) {
  try {
    const token = getToken()
        const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${token}`,
      },
    })
    const data = await parseJSON(res)
    if (!res.ok) {
            return { success: false, message: data.message || data.detail || 'Failed to delete event.' }
    }
    return { success: true }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

/* ── MOCK REGISTRATIONS ─────────────────────────────────────── */
const MOCK_REGISTRATIONS_KEY = 'campus_connect_mock_registrations'

function getMockRegistrations() {
  const local = localStorage.getItem(MOCK_REGISTRATIONS_KEY)
  if (local) {
    try { return JSON.parse(local) } catch { }
  }
  localStorage.setItem(MOCK_REGISTRATIONS_KEY, JSON.stringify(defaultRegistrations))
  return defaultRegistrations
}

function saveMockRegistrations(regs) {
  localStorage.setItem(MOCK_REGISTRATIONS_KEY, JSON.stringify(regs))
}

async function mockFetchRegistrations(eventId) {
  await new Promise(r => setTimeout(r, 300))
  const regs = getMockRegistrations()
  const eventRegs = regs.filter(r => r.eventId === eventId)
  
  if (eventRegs.length === 0) {
    const seeded = [
      { id: `REG_${eventId}_1`, eventId, studentName: 'Arjun Patel', rollNo: '21CS001', department: 'CSE', year: '3rd', date: '2025-07-01', status: 'Approved' },
      { id: `REG_${eventId}_2`, eventId, studentName: 'Sneha Krishnan', rollNo: '21ECE042', department: 'ECE', year: '3rd', date: '2025-07-02', status: 'Approved' },
      { id: `REG_${eventId}_3`, eventId, studentName: 'Rahul Gupta', rollNo: '22ME015', department: 'ME', year: '2nd', date: '2025-07-03', status: 'Pending' },
      { id: `REG_${eventId}_4`, eventId, studentName: 'Priya Nair', rollNo: '21MBA008', department: 'MBA', year: '2nd', date: '2025-07-01', status: 'Approved' },
      { id: `REG_${eventId}_5`, eventId, studentName: 'Vikram Singh', rollNo: '23EEE031', department: 'EEE', year: '1st', date: '2025-07-04', status: 'Pending' },
      { id: `REG_${eventId}_6`, eventId, studentName: 'Aishwarya Menon', rollNo: '21CSE089', department: 'CSE', year: '3rd', date: '2025-07-05', status: 'Rejected' },
    ]
    const allRegs = [...regs, ...seeded]
    saveMockRegistrations(allRegs)
    return { success: true, registrations: seeded }
  }

  return { success: true, registrations: eventRegs }
}

async function mockUpdateRegistrationStatus(id, status) {
  await new Promise(r => setTimeout(r, 300))
  const regs = getMockRegistrations()
  const idx = regs.findIndex(r => r.id === id)
  if (idx === -1) {
    return { success: false, message: 'Registration not found' }
  }

  const oldStatus = regs[idx].status
  regs[idx].status = status
  saveMockRegistrations(regs)

  // Update registrationsCount in event
  const eventId = regs[idx].eventId
  const events = getMockEvents()
  const eventIdx = events.findIndex(e => e.id === eventId)
  if (eventIdx !== -1) {
    let change = 0
    if (oldStatus !== 'Approved' && status === 'Approved') change = 1
    else if (oldStatus === 'Approved' && status !== 'Approved') change = -1
    
    if (change !== 0) {
      events[eventIdx].registrationsCount = Math.max(0, (events[eventIdx].registrationsCount || 0) + change)
      saveMockEvents(events)
    }
  }

  return { success: true, registration: regs[idx] }
}

/* ── MOCK ATTENDANCE ────────────────────────────────────────── */
const MOCK_ATTENDANCE_KEY = 'campus_connect_mock_attendance'

function getMockAttendance() {
  const local = localStorage.getItem(MOCK_ATTENDANCE_KEY)
  if (local) {
    try { return JSON.parse(local) } catch { }
  }
  localStorage.setItem(MOCK_ATTENDANCE_KEY, JSON.stringify(defaultAttendance))
  return defaultAttendance
}

function saveMockAttendance(att) {
  localStorage.setItem(MOCK_ATTENDANCE_KEY, JSON.stringify(att))
}

async function mockFetchAttendance(eventId) {
  await new Promise(r => setTimeout(r, 300))
  const attendance = getMockAttendance()
  const eventAttendance = attendance.filter(a => a.eventId === eventId)
  
  if (eventAttendance.length === 0) {
    const seeded = defaultAttendance.map((a, i) => ({
      ...a,
      id: `ATT_${eventId}_${i + 1}`,
      eventId
    }))
    const allAttendance = [...attendance, ...seeded]
    saveMockAttendance(allAttendance)
    return { success: true, attendance: seeded }
  }

  return { success: true, attendance: eventAttendance }
}

/* ── REAL API REGISTRATIONS ──────────────────────────────────── */
async function apiFetchRegistrations(eventId) {
  try {
    const userRole = sessionStorage.getItem('cc_role') || sessionStorage.getItem('role') || ''
    if (userRole.toLowerCase() === 'student') {
      return { success: true, registrations: [] }
    }

    const res = await fetchWithAuth(
      `${API_BASE}/registrations/event/${eventId}?page=1&size=500`,
      { method: 'GET' }
    )
    const data = await parseJSON(res)

    if (!res.ok) {
      return { success: false, registrations: [], message: data.message || 'Failed to fetch registrations.' }
    }

    const regs = data.registrations || data.data || data.items || data || []
    return { success: true, registrations: Array.isArray(regs) ? regs : [] }
  } catch (err) {
    return { success: false, registrations: [], message: 'Server unreachable.' }
  }
}

async function apiUpdateRegistrationStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/registrations/${id}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to update status.' }
    }
    return { success: true, registration: data.registration }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

/* ── REAL API ATTENDANCE ─────────────────────────────────────── */
function mapAttendanceRecord(r) {
  const fmtTime = (dt) => {
    if (!dt) return '-'
    try {
      return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch { return dt }
  }

  const fmtStatus = (s) => {
    if (!s) return 'Present'
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
  }

  return {
    id: r.attendance_id || r.id,
    studentName: r.student_name || r.full_name || r.name || r.studentName || r.registration_id?.slice(0, 8) || 'Student',
    rollNo: r.roll_no || r.rollNo || r.college_id || r.student_id || 'N/A',
    eventId: r.event_id || r.eventId || '',
    eventName: r.event_name || r.eventName || r.event_title || '',
    venue: r.venue || r.event_venue || r.location || '',
    checkIn: fmtTime(r.check_in_time || r.checkIn),
    checkOut: fmtTime(r.check_out_time || r.checkOut),
    status: fmtStatus(r.attendance_status || r.status),
    department: r.department || r.dept || '',
    registrationId: r.registration_id || r.registrationId || '',
    scannedBy: r.scanned_by || r.scannedBy || r.student_id || r.studentId || '',
  }
}

async function apiFetchAttendance(eventId) {
  try {
    const res = await fetch(`${API_BASE}/attendance/event/${eventId}`, {
      headers: authHeaders(),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to fetch attendance.' }
    }
    const raw = data.attendance || data.data || data || []
    const attendance = Array.isArray(raw) ? raw.map(mapAttendanceRecord) : []
    return { success: true, attendance }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

/* ── REAL API APPROVAL ───────────────────────────────────────── */
async function apiApproveEvent(eventId, approvalStatus, rejectionReason = null) {
  try {
    const res = await fetch(`${API_BASE}/events/${eventId}/approve`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        approval_status: approvalStatus.toLowerCase(),
        rejection_reason: rejectionReason,
      }),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to update event approval status.' }
    }
    return { success: true, message: data.message }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

async function apiPublishEvent(eventId) {
  try {
    const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token')
    const res = await fetch(`${API_BASE}/events/${eventId}/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to publish event.' }
    }
    return { success: true, message: data.message || 'Event published successfully!' }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

// ─────────────────────────────────────────────────────────────────
// PUBLIC SERVICE
// ─────────────────────────────────────────────────────────────────
const eventsService = {
  fetchAll: () =>
    USE_MOCK ? mockFetchEvents() : apiFetchEvents(),

  fetchUpcoming: (limit) =>
    USE_MOCK ? mockFetchUpcomingEvents(limit) : apiFetchUpcomingEvents(limit),

  create: (payload) =>
    USE_MOCK ? mockCreateEvent(payload) : apiCreateEvent(payload),
    
  update: (id, payload) =>
    USE_MOCK ? mockUpdateEvent(id, payload) : apiUpdateEvent(id, payload),

  delete: (id) =>
    USE_MOCK ? mockDeleteEvent(id) : apiDeleteEvent(id),

  import: (list) =>
    USE_MOCK ? mockImportEvents(list) : Promise.resolve({ success: false, message: 'Not implemented in API' }),

  fetchRegistrations: (eventId) =>
    USE_MOCK ? mockFetchRegistrations(eventId) : apiFetchRegistrations(eventId),

  updateRegistrationStatus: (id, status) =>
    USE_MOCK ? mockUpdateRegistrationStatus(id, status) : apiUpdateRegistrationStatus(id, status),

  fetchAttendance: (eventId) =>
    USE_MOCK ? mockFetchAttendance(eventId) : apiFetchAttendance(eventId),

  approve: (eventId, approvalStatus, rejectionReason) =>
    USE_MOCK ? Promise.resolve({ success: true }) : apiApproveEvent(eventId, approvalStatus, rejectionReason),

  publish: (eventId) =>
    USE_MOCK ? Promise.resolve({ success: true, message: 'Event published (mock).' }) : apiPublishEvent(eventId),

  getQRCodeBlob: (eventId) => apiGetQRCodeBlob(eventId),
}

/* ── API GET QR CODE FROM BACKEND ONLY (POST /api/v1/events/{event_id}/qrcode) ── */
async function apiGetQRCodeBlob(eventId) {
  try {
    // Perform POST /api/v1/events/{event_id}/qrcode using fetchWithAuth with JSON body payload
    let res = await fetchWithAuth(`${API_BASE}/events/${eventId}/qrcode`, {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId, eventId })
    })

    // Fallback to GET if backend returns 405 Method Not Allowed
    if (!res.ok && res.status === 405) {
      res = await fetchWithAuth(`${API_BASE}/events/${eventId}/qrcode`, {
        method: 'GET'
      })
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      let errMsg = errorData.message || errorData.detail || 'Event check-in QR code can only be generated after the event has started'
      if (Array.isArray(errMsg)) errMsg = errMsg.map(e => e.msg || e.message).join(', ')
      if (typeof errMsg === 'object') errMsg = JSON.stringify(errMsg)
      return { success: false, message: errMsg }
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase()
    if (contentType.includes('application/json')) {
      const data = await res.json().catch(() => ({}))
      let qrUrl = data.data || data.qr_code || data.qrCode || data.url || data
      if (typeof qrUrl === 'object' && qrUrl !== null) {
        qrUrl = qrUrl.qr_code || qrUrl.qrCode || qrUrl.url || qrUrl.data || ''
      }
      if (typeof qrUrl === 'string' && qrUrl.length > 0) {
        if (!qrUrl.startsWith('data:') && (qrUrl.startsWith('iVBORw0KG') || qrUrl.length > 100)) {
          qrUrl = `data:image/png;base64,${qrUrl}`
        }
        return { success: true, qrUrl }
      }
    }

    const blob = await res.blob()
    if (blob && blob.size > 0) {
      const base64Url = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = () => resolve(URL.createObjectURL(blob))
        reader.readAsDataURL(blob)
      })
      return { success: true, qrUrl: base64Url, blob }
    }

    return { success: false, message: 'Empty QR code response received.' }
  } catch (err) {
    return { success: false, message: err.message || 'Server unreachable.' }
  }
}

export default eventsService
