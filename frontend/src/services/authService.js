import { saveTokens } from '../utils/apiClient'

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

  // Check if student account is suspended
  try {
    const localStudents = localStorage.getItem('cc_students_v1')
    if (localStudents) {
      const list = JSON.parse(localStudents)
      const currentStudent = list.find(s =>
        String(s.id) === String(user.id) ||
        (s.email && user.email && s.email.toLowerCase() === user.email.toLowerCase())
      )
      if (currentStudent?.status === 'Suspended') {
        return { success: false, message: 'Your account has been suspended by the administration. Please contact your campus admin.' }
      }
    }
  } catch {
    /* ignore */
  }

  if (user.status === 'Suspended' || user.is_active === false) {
    return { success: false, message: 'Your account has been suspended by the administration. Please contact your campus admin.' }
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
  const isDuplicate = userList.some(u => u.email.toLowerCase() === email.toLowerCase())
  if (isDuplicate) {
    return { success: false, message: 'Email address is already registered.' }
  }

  // Generate a mock code securely and save it in sessionStorage for verification
  const randomBuffer = new Uint32Array(1)
  crypto.getRandomValues(randomBuffer)
  const mockCode = String(100000 + (randomBuffer[0] % 900000))
  sessionStorage.setItem(`mock_otp_${email.toLowerCase()}`, mockCode)

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
  const exists = userList.some(u => u.email.toLowerCase() === email.toLowerCase())
  if (!exists) {
    return { success: false, message: 'No account found with this email address.' }
  }
  return { success: true, message: `Password reset link sent to ${email}` }
}

/* ── MOCK RESET PASSWORD ─────────────────────────────────── */
async function mockResetPassword(token, newPassword, confirmPassword) {
  await new Promise(r => setTimeout(r, 900))
  if (!token) return { success: false, message: 'Invalid or expired reset token.' }
  if (newPassword !== confirmPassword) return { success: false, message: 'Passwords do not match.' }
  return { success: true, message: 'Password reset successfully! You can now log in.' }
}

/* ── REAL API RESET PASSWORD ─────────────────────────────── */
async function apiResetPassword(token, newPassword, confirmPassword) {
  try {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, message: data.message || 'Password reset failed.' }
    }

    return { success: true, message: data.message || 'Password reset successfully!' }
  } catch {
    return { success: false, message: 'Unable to reach server. Check your connection.' }
  }
}

function determineRole(rawRole, email) {
  const norm = (rawRole || '').toString().toLowerCase()
  if (['admin', 'superadmin', 'super_admin'].includes(norm)) return 'admin'
  if (['organizer', 'event_organizer'].includes(norm)) return 'organizer'
  if (['student', 'participant'].includes(norm)) return 'student'
  if (email.toLowerCase().includes('admin')) return 'admin'
  if (email.toLowerCase().includes('organizer')) return 'organizer'
  return 'student'
}

async function fetchUserProfile(token, email) {
  try {
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!meRes.ok) return null
    const meData = await meRes.json()
    const rawProfile = meData.data?.user || meData.user || meData.data || meData
    const rawRole = (
      rawProfile.role || rawProfile.role_name || rawProfile.roleName ||
      rawProfile.userType || rawProfile.user_type || meData.data?.role || meData.role || ''
    )

    return {
      ...rawProfile,
      name: rawProfile.full_name || rawProfile.name || rawProfile.fullName || rawProfile.username || email.split('@')[0] || 'User',
      role: determineRole(rawRole, email),
    }
  } catch {
    return null
  }
}

/* ── REAL API LOGIN ─────────────────────────────────────── */
async function apiLogin(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    // ── Handle unverified email ──
    // Check both: explicit requires_verification flag OR message keywords (backend fallback)
    if (!res.ok || data.success === false) {
      const msg = (data.message || '').toLowerCase()

      const requiresVerification =
        data.data?.requires_verification === true ||
        data.requires_verification === true ||
        msg.includes('verify your email') ||
        msg.includes('email not verified') ||
        msg.includes('not verified') ||
        msg.includes('verification code has been sent') ||
        msg.includes('please verify')

      if (requiresVerification) {
        return {
          success: false,
          message: data.message || 'Email not verified. A verification code has been sent to your email.',
          requires_verification: true,
          data: {
            requires_verification: true,
            email: data.data?.email || email,
          },
        }
      }
      return { success: false, message: data.message || 'Login failed.' }
    }

    const token = data.data?.access_token || data.token || data.accessToken || data.data?.token || ''
    const refreshToken = data.data?.refresh_token || data.refresh_token || data.refreshToken || ''

    if (token || refreshToken) {
      saveTokens(token, refreshToken)
    }

    let user = null
    if (token) {
      user = await fetchUserProfile(token, email)
    }

    if (!user) {
      const loginProfile = data.data?.user || data.user || data.data || data
      const rawRole = (
        loginProfile.role || loginProfile.role_name || loginProfile.roleName ||
        loginProfile.userType || loginProfile.user_type || data.data?.role || data.role || ''
      )

      user = {
        ...loginProfile,
        email,
        name: loginProfile.full_name || loginProfile.name || loginProfile.fullName || email.split('@')[0] || 'User',
        role: determineRole(rawRole, email)
      }
    }

    return { success: true, user, token, refreshToken }
  } catch (err) {
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
      year_of_study: Number.parseInt(payload.yearOfStudy || payload.year_of_study || 1, 10),
    }

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      },
      body: JSON.stringify({ email, code }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, message: data.message || 'Verification failed.' }
    }

    return { success: true, message: data.message || 'Email verified successfully!' }
  } catch {
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
      },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to resend verification code.' }
    }

    return { success: true, message: data.message || 'Verification code resent successfully!' }
  } catch {
    return { success: false, message: 'Unable to reach server. Check your connection.' }
  }
}

/* ── REAL API LOGOUT ────────────────────────────────────── */
async function apiLogout(refreshToken) {
  try {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return { success: false, message: data.message || 'Logout failed.' }
    }

    return { success: true, message: data.message || 'Logged out successfully.' }
  } catch (err) {
    return { success: false, message: `API Logout Error: ${err.message || err}` }
  }
}

/* ── MOCK LOGOUT ────────────────────────────────────────── */
async function mockLogout(refreshToken) {
  await new Promise(r => setTimeout(r, 300))
  return { success: true, message: 'Mock logout successful.' }
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

  resetPassword: (token, newPassword, confirmPassword) =>
    USE_MOCK
      ? mockResetPassword(token, newPassword, confirmPassword)
      : apiResetPassword(token, newPassword, confirmPassword),

  verifyEmail: (email, code) => apiVerifyEmail(email, code),

  resendCode: (email) => apiResendCode(email),

  logout: (refreshToken) =>
    USE_MOCK ? mockLogout(refreshToken) : apiLogout(refreshToken),
}

export default authService

