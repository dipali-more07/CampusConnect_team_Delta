const USE_MOCK = import.meta.env.VITE_USE_MOCK 
const API_BASE = import.meta.env.VITE_API_BASE_URL 
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
    Authorization: `Bearer ${getToken()}`,
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

// ─────────────────────────────────────────────────────────────────
// REAL API FUNCTIONS
// ─────────────────────────────────────────────────────────────────
async function apiFetchEvents() {
  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      console.error('[eventsService] fetchEvents failed:', res.status, data)
      return { success: false, events: [] }
    }
    return { success: true, events: data.events ?? [] }
  } catch (err) {
    console.error('[eventsService] fetchEvents network error:', err)
    return { success: false, events: [], message: 'Server unreachable.' }
  }
}

async function apiCreateEvent(payload) {
  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      console.error('[eventsService] createEvent failed:', res.status, data)
      return { success: false, message: data.message || 'Failed to create event.' }
    }
    return { success: true, event: data.event }
  } catch (err) {
    console.error('[eventsService] createEvent network error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiUpdateEvent(id, payload) {
  try {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      console.error('[eventsService] updateEvent failed:', res.status, data)
      return { success: false, message: data.message || 'Failed to update event.' }
    }
    return { success: true, event: data.event }
  } catch (err) {
    console.error('[eventsService] updateEvent network error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiDeleteEvent(id) {
  try {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      console.error('[eventsService] deleteEvent failed:', res.status, data)
      return { success: false }
    }
    return { success: true }
  } catch (err) {
    console.error('[eventsService] deleteEvent network error:', err)
    return { success: false }
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
    const res = await fetch(`${API_BASE}/events/${eventId}/registrations`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to fetch registrations.' }
    }
    return { success: true, registrations: data.registrations || [] }
  } catch (err) {
    console.error('[eventsService] fetchRegistrations error:', err)
    return { success: false, message: 'Server unreachable.' }
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
    console.error('[eventsService] updateRegistrationStatus error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

/* ── REAL API ATTENDANCE ─────────────────────────────────────── */
async function apiFetchAttendance(eventId) {
  try {
    const res = await fetch(`${API_BASE}/events/${eventId}/attendance`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to fetch attendance.' }
    }
    return { success: true, attendance: data.attendance || [] }
  } catch (err) {
    console.error('[eventsService] fetchAttendance error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

// ─────────────────────────────────────────────────────────────────
// PUBLIC SERVICE
// ─────────────────────────────────────────────────────────────────
const eventsService = {
  fetchAll: () =>
    USE_MOCK ? mockFetchEvents() : apiFetchEvents(),

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
}

export default eventsService
