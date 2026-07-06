import studentDashboardData from '../data/student/studentDashboardData.json'
import studentAttendanceData from '../data/student/studentAttendanceData.json'
import studentEventsData from '../data/student/studentEventsData.json'
import studentCertificatesData from '../data/student/studentCertificatesData.json'
import studentNotificationsData from '../data/student/studentNotificationsData.json'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Local in-memory store for notifications, attendance & user profile
let notificationsStore = [...studentNotificationsData]
let attendanceStore = { ...studentAttendanceData }
let studentProfileStore = {
  name: 'Arjun Sharma',
  college: 'IIT Delhi',
  course: 'B.Tech Computer Science',
  email: 'arjun.sharma@iitd.ac.in',
  mobile: '+91 98765 43210',
  avatar: 'AS'
}

/* ── MOCK IMPLEMENTATIONS ── */
async function mockFetchDashboardOverview() {
  await new Promise(r => setTimeout(r, 200))
  return {
    success: true,
    data: studentDashboardData
  }
}

async function mockFetchAttendanceData() {
  await new Promise(r => setTimeout(r, 200))
  return {
    success: true,
    data: attendanceStore
  }
}

async function mockFetchEventsData() {
  await new Promise(r => setTimeout(r, 200))
  return {
    success: true,
    data: studentEventsData
  }
}

async function mockFetchCertificatesData() {
  await new Promise(r => setTimeout(r, 200))
  return {
    success: true,
    data: studentCertificatesData
  }
}

async function mockFetchNotifications() {
  await new Promise(r => setTimeout(r, 150))
  return {
    success: true,
    data: notificationsStore
  }
}

async function mockMarkNotificationAsRead(id) {
  await new Promise(r => setTimeout(r, 100))
  notificationsStore = notificationsStore.map(n => n.id === id ? { ...n, unread: false } : n)
  return {
    success: true,
    data: notificationsStore
  }
}

async function mockMarkAllNotificationsAsRead() {
  await new Promise(r => setTimeout(r, 150))
  notificationsStore = notificationsStore.map(n => ({ ...n, unread: false }))
  return {
    success: true,
    data: notificationsStore
  }
}

async function mockUpdateStudentProfile(updatedData) {
  await new Promise(r => setTimeout(r, 300))
  studentProfileStore = { ...studentProfileStore, ...updatedData }
  return {
    success: true,
    message: 'Profile updated successfully!',
    data: studentProfileStore
  }
}

async function mockChangeStudentPassword({ newPassword, confirmPassword }) {
  await new Promise(r => setTimeout(r, 300))
  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters long.' }
  }
  if (newPassword !== confirmPassword) {
    return { success: false, message: 'Passwords do not match.' }
  }
  return {
    success: true,
    message: 'Password changed successfully!'
  }
}

async function mockRegisterEvent(eventId) {
  await new Promise(r => setTimeout(r, 300))
  const event = studentEventsData.find(e => e.id === eventId)
  if (event) {
    event.registered = true
    event.status = 'Registered'
  }
  return { success: true, message: 'Successfully registered for event!' }
}

async function mockScanAttendanceQR(qrCodeContent) {
  await new Promise(r => setTimeout(r, 400))
  // Simulate marking attendance for a pending record or adding a new record
  const now = new Date()
  const scanTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  
  if (attendanceStore.records && attendanceStore.records.length > 0) {
    const pendingItem = attendanceStore.records.find(r => r.status === 'Pending')
    if (pendingItem) {
      pendingItem.status = 'Present'
      pendingItem.scanTime = scanTimeStr
    }
  }

  return {
    success: true,
    message: 'QR Scan verified! Attendance recorded successfully.',
    data: attendanceStore
  }
}

/* ── REAL API IMPLEMENTATIONS (Fallback) ── */
async function apiFetchAttendanceData() {
  try {
    const res = await fetch(`${API_BASE}/student/attendance`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
    })
    const data = await res.json()
    if (!res.ok) return mockFetchAttendanceData()
    return { success: true, data }
  } catch {
    return mockFetchAttendanceData()
  }
}

async function apiScanAttendanceQR(qrCodeContent) {
  try {
    const res = await fetch(`${API_BASE}/student/attendance/scan-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionStorage.getItem('token')}`
      },
      body: JSON.stringify({ qrCode: qrCodeContent })
    })
    const data = await res.json()
    if (!res.ok) return mockScanAttendanceQR(qrCodeContent)
    return { success: true, data }
  } catch {
    return mockScanAttendanceQR(qrCodeContent)
  }
}

/* ── PUBLIC STUDENT SERVICE API ── */
const studentService = {
  fetchDashboardOverview: () => (USE_MOCK ? mockFetchDashboardOverview() : apiFetchAttendanceData()),
  fetchAttendanceData: () => (USE_MOCK ? mockFetchAttendanceData() : apiFetchAttendanceData()),
  fetchEventsData: () => (USE_MOCK ? mockFetchEventsData() : apiFetchEventsData()),
  fetchCertificatesData: () => (USE_MOCK ? mockFetchCertificatesData() : apiFetchCertificatesData()),
  fetchNotifications: () => (USE_MOCK ? mockFetchNotifications() : apiFetchNotifications()),
  markNotificationAsRead: (id) => (USE_MOCK ? mockMarkNotificationAsRead(id) : apiMarkNotificationAsRead(id)),
  markAllNotificationsAsRead: () => (USE_MOCK ? mockMarkAllNotificationsAsRead() : apiMarkAllNotificationsAsRead()),
  updateStudentProfile: (data) => (USE_MOCK ? mockUpdateStudentProfile(data) : apiUpdateStudentProfile(data)),
  changeStudentPassword: (data) => (USE_MOCK ? mockChangeStudentPassword(data) : apiChangeStudentPassword(data)),
  registerEvent: (eventId) => mockRegisterEvent(eventId),
  scanAttendanceQR: (code) => (USE_MOCK ? mockScanAttendanceQR(code) : apiScanAttendanceQR(code)),
}

export default studentService
