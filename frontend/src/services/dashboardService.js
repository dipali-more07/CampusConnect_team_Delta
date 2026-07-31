import {
  CalendarDays,
  GraduationCap,
  ClipboardList,
  UserCheck,
  Star,
  Award,
} from 'lucide-react'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' 

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
  total_organizers: {
    label: 'Total Organizers',
    icon: UserCheck,
    iconBg: '#8E51FF',
    iconColor: '#fff',
  },
  avg_attendance: {
    label: 'Total Organizers',
    icon: UserCheck,
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
  { key: 'total_organizers', value: '12', delta: '+2' },
  { key: 'upcoming_events', value: '32', delta: '+5' },
  { key: 'certificates', value: '8,214', delta: '+631' },
]

import eventsService from './eventsService'
import studentsService from './studentsService'
import certificatesService from './certificatesService'
import organizersService from './organizersService'

/* ── API IMPLEMENTATIONS ── */
async function mockFetchStats() {
  await new Promise(r => setTimeout(r, 300))
  let orgCount = 12
  try {
    const orgRes = await organizersService.fetchAll()
    if (orgRes.success && Array.isArray(orgRes.organizers)) {
      orgCount = orgRes.organizers.length
    }
  } catch {
    /* ignore */
  }

  const stats = MOCK_STATS.map(s => {
    if (s.key === 'total_organizers' || s.key === 'avg_attendance') {
      return { key: 'total_organizers', value: String(orgCount), delta: '+0' }
    }
    return s
  })
  return { success: true, stats }
}

async function apiFetchStats() {
  try {
    const [eventsRes, studentsRes, certsRes, organizersRes] = await Promise.allSettled([
      eventsService.fetchAll(),
      studentsService.fetchAll(),
      certificatesService.fetchAll(),
      organizersService.fetchAll()
    ])

    const events = eventsRes.status === 'fulfilled' && eventsRes.value?.success ? (eventsRes.value.events || []) : []
    const students = studentsRes.status === 'fulfilled' && studentsRes.value?.success ? (studentsRes.value.students || []) : []
    const certificates = certsRes.status === 'fulfilled' && certsRes.value?.success ? (certsRes.value.certificates || []) : []
    const organizers = organizersRes.status === 'fulfilled' && organizersRes.value?.success ? (organizersRes.value.organizers || []) : []

    const totalEvents = events.length
    const totalStudents = students.length
    const totalCertificates = certificates.length
    const totalOrganizers = organizers.length

    let totalRegistrations = 0
    let upcomingEvents = 0

    const todayStr = new Date().toISOString().split('T')[0]
    events.forEach(ev => {
      const regCount = Number(ev.registrationsCount || ev.registration_count || ev.total_registrations || ev.totalRegistrations || 0)
      totalRegistrations += regCount
      const isStatusUpcoming = String(ev.status || '').toLowerCase() === 'upcoming'
      const isDateUpcoming = ev.date && ev.date >= todayStr
      if (isStatusUpcoming || isDateUpcoming) upcomingEvents++
    })

    const stats = [
      { key: 'total_events', value: totalEvents.toLocaleString('en-IN'), delta: '+0' },
      { key: 'total_students', value: totalStudents.toLocaleString('en-IN'), delta: '+0' },
      { key: 'registrations', value: totalRegistrations.toLocaleString('en-IN'), delta: '+0' },
      { key: 'total_organizers', value: totalOrganizers.toLocaleString('en-IN'), delta: '+0' },
      { key: 'upcoming_events', value: upcomingEvents.toLocaleString('en-IN'), delta: '+0' },
      { key: 'certificates', value: totalCertificates.toLocaleString('en-IN'), delta: '+0' },
    ]

    return { success: true, stats }
  } catch {
    return { success: true, stats: MOCK_STATS }
  }
}

/* ── PUBLIC SERVICE API ── */
const dashboardService = {
  fetchStats: () => (USE_MOCK ? mockFetchStats() : apiFetchStats()),
}

export default dashboardService
