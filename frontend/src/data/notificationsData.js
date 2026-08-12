export const NOTIFICATION_CATEGORIES = [
  'All',
  'Events',
  'Registrations',
  'Certificates',
  'System',
]

import { Users, Award, Calendar, Megaphone } from 'lucide-react'

export function buildStatsDisplay(stats = {}, notifications = []) {
  const registrationsCount = (notifications || []).filter(n => n.type === 'registration' || n.type === 'bulk_registration').length
  const certificatesCount = (notifications || []).filter(n => n.type === 'certificate').length
  const eventsCount = (notifications || []).filter(n => n.type === 'event' || n.type === 'cancelled' || n.type === 'warning' || n.type === 'trending').length
  const systemCount = (notifications || []).filter(n => n.type === 'system').length

  return [
    { label: 'Registrations', value: (stats.registrations || registrationsCount || 0).toLocaleString(), icon: Users,      color: '#615FFF' },
    { label: 'Certificates',  value: (stats.certificates  || certificatesCount  || 0).toLocaleString(), icon: Award,      color: '#FE9A00' },
    { label: 'Events',        value: (stats.events        || eventsCount        || 0).toLocaleString(), icon: Calendar,   color: '#00BC7D' },
    { label: 'System Alerts', value: (stats.system        || systemCount        || 0).toLocaleString(), icon: Megaphone,  color: '#8E51FF' },
  ]
}
