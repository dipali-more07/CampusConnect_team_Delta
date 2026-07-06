import {
  CalendarDays,
  GraduationCap,
  ClipboardList,
  SquareCheckBig,
  Star,
  Award,
} from 'lucide-react'

const USE_MOCK = import.meta.env.VITE_USE_MOCK 
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

/* ── API IMPLEMENTATIONS ── */
async function mockFetchStats() {
  await new Promise(r => setTimeout(r, 300))
  return { success: true, stats: MOCK_STATS }
}

async function apiFetchStats() {
  try {
    const res = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
    })
    const data = await res.json()
    if (!res.ok) return { success: false, stats: [] }
    return { success: true, stats: data }
  } catch {
    return { success: false, stats: [], message: 'Server unreachable.' }
  }
}

/* ── PUBLIC SERVICE API ── */
const dashboardService = {
  fetchStats: () => (USE_MOCK ? mockFetchStats() : apiFetchStats()),
}

export default dashboardService
