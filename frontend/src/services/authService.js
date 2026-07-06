import users from '../data/users.json'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const MOCK_USERS_KEY = 'campus_connect_mock_users'

function getMockUsers() {
  const local = localStorage.getItem(MOCK_USERS_KEY)
  if (local) {
    try { return JSON.parse(local) } catch { }
  }
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))
  return users
}

function saveMockUsers(userList) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(userList))
}

/* ── MOCK LOGIN ─────────────────────────────────────────── */
async function mockLogin(email, password) {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 900))

  const userList = getMockUsers()
  const user = userList.find(
    u =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password
  )

  if (!user) {
    return { success: false, message: 'Invalid email or password.' }
  }

  // Strip password before storing
  const { password: _pwd, ...safeUser } = user

  // Fake JWT-like token
  const token = btoa(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 86400000 }))

  return { success: true, user: safeUser, token }
}

/* ── MOCK REGISTER ───────────────────────────────────────── */
async function mockRegister(payload) {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 900))
  const { name, email, mobile, college, course, password, role = 'student' } = payload

  const userList = getMockUsers()
  
  // Duplicate check
  const duplicate = userList.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (duplicate) {
    return { success: false, message: 'Email address is already registered.' }
  }

  // Add user
  const newUser = {
    id: userList.length + 1,
    name,
    email,
    mobile,
    college,
    course,
    password,
    role,
    avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
    joinedAt: new Date().toISOString().split('T')[0]
  }

  userList.push(newUser)
  saveMockUsers(userList)

  // Strip password
  const { password: _pwd, ...safeUser } = newUser

  return { success: true, user: safeUser, message: 'Registration successful! You can now log in.' }
}

/* ── MOCK FORGOT PASSWORD ────────────────────────────────── */
async function mockForgotPassword(email) {
  await new Promise(r => setTimeout(r, 900))
  const userList = getMockUsers()
  const user = userList.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (!user) {
    return { success: false, message: 'No account found with this email address.' }
  }
  return { success: true, message: `Password reset link sent to ${email}` }
}

/* ── REAL API LOGIN ─────────────────────────────────────── */
async function apiLogin(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok || data.success === false) {
      return { success: false, message: data.message || 'Login failed.' }
    }

    // Support flexible backend user & token formats
    const rawUser = data.user || data.data?.user || (data.data && typeof data.data === 'object' ? data.data : data)
    const token = data.token || data.accessToken || data.data?.token || ''

    // Normalize user object fields
    const user = rawUser && typeof rawUser === 'object' ? {
      ...rawUser,
      name: rawUser.name || rawUser.fullName || rawUser.username || rawUser.email?.split('@')[0] || 'User',
      role: (rawUser.role || rawUser.userType || rawUser.roleName || 'admin').toString().toLowerCase(),
    } : null

    return { success: true, user, token }
  } catch (err) {
    console.error('API Login Error:', err)
    return { success: false, message: 'Unable to process server response. Check console for details.' }
  }
}

/* ── REAL API REGISTER ──────────────────────────────────── */
async function apiRegister(payload) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, message: data.message || 'Registration failed.' }
    }

    return { success: true, user: data.user, message: data.message || 'Registration successful!' }
  } catch {
    return { success: false, message: 'Unable to reach server. Check your connection.' }
  }
}

/* ── REAL API FORGOT PASSWORD ────────────────────────────── */
async function apiForgotPassword(email) {
  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, message: data.message || 'Unable to request password reset.' }
    }

    return { success: true, message: data.message || 'Password reset link sent successfully.' }
  } catch {
    return { success: false, message: 'Unable to reach server. Check your connection.' }
  }
}

/* ── PUBLIC API ─────────────────────────────────────────── */
const authService = {
  /**
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ success: boolean, user?: object, token?: string, message?: string }>}
   */
  login: (email, password) =>
    USE_MOCK ? mockLogin(email, password) : apiLogin(email, password),

  register: (payload) =>
    USE_MOCK ? mockRegister(payload) : apiRegister(payload),

  forgotPassword: (email) =>
    USE_MOCK ? mockForgotPassword(email) : apiForgotPassword(email),
}

export default authService

