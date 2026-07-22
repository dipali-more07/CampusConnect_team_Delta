const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL
import { fetchWithAuth } from '../utils/apiClient'

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

/* ── MOCK DATA ─────────────────────────────────────────────────── */
const MOCK_PAYMENTS = [
  { id: 'PAY001', transactionId: 'TXN83940128', studentName: 'Arjun Patel', rollNo: '21CS001', email: 'arjun.patel@gmail.com', eventId: 'EVT081', eventName: 'TechFest 2025', amount: 250, method: 'UPI', status: 'Success', date: '2025-07-19 10:30' },
  { id: 'PAY002', transactionId: 'TXN92810384', studentName: 'Sneha Krishnan', rollNo: '21ECE042', email: 'sneha.k@iitd.ac.in', eventId: 'EVT081', eventName: 'TechFest 2025', amount: 250, method: 'Card', status: 'Success', date: '2025-07-19 11:15' },
  { id: 'PAY003', transactionId: 'TXN38201948', studentName: 'Rahul Gupta', rollNo: '22ME015', email: 'rahul.g@iitd.ac.in', eventId: 'EVT082', eventName: 'Annual Cultural Fest', amount: 150, method: 'UPI', status: 'Success', date: '2025-07-18 16:45' },
  { id: 'PAY004', transactionId: 'TXN74829103', studentName: 'Priya Nair', rollNo: '21MBA008', email: 'priya.nair@gmail.com', eventId: 'EVT082', eventName: 'Annual Cultural Fest', amount: 150, method: 'NetBanking', status: 'Success', date: '2025-07-18 18:20' },
  { id: 'PAY005', transactionId: 'TXN10394827', studentName: 'Vikram Singh', rollNo: '23EEE031', email: 'vikram.s@iitd.ac.in', eventId: 'EVT083', eventName: 'National Hackathon', amount: 500, method: 'UPI', status: 'Pending', date: '2025-07-19 13:05' },
  { id: 'PAY006', transactionId: 'TXN49302817', studentName: 'Aishwarya Menon', rollNo: '21CSE089', email: 'aish.m@gmail.com', eventId: 'EVT083', eventName: 'National Hackathon', amount: 500, method: 'Card', status: 'Failed', date: '2025-07-17 14:00' },
  { id: 'PAY007', transactionId: 'TXN82710492', studentName: 'Rohan Sharma', rollNo: '22CS054', email: 'rohan.s@gmail.com', eventId: 'EVT081', eventName: 'TechFest 2025', amount: 250, method: 'UPI', status: 'Success', date: '2025-07-17 10:10' },
  { id: 'PAY008', transactionId: 'TXN62910384', studentName: 'Divya Teja', rollNo: '21ECE011', email: 'divya.t@iitd.ac.in', eventId: 'EVT084', eventName: 'Industry Connect Summit', amount: 100, method: 'UPI', status: 'Success', date: '2025-06-25 09:30' },
  { id: 'PAY009', transactionId: 'TXN91827364', studentName: 'Aditya Verma', rollNo: '22ME098', email: 'aditya.v@gmail.com', eventId: 'EVT084', eventName: 'Industry Connect Summit', amount: 100, method: 'Card', status: 'Success', date: '2025-06-25 10:45' },
  { id: 'PAY010', transactionId: 'TXN28391029', studentName: 'Kriti Deshmukh', rollNo: '21CS112', email: 'kriti.d@gmail.com', eventId: 'EVT082', eventName: 'Annual Cultural Fest', amount: 150, method: 'UPI', status: 'Success', date: '2025-07-18 14:15' },
  { id: 'PAY011', transactionId: 'TXN37281902', studentName: 'Manish Kumar', rollNo: '22EE023', email: 'manish.k@iitd.ac.in', eventId: 'EVT083', eventName: 'National Hackathon', amount: 500, method: 'UPI', status: 'Success', date: '2025-07-09 11:00' },
  { id: 'PAY012', transactionId: 'TXN48392019', studentName: 'Ananya Roy', rollNo: '21MBA043', email: 'ananya.roy@gmail.com', eventId: 'EVT085', eventName: 'Sports Meet 2025', amount: 200, method: 'UPI', status: 'Success', date: '2025-07-19 08:30' },
  { id: 'PAY013', transactionId: 'TXN94830291', studentName: 'Siddharth Sen', rollNo: '23CS012', email: 'sid.sen@gmail.com', eventId: 'EVT085', eventName: 'Sports Meet 2025', amount: 200, method: 'Card', status: 'Success', date: '2025-07-18 11:20' },
  { id: 'PAY014', transactionId: 'TXN73829104', studentName: 'Nisha Pillai', rollNo: '22ECE054', email: 'nisha.p@iitd.ac.in', eventId: 'EVT085', eventName: 'Sports Meet 2025', amount: 200, method: 'NetBanking', status: 'Pending', date: '2025-07-19 14:10' },
  { id: 'PAY015', transactionId: 'TXN82910385', studentName: 'Varun Dhawan', rollNo: '21ME045', email: 'varun.d@gmail.com', eventId: 'EVT086', eventName: 'Research Symposium', amount: 0, method: 'Free', status: 'Success', date: '2025-06-12 15:45' }
]

