export const NOTIFICATION_CATEGORIES = [
  'All',
  'Events',
  'Registrations',
  'Attendance',
  'Certificates',
  'System',
]

import { Mail, MessageSquare, Bell, Globe } from 'lucide-react'

export function buildStatsDisplay(stats = {}) {
  return [
    { label: 'Email',         value: (stats.email         ?? 0).toLocaleString(), icon: Mail,           color: '#615FFF' },
    { label: 'SMS',           value: (stats.sms           ?? 0).toLocaleString(), icon: MessageSquare,  color: '#00BC7D' },
    { label: 'Push',          value: (stats.push          ?? 0).toLocaleString(), icon: Bell,           color: '#FE9A00' },
    { label: 'Announcements', value: (stats.announcements ?? 0).toLocaleString(), icon: Globe,          color: '#8E51FF' },
  ]
}
