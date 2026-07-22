import React, { useState, useEffect } from 'react'
import {
  MapPin, Clock, ExternalLink,
  UserPlus, CheckSquare, Calendar, Award, Send, XCircle
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

export default function BottomRow({ dark }) {
  const [activities, setActivities] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])

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
      if (res.success && res.events && res.events.length > 0) {
        setUpcomingEvents(res.events)
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
          <button className="flex items-center gap-1 text-[12px] font-semibold bg-transparent border-none cursor-pointer" style={{ color: BRAND }}>
            View all <ExternalLink size={12} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map(ev => {
              const pct = ev.capacity > 0 ? Math.round((ev.registered / ev.capacity) * 100) : 0
              return (
                <div
                  key={ev.id}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-3.5 px-4 py-3.5 rounded-2xl border cursor-pointer transition-all duration-200"
                  style={{
                    borderColor: dark ? '#1a3050' : '#e2e8f0',
                    background: dark ? '#060e1c' : '#f8fafc',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = ev.color; e.currentTarget.style.boxShadow = `0 0 0 3px ${ev.color}25` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {/* Date badge */}
                  <div
                    className="min-w-[48px] h-[54px] rounded-xl flex flex-col items-center justify-center text-white shrink-0"
                    style={{ background: ev.color }}
                  >
                    <span className="text-[9px] font-bold tracking-widest opacity-90 uppercase">{ev.month}</span>
                    <span className="text-[20px] font-black leading-[1.1]">{ev.day}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-900 dark:text-[#e8f0fe] m-0 whitespace-nowrap overflow-hidden text-ellipsis">{ev.title}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-[#7a98bb]">
                        <MapPin size={10} /> {ev.venue}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-[#7a98bb]">
                        <Clock size={10} /> {ev.time}
                      </span>
                    </div>
                  </div>

                  {/* Count + progress */}
                  <div className="w-full sm:w-auto shrink-0 sm:min-w-[160px] flex items-center gap-3 mt-2 sm:mt-0 justify-between sm:justify-start pl-16 sm:pl-0">
                    <div className="text-right min-w-[70px]">
                      <p className="text-[13px] font-extrabold text-slate-900 dark:text-[#e8f0fe] m-0">
                        {ev.registered.toLocaleString()}
                        <span className="text-[11px] font-medium text-slate-400 dark:text-[#3d5470]">/{ev.capacity.toLocaleString()}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-[#3d5470] mt-0.5 font-medium">registered</p>
                    </div>
                    <div className="flex-1 min-w-[70px]">
                      <div className="h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-[#162640]">
                        <div
                          className="h-full rounded-full transition-[width] duration-500 ease-in-out"
                          style={{ width: `${pct}%`, background: ev.color }}
                        />
                      </div>
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
      <div
        className="bg-white dark:bg-[#0f1e30] rounded-2xl border border-slate-200 dark:border-[#1a3050] p-5 transition-all duration-300"
        style={{ boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <h2 className="text-[15px] font-extrabold text-slate-900 dark:text-[#e8f0fe] m-0 mb-4">Recent Activity</h2>

        <div className="flex flex-col">
          {activities.length > 0 ? (
            activities.map((act, idx) => {
              const { icon: Icon, color: iconColor } = resolveActivityIcon(act.type, act.text)
              const isLast = idx === activities.length - 1
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

    </div>
  )
}
