const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL
import defaultRegistrations from '../data/registrations.json'
import defaultEvents from '../data/events.json'

function authHeaders() {
  const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token') || ''
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true'
  }
}

function parseJSON(res) {
  return res.json().catch(() => ({}));
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

const MOCK_EVENTS_KEY = 'campus_connect_mock_events'
function getMockEvents() {
  const local = localStorage.getItem(MOCK_EVENTS_KEY)
  if (local) {
    try { return JSON.parse(local) } catch { }
  }
  return defaultEvents
}

function saveMockEvents(events) {
  localStorage.setItem(MOCK_EVENTS_KEY, JSON.stringify(events))
}

async function mockFetchRegistrations() {
  await new Promise(r => setTimeout(r, 300))
  const regs = getMockRegistrations()
  const events = getMockEvents()

  const enriched = regs.map(r => {
    const ev = events.find(e => e.id === r.eventId)
    return {
      ...r,
      eventName: ev ? ev.name : 'Unknown Event'
    }
  })

  return { success: true, registrations: enriched }
}

async function mockUpdateStatus(id, status) {
  await new Promise(r => setTimeout(r, 200))
  const regs = getMockRegistrations()
  const idx = regs.findIndex(r => r.id === id)
  if (idx === -1) {
    return { success: false, message: 'Registration not found' }
  }

  const oldStatus = regs[idx].status
  regs[idx].status = status
  saveMockRegistrations(regs)

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

  const ev = events.find(e => e.id === eventId)
  return { 
    success: true, 
    registration: {
      ...regs[idx],
      eventName: ev ? ev.name : 'Unknown Event'
    } 
  }
}

/* ── REAL API ────────────────────────────────────────────────── */
async function apiFetchRegistrations() {
  try {
    const res = await fetch(`${API_BASE}/registrations`, {
      headers: authHeaders(),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to fetch registrations.' }
    }
    return { success: true, registrations: data.registrations || [] }
  } catch (err) {
    console.error('[registrationsService] fetchRegistrations error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiUpdateStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/registrations/${id}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to update registration status.' }
    }
    return { success: true, registration: data.registration }
  } catch (err) {
    console.error('[registrationsService] updateStatus error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

const registrationsService = {
  fetchAll: () =>
    USE_MOCK ? mockFetchRegistrations() : apiFetchRegistrations(),

  updateStatus: (id, status) =>
    USE_MOCK ? mockUpdateStatus(id, status) : apiUpdateStatus(id, status),
}

export default registrationsService
