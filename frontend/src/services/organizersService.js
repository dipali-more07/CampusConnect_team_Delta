import { fetchWithAuth } from '../utils/apiClient'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL

import defaultOrganizers from '../data/organizers.json'

function authHeaders() {
  const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token') || ''
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
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
  const prof = o.profile || {}
  const u = o.user || {}
  return {
    ...o,
    id: o.user_id || o.id || prof.id || u.id,
    name: o.full_name || o.name || prof.full_name || prof.name || u.full_name || u.name || '',
    email: o.email || prof.email || u.email || '',
    phone: o.phone || o.mobile || o.phone_number || o.mobile_number || prof.phone || prof.mobile || u.phone || u.mobile || '',
    gender: (o.gender || prof.gender || u.gender || '').toLowerCase(),
    department: o.department || prof.department || u.department || '',
    collegeId: o.college_id || o.collegeId || o.college_code || o.collegeCode || prof.college_id || prof.collegeId || '',
    bio: o.bio || prof.bio || u.bio || '',
    avatarUrl: o.profile_image || o.avatar_url || o.avatarUrl || prof.profile_image || prof.avatar_url || null,
    office: o.office || o.office_location || prof.office || '',
    role: o.role || 'Organizer',
    eventsManaged: o.events_managed || o.eventsManaged || 0,
    avatarColor: o.avatarColor || '#615FFF'
  }
}

/* ── REAL API HANDLERS ─────────────────────────────────────────── */
async function apiFetchAll() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/organizers`, { method: 'GET' })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch organizers.' }
    const orgsArray = Array.isArray(data.data) ? data.data : Array.isArray(data.organizers) ? data.organizers : []
    const mapped = orgsArray.map(o => mapOrganizer(o))
    return { success: true, organizers: mapped }
  } catch (err) {
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
      gender: (payload.gender || '').toLowerCase(),
      department: payload.department,
      college_id: payload.collegeId
    }
    const res = await fetchWithAuth(`${API_BASE}/users/organizer`, {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to create organizer.' }
    const rawOrganizer = data.data || data.organizer || data
    return { success: true, organizer: mapOrganizer(rawOrganizer) }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

async function apiUpdate(id, payload) {
  try {
    const backendPayload = {
      email: payload.email,
      full_name: payload.name,
      phone: payload.phone,
      gender: (payload.gender || '').toLowerCase(),
      department: payload.department,
      college_id: payload.collegeId
    }
    const res = await fetchWithAuth(`${API_BASE}/organizers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendPayload),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to update organizer.' }
    const rawOrganizer = data.data || data.organizer || data
    return { success: true, organizer: mapOrganizer(rawOrganizer) }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

async function apiDelete(id) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/organizers/${id}`, {
      method: 'DELETE',
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to delete organizer.' }
    return { success: true }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

async function mockGetProfile() {
  await new Promise(r => setTimeout(r, 200))
  let email = 'priya.s@university.edu'
  const sessionRaw = sessionStorage.getItem('cc_session')
  if (sessionRaw) {
    try {
      const s = JSON.parse(sessionRaw)
      if (s?.user?.email) email = s.user.email
    } catch {}
  }
  const organizers = getMock()
  const currentOrg = organizers.find(o => o.email.toLowerCase() === email.toLowerCase()) || organizers[0]
  return { success: true, organizer: mapOrganizer(currentOrg) }
}

async function apiGetProfile() {
  try {
    let res = await fetchWithAuth(`${API_BASE}/organizers/me`)
    if (!res.ok) {
      res = await fetchWithAuth(`${API_BASE}/auth/me`)
    }
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch organizer profile.' }
    const rawOrganizer = data.data || data.organizer || data
    return { success: true, organizer: mapOrganizer(rawOrganizer) }
  } catch (err) {
    return { success: false, message: 'Server unreachable.' }
  }
}

async function mockUpdateProfile(payload) {
  await new Promise(r => setTimeout(r, 300))
  const organizers = getMock()
  if (organizers.length > 0) {
    organizers[0] = { ...organizers[0], ...payload }
    saveMock(organizers)
  }
  return { success: true, message: 'Profile updated successfully.' }
}

async function apiUpdateProfile(payload) {
  try {
    const backendPayload = {
      full_name: payload.name,
      email: payload.email,
      phone: payload.phone,
      mobile: payload.phone,
      gender: payload.gender ? payload.gender.toLowerCase() : null,
      department: payload.department,
      bio: payload.bio || '',
      profile_picture: payload.avatarUrl || payload.profile_image || null
    }
    let res = await fetchWithAuth(`${API_BASE}/organizers/me`, {
      method: 'PUT',
      body: JSON.stringify(backendPayload)
    })
    if (!res.ok) {
      res = await fetchWithAuth(`${API_BASE}/auth/me`, {
        method: 'PUT',
        body: JSON.stringify(backendPayload)
      })
    }
    if (!res.ok) {
      res = await fetchWithAuth(`${API_BASE}/auth/me`, {
        method: 'PATCH',
        body: JSON.stringify(backendPayload)
      })
    }
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to update profile.' }
    const rawOrganizer = data.data || data.organizer || data
    return { success: true, organizer: mapOrganizer(rawOrganizer), message: 'Profile updated successfully.' }
  } catch (err) {
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

  getProfile: () =>
    USE_MOCK ? mockGetProfile() : apiGetProfile(),

  updateProfile: (data) =>
    USE_MOCK ? mockUpdateProfile(data) : apiUpdateProfile(data),
}

export default organizersService
