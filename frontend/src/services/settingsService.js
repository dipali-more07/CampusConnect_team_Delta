const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL

import defaultSettings from '../data/settings.json'

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
    const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() })
    const data = await parseJSON(res)
    if (!res.ok) {
      console.warn('[settingsService] fetch settings failed, falling back to mock.')
      return mockFetch()
    }
    
    const user = data.data || {}
    const profile = user.profile || {}
    const settings = {
      profile: {
        name: profile.full_name || '',
        email: user.email || '',
        phone: profile.phone || user.phone || '',
        gender: user.gender || profile.gender || '',
        bio: user.bio || profile.bio || '',
        avatarColor: '#7c3aed',
        avatarUrl: user.profile_image || null
      },
      appearance: {
        themeMode: 'Light',
        accentColor: '#615FFF',
        fontSize: 'medium'
      },
      permissions: {
        Admin: ['all'],
        Organizer: ['events', 'attendance'],
        Student: ['view_events']
      }
    }
    return { success: true, settings }
  } catch (err) {
    console.error('[settingsService] fetch error, falling back to mock:', err)
    return mockFetch()
  }
}

async function apiUpdateProfile(profileData) {
  try {
    const payload = {}
    if (profileData.name) payload.full_name = profileData.name
    if (profileData.phone) payload.phone = profileData.phone
    if (profileData.gender) payload.gender = profileData.gender
    if (profileData.course) payload.course = profileData.course
    if (profileData.year_of_study) payload.year_of_study = Number(profileData.year_of_study)
    if (profileData.bio) payload.bio = profileData.bio
    if (profileData.college_id) payload.college_id = profileData.college_id

    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      console.warn('[settingsService] updateProfile failed, falling back to mock.')
      return mockUpdateProfile(profileData)
    }
    
    const updatedProfile = data.data || {}
    const settings = {
      profile: {
        name: updatedProfile.full_name || profileData.name,
        email: profileData.email,
        phone: updatedProfile.phone || profileData.phone,
        gender: updatedProfile.gender || profileData.gender,
        bio: updatedProfile.bio || profileData.bio,
        avatarColor: '#7c3aed',
        avatarUrl: updatedProfile.profile_image || profileData.avatarUrl
      }
    }
    return { success: true, message: data.message || 'Profile updated successfully.', settings }
  } catch (err) {
    console.error('[settingsService] updateProfile error, falling back to mock:', err)
    return mockUpdateProfile(profileData)
  }
}

async function apiUpdateAppearance(appearanceData) {
  try {
    const res = await fetch(`${API_BASE}/admin/settings/appearance`, {
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
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
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
