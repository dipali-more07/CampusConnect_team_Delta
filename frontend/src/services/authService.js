/* eslint-disable no-unused-vars, no-empty */
import users from '../data/users.json'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL

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
  const { name, email, mobile, college, course, department, password, role = 'student' } = payload

  const userList = getMockUsers()
  
  // Duplicate check
  const duplicate = userList.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (duplicate) {
    return { success: false, message: 'Email address is already registered.' }
  }

  // Generate a mock code and save it in sessionStorage for verification
  const mockCode = String(Math.floor(100000 + Math.random() * 900000))
  sessionStorage.setItem(`mock_otp_${email.toLowerCase()}`, mockCode)
  console.log(`Mock OTP for ${email}: ${mockCode}`)

  // Add user
  const newUser = {
    id: userList.length + 1,
    name,
    email,
    mobile,
    college,
    course,
    department,
    password,
    role,
    avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
    joinedAt: new Date().toISOString().split('T')[0],
    verified: false
  }

  userList.push(newUser)
  saveMockUsers(userList)

  // Strip password
  const { password: _pwd, ...safeUser } = newUser

  return { success: true, user: safeUser, message: `Verification code sent to ${email}! (Mock Code: ${mockCode})` }
}

/* ── MOCK VERIFY EMAIL ──────────────────────────────────── */
async function mockVerifyEmail(email, code) {
  await new Promise(r => setTimeout(r, 600))
  if (!code) {
    return { success: false, message: 'Verification code is required.' }
  }

  const expectedCode = sessionStorage.getItem(`mock_otp_${email.toLowerCase()}`)
  if (expectedCode && code !== expectedCode) {
    return { success: false, message: 'Incorrect verification code. Please try again.' }
  }

  // Mark mock user as verified
  const userList = getMockUsers()
  const idx = userList.findIndex(u => u.email.toLowerCase() === email.toLowerCase())
  if (idx !== -1) {
    userList[idx].verified = true
    saveMockUsers(userList)
  }

  return { success: true, message: 'Email verified successfully! You can now log in.' }
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

    // Support flexible backend token formats
    const token = data.data?.access_token || data.token || data.accessToken || data.data?.token || ''
    const refreshToken = data.data?.refresh_token || data.refresh_token || data.refreshToken || ''

    // Store refresh token immediately for auto-refresh to work
    if (refreshToken) {
      localStorage.setItem('cc_refresh_token', refreshToken)
    }

    let user = null
    if (token) {
      try {
        const meRes = await fetch(`${API_BASE}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          }
        })
        if (meRes.ok) {
          const meData = await meRes.json()
          const profile = meData.data || meData
          let role = (profile.role || profile.userType || profile.roleName || 'student').toString().toLowerCase()
          if (role === 'participant') {
            role = 'student'
          }
          user = {
            ...profile,
            name: profile.full_name || profile.name || profile.fullName || profile.username || profile.email?.split('@')[0] || 'User',
            role,
          }
        }
      } catch (meErr) {
        console.error('Error fetching user profile:', meErr)
      }
    }

    // Fallback user object if /me failed or returned nothing
    if (!user) {
      user = {
        email,
        name: email.split('@')[0] || 'User',
        role: 'student'
      }
    }

    return { success: true, user, token, refreshToken }
  } catch (err) {
    console.error('API Login Error:', err)
    return { success: false, message: `API Login Error: ${err.message || err}` }
  }
}

/* ── REAL API REGISTER ──────────────────────────────────── */
async function apiRegister(payload) {
  try {
    const apiPayload = {
      email: payload.email,
      password: payload.password,
      confirm_password: payload.confirmPassword || payload.password,
      full_name: payload.name,
      phone: payload.mobile,
      course: payload.course,
      department: payload.department,
      college_id: payload.collegeId || payload.college,
      gender: payload.gender || 'male',
      year_of_study: parseInt(payload.yearOfStudy || payload.year_of_study || 1, 10),
    }

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(apiPayload),
    })

    const data = await res.json()

    if (!res.ok) {
      let errMsg = data.message || data.error || 'Registration failed.'
      if (Array.isArray(data.data) && data.data.length > 0) {
        errMsg = data.data.map(err => err.message).join(', ')
      } else if (data.errors && typeof data.errors === 'object') {
        errMsg = Object.values(data.errors).join(', ')
      }
      return { success: false, message: errMsg }
    }

    const rawUser = data.user || data.data?.user || (data.data && typeof data.data === 'object' ? data.data : data)
    return { success: true, user: rawUser, message: data.message || 'Registration successful!' }
  } catch (err) {
    console.error('API Register Error:', err)
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

/* ── REAL API VERIFY EMAIL ───────────────────────────────── */
async function apiVerifyEmail(email, code) {
  try {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ email, code }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, message: data.message || 'Verification failed.' }
    }

    return { success: true, message: data.message || 'Email verified successfully!' }
  } catch (err) {
    console.error('API Verify Email Error:', err)
    return { success: false, message: 'Unable to reach server. Check your connection.' }
  }
}

/* ── REAL API RESEND CODE ────────────────────────────────── */
async function apiResendCode(email) {
  try {
    const res = await fetch(`${API_BASE}/auth/resend-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to resend verification code.' }
    }

    return { success: true, message: data.message || 'Verification code resent successfully!' }
  } catch (err) {
    console.error('API Resend Code Error:', err)
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

  register: (payload) => apiRegister(payload),

  forgotPassword: (email) =>
    USE_MOCK ? mockForgotPassword(email) : apiForgotPassword(email),

  verifyEmail: (email, code) => apiVerifyEmail(email, code),

  resendCode: (email) => apiResendCode(email),
}

export default authService