/* ── Shared mapper ──────────────────────────────────────────────── */
function mapPayment(p, index) {
  const student = p.student || p.user || {}
  const event = p.event || {}
  const amt = Number(p.amount ?? p.fee ?? event.fees ?? 0)
  const rawStatus = p.payment_status || p.status || p.paymentStatus
  let normStatus = 'Success'
  if (rawStatus) {
    const s = String(rawStatus).toLowerCase()
    if (s.includes('pend')) normStatus = 'Pending'
    else if (s.includes('fail')) normStatus = 'Failed'
    else if (s.includes('succ') || s.includes('comp')) normStatus = 'Success'
    else normStatus = s.charAt(0).toUpperCase() + s.slice(1)
  } else if (amt > 0) {
    normStatus = 'Pending'
  }

  return {
    id: p.payment_id || p.id || `PAY${String(index + 1).padStart(3, '0')}`,
    registrationId: p.registration_id || p.registrationId || p.id,
    transactionId: p.transaction_id || p.transactionId || `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    studentName: p.student_name || student.full_name || student.name || 'Student',
    rollNo: p.roll_no || student.college_id || 'N/A',
    email: p.email || student.email || '',
    eventId: p.event_id || event.id || '',
    eventName: p.event_name || event.event_name || event.name || 'Event',
    amount: amt,
    method: p.payment_method || p.method || (amt === 0 ? 'Free' : 'Pending'),
    status: normStatus,
    date: p.created_at ? new Date(p.created_at).toLocaleString('en-IN') : (p.date || '')
  }
}

function getStoredPendingPayments() {
  try {
    const stored = JSON.parse(sessionStorage.getItem('cc_student_pending_payments') || '[]')
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

/* ── SERVICE IMPLEMENTATIONS ── */
async function mockFetchPayments() {
  await new Promise(r => setTimeout(r, 400))
  return { success: true, payments: MOCK_PAYMENTS }
}

async function apiFetchPayments() {
  try {
    let res = await fetch(`${API_BASE}/payments`, {
      method: 'GET',
      headers: authHeaders()
    })

    if (!res.ok) {
      res = await fetch(`${API_BASE}/payments/all`, {
        method: 'GET',
        headers: authHeaders()
      })
    }

    
    if (!res.ok) {
      return { success: false, payments: [], message: 'Failed to load payments.' }
    }

    const data = await parseJSON(res)
    const rawList = data.data || data.payments || data.items || data || []

    if (!Array.isArray(rawList)) {
      return { success: true, payments: [] }
    }

    return { success: true, payments: rawList.map(mapPayment) }
  } catch (err) {
    return { success: false, payments: [], message: 'Server unreachable.' }
  }
}

/**
 * GET /payments/my
 * Retrieves all payments made by the currently logged-in student.
 * Supports pagination via page & size query params.
 */
async function apiFetchMyPayments({ page = 1, size = 100 } = {}) {
  try {
    const res = await fetch(`${API_BASE}/payments/my?page=${page}&size=${size}`, {
      method: 'GET',
      headers: authHeaders(),
    })

    const storedPending = getStoredPendingPayments()

    if (!res.ok) {
      // If API error, still return stored pending payments if available
      if (storedPending.length > 0) {
        return { success: true, payments: storedPending.map(mapPayment), total: storedPending.length }
      }
      return { success: false, payments: [], message: 'Failed to load payments.' }
    }

    const data = await parseJSON(res)
    const rawList = data.data?.payments ?? data.data ?? data.payments ?? data.items ?? []

    const serverList = Array.isArray(rawList) ? rawList : []
    // Combine server payments + local pending payments without duplicates
    const combined = [...storedPending]
    serverList.forEach(item => {
      if (!combined.some(c => c.id === item.id || (c.event_id && c.event_id === item.event_id))) {
        combined.push(item)
      }
    })

    return {
      success: true,
      payments: combined.map(mapPayment),
      total: combined.length,
    }
  } catch (err) {
    const storedPending = getStoredPendingPayments()
    if (storedPending.length > 0) {
      return { success: true, payments: storedPending.map(mapPayment), total: storedPending.length }
    }
    return { success: false, payments: [], message: 'Server unreachable.' }
  }
}

async function mockFetchMyPayments() {
  await new Promise(r => setTimeout(r, 400))
  const storedPending = getStoredPendingPayments()
  const combined = [...storedPending, ...MOCK_PAYMENTS.slice(0, 3)]
  return { success: true, payments: combined.map(mapPayment), total: combined.length }
}

/**
 * GET /payments/event/{event_id}
 * Retrieve all payments for a specific event. Organizer/Admin only.
 */
async function apiFetchEventPayments(eventId, { page = 1, size = 500 } = {}) {
  try {
    const res = await fetch(`${API_BASE}/payments/event/${eventId}?page=${page}&size=${size}`, {
      method: 'GET',
      headers: authHeaders(),
    })

    if (!res.ok) {
      return { success: false, payments: [], message: 'Failed to load event payments.' }
    }

    const data = await parseJSON(res)
    const rawList = data.data?.payments ?? data.data ?? data.payments ?? data.items ?? []

    if (!Array.isArray(rawList)) {
      return { success: true, payments: [], total: 0 }
    }

    return {
      success: true,
      payments: rawList.map(mapPayment),
      total: data.data?.total ?? data.total ?? rawList.length,
    }
  } catch (err) {
    return { success: false, payments: [], message: 'Server unreachable.' }
  }
}

async function mockFetchEventPayments(eventId) {
  await new Promise(r => setTimeout(r, 400))
  const filtered = MOCK_PAYMENTS.filter(p => p.eventId === eventId)
  return { success: true, payments: filtered, total: filtered.length }
}

const paymentsService = {
  fetchAll: () => (USE_MOCK ? mockFetchPayments() : apiFetchPayments()),

  /** Fetch payments for the currently logged-in student */
  fetchMy: (opts) => (USE_MOCK ? mockFetchMyPayments() : apiFetchMyPayments(opts)),

  /** Fetch payments for a specific event (Organizer/Admin only) */
  fetchByEvent: (eventId, opts) =>
    USE_MOCK ? mockFetchEventPayments(eventId) : apiFetchEventPayments(eventId, opts),
}

export default paymentsService
