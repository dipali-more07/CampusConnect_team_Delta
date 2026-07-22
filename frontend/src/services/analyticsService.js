const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL

import {
  ANALYTICS_STATS,
  MONTHLY_TREND_DATA,
  RADAR_DATA,
  CATEGORIES_TREND_DATA,
  DEPT_PIE_DATA
} from '../data/analyticsData'
import { fetchWithAuth } from '../utils/apiClient'
import eventsService from './eventsService'
import studentsService from './studentsService'
import certificatesService from './certificatesService'
import attendanceService from './attendanceService'

function authHeaders() {
  const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token') || ''
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

function parseJSON(res) {
  if (typeof res.json === 'function') {
    return res.json().catch(() => ({}))
  }
  return Promise.resolve(res)
}

/* ── MOCK HANDLERS ───────────────────────────────────────── */
async function mockFetchStats() {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, stats: ANALYTICS_STATS }
}

async function mockFetchMonthlyTrend(tab) {
  await new Promise(r => setTimeout(r, 200))
  // Variations based on tab if needed, otherwise return base trend
  let data = [...MONTHLY_TREND_DATA]
  if (tab === 'registration') {
    data = data.map(d => ({ ...d, value: Math.round(d.value * 1.2 * 10) / 10 }))
  } else if (tab === 'attendance') {
    data = data.map(d => ({ ...d, value: Math.round(d.value * 0.95 * 10) / 10 }))
  } else if (tab === 'student') {
    data = data.map(d => ({ ...d, value: Math.round(d.value * 1.5 * 10) / 10 }))
  }
  return { success: true, trend: data }
}

async function mockFetchRadarData() {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, radar: RADAR_DATA }
}

async function mockFetchCategories() {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, categories: CATEGORIES_TREND_DATA }
}

async function mockFetchDeptDistribution() {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, depts: DEPT_PIE_DATA }
}

async function mockFetchEventAnalytics(eventId) {
  await new Promise(r => setTimeout(r, 200))
  return {
    success: true,
    data: {
      registrations: {
        total: 120,
        confirmed: 95,
        cancelled: 25
      },
      attendance: {
        present: 80,
        absent: 15,
        percentage: 84.21
      },
      certificates: {
        generated: 78
      }
    }
  }
}

/* ── REAL API HANDLERS ───────────────────────────────────── */
async function apiFetchStats() {
  try {
    const [eventsRes, studentsRes, certsRes] = await Promise.all([
      eventsService.fetchAll(),
      studentsService.fetchAll(),
      certificatesService.fetchAll()
    ])

    const events = eventsRes.success ? eventsRes.events : []
    const students = studentsRes.success ? studentsRes.students : []
    const certificates = certsRes.success ? (certsRes.certificates || []) : []

    if (events.length === 0) {
            return { success: false, stats: [], message: 'No events found.' }
    }

    // Fetch registrations and attendance for each event to aggregate them
    const [registrationsResults, attendanceResults] = await Promise.all([
      Promise.all(events.map(ev => eventsService.fetchRegistrations(ev.id))),
      Promise.all(events.map(ev => attendanceService.fetchAll(ev.id)))
    ])

    let mostPopularEventName = 'N/A'
    let maxRegs = 0
    let highestAttendanceEventName = 'N/A'
    let maxAttendance = 0
    let lowestAttendanceEventName = 'N/A'
    let minAttendance = 100
    let hasAttendanceData = false
    let totalAttendancePercentSum = 0
    let attendanceEventsCount = 0

    const eventStats = events.map((ev, idx) => {
      const regs = registrationsResults[idx].success ? (registrationsResults[idx].registrations || []) : []
      const atts = attendanceResults[idx].success ? (attendanceResults[idx].records || []) : []
      
      const regCount = regs.length
      const totalAtt = atts.length
      const presentAtt = atts.filter(r => r.status === 'Present' || r.status === 'Late').length
      const attPct = totalAtt > 0 ? (presentAtt / totalAtt) * 100 : 0
      
      return {
        id: ev.id,
        name: ev.title || ev.event_name || 'Unnamed Event',
        regCount,
        attPct,
        hasAtt: totalAtt > 0
      }
    })

    eventStats.forEach(es => {
      if (es.regCount > maxRegs) {
        maxRegs = es.regCount
        mostPopularEventName = es.name
      }
      
      if (es.hasAtt) {
        hasAttendanceData = true
        totalAttendancePercentSum += es.attPct
        attendanceEventsCount++
        
        if (es.attPct > maxAttendance) {
          maxAttendance = es.attPct
          highestAttendanceEventName = es.name
        }
        if (es.attPct < minAttendance) {
          minAttendance = es.attPct
          lowestAttendanceEventName = es.name
        }
      }
    })

    if (maxRegs === 0 && eventStats.length > 0) {
      mostPopularEventName = eventStats[0].name
    }
    
    if (!hasAttendanceData && eventStats.length > 0) {
      highestAttendanceEventName = eventStats[0].name
      maxAttendance = 0
      lowestAttendanceEventName = eventStats[0].name
      minAttendance = 0
    }

    const avgAttendance = attendanceEventsCount > 0 ? (totalAttendancePercentSum / attendanceEventsCount) : 85
    const engagementScore = Math.min(100, Math.round(avgAttendance))
    const totalRegs = eventStats.reduce((sum, es) => sum + es.regCount, 0)
    
    const growth = students.length > 0 ? (totalRegs / students.length) * 100 : 23.8
    const growthStr = `${growth >= 0 ? '+' : ''}${Math.round(growth * 10) / 10}%`

    const stats = [
      { title: 'Most Popular Event', value: mostPopularEventName, sub: `${maxRegs} registrations`, color: '#615FFF' },
      { title: 'Highest Attendance', value: highestAttendanceEventName, sub: `${Math.round(maxAttendance * 10) / 10}% attendance`, color: '#00BC7D' },
      { title: 'Lowest Attendance', value: lowestAttendanceEventName, sub: `${Math.round(minAttendance * 10) / 10}% attendance`, color: '#FB2C36' },
      { title: 'Engagement Score', value: `${engagementScore} / 100`, sub: 'Based on active student participation', color: '#FE9A00' },
      { title: 'Monthly Growth', value: growthStr, sub: 'Registrations growth', color: '#0284c7' },
      { title: 'Certificates Issued', value: String(certificates.length), sub: `${totalRegs > 0 ? Math.round((certificates.length / totalRegs) * 100) : 92}% redemption rate`, color: '#e11d48' },
    ]

    return { success: true, stats }
  } catch (err) {
        return { success: false, stats: [], message: 'Server unreachable.' }
  }
}

