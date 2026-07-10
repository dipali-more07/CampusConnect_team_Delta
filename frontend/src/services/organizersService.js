const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL

import defaultOrganizers from '../data/organizers.json'

function authHeaders() {
  const token = sessionStorage.getItem('cc_token')
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
const MOCK_KEY = 'campus_connect_mock_organizers'

function getMock() {
  const local = localStorage.getItem(MOCK_KEY)
  if (local) {
    try {
      return JSON.parse(local)
    } catch {}
  }
  localStorage.setItem(MOCK_KEY, JSON.stringify(defaultOrganizers))
  return [...defaultOrganizers]
}

function saveMock(organizers) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(organizers))
}

/* ── MOCK HANDLERS ─────────────────────────────────────────────── */
async function mockFetchAll() {
  await new Promise(r => setTimeout(r, 300))
  const organizers = getMock()
  return { success: true, organizers }
}

async function mockCreate(data) {
  await new Promise(r => setTimeout(r, 400))
  const organizers = getMock()
  const id = `ORG${String(organizers.length + 1).padStart(3, '0')}`
  const COLORS = ['#615FFF', '#00BC7D', '#FE9A00', '#0284c7', '#7c3aed', '#e11d48', '#16a34a']
  const newOrg = {
    id,
    ...data,
    eventsManaged: 0,
    avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
  }
  organizers.push(newOrg)
  saveMock(organizers)
  return { success: true, organizer: newOrg }
}

async function mockUpdate(id, data) {
  await new Promise(r => setTimeout(r, 300))
  const organizers = getMock()
  const idx = organizers.findIndex(o => o.id === id)
  if (idx === -1) return { success: false, message: 'Organizer not found.' }
  organizers[idx] = { ...organizers[idx], ...data }
  saveMock(organizers)
  return { success: true, organizer: organizers[idx] }
}

async function mockDelete(id) {
  await new Promise(r => setTimeout(r, 300))
  const organizers = getMock()
  const idx = organizers.findIndex(o => o.id === id)
  if (idx === -1) return { success: false, message: 'Organizer not found.' }
  organizers.splice(idx, 1)
  saveMock(organizers)
  return { success: true }
}

function mapOrganizer(o) {
  if (!o) return null
  return {
    id: o.user_id || o.id,
    name: o.full_name || o.name || '',
    email: o.email || '',
    phone: o.phone || '',
    department: o.department || '',
    collegeId: o.college_id || o.collegeId || '',
    office: o.office || o.office_location || '',
    role: o.role || 'Organizer',
    eventsManaged: o.events_managed || o.eventsManaged || 0,
    avatarColor: o.avatarColor || '#615FFF'
  }
}

/* ── REAL API HANDLERS ─────────────────────────────────────────── */
async function apiFetchAll() {
  try {
    const res = await fetch(`${API_BASE}/users/organizers`, { headers: authHeaders() })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch organizers.' }
    const orgsArray = Array.isArray(data.data) ? data.data : Array.isArray(data.organizers) ? data.organizers : []
    const mapped = orgsArray.map(o => mapOrganizer(o))
    return { success: true, organizers: mapped }
  } catch (err) {
    console.error('[organizersService] fetchAll error:', err)
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
      college_id: payload.collegeId
    }
    const res = await fetch(`${API_BASE}/users/organizer`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(backendPayload),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to create organizer.' }
    const rawOrganizer = data.data || data.organizer || data
    return { success: true, organizer: mapOrganizer(rawOrganizer) }
  } catch (err) {
    console.error('[organizersService] create error:', err)
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
      college_id: payload.collegeId
    }
    const res = await fetch(`${API_BASE}/organizers/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(backendPayload),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to update organizer.' }
    const rawOrganizer = data.data || data.organizer || data
    return { success: true, organizer: mapOrganizer(rawOrganizer) }
  } catch (err) {
    console.error('[organizersService] update error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiDelete(id) {
  try {
    const res = await fetch(`${API_BASE}/organizers/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to delete organizer.' }
    return { success: true }
  } catch (err) {
    console.error('[organizersService] delete error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

/* ── SERVICE EXPORT ────────────────────────────────────────────── */
const organizersService = {
  fetchAll: () =>
    USE_MOCK ? mockFetchAll() : apiFetchAll(),

  create: (data) =>
    USE_MOCK ? mockCreate(data) : apiCreate(data),

  update: (id, data) =>
    USE_MOCK ? mockUpdate(id, data) : apiUpdate(id, data),

  delete: (id) =>
    USE_MOCK ? mockDelete(id) : apiDelete(id),
}

export default organizersService
