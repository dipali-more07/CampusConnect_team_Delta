const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL
import { fetchWithAuth } from '../utils/apiClient'

import defaultStudents from '../data/students.json'

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
const MOCK_KEY = 'campus_connect_mock_students'

function getMock() {
  const local = localStorage.getItem(MOCK_KEY)
  if (local) { try { return JSON.parse(local) } catch {} }
  localStorage.setItem(MOCK_KEY, JSON.stringify(defaultStudents))
  return [...defaultStudents]
}

function saveMock(students) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(students))
}

/* ── MOCK HANDLERS ─────────────────────────────────────────────── */
async function mockFetchAll() {
  await new Promise(r => setTimeout(r, 300))
  const students = getMock()
  const total = students.length
  const active = students.filter(s => s.status === 'Active').length
  const suspended = students.filter(s => s.status === 'Suspended').length
  return { success: true, students, stats: { total, active, suspended } }
}

async function mockCreate(data) {
  await new Promise(r => setTimeout(r, 400))
  const students = getMock()
  const id = `STU${String(students.length + 1).padStart(3, '0')}`
  const COLORS = ['#615FFF', '#00BC7D', '#FE9A00', '#0284c7', '#7c3aed', '#e11d48', '#16a34a', '#d97706']
  const newStudent = {
    id,
    ...data,
    eventsAttended: 0,
    attendancePercent: 0,
    certificatesCount: 0,
    status: 'Active',
    joinedDate: new Date().toISOString().split('T')[0],
    avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
  }
  students.push(newStudent)
  saveMock(students)
  return { success: true, student: newStudent }
}

async function mockUpdate(id, data) {
  await new Promise(r => setTimeout(r, 300))
  const students = getMock()
  const idx = students.findIndex(s => s.id === id)
  if (idx === -1) return { success: false, message: 'Student not found.' }
  students[idx] = { ...students[idx], ...data }
  saveMock(students)
  return { success: true, student: students[idx] }
}

async function mockUpdateStatus(id, status) {
  await new Promise(r => setTimeout(r, 250))
  const students = getMock()
  const idx = students.findIndex(s => s.id === id)
  if (idx === -1) return { success: false, message: 'Student not found.' }
  students[idx].status = status
  saveMock(students)
  return { success: true, student: students[idx] }
}

async function mockDelete(id) {
  await new Promise(r => setTimeout(r, 300))
  const students = getMock()
  const idx = students.findIndex(s => s.id === id)
  if (idx === -1) return { success: false, message: 'Student not found.' }
  students.splice(idx, 1)
  saveMock(students)
  return { success: true }
}

function mapStudent(s) {
  if (!s) return null
  const COLORS = ['#615FFF', '#00BC7D', '#FE9A00', '#0284c7', '#7c3aed', '#e11d48', '#16a34a', '#d97706']
  return {
    id: s.user_id || s.id || '',
    name: s.full_name || s.name || '',
    rollNo: s.roll_no || s.rollNo || (s.user_id ? s.user_id.slice(0, 8) : ''),
    email: s.email || '',
    department: s.department || 'N/A',
    year: s.year || s.course_year || '3rd',
    phone: s.mobile || s.phone || '',
    eventsAttended: s.events_attended || s.eventsAttended || 0,
    attendancePercent: s.attendance_percent || s.attendancePercent || 0,
    certificatesCount: s.certificates_count || s.certificatesCount || 0,
    status: s.is_active === false
      ? 'Suspended'
      : (s.status && ['suspended', 'inactive', 'deactivated', 'banned'].includes(String(s.status).toLowerCase()))
        ? 'Suspended'
        : 'Active',
    joinedDate: s.joined_date || s.joinedDate || new Date().toISOString().split('T')[0],
    avatarColor: s.avatarColor || COLORS[Math.floor(Math.random() * COLORS.length)]
  }
}

/* ── REAL API HANDLERS ─────────────────────────────────────────── */
async function apiFetchAll() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/students`, { method: 'GET' })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch students.' }
    
    const rawStudents = Array.isArray(data.data) ? data.data : 
                        Array.isArray(data.students) ? data.students : 
                        Array.isArray(data) ? data : []
                        
    const mapped = rawStudents.map(s => mapStudent(s))
    
    const total = mapped.length
    const active = mapped.filter(s => s.status === 'Active').length
    const suspended = mapped.filter(s => s.status === 'Suspended').length
    const stats = {
      total: data.stats?.total ?? total,
      active: data.stats?.active ?? active,
      suspended: data.stats?.suspended ?? suspended
    }
    
    return { success: true, students: mapped, stats }
  } catch (err) {
    console.error('[studentsService] fetchAll error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiCreate(payload) {
  try {
    const backendPayload = {
      email: payload.email,
      password: payload.password,
      full_name: payload.name,
      phone: payload.phone,
      department: payload.department,
      course: payload.year || '3rd',
      college_id: payload.rollNo
    }
    const res = await fetch(`${API_BASE}/users/students`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(backendPayload),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to create student.' }
    return { success: true, student: mapStudent(data.data || data.student || data) }
  } catch (err) {
    console.error('[studentsService] create error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiUpdate(id, payload) {
  try {
    const backendPayload = {
      email: payload.email,
      full_name: payload.name,
      phone: payload.phone,
      department: payload.department,
      course: payload.year || '3rd',
      college_id: payload.rollNo
    }
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(backendPayload),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to update student.' }
    return { success: true, student: mapStudent(data.data || data.student || data) }
  } catch (err) {
    console.error('[studentsService] update error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiUpdateStatus(id, status) {
  try {
    const endpoint = status === 'Active'
      ? `${API_BASE}/users/${id}/activate`
      : `${API_BASE}/users/${id}/deactivate`
      
    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: authHeaders()
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to update status.' }
    return { success: true, student: mapStudent(data.data || data.student || data) }
  } catch (err) {
    console.error('[studentsService] updateStatus error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiDelete(id) {
  try {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to delete student.' }
    return { success: true }
  } catch (err) {
    console.error('[studentsService] delete error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

/* ── SERVICE EXPORT ────────────────────────────────────────────── */
const studentsService = {
  fetchAll: () =>
    USE_MOCK ? mockFetchAll() : apiFetchAll(),

  create: (data) =>
    USE_MOCK ? mockCreate(data) : apiCreate(data),

  update: (id, data) =>
    USE_MOCK ? mockUpdate(id, data) : apiUpdate(id, data),

  updateStatus: (id, status) =>
    USE_MOCK ? mockUpdateStatus(id, status) : apiUpdateStatus(id, status),

  delete: (id) =>
    USE_MOCK ? mockDelete(id) : apiDelete(id),
}

export default studentsService