async function apiFetchMonthlyTrend(tab) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/analytics/monthly?year=${new Date().getFullYear()}`)
    const data = await parseJSON(res)
    if (!res.ok) {
            return { success: false, trend: [], message: 'Failed to fetch monthly trend.' }
    }
    
    const raw = Array.isArray(data) ? data : (data.data || data.trend || [])
    const formatted = raw.map(item => {
      let monthLabel = item.month || ''
      if (monthLabel.includes('-')) {
        const parts = monthLabel.split('-')
        if (parts.length >= 2) {
          const monthNum = parseInt(parts[1], 10)
          const date = new Date(2000, monthNum - 1, 1)
          monthLabel = date.toLocaleString('en-US', { month: 'short' })
        }
      }
      
      let val = 0
      if (tab === 'event') {
        val = Number(item.events_created !== undefined ? item.events_created : (item.events_count !== undefined ? item.events_count : (item.events || 0)))
      } else if (tab === 'registration') {
        val = Number(item.registrations !== undefined ? item.registrations : (item.registrations_count !== undefined ? item.registrations_count : 0))
      } else if (tab === 'attendance') {
        val = Number(item.attendance !== undefined ? item.attendance : (item.attendance_avg !== undefined ? item.attendance_avg : 0))
      } else {
        val = Number(item.students_count !== undefined ? item.students_count : (item.value || 0))
      }
      
      return {
        month: monthLabel,
        value: val
      }
    })
    return { success: true, trend: formatted }
  } catch (err) {
        return { success: false, trend: [], message: 'Server unreachable.' }
  }
}

async function apiFetchRadarData() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/analytics/engagement-radar`)
    const data = await parseJSON(res)
    if (!res.ok) {
            return { success: false, radar: [], message: 'Failed to fetch radar data.' }
    }
    const raw = Array.isArray(data) ? data : (data.radar || data.data || data.metrics || [])
    const formatted = raw.map(item => ({
      axis: item.axis || item.name || item.metric || '',
      value: Number(item.value !== undefined ? item.value : (item.score || 0))
    }))
    return { success: true, radar: formatted }
  } catch (err) {
        return { success: false, radar: [], message: 'Server unreachable.' }
  }
}

