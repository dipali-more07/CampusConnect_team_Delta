import React, { useState, useEffect } from 'react'
import {
  MapPin, Clock, ExternalLink, Users,
  UserPlus, CheckSquare, Calendar, Award, Send, XCircle, ChevronLeft, ChevronRight
} from 'lucide-react'
import { UPCOMING_EVENTS, RECENT_ACTIVITY, BRAND } from '../../../data/dashboardData'
import analyticsService from '../../../services/analyticsService'
import eventsService from '../../../services/eventsService'

const resolveActivityIcon = (type, text) => {
  const t = (type || '').toLowerCase()
  const txt = (text || '').toLowerCase()

  if (t === 'registration' || txt.includes('register')) return { icon: UserPlus, color: '#4f46e5' }
  if (t === 'attendance' || txt.includes('attendance')) return { icon: CheckSquare, color: '#16a34a' }
  if (t === 'publish' || t === 'event' || txt.includes('publish') || txt.includes('event') || txt.includes('create')) return { icon: Calendar, color: '#0284c7' }
  if (t === 'certificate' || txt.includes('certificate')) return { icon: Award, color: '#d97706' }
  if (t === 'notification' || txt.includes('notification')) return { icon: Send, color: '#7c3aed' }
  if (t === 'cancel' || txt.includes('cancel')) return { icon: XCircle, color: '#ef4444' }

  return { icon: Calendar, color: '#615FFF' } // Default fallback
}

const formatTime = (ts) => {
  if (!ts) return ''
  try {
    const diffMs = new Date() - new Date(ts)
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    const diffHrs = Math.floor(diffMins / 60)
    if (diffHrs < 24) return `${diffHrs} hr ago`
    const diffDays = Math.floor(diffHrs / 24)
    if (diffDays === 1) return 'Yesterday'
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ts
  }
}

const formatTo12Hr = (timeStr) => {
  if (!timeStr) return ''
  if (/[a-zA-Z]/.test(timeStr)) return timeStr
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1].trim()
  if (Number.isNaN(hours)) return timeStr
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  return `${hours}:${minutes} ${ampm}`
}

