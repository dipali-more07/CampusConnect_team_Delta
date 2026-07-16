import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, MapPin, Clock, Ticket, CheckCircle2, Users, User, Eye, X, IndianRupee } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import studentService from '../../services/studentService'
import RegistrationModal from '../../components/student/RegistrationModal'

export default function EventsPage({ tokens }) {
  const { accentColor } = useTheme()
  const showToast = useToast()
  const BRAND = accentColor || '#615FFF'

  const [filter, setFilter] = useState('All')
  const [eventsList, setEventsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [viewingEvent, setViewingEvent] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    studentService.fetchEventsData().then(res => {
      if (cancelled) return
      if (res.success) setEventsList(res.data)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const handleRegisterClick = (event) => {
    if (event.registered) return
    setSelectedEvent(event)
  }

  const handleRegistrationSuccess = (eventId) => {
    setEventsList(prev => prev.map(e => e.id === eventId ? { ...e, registered: true, status: 'Registered' } : e))
    showToast('Successfully registered for event! 🎉', 'success')
    setSelectedEvent(null)
  }

  const filtered = eventsList.filter(e => {
    if (filter === 'Registered') return e.registered
    if (filter === 'Upcoming') return !e.registered
    return true
  })

  return (
    <div className="p-6 flex flex-col gap-6">

      {/* Top Banner */}
      <div
        className="rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border shadow-sm"
        style={{ background: tokens.dark ? '#0f1e30' : '#ffffff', borderColor: tokens.dark ? '#1a3050' : '#e2e8f0' }}
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2 bg-purple-500/10 text-purple-500">
            <CalendarDays size={14} /> Student Events
          </div>
          <h2 className="text-2xl font-black m-0" style={{ color: tokens.txtPri }}>Campus Events &amp; Registrations</h2>
          <p className="text-xs font-medium mt-1 m-0" style={{ color: tokens.txtSec }}>
            Discover upcoming fests, competitions, seminars, and manage your registrations.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-xl border" style={{ background: tokens.dark ? '#162640' : '#f1f5f9', borderColor: tokens.border }}>
          {['All', 'Registered', 'Upcoming'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all"
              style={{ background: filter === tab ? BRAND : 'transparent', color: filter === tab ? '#fff' : tokens.txtSec }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm font-semibold" style={{ color: tokens.txtMuted }}>Loading events…</div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-sm font-semibold" style={{ color: tokens.txtMuted }}>No events found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(event => (
            <div
              key={event.id}
              className="rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
              style={{ background: tokens.card, borderColor: tokens.border, boxShadow: tokens.shadow }}
            >
              <div>
                {/* Badges row */}
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
                      {event.category}
                    </span>
                    {event.mode === 'Team' && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">
                        <Users size={11} /> Team
                      </span>
                    )}
                    {event.mode === 'Solo' && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-500 border border-sky-500/20">
                        <User size={11} /> Solo
                      </span>
                    )}
                    {(event.mode === 'Both' || event.mode === 'Solo / Team') && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Users size={11} /> Solo &amp; Team
                      </span>
                    )}
                    {event.fees > 0 && (
                      <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        ₹{event.fees}
                      </span>
                    )}
                  </div>

                  {event.registered ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 shrink-0">
                      <CheckCircle2 size={13} /> Registered
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-500 shrink-0">Registration Open</span>
                  )}
                </div>

                <h3 className="text-base font-extrabold m-0 tracking-tight" style={{ color: tokens.txtPri }}>{event.title}</h3>

                <div className="flex flex-col gap-2 mt-4 text-xs font-medium" style={{ color: tokens.txtSec }}>
                  <div className="flex items-center gap-2"><CalendarDays size={14} /> {event.date}</div>
                  <div className="flex items-center gap-2"><Clock size={14} /> {event.time}</div>
                  <div className="flex items-center gap-2"><MapPin size={14} /> {event.venue}</div>
                  <div className="flex items-center gap-2">
                    <Users size={14} />
                    Type: <span className="font-bold" style={{ color: tokens.txtPri }}>
                      {event.mode === 'Both' ? 'Solo & Team Event' : `${event.mode || 'Solo'} Event`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 mt-6 pt-4 border-t" style={{ borderColor: tokens.border }}>
                <button
                  onClick={() => setViewingEvent(event)}
                  className="px-3 py-2.5 rounded-xl border cursor-pointer flex items-center justify-center transition-all"
                  style={{
                    borderColor: tokens.border,
                    color: tokens.txtSec,
                    background: 'transparent',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = BRAND
                    e.currentTarget.style.color = BRAND
                    e.currentTarget.style.background = tokens.dark ? '#162640' : '#f8fafc'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = tokens.border
                    e.currentTarget.style.color = tokens.txtSec
                    e.currentTarget.style.background = 'transparent'
                  }}
                  title="View Event Details"
                >
                  <Eye size={15} />
                </button>

                {event.registered ? (
                  <button
                    disabled
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs border-none cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: tokens.hoverBg, color: tokens.txtMuted }}
                  >
                    <CheckCircle2 size={14} /> Already Registered
                  </button>
                ) : (
                  <button
                    onClick={() => handleRegisterClick(event)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:-translate-y-px"
                    style={{ background: BRAND, boxShadow: `0 4px 14px ${BRAND}40` }}
                  >
                    <Ticket size={14} /> Register Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registration Modal */}
      {selectedEvent && (
        <RegistrationModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSuccess={handleRegistrationSuccess}
        />
      )}

      {/* Event Details Modal */}
      {viewingEvent && (
        <EventDetailModal
          event={viewingEvent}
          onClose={() => setViewingEvent(null)}
          tokens={tokens}
          BRAND={BRAND}
          onRegisterClick={handleRegisterClick}
        />
      )}
    </div>
  )
}

function EventDetailModal({ event, onClose, tokens, BRAND, onRegisterClick }) {
  const card = tokens.dark ? '#0c1829' : '#ffffff'
  const border = tokens.dark ? '#1a3050' : '#e2e8f0'
  const txt = tokens.dark ? '#e8f0fe' : '#0f172a'
  const txtSec = tokens.dark ? '#7a98bb' : '#64748b'
  const bgHeader = tokens.dark ? '#162640' : '#f8fafc'

  const formatDeadline = (deadlineStr) => {
    if (!deadlineStr) return 'No Deadline'
    try {
      const d = new Date(deadlineStr)
      if (!isNaN(d.getTime())) {
        const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        return `${datePart} · ${timePart}`
      }
    } catch (err) {
      // ignore
    }
    return deadlineStr.replace('T', ' ').substring(0, 16)
  }

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center px-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col transition-all"
        style={{ background: card, border: `1px solid ${border}`, animation: 'detailModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        <style>{`
          @keyframes detailModalIn {
            from { opacity: 0; transform: scale(0.94) translateY(16px); }
            to   { opacity: 1; transform: scale(1)    translateY(0); }
          }
        `}</style>

        {/* Banner Image */}
        <div className="relative w-full h-48 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
          {event.banner ? (
            <img
              src={event.banner}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center text-white font-bold text-lg"
              style={{ background: `linear-gradient(135deg, ${BRAND}, #8b5cf6)` }}
            >
              <CalendarDays size={48} className="mb-2 opacity-80" />
              <span className="text-[13px] font-black uppercase tracking-wider">{event.category} Event</span>
            </div>
          )}
          
          {/* Close Button on Banner */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full border-none bg-black/40 text-white cursor-pointer flex items-center justify-center backdrop-blur-sm transition-all hover:bg-black/60"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                style={{ background: `${BRAND}18`, color: BRAND }}
              >
                {event.category}
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                  event.mode === 'Team' ? 'bg-purple-500/10 text-purple-500' : event.mode === 'Solo' ? 'bg-sky-500/10 text-sky-500' : 'bg-amber-500/10 text-amber-500'
                }`}
              >
                {event.mode === 'Both' ? 'Solo & Team' : event.mode} Event
              </span>
            </div>
            <h2 className="text-xl font-black mt-1.5 mb-1" style={{ color: txt }}>{event.title}</h2>
            {event.organizer && (
              <p className="text-[11.5px] font-medium m-0 flex items-center gap-1" style={{ color: txtSec }}>
                Organized by: <strong style={{ color: txt }}>{event.organizer}</strong>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-[11px] font-black uppercase tracking-wider m-0" style={{ color: txtSec }}>About Event</h4>
            <p className="text-[13px] leading-relaxed m-0 text-justify" style={{ color: tokens.dark ? '#cbd5e1' : '#475569' }}>
              {event.description || 'No detailed description available for this event.'}
            </p>
          </div>

          {/* Registration Deadline Warning */}
          {event.registrationDeadline && (
            <div className="text-[11.5px] font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-2"
              style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.18)' }}>
              <Clock size={14} className="shrink-0 animate-pulse" />
              <span>Registration Deadline: <strong className="ml-1">{formatDeadline(event.registrationDeadline)}</strong></span>
            </div>
          )}

          {/* Event Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl border" style={{ background: bgHeader, borderColor: border }}>
            <div className="flex items-start gap-2.5">
              <CalendarDays size={16} className="mt-0.5 shrink-0" style={{ color: BRAND }} />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: txtSec }}>Date</div>
                <div className="text-[12px] font-black mt-0.5" style={{ color: txt }}>{event.date}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2.5">
              <Clock size={16} className="mt-0.5 shrink-0" style={{ color: BRAND }} />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: txtSec }}>Time</div>
                <div className="text-[12px] font-black mt-0.5" style={{ color: txt }}>{event.time}</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: BRAND }} />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: txtSec }}>Venue & Mode</div>
                <div className="text-[12px] font-black mt-0.5" style={{ color: txt }}>
                  {event.venue} <span className="text-[10px] font-bold opacity-60 uppercase">({event.eventType})</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <IndianRupee size={16} className="mt-0.5 shrink-0" style={{ color: BRAND }} />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: txtSec }}>Entry Fees</div>
                <div className="text-[12px] font-black mt-0.5" style={{ color: txt }}>
                  {event.fees > 0 ? `₹${event.fees}` : 'Free Entry'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 col-span-2 border-t pt-3" style={{ borderColor: border }}>
              <Users size={16} className="mt-0.5 shrink-0" style={{ color: BRAND }} />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: txtSec }}>Max Capacity</div>
                <div className="text-[12px] font-black mt-0.5" style={{ color: txt }}>
                  Max {event.capacity} participants allowed
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs border cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{ background: 'transparent', color: txtSec, borderColor: border }}
            >
              Close
            </button>
            {event.registered ? (
              <button
                disabled
                className="flex-1 py-2.5 rounded-xl font-bold text-xs border-none cursor-not-allowed flex items-center justify-center gap-1.5"
                style={{ background: tokens.hoverBg, color: tokens.txtMuted }}
              >
                <CheckCircle2 size={13} /> Already Registered
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose()
                  onRegisterClick(event)
                }}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:opacity-90 hover:-translate-y-px"
                style={{ background: BRAND, boxShadow: `0 4px 14px ${BRAND}40` }}
              >
                <Ticket size={13} /> Register Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
