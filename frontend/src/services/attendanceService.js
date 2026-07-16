const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL
import defaultAttendance from '../data/attendance.json'
import { ATTENDANCE_EVENTS, RECENT_SCANS as DEFAULT_SCANS, LIVE_CHART_DATA as DEFAULT_CHART, DEPT_ATTENDANCE_DATA as DEFAULT_DEPT } from '../data/attendanceData'

function authHeaders() {
  const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token') || ''
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true'
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
function mapAttendanceRecord(r) {
  // Format datetime string to readable time e.g. "2026-07-16T16:08:00" → "04:08 PM"
  const fmtTime = (dt) => {
    if (!dt) return '-'
    try {
      return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch { return dt }
  }

  // Capitalize status e.g. "present" → "Present"
  const fmtStatus = (s) => {
    if (!s) return 'Present'
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
  }

  return {
    id: r.attendance_id || r.id,
    studentName: r.student_name || r.full_name || r.name || r.studentName || r.registration_id?.slice(0, 8) || 'Student',
    rollNo: r.roll_no || r.rollNo || r.college_id || r.student_id || 'N/A',
    eventId: r.event_id || r.eventId || '',
    eventName: r.event_name || r.eventName || '',
    checkIn: fmtTime(r.check_in_time || r.checkIn),
    checkOut: fmtTime(r.check_out_time || r.checkOut),
    status: fmtStatus(r.attendance_status || r.status),
    department: r.department || r.dept || '',
    registrationId: r.registration_id || r.registrationId || '',
  }
}

async function apiFetchAll(eventId) {
  try {
    const url = eventId && eventId !== 'ALL'
      ? `${API_BASE}/attendance/event/${eventId}`
      : `${API_BASE}/attendance/event/ALL`
    const res = await fetch(url, { headers: authHeaders() })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch attendance.' }
    const raw = data.data || data.records || data || []
    const records = Array.isArray(raw) ? raw.map(mapAttendanceRecord) : []
    return { success: true, records }
  } catch (err) {
    console.error('[attendanceService] fetchAll error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiUpdateStatus(id, status) {
  try {
    const endpoint = (status === 'Present' || status === 'Late')
      ? `${API_BASE}/attendance/check-in`
      : `${API_BASE}/attendance/check-out`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ id, attendanceId: id, status }),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to update attendance.' }
    return { success: true, record: data.record || data.data || data }
  } catch (err) {
    console.error('[attendanceService] updateStatus error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiMarkPresent(id) {
  try {
    const res = await fetch(`${API_BASE}/attendance/check-in`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ id, attendanceId: id }),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to mark present.' }
    return { success: true, record: data.record || data.data || data }
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

function mapHourlyTrend(raw) {
  if (!raw) return []
  
  // Format hour helper (e.g. 9 -> "9AM", "09:00" -> "9AM", "9AM" -> "9AM")
  const formatHour = (h) => {
    if (typeof h === 'string' && (h.includes('AM') || h.includes('PM'))) {
      return h;
    }
    const num = parseInt(h, 10);
    if (isNaN(num)) return String(h);
    const ampm = num >= 12 ? 'PM' : 'AM';
    let displayHour = num % 12;
    if (displayHour === 0) displayHour = 12;
    return `${displayHour}${ampm}`;
  }

  // Case 1: Array of objects
  if (Array.isArray(raw)) {
    return raw.map(item => {
      if (typeof item === 'object' && item !== null) {
        const hour = item.hour !== undefined ? item.hour : (item.check_in_hour !== undefined ? item.check_in_hour : (item.time_slot || ''));
        const count = item.count !== undefined ? Number(item.count) : (item.attendance_count !== undefined ? Number(item.attendance_count) : Number(item.count || 0));
        return { hour: formatHour(hour), count };
      }
      return null;
    }).filter(Boolean);
  }

  // Case 2: Object with key-value pairs (e.g., { "09:00": 85, "10:00": 134 })
  if (typeof raw === 'object' && raw !== null) {
    return Object.entries(raw).map(([h, c]) => ({
      hour: formatHour(h),
      count: Number(c || 0)
    }));
  }

  return [];
}

/* ── SERVICE EXPORT ────────────────────────────────────────────── */
async function mockFetchLiveChart(eventId) {
  await new Promise(r => setTimeout(r, 300))
  return { success: true, chart: DEFAULT_CHART, eventId }
}

async function apiFetchLiveChart(eventId) {
  try {
    const url = `${API_BASE}/analytics/hourly-attendance`
    const res = await fetch(url, { headers: authHeaders() })
    const data = await parseJSON(res)
    
    if (!res.ok) {
      console.warn('[attendanceService] fetchLiveChart failed, trying fallback to mock.')
      return mockFetchLiveChart(eventId)
    }

    const raw = data.data || data.chart || data || []
    const mapped = mapHourlyTrend(raw)
    
    if (mapped.length === 0) {
      console.warn('[attendanceService] mapped hourly data is empty, falling back to mock.')
      return mockFetchLiveChart(eventId)
    }

    return { success: true, chart: mapped, eventId }
  } catch (err) {
    console.error('[attendanceService] fetchLiveChart error, falling back to mock:', err)
    return mockFetchLiveChart(eventId)
  }
}

function mapDeptAttendance(raw) {
  if (!raw) return []

  const DEPT_COLORS = ['#615FFF', '#00BC7D', '#FE9A00', '#0284c7', '#e11d48', '#7c3aed', '#0891b2', '#dc2626']

  // Case 1: Array of objects
  if (Array.isArray(raw)) {
    return raw.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        const dept = item.department || item.dept || item.name || '';
        const count = item.count !== undefined ? Number(item.count) : (item.attendance_count !== undefined ? Number(item.attendance_count) : Number(item.value || 0));
        const color = item.color || DEPT_COLORS[idx % DEPT_COLORS.length];
        return { dept, count, color };
      }
      return null;
    }).filter(Boolean);
  }

  // Case 2: Object with key-value pairs (e.g., { "CSE": 35, "ECE": 26 })
  if (typeof raw === 'object' && raw !== null) {
    return Object.entries(raw).map(([dept, count], idx) => ({
      dept,
      count: Number(count || 0),
      color: DEPT_COLORS[idx % DEPT_COLORS.length]
    }));
  }

  return [];
}

async function mockFetchDeptAttendance(eventId) {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, depts: DEFAULT_DEPT, eventId }
}

async function apiFetchDeptAttendance(eventId) {
  try {
    const url = `${API_BASE}/analytics/department-attendance`
    const res = await fetch(url, { headers: authHeaders() })
    const data = await parseJSON(res)
    
    if (!res.ok) {
      console.warn('[attendanceService] fetchDeptAttendance failed, trying fallback to mock.')
      return mockFetchDeptAttendance(eventId)
    }

    const raw = data.data || data.depts || data || []
    const mapped = mapDeptAttendance(raw)

    if (mapped.length === 0) {
      console.warn('[attendanceService] mapped department data is empty, falling back to mock.')
      return mockFetchDeptAttendance(eventId)
    }

    return { success: true, depts: mapped, eventId }
  } catch (err) {
    console.error('[attendanceService] fetchDeptAttendance error, falling back to mock:', err)
    return mockFetchDeptAttendance(eventId)
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
