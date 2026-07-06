const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_USE_MOCK === true
const API_BASE = import.meta.env.VITE_API_BASE_URL
import defaultAttendance from '../data/attendance.json'
import { ATTENDANCE_EVENTS, RECENT_SCANS as DEFAULT_SCANS, LIVE_CHART_DATA as DEFAULT_CHART, DEPT_ATTENDANCE_DATA as DEFAULT_DEPT } from '../data/attendanceData'

function authHeaders() {
  const token = sessionStorage.getItem('cc_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

function parseJSON(res) {
  return res.json().catch(() => ({}))
}

/* ── MOCK STORAGE ──────────────────────────────────────────────── */
const MOCK_SCANS_KEY = 'campus_connect_mock_scans'

function getMockScans() {
  const local = localStorage.getItem(MOCK_SCANS_KEY)
  if (local) { try { return JSON.parse(local) } catch {} }
  localStorage.setItem(MOCK_SCANS_KEY, JSON.stringify(DEFAULT_SCANS))
  return [...DEFAULT_SCANS]
}

function saveMockScans(scans) {
  localStorage.setItem(MOCK_SCANS_KEY, JSON.stringify(scans))
}

const MOCK_ATTENDANCE_KEY = 'campus_connect_mock_attendance'

function getMockAttendance() {
  const local = localStorage.getItem(MOCK_ATTENDANCE_KEY)
  if (local) {
    try { return JSON.parse(local) } catch { }
  }
  localStorage.setItem(MOCK_ATTENDANCE_KEY, JSON.stringify(defaultAttendance))
  return defaultAttendance
}

function saveMockAttendance(records) {
  localStorage.setItem(MOCK_ATTENDANCE_KEY, JSON.stringify(records))
}

/* ── MOCK FUNCTIONS ────────────────────────────────────────────── */
async function mockFetchAll(eventId) {
  await new Promise(r => setTimeout(r, 300))
  let records = getMockAttendance()
  if (eventId && eventId !== 'ALL') {
    records = records.filter(r => r.eventId === eventId)
  }
  const enriched = records.map(r => {
    const ev = ATTENDANCE_EVENTS.find(e => e.id === r.eventId)
    return { ...r, eventName: ev ? ev.name : 'Unknown Event' }
  })
  return { success: true, records: enriched }
}

async function mockUpdateStatus(id, status) {
  await new Promise(r => setTimeout(r, 200))
  const records = getMockAttendance()
  const idx = records.findIndex(r => r.id === id)
  if (idx === -1) return { success: false, message: 'Attendance record not found' }
  records[idx].status = status
  if (status === 'Absent') {
    records[idx].checkIn = '-'
    records[idx].checkOut = '-'
  }
  saveMockAttendance(records)
  const ev = ATTENDANCE_EVENTS.find(e => e.id === records[idx].eventId)
  return {
    success: true,
    record: { ...records[idx], eventName: ev ? ev.name : 'Unknown Event' }
  }
}

async function mockMarkPresent(id) {
  await new Promise(r => setTimeout(r, 200))
  const records = getMockAttendance()
  const idx = records.findIndex(r => r.id === id)
  if (idx === -1) return { success: false, message: 'Record not found' }
  const now = new Date()
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  records[idx].status = 'Present'
  records[idx].checkIn = time
  records[idx].checkOut = '-'
  saveMockAttendance(records)
  const ev = ATTENDANCE_EVENTS.find(e => e.id === records[idx].eventId)
  return {
    success: true,
    record: { ...records[idx], eventName: ev ? ev.name : 'Unknown Event' }
  }
}

async function mockFetchRecentScans() {
  await new Promise(r => setTimeout(r, 250))
  return { success: true, scans: getMockScans() }
}

async function mockAddScan(studentName, rollNo, status) {
  await new Promise(r => setTimeout(r, 200))
  const scans = getMockScans()
  const AVATAR_COLORS = ['#615FFF','#00BC7D','#FE9A00','#0284c7','#e11d48','#7c3aed','#0891b2','#dc2626']
  const now = new Date()
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const newScan = {
    id: `SC${Date.now()}`,
    studentName,
    rollNo,
    status: status || 'Present',
    time,
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
  }
  const updated = [newScan, ...scans].slice(0, 20)   // keep latest 20
  saveMockScans(updated)
  return { success: true, scan: newScan, scans: updated }
}

async function mockGenerateQR(eventId, session) {
  await new Promise(r => setTimeout(r, 800))
  const payload = { eventId, session, generated: new Date().toISOString() }
  return { success: true, qrData: btoa(JSON.stringify(payload)), payload }
}

/* ── REAL API ──────────────────────────────────────────────────── */
async function apiFetchAll(eventId) {
  try {
    const url = eventId && eventId !== 'ALL'
      ? `${API_BASE}/attendance?eventId=${eventId}`
      : `${API_BASE}/attendance`
    const res = await fetch(url, { headers: authHeaders() })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch attendance.' }
    return { success: true, records: data.records || [] }
  } catch (err) {
    console.error('[attendanceService] fetchAll error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiUpdateStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/attendance/${id}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to update attendance.' }
    return { success: true, record: data.record }
  } catch (err) {
    console.error('[attendanceService] updateStatus error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiMarkPresent(id) {
  try {
    const res = await fetch(`${API_BASE}/attendance/${id}/checkin`, {
      method: 'POST',
      headers: authHeaders(),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to mark present.' }
    return { success: true, record: data.record }
  } catch (err) {
    console.error('[attendanceService] markPresent error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiFetchRecentScans() {
  try {
    const res = await fetch(`${API_BASE}/attendance/scans/recent`, { headers: authHeaders() })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch scans.' }
    return { success: true, scans: data.scans || [] }
  } catch (err) {
    console.error('[attendanceService] fetchRecentScans error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiAddScan(studentName, rollNo, status) {
  try {
    const res = await fetch(`${API_BASE}/attendance/scans`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ studentName, rollNo, status }),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to add scan.' }
    return { success: true, scan: data.scan, scans: data.scans }
  } catch (err) {
    console.error('[attendanceService] addScan error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

/* ── SERVICE EXPORT ────────────────────────────────────────────── */
async function mockFetchLiveChart(eventId) {
  await new Promise(r => setTimeout(r, 300))
  // In real app, chart would be per-event; here we return the same default data
  return { success: true, chart: DEFAULT_CHART, eventId }
}

async function apiFetchLiveChart(eventId) {
  try {
    const url = `${API_BASE}/attendance/chart${eventId ? `?eventId=${eventId}` : ''}`
    const res = await fetch(url, { headers: authHeaders() })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch chart data.' }
    return { success: true, chart: data.chart || [], eventId }
  } catch (err) {
    console.error('[attendanceService] fetchLiveChart error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function mockFetchDeptAttendance(eventId) {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, depts: DEFAULT_DEPT, eventId }
}

async function apiFetchDeptAttendance(eventId) {
  try {
    const url = `${API_BASE}/attendance/departments${eventId ? `?eventId=${eventId}` : ''}`
    const res = await fetch(url, { headers: authHeaders() })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch department attendance.' }
    return { success: true, depts: data.depts || [], eventId }
  } catch (err) {
    console.error('[attendanceService] fetchDeptAttendance error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}


async function apiGenerateQR(eventId, session) {
  try {
    const res = await fetch(`${API_BASE}/attendance/qr/generate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ eventId, session }),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to generate QR.' }
    return { success: true, qrData: data.qrData, payload: data.payload }
  } catch (err) {
    console.error('[attendanceService] generateQR error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

const attendanceService = {
  fetchAll: (eventId) =>
    USE_MOCK ? mockFetchAll(eventId) : apiFetchAll(eventId),

  updateStatus: (id, status) =>
    USE_MOCK ? mockUpdateStatus(id, status) : apiUpdateStatus(id, status),

  markPresent: (id) =>
    USE_MOCK ? mockMarkPresent(id) : apiMarkPresent(id),

  generateQR: (eventId, session) =>
    USE_MOCK ? mockGenerateQR(eventId, session) : apiGenerateQR(eventId, session),

  fetchRecentScans: () =>
    USE_MOCK ? mockFetchRecentScans() : apiFetchRecentScans(),

  addScan: (studentName, rollNo, status) =>
    USE_MOCK ? mockAddScan(studentName, rollNo, status) : apiAddScan(studentName, rollNo, status),

  fetchLiveChart: (eventId) =>
    USE_MOCK ? mockFetchLiveChart(eventId) : apiFetchLiveChart(eventId),

  fetchDeptAttendance: (eventId) =>
    USE_MOCK ? mockFetchDeptAttendance(eventId) : apiFetchDeptAttendance(eventId),
}

export default attendanceService