export default function BottomRow({ dark }) {
  const [activities, setActivities] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    const loadActivities = async () => {
      const res = await analyticsService.fetchRecentActivity()
      if (res.success && res.activities && res.activities.length > 0) {
        const mapped = res.activities.map(act => ({
          id: act.activity_id || act.id || Math.random(),
          text: act.message || act.text || '',
          time: formatTime(act.timestamp || act.time),
          type: act.type || ''
        }))
        setActivities(mapped)
      } else {
        setActivities([])
      }
    }
    const loadUpcoming = async () => {
      const res = await eventsService.fetchUpcoming(3)
      if (res.success && Array.isArray(res.events) && res.events.length > 0) {
        const COLORS = ['#615FFF', '#0284c7', '#00BC7D', '#FE9A00', '#ef4444', '#a855f7']
        const mapped = res.events.map((ev, idx) => {
          let monthStr = 'AUG'
          let dayStr = '15'
          if (ev.date || ev.start_date) {
            try {
              const dObj = new Date(ev.date || ev.start_date)
              if (!isNaN(dObj.getTime())) {
                monthStr = dObj.toLocaleString('en-US', { month: 'short' }).toUpperCase()
                dayStr = String(dObj.getDate())
              }
            } catch { }
          }
          return {
            ...ev,
            title: ev.title || ev.name || ev.event_name || 'Event',
            color: ev.color || COLORS[idx % COLORS.length],
            month: ev.month || monthStr,
            day: ev.day || dayStr,
            registered: Number(ev.registered || ev.registrationsCount || ev.registrations_count || 0),
            capacity: Number(ev.capacity || 500),
          }
        })
        setUpcomingEvents(mapped)
      } else {
        setUpcomingEvents([])
      }
    }
    loadActivities()
    loadUpcoming()
  }, [])
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">

      {/* ── Upcoming Events ── */}
      <div
        className="lg:col-span-2 bg-white dark:bg-[#0f1e30] rounded-2xl border border-slate-200 dark:border-[#1a3050] p-5 transition-all duration-300"
        style={{ boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-extrabold text-slate-900 dark:text-[#e8f0fe] m-0">Upcoming Events</h2>
          <button type='button' className="flex items-center gap-1 text-[12px] font-semibold bg-transparent border-none cursor-pointer" style={{ color: BRAND }}>
            View all <ExternalLink size={12} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map(ev => {
              const pct = ev.capacity > 0 ? Math.round((ev.registered / ev.capacity) * 100) : 0
              const eventTitle = ev.title || ev.name || ev.event_name || 'Event'
              return (
                <div
                  key={ev.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    borderColor: dark ? '#1a3050' : '#e2e8f0',
                    background: dark ? '#060e1c' : '#f8fafc',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = ev.color || BRAND; e.currentTarget.style.boxShadow = `0 0 0 3px ${(ev.color || BRAND)}25` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {/* Event Details (Date + Title + Metadata) */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Date badge */}
                    <div
                      className="w-[46px] h-[52px] rounded-xl flex flex-col items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ background: ev.color || BRAND }}
                    >
                      <span className="text-[9px] font-bold tracking-widest opacity-90 uppercase">{ev.month}</span>
                      <span className="text-[19px] font-black leading-tight">{ev.day}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-bold text-slate-900 dark:text-[#e8f0fe] m-0 truncate" title={eventTitle}>
                        {eventTitle}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500 dark:text-[#7a98bb]">
                        {ev.venue && (
                          <span className="flex items-center gap-1 truncate max-w-[140px] sm:max-w-[120px]">
                            <MapPin size={11} className="shrink-0 text-slate-400" />
                            <span className="truncate">{ev.venue}</span>
                          </span>
                        )}
                        {ev.time && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Clock size={11} className="shrink-0 text-slate-400" />
                            <span>{formatTo12Hr(ev.time)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Count + Progress Bar */}
                  <div className="w-full sm:w-44 lg:w-48 shrink-0 flex flex-col justify-center pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800/80">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-[#7a98bb] flex items-center gap-1 sm:hidden">
                        <Users size={11} className="text-slate-400" />
                        <span>Registered</span>
                      </span>
                      <p className="text-[12px] sm:text-[13px] font-extrabold text-slate-900 dark:text-[#e8f0fe] m-0 ml-auto text-right">
                        {ev.registered.toLocaleString()}
                        <span className="text-[11px] font-medium text-slate-400 dark:text-[#3d5470]">/{ev.capacity.toLocaleString()}</span>
                        
                      </p>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-[#162640]">
                      <div
                        className="h-full rounded-full transition-[width] duration-500 ease-in-out"
                        style={{ width: `${Math.min(pct, 100)}%`, background: ev.color || BRAND }}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-10 text-[13px] font-medium text-slate-400 dark:text-[#7a98bb]">
              No upcoming events found
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      {(() => {
        const totalPages = Math.ceil(activities.length / itemsPerPage) || 1
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedActivities = activities.slice(startIndex, endIndex)

        return (
          <div
            className="bg-white dark:bg-[#0f1e30] rounded-2xl border border-slate-200 dark:border-[#1a3050] p-5 transition-all duration-300 flex flex-col justify-between"
            style={{ boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-extrabold text-slate-900 dark:text-[#e8f0fe] m-0">Recent Activity</h2>
                {activities.length > 0 && (
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    {activities.length} total
                  </span>
                )}
              </div>

              <div className="flex flex-col min-h-[300px]">
                {paginatedActivities.length > 0 ? (
                  paginatedActivities.map((act, idx) => {
                    const { icon: Icon, color: iconColor } = resolveActivityIcon(act.type, act.text)
                    const isLast = idx === paginatedActivities.length - 1
                    return (
                      <div key={act.id || idx} className="flex gap-3">
                        <div className="flex flex-col items-center shrink-0">
                          <div
                            className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0"
                            style={{
                              background: `${iconColor}20`,
                              border: `1.5px solid ${iconColor}50`,
                            }}
                          >
                            <Icon size={14} style={{ color: iconColor }} />
                          </div>
                          {!isLast && (
                            <div className="w-0.5 flex-1 min-h-[10px] my-1 rounded-full bg-slate-200 dark:bg-[#162640]" />
                          )}
                        </div>

                        <div className={`flex-1 min-w-0 pt-1 ${isLast ? '' : 'pb-4'}`}>
                          <p className="text-[12px] text-slate-800 dark:text-[#c8daf0] font-medium m-0 leading-relaxed">{act.text}</p>
                          <p className="text-[10.5px] text-slate-400 dark:text-[#3d5470] mt-1 font-medium">{act.time}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-10 text-[13px] font-medium text-slate-400 dark:text-[#7a98bb]">
                    No recent activities found
                  </div>
                )}
              </div>
            </div>

            {/* Pagination Controls */}
            {activities.length > itemsPerPage && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 dark:border-[#1a3050]">
                <span className="text-[11.5px] font-semibold text-slate-400 dark:text-[#7a98bb]">
                  {startIndex + 1}-{Math.min(endIndex, activities.length)} of {activities.length}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type='button'
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 dark:border-[#1a3050] text-slate-600 dark:text-[#7a98bb] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#162640] transition-colors cursor-pointer"
                    title="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      type='button'
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-[11.5px] font-extrabold transition-colors cursor-pointer ${currentPage === page
                          ? 'bg-[#615FFF] text-white shadow-xs'
                          : 'text-slate-600 dark:text-[#7a98bb] hover:bg-slate-100 dark:hover:bg-[#162640]'
                        }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type='button'
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 dark:border-[#1a3050] text-slate-600 dark:text-[#7a98bb] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#162640] transition-colors cursor-pointer"
                    title="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })()}

    </div>
  )
}
