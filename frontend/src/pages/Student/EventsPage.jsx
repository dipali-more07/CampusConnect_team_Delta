import React, { useState, useEffect } from 'react'
import { CalendarDays, Search, MapPin, Clock, Ticket, CheckCircle2, Users, User } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import studentService from '../../services/studentService'

export default function EventsPage({ tokens }) {
  const { accentColor } = useTheme()
  const showToast = useToast()
  const BRAND = accentColor || '#615FFF'

  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [eventsList, setEventsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    studentService.fetchEventsData().then(res => {
      if (cancelled) return
      if (res.success) {
        setEventsList(res.data)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const handleRegister = async (eventId) => {
    const res = await studentService.registerEvent(eventId)
    if (res.success) {
      showToast('Successfully registered for event!', 'success')
      setEventsList(prev => prev.map(e => e.id === eventId ? { ...e, registered: true, status: 'Registered' } : e))
    }
  }

  const filtered = eventsList.filter(e => {
    const matchesFilter = filter === 'All' ? true : filter === 'Registered' ? e.registered : !e.registered
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="p-6 flex flex-col gap-6">

      {/* Top Banner Card */}
      <div
        className="rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border shadow-sm"
        style={{
          background: tokens.dark ? '#0f1e30' : '#ffffff',
          borderColor: tokens.dark ? '#1a3050' : '#e2e8f0',
        }}
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2 bg-purple-500/10 text-purple-500">
            <CalendarDays size={14} /> Student Events
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white m-0">
            Campus Events & Registrations
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-[#7a98bb] mt-1 m-0">
            Discover upcoming fests, competitions, seminars, and manage your registrations.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#162640] border border-slate-200 dark:border-[#1a3050]">
          {['All', 'Registered', 'Upcoming'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all"
              style={{
                background: filter === tab ? BRAND : 'transparent',
                color: filter === tab ? '#ffffff' : (tokens.dark ? '#7a98bb' : '#64748b'),
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((event) => (
          <div
            key={event.id}
            className="rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
            style={{
              background: tokens.dark ? '#0f1e30' : '#ffffff',
              borderColor: tokens.dark ? '#1a3050' : '#e2e8f0',
              boxShadow: tokens.shadow,
            }}
          >
            <div>
              {/* Card Header: Category + Participation Mode + Status */}
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
                    {event.category}
                  </span>

                  {/* Mode Badge: Solo / Team / Both */}
                  {event.mode === 'Team' && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      <Users size={11} /> Team
                    </span>
                  )}
                  {event.mode === 'Solo' && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      <User size={11} /> Solo
                    </span>
                  )}
                  {(event.mode === 'Both' || event.mode === 'Solo / Team') && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Users size={11} /> Solo & Team
                    </span>
                  )}
                </div>

                {event.registered ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 shrink-0">
                    <CheckCircle2 size={13} /> Registered
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-500 shrink-0">
                    Registration Open
                  </span>
                )}
              </div>

              <h3 className="text-base font-extrabold text-slate-900 dark:text-white m-0 tracking-tight">
                {event.title}
              </h3>

              <div className="flex flex-col gap-2 mt-4 text-xs font-medium text-slate-500 dark:text-[#7a98bb]">
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-slate-400" /> {event.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" /> {event.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" /> {event.venue}
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-400" /> Type: <span className="font-bold text-slate-700 dark:text-slate-200">{event.mode === 'Both' ? 'Solo & Team Event' : `${event.mode || 'Solo'} Event`}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1a3050]">
              {event.registered ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-[#162640] text-slate-400 dark:text-[#4a6a8a] border-none cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={14} /> Already Registered
                </button>
              ) : (
                <button
                  onClick={() => handleRegister(event.id)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ background: BRAND }}
                >
                  <Ticket size={14} /> Register Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
