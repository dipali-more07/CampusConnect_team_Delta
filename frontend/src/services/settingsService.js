const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL

import defaultSettings from '../data/settings.json'

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
const MOCK_KEY = 'campus_connect_mock_settings'

function getMock() {
  const local = localStorage.getItem(MOCK_KEY)
  if (local) {
    try {
      return JSON.parse(local)
    } catch {}
  }
  localStorage.setItem(MOCK_KEY, JSON.stringify(defaultSettings))
  return { ...defaultSettings }
}

function saveMock(settings) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(settings))
}

/* ── MOCK HANDLERS ─────────────────────────────────────────────── */
async function mockFetch() {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, settings: getMock() }
}

async function mockUpdateProfile(profileData) {
  await new Promise(r => setTimeout(r, 300))
  const settings = getMock()
  settings.profile = { ...settings.profile, ...profileData }
  saveMock(settings)
  return { success: true, message: 'Profile updated successfully.', settings }
}

async function mockUpdateAppearance(appearanceData) {
  await new Promise(r => setTimeout(r, 200))
  const settings = getMock()
  settings.appearance = { ...settings.appearance, ...appearanceData }
  saveMock(settings)
  return { success: true, message: 'Appearance preferences updated.', settings }
}

async function mockUpdatePassword(passwordData) {
  await new Promise(r => setTimeout(r, 400))
  if (!passwordData.currentPassword || !passwordData.newPassword) {
    return { success: false, message: 'Invalid password fields.' }
  }
  return { success: true, message: 'Password updated successfully.' }
}

/* ── REAL API HANDLERS ─────────────────────────────────────────── */
async function apiFetch() {
  try {
    const res = await fetch(`${API_BASE}/settings`, { headers: authHeaders() })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch settings.' }
    return { success: true, settings: data.settings }
  } catch (err) {
    console.error('[settingsService] fetch error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiUpdateProfile(profileData) {
  try {
    const res = await fetch(`${API_BASE}/settings/profile`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(profileData),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to update profile.' }
    return { success: true, message: data.message || 'Profile updated.', settings: data.settings }
  } catch (err) {
    console.error('[settingsService] updateProfile error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiUpdateAppearance(appearanceData) {
  try {
    const res = await fetch(`${API_BASE}/settings/appearance`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(appearanceData),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to update appearance.' }
    return { success: true, message: data.message || 'Appearance updated.', settings: data.settings }
  } catch (err) {
    console.error('[settingsService] updateAppearance error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiUpdatePassword(passwordData) {
  try {
    const res = await fetch(`${API_BASE}/settings/password`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(passwordData),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to update password.' }
    return { success: true, message: data.message || 'Password updated.' }
  } catch (err) {
    console.error('[settingsService] updatePassword error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

/* ── SERVICE EXPORT ────────────────────────────────────────────── */
const settingsService = {
  fetch: () =>
    USE_MOCK ? mockFetch() : apiFetch(),

  updateProfile: (data) =>
    USE_MOCK ? mockUpdateProfile(data) : apiUpdateProfile(data),

  updateAppearance: (data) =>
    USE_MOCK ? mockUpdateAppearance(data) : apiUpdateAppearance(data),

  updatePassword: (data) =>
    USE_MOCK ? mockUpdatePassword(data) : apiUpdatePassword(data),
}

export default settingsService
