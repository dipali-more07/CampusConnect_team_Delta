import {
  LayoutDashboard, Award,
  ChartColumn, Bell, Settings,
  GraduationCap, Building2, CalendarDays, SquareCheckBig,
  UserPlus, CheckSquare, Calendar,
  SendHorizonal, XCircle, Trophy,
} from 'lucide-react'

export const BRAND = '#615FFF'

export const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: CalendarDays,    label: 'Events' },
  { icon: Trophy,          label: 'Results' },
  { icon: SquareCheckBig,  label: 'Attendance' },
  { icon: ChartColumn,     label: 'Analytics' },
  { icon: Award,           label: 'Certificates' },
  { icon: GraduationCap,   label: 'Students' },
  { icon: Building2,       label: 'Organizers' },
  { icon: Bell,            label: 'Notifications', badge: 2 },
  { icon: Settings,        label: 'Settings' },
]


export const CHART_DATA = [
  { month: 'Jan', registrations: 280, attendance: 60 },
  { month: 'Feb', registrations: 420, attendance: 65 },
  { month: 'Mar', registrations: 510, attendance: 70 },
  { month: 'Apr', registrations: 390, attendance: 62 },
  { month: 'May', registrations: 640, attendance: 75 },
  { month: 'Jun', registrations: 720, attendance: 80 },
  { month: 'Jul', registrations: 850, attendance: 88 },
  { month: 'Aug', registrations: 780, attendance: 85 },
]

export const DEPT_DATA = [
  { name: 'CSE',   value: 35, color: '#4f46e5' },
  { name: 'ME',    value: 15, color: '#16a34a' },
  { name: 'MBA',   value: 10, color: '#e11d48' },
  { name: 'ECE',   value: 22, color: '#0284c7' },
  { name: 'EEE',   value: 12, color: '#d97706' },
  { name: 'Civil', value: 6,  color: '#7c3aed' },
]

export const UPCOMING_EVENTS = [
  { id: 1, month: 'AUG', day: '15', title: 'TechFest 2025',        venue: 'Main Auditorium',    time: '09:00', registered: 425, capacity: 500,  color: '#615FFF' },
  { id: 2, month: 'JUL', day: '22', title: 'Annual Cultural Fest',  venue: 'Open Air Theatre',   time: '18:00', registered: 876, capacity: 1000, color: '#615FFF' },
  { id: 3, month: 'SEP', day: '5',  title: 'Sports Meet 2025',      venue: 'University Grounds', time: '07:00', registered: 612, capacity: 800,  color: '#615FFF' },
]

export const RECENT_ACTIVITY = [
  { id: 1, icon: UserPlus,      text: 'Arjun Patel registered for TechFest 2025',          time: '2 min ago',  iconColor: '#4f46e5' },
  { id: 2, icon: CheckSquare,   text: 'Attendance marked for National Hackathon (198/200)', time: '15 min ago', iconColor: '#16a34a' },
  { id: 3, icon: Calendar,      text: 'Sports Meet 2025 published by Dr. Kavitha Reddy',    time: '1 hr ago',   iconColor: '#0284c7' },
  { id: 4, icon: Award,         text: '143 certificates generated for Research Symposium',  time: '3 hr ago',   iconColor: '#d97706' },
  { id: 5, icon: SendHorizonal, text: 'Bulk notification sent to 1,200 students',           time: '5 hr ago',   iconColor: '#7c3aed' },
  { id: 6, icon: XCircle,       text: 'Entrepreneurship Bootcamp cancelled',                time: 'Yesterday',  iconColor: '#ef4444' },
]