async function apiFetchCategories() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/analytics/categories-breakdown`)
    const data = await parseJSON(res)
    if (!res.ok) {
            return { success: false, categories: [], message: 'Failed to fetch categories.' }
    }
    const raw = Array.isArray(data) ? data : (data.data || data.categories || [])
    const formatted = raw.map(item => {
      const catName = item.category ? (item.category.charAt(0).toUpperCase() + item.category.slice(1)) : 'Other'
      return {
        name: catName,
        events: Number(item.events_count !== undefined ? item.events_count : 0),
        registrations: Number(item.registrations_count !== undefined ? item.registrations_count : 0),
        month: catName,
        workshops: Number(item.events_count !== undefined ? item.events_count : 0),
        seminars: Number(item.registrations_count !== undefined ? item.registrations_count : 0),
        isApiData: true
      }
    })
    return { success: true, categories: formatted }
  } catch (err) {
        return { success: false, categories: [], message: 'Server unreachable.' }
  }
}

async function apiFetchDeptDistribution() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/analytics/department-distribution`)
    const data = await parseJSON(res)
    if (!res.ok) {
            return { success: false, depts: [], message: 'Failed to fetch department distribution.' }
    }
    
    const rawDepts = Array.isArray(data) ? data : (data.data || data.depts || [])
    const COLORS = ['#615FFF', '#0284c7', '#00BC7D', '#FE9A00', '#ef4444', '#a855f7', '#ec4899', '#f43f5e']
    const formatted = rawDepts.map((item, idx) => {
      const deptName = item.name || item.department || item.dept || 'Other'
      const pctValue = Number(item.value || item.count || item.percentage || item.share || 0)
      return {
        dept: deptName,
        name: deptName,
        percentage: pctValue,
        value: pctValue,
        color: item.color || COLORS[idx % COLORS.length]
      }
    })
    
    return { success: true, depts: formatted }
  } catch (err) {
        return { success: false, depts: [], message: 'Server unreachable.' }
  }
}

async function apiFetchEventAnalytics(eventId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/analytics/events/${eventId}`)
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch event analytics.' }
    return { success: true, data: data.data || data }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

async function mockFetchRecentActivity() {
  await new Promise(r => setTimeout(r, 200))
  const serializable = [
    { id: 1, type: 'registration', text: 'Arjun Patel registered for TechFest 2025', time: '2 min ago' },
    { id: 2, type: 'attendance', text: 'Attendance marked for National Hackathon (198/200)', time: '15 min ago' },
    { id: 3, type: 'publish', text: 'Sports Meet 2025 published by Dr. Kavitha Reddy', time: '1 hr ago' },
    { id: 4, type: 'certificate', text: '143 certificates generated for Research Symposium', time: '3 hr ago' },
    { id: 5, type: 'notification', text: 'Bulk notification sent to 1,200 students', time: '5 hr ago' },
    { id: 6, type: 'cancel', text: 'Entrepreneurship Bootcamp cancelled', time: 'Yesterday' }
  ]
  return { success: true, activities: serializable }
}

async function apiFetchRecentActivity() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/analytics/recent-activity`)
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch recent activity.' }
    const activities = Array.isArray(data) ? data : (data.activities || data.data || [])
    return { success: true, activities }
  } catch (err) {
        return { success: false, message: 'Server unreachable.' }
  }
}

async function mockFetchGrowth() {
  await new Promise(r => setTimeout(r, 200))
  const mockData = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    mockData.push({
      date: d.toISOString().split('T')[0],
      events_count: Math.floor(Math.random() * 2),
      registrations_count: Math.floor(Math.random() * 15) + 5,
      month: dateStr,
      registrations: Math.floor(Math.random() * 15) + 5,
      attendance: Math.floor(Math.random() * 20) + 70
    })
  }
  return { success: true, data: mockData }
}

async function apiFetchGrowth() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/analytics/growth`)
    const data = await parseJSON(res)
    if (!res.ok) {
      return { success: false, data: [], message: 'Failed to fetch growth data.' }
    }
    const raw = Array.isArray(data) ? data : (data.data || data.growth || [])
    return { success: true, data: raw }
  } catch (err) {
    return { success: false, data: [], message: 'Server unreachable.' }
  }
}

const analyticsService = {
  fetchStats: () =>
    USE_MOCK ? mockFetchStats() : apiFetchStats(),

  fetchMonthlyTrend: (tab) =>
    USE_MOCK ? mockFetchMonthlyTrend(tab) : apiFetchMonthlyTrend(tab),

  fetchRadarData: () =>
    USE_MOCK ? mockFetchRadarData() : apiFetchRadarData(),

  fetchCategories: () =>
    USE_MOCK ? mockFetchCategories() : apiFetchCategories(),

  fetchDeptDistribution: () =>
    USE_MOCK ? mockFetchDeptDistribution() : apiFetchDeptDistribution(),

  fetchRecentActivity: () =>
    USE_MOCK ? mockFetchRecentActivity() : apiFetchRecentActivity(),

  fetchEventAnalytics: (eventId) =>
    USE_MOCK ? mockFetchEventAnalytics(eventId) : apiFetchEventAnalytics(eventId),

  fetchGrowth: () =>
    USE_MOCK ? mockFetchGrowth() : apiFetchGrowth(),
}

export default analyticsService
