import {
  CalendarDays,
  GraduationCap,
  ClipboardList,
  SquareCheckBig,
  Star,
  Award,
} from 'lucide-react'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL 

export const STATS_CONFIG = {
  total_events: {
    label: 'Total Events',
    icon: CalendarDays,
    iconBg: '#615FFF',
    iconColor: '#fff',
  },
  total_students: {
    label: 'Total Students',
    icon: GraduationCap,
    iconBg: '#00BC7D',
    iconColor: '#fff',
  },
  registrations: {
    label: 'Registrations',
    icon: ClipboardList,
    iconBg: '#FE9A00',
    iconColor: '#fff',
  },
  avg_attendance: {
    label: 'Avg Attendance',
    icon: SquareCheckBig,
    iconBg: '#8E51FF',
    iconColor: '#fff',
  },
  upcoming_events: {
    label: 'Upcoming Events',
    icon: Star,
    iconBg: '#2B7FFF',
    iconColor: '#fff',
  },
  certificates: {
    label: 'Certificates',
    icon: Award,
    iconBg: '#F6339A',
    iconColor: '#fff',
  },
}

export function enrichStats(statsList = []) {
  return statsList.map(item => {
    const config = STATS_CONFIG[item.key] || {
      label: item.key,
      icon: Star,
      iconBg: '#615FFF',
      iconColor: '#fff',
    }
    return { ...item, ...config }
  })
}

/* ── MOCK DATA ── */
const MOCK_STATS = [
  { key: 'total_events', value: '247', delta: '+18' },
  { key: 'total_students', value: '12,483', delta: '+342' },
  { key: 'registrations', value: '38,291', delta: '+2,140' },
  { key: 'avg_attendance', value: '89%', delta: '+2%' },
  { key: 'upcoming_events', value: '32', delta: '+5' },
  { key: 'certificates', value: '8,214', delta: '+631' },
]

import eventsService from './eventsService'
import studentsService from './studentsService'
import certificatesService from './certificatesService'
import attendanceService from './attendanceService'

/* ── API IMPLEMENTATIONS ── */
async function mockFetchStats() {
  await new Promise(r => setTimeout(r, 300))
  return { success: true, stats: MOCK_STATS }
}

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

    const totalEvents = events.length
    const totalStudents = students.length

    // Fetch registrations and attendance for each event to sum them up accurately
    const [registrationsResults, attendanceResults] = await Promise.all([
      Promise.all(events.map(ev => eventsService.fetchRegistrations(ev.id))),
      Promise.all(events.map(ev => attendanceService.fetchAll(ev.id)))
    ])

    const totalRegistrations = registrationsResults.reduce((sum, res) => {
      const list = res.success ? (res.registrations || []) : []
      return sum + list.length
    }, 0)

    let totalAttendanceCount = 0
    let presentAttendanceCount = 0
    attendanceResults.forEach(res => {
      const records = res.success ? (res.records || []) : []
      totalAttendanceCount += records.length
      presentAttendanceCount += records.filter(r => r.status === 'Present' || r.status === 'Late').length
    })

    const avgAttendanceVal = totalAttendanceCount > 0 ? Math.round((presentAttendanceCount / totalAttendanceCount) * 100) : 0

    const todayStr = new Date().toISOString().split('T')[0]
    const upcomingEvents = events.filter(ev => {
      const isStatusUpcoming = String(ev.status).toLowerCase() === 'upcoming'
      const isDateUpcoming = ev.date && ev.date >= todayStr
      return isStatusUpcoming || isDateUpcoming
    }).length

    const totalCertificates = certificates.length

    const stats = [
      { key: 'total_events', value: String(totalEvents), delta: `+${totalEvents}` },
      { key: 'total_students', value: String(totalStudents), delta: `+${totalStudents}` },
      { key: 'registrations', value: String(totalRegistrations), delta: `+${totalRegistrations}` },
      { key: 'avg_attendance', value: `${avgAttendanceVal}%`, delta: '+0%' },
      { key: 'upcoming_events', value: String(upcomingEvents), delta: `+${upcomingEvents}` },
      { key: 'certificates', value: String(totalCertificates), delta: `+${totalCertificates}` },
    ]

    return { success: true, stats }
  } catch (err) {
        return { success: true, stats: MOCK_STATS }
  }
}

/* ── PUBLIC SERVICE API ── */
const dashboardService = {
  fetchStats: () => (USE_MOCK ? mockFetchStats() : apiFetchStats()),
}

export default dashboardService
