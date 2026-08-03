import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, MapPin, Clock, Ticket, CheckCircle2, Users, User, Eye, X, IndianRupee, CreditCard, XCircle, Loader2, Trash2, Star, AlertTriangle } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import studentService from '../../services/studentService'
import RegistrationModal from '../../components/student/RegistrationModal'
import { processRazorpayPayment } from '../../utils/paymentUtils'

export default function EventsPage({ tokens: inputTokens }) {
  const { accentColor, isDarkMode } = useTheme()
  const showToast = useToast()
  const BRAND = accentColor || '#615FFF'

  const isDark = inputTokens?.dark ?? isDarkMode ?? false
  const tokens = {
    dark: isDark,
    card: inputTokens?.card || (isDark ? '#0c1829' : '#ffffff'),
    border: inputTokens?.border || (isDark ? '#1a3050' : '#e2e8f0'),
    txtPri: inputTokens?.txtPri || (isDark ? '#e8f0fe' : '#0f172a'),
    txtSec: inputTokens?.txtSec || (isDark ? '#7a98bb' : '#64748b'),
    txtMuted: inputTokens?.txtMuted || (isDark ? '#475569' : '#94a3b8'),
    hoverBg: inputTokens?.hoverBg || (isDark ? '#162640' : '#f8fafc'),
    shadow: inputTokens?.shadow || (isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)')
  }

  const [filter, setFilter] = useState('All')
  const [eventsList, setEventsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [viewingEvent, setViewingEvent] = useState(null)
  const [payingEventId, setPayingEventId] = useState(null)
  const [feedbackEvent, setFeedbackEvent] = useState(null)
  const [cancelConfirmEvent, setCancelConfirmEvent] = useState(null)
  const [cancellingEventId, setCancellingEventId] = useState(null)
  // Event Full popup
  const [eventFullPopup, setEventFullPopup] = useState(null)
  // Set of event IDs where this student has marked attendance (present)
  const [attendedEventIds, setAttendedEventIds] = useState(new Set())
  // Set of event IDs for which this student has already submitted feedback
  const [feedbackedEventIds, setFeedbackedEventIds] = useState(new Set())

  useEffect(() => {
    let cancelled = false
    studentService.fetchEventsData().then(res => {
      if (cancelled) return
      if (res.success) setEventsList(res.data)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  // Fetch attendance records to know which events the student actually attended
  useEffect(() => {
    let cancelled = false
    studentService.fetchAttendanceData().then(res => {
      if (cancelled) return
      if (res.success && res.data) {
        const records = res.data.records || []
        const ids = new Set()
        records.forEach(r => {
          const status = String(r.attendance_status || r.status || '').toLowerCase()
          // Only count 'present' or 'attended' — not 'absent' or 'pending'
          if (status === 'present' || status === 'attended' || status === 'checked_in') {
            const eid = String(r.event_id || r.eventId || r.event?.id || r.event?.event_id || '')
            if (eid) ids.add(eid)
          }
        })
        setAttendedEventIds(ids)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Fetch my feedbacks to know which events already have feedback submitted
  useEffect(() => {
    let cancelled = false
    studentService.fetchMyFeedbacks().then(res => {
      if (cancelled) return
      if (res.success && Array.isArray(res.data)) {
        const ids = new Set()
        res.data.forEach(f => {
          const eid = String(f.event_id || f.eventId || f.event?.id || '')
          if (eid) ids.add(eid)
        })
        setFeedbackedEventIds(ids)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Returns true only if student has marked attendance for this event
  const hasAttendance = (event) => attendedEventIds.has(String(event.id))

  // Returns true if student has already submitted feedback for this event
  const hasFeedback = (event) => feedbackedEventIds.has(String(event.id))

  const handleFeedbackChange = (eventId, submitted) => {
    setFeedbackedEventIds(prev => {
      const next = new Set(prev)
      if (submitted) next.add(String(eventId))
      else next.delete(String(eventId))
      return next
    })
  }

  const getEventStartDate = (ev) => {
    if (!ev.date) return null
    let dateTimeStr = ev.date
    if (ev.time) {
      dateTimeStr += ` ${ev.time}`
    }
    const d = new Date(dateTimeStr)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const getRegDeadlineDate = (ev) => {
    const dl = ev.registration_deadline || ev.registrationDeadline || ev.deadline || ev.registration_end
    if (dl) {
      const d = new Date(dl)
      if (!isNaN(d.getTime())) return d
    }
    return getEventStartDate(ev)
  }

  const getEventEndDate = (ev) => {
    const end = ev.end_datetime || ev.endDateTime
    if (end) {
      const d = new Date(end)
      if (!isNaN(d.getTime())) return d
    }
    const start = getEventStartDate(ev)
    if (start) {
      return new Date(start.getTime() + 3 * 60 * 60 * 1000)
    }
    return null
  }

  const formatSingleTime = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) return null
    return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const getFormattedEventTimeRange = (ev) => {
    if (!ev) return 'TBD'
    const startD = getEventStartDate(ev)
    const endD = getEventEndDate(ev)

    const startTimeStr = formatSingleTime(startD)
    const endTimeStr = formatSingleTime(endD)

    if (startTimeStr && endTimeStr) {
      return `${startTimeStr} - ${endTimeStr}`
    } else if (startTimeStr) {
      return startTimeStr
    } else if (ev.time) {
      if (ev.time.includes('-')) return ev.time
      return ev.time
    }

    return 'TBD'
  }

  const isEventFinished = (ev) => {
    const end = getEventEndDate(ev)
    if (!end) return false
    const now = new Date()
    return now >= end
  }

  const isEventOngoing = (ev) => {
    const start = getEventStartDate(ev)
    if (!start) return false
    const end = getEventEndDate(ev)
    const now = new Date()
    return now >= start && (!end || now < end)
  }

  const isDeadlinePassed = (ev) => {
    const dl = getRegDeadlineDate(ev)
    if (!dl) return false
    const now = new Date()
    return dl < now
  }

  const hasPendingPayment = (event) => {
    if (!event.registered || !event.fees || event.fees <= 0) return false

    const st = String(event.paymentStatus || event.payment_status || '').toLowerCase()
    if (st.includes('succ') || st.includes('comp') || st.includes('paid')) {
      return false
    }

    try {
      const storedPending = JSON.parse(sessionStorage.getItem('cc_student_pending_payments') || '[]')
      const match = storedPending.find(p => (String(p.event_id) === String(event.id) || String(p.eventId) === String(event.id) || String(p.id) === String(event.id)))
      if (match) {
        const mSt = String(match.payment_status || match.status || '').toLowerCase()
        if (mSt.includes('succ') || mSt.includes('comp') || mSt.includes('paid')) {
          return false
        }
        return mSt.includes('pend')
      }
    } catch (e) {}

    return true
  }

  const handleEventPayNow = async (event) => {
    if (isDeadlinePassed(event)) {
      showToast('Registration deadline has passed for this event.', 'error')
      return
    }

    setPayingEventId(event.id)
    try {
      // 1. Fetch real backend registration ID for this event
      let regId = null
      try {
        const myRegsRes = await studentService.fetchMyRegistrations()
        if (myRegsRes.success && Array.isArray(myRegsRes.data)) {
          const found = myRegsRes.data.find(r => 
            String(r.event_id || r.eventId || r.event?.id) === String(event.id)
          )
          if (found) {
            regId = found.id || found.registration_id || found.registrationId
          }
        }
      } catch (_e) {}

      // 2. Fallback to local storage if not found in backend
      if (!regId) {
        try {
          const storedPending = JSON.parse(sessionStorage.getItem('cc_student_pending_payments') || '[]')
          const match = storedPending.find(p => (p.event_id === event.id || p.eventId === event.id || String(p.id) === String(event.id)))
          regId = match?.registrationId || match?.id || match?.registration_id
        } catch (_e) {}
      }

      // 3. Initiate payment via backend
      let res = await studentService.initiatePayment({
        registration_id: regId || event.id,
        payment_gateway: 'razorpay',
        payment_method: 'upi'
      })

      // If registration ID was not found or stale, auto-register first and retry
      if (!res.success) {
        const regAttempt = await studentService.registerEvent(event.id, { registration_type: 'individual' })
        if (regAttempt.success) {
          const newRegId = regAttempt.data?.id || regAttempt.data?.registration_id || regAttempt.data?.registrationId
          if (newRegId) {
            res = await studentService.initiatePayment({
              registration_id: newRegId,
              payment_gateway: 'razorpay',
              payment_method: 'upi'
            })
          }
        }
      }

      if (!res.success) {
        showToast(res.message || 'Payment initiation failed.', 'error')
        return
      }

      const { payment_id, transaction_id, amount } = res.data || {}

      await processRazorpayPayment({
        payment_id,
        transaction_id,
        amount: amount || event.fees,
        eventTitle: event.title,
        onSuccess: () => {
          showToast('Payment completed successfully! 🎉', 'success')
          try {
            const stored = JSON.parse(sessionStorage.getItem('cc_student_pending_payments') || '[]')
            const updated = stored.map(p => (String(p.event_id) === String(event.id) || String(p.eventId) === String(event.id)) ? { ...p, payment_status: 'Success', status: 'Success' } : p)
            sessionStorage.setItem('cc_student_pending_payments', JSON.stringify(updated))
          } catch (e) {}
          setEventsList(prev => prev.map(e => String(e.id) === String(event.id) ? { ...e, paymentStatus: 'Success', payment_status: 'Success' } : e))
        },
        onError: (errMsg) => {
          showToast(errMsg || 'Payment failed.', 'error')
        }
      })
    } catch (err) {
      showToast('Payment processing error', 'error')
    } finally {
      setPayingEventId(null)
    }
  }

  const [initialRegType, setInitialRegType] = useState('individual')

  // ── Check if event has reached capacity ──
  const isEventFull = (event) => {
    const capacity = Number(event.capacity || event.max_capacity || event.max_participants || 0)
    if (!capacity) return false // no limit set
    const filled = Number(
      event.current_participants ??
      event.registrations_count ??
      event.registered_count ??
      event.participants_count ??
      0
    )
    return filled >= capacity
  }

  const handleRegisterClick = (event, type = 'individual') => {
    if (isDeadlinePassed(event)) return
    if (isEventFull(event)) {
      setEventFullPopup(event)
      return
    }
    setSelectedEvent(event)
    setInitialRegType(type)
  }

  const handleRegistrationSuccess = (eventId) => {
    setEventsList(prev => prev.map(e => String(e.id) === String(eventId) ? { ...e, registered: true, status: 'Registered' } : e))
    showToast('Successfully registered for event! 🎉', 'success')
    setSelectedEvent(null)
    setInitialRegType('individual')
  }

  const handleCancelRegistration = async (event) => {
    // ── Optimistic update: change UI immediately before API call ──
    const markUnregistered = (list) =>
      list.map(e =>
        String(e.id) === String(event.id)
          ? { ...e, registered: false, status: 'Open', paymentStatus: null, payment_status: null }
          : e
      )
    const markRegistered = (list) =>
      list.map(e =>
        String(e.id) === String(event.id)
          ? { ...e, registered: true, status: 'Registered' }
          : e
      )

    // Close modal & update UI immediately (don't wait for API)
    setCancelConfirmEvent(null)
    setCancellingEventId(event.id)
    setEventsList(prev => markUnregistered(prev))

    const isPaid = Number(event.fees || event.fee || event.price || 0) > 0 || String(event.paymentStatus || event.payment_status || '').toLowerCase() === 'paid'

    try {
      const res = await studentService.cancelEventRegistration(event.id)
      if (res.success) {
        if (isPaid) {
          showToast('Registration cancelled! Payment refund will be processed soon.', 'success')
        } else {
          showToast('Registration cancelled successfully!', 'success')
        }
      } else {
        // Revert if API failed
        setEventsList(prev => markRegistered(prev))
        showToast(res.message || 'Failed to cancel registration.', 'error')
      }
    } catch (err) {
      // Revert on network error
      setEventsList(prev => markRegistered(prev))
      showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setCancellingEventId(null)
    }
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
                <CountdownTimer event={event} tokens={tokens} />
                
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
                    hasPendingPayment(event) ? (
                      String(event.paymentStatus || event.payment_status || '').toLowerCase().includes('fail') ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 shrink-0">
                          <XCircle size={13} /> Payment Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 shrink-0">
                          <Clock size={13} /> Payment Pending
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 shrink-0">
                        <CheckCircle2 size={13} /> Registered
                      </span>
                    )
                  ) : isEventFinished(event) ? (
                    <span className="text-[11px] font-bold text-slate-500 shrink-0">Completed</span>
                  ) : isEventOngoing(event) ? (
                    <span className="text-[11px] font-bold text-blue-500 shrink-0">Ongoing</span>
                  ) : isDeadlinePassed(event) ? (
                    <span className="text-[11px] font-bold text-red-500 shrink-0">Registration Closed</span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-500 shrink-0">Registration Open</span>
                  )}
                </div>

                <h3 className="text-base font-extrabold m-0 tracking-tight" style={{ color: tokens.txtPri }}>{event.title}</h3>

                <div className="flex flex-col gap-2 mt-4 text-xs font-medium" style={{ color: tokens.txtSec }}>
                  <div className="flex items-center gap-2"><CalendarDays size={14} /> {event.date}</div>
                  <div className="flex items-center gap-2"><Clock size={14} /> {getFormattedEventTimeRange(event)}</div>
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

                {isEventFinished(event) ? (
                  hasAttendance(event) ? (
                    hasFeedback(event) ? (
                      <button
                        onClick={() => setFeedbackEvent(event)}
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:-translate-y-px"
                        style={{ background: tokens.dark ? '#162640' : '#f1f5f9', color: BRAND, border: `1px solid ${BRAND}40` }}
                      >
                        <Star size={14} /> See Feedback
                      </button>
                    ) : (
                      <button
                        onClick={() => setFeedbackEvent(event)}
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:-translate-y-px shadow-md"
                        style={{ background: BRAND, boxShadow: `0 4px 14px ${BRAND}40` }}
                      >
                        <Star size={14} /> Give Feedback
                      </button>
                    )
                  ) : (
                    <button
                      disabled
                      className="flex-1 py-2.5 rounded-xl font-bold text-xs border-none cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ background: tokens.hoverBg, color: tokens.txtMuted }}
                      title="You must attend the event to give feedback"
                    >
                      <XCircle size={14} /> Not Attended
                    </button>
                  )
                ) : isDeadlinePassed(event) ? (
                  <button
                    disabled
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs border-none cursor-not-allowed flex items-center justify-center gap-2 bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400"
                  >
                    <XCircle size={14} /> Registration Closed
                  </button>
                ) : event.registered ? (
                  hasPendingPayment(event) ? (
                    <button
                      onClick={() => handleEventPayNow(event)}
                      disabled={payingEventId === event.id}
                      className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:-translate-y-px shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: BRAND }}
                    >
                      {payingEventId === event.id ? (
                        <><Loader2 size={14} className="animate-spin" /> Processing...</>
                      ) : (
                        <><CreditCard size={14} /> Pay Now (₹{event.fees})</>
                      )}
                    </button>
                  ) : (
                    <div className="flex-1 flex items-center gap-2">
                      {(event.mode === 'Both' || event.mode === 'Solo / Team' || (event.mode || '').toLowerCase().includes('both') || (event.mode || '').toLowerCase().includes('team')) && (
                        <button
                          onClick={() => handleRegisterClick(event, 'team')}
                          className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:opacity-90 shadow-md"
                          style={{ background: BRAND, boxShadow: `0 4px 14px ${BRAND}40` }}
                        >
                          <Users size={14} /> Register Team
                        </button>
                      )}
                      <button
                        onClick={() => setCancelConfirmEvent(event)}
                        disabled={cancellingEventId === event.id}
                        className={`${(event.mode === 'Both' || event.mode === 'Solo / Team' || (event.mode || '').toLowerCase().includes('both') || (event.mode || '').toLowerCase().includes('team')) ? 'px-3' : 'flex-1'} py-2.5 rounded-xl font-bold text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                        title="Cancel Registration"
                      >
                        {cancellingEventId === event.id ? (
                          <><Loader2 size={14} className="animate-spin" /></>
                        ) : (
                          <><XCircle size={14} /> <span className={(event.mode === 'Both' || event.mode === 'Solo / Team' || (event.mode || '').toLowerCase().includes('both') || (event.mode || '').toLowerCase().includes('team')) ? 'hidden sm:inline' : ''}>Cancel</span></>
                        )}
                      </button>
                    </div>
                  )
                ) : isEventFull(event) ? (
                  <button
                    onClick={() => setEventFullPopup(event)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all hover:opacity-90"
                    style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' }}
                  >
                    <Users size={14} /> Event Full
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
          initialRegType={initialRegType}
          onClose={() => { setSelectedEvent(null); setInitialRegType('individual') }}
          onSuccess={handleRegistrationSuccess}
        />
      )}

      {/* ── EVENT FULL POPUP ── */}
      {eventFullPopup && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ animation: 'efp-fadeIn 0.2s ease' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setEventFullPopup(null)}
          />

          {/* Modal card */}
          <div
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center"
            style={{ animation: 'efp-slideUp 0.25s cubic-bezier(0.16,1,0.3,1)' }}
          >
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(249,115,22,0.12)' }}
            >
              <Users size={30} style={{ color: '#f97316' }} />
            </div>

            {/* Title */}
            <h2 className="text-xl font-black text-slate-900 mb-2">
              Event is Full!
            </h2>

            {/* Event name */}
            <p className="text-sm font-bold text-slate-700 mb-1">
              {eventFullPopup.title || eventFullPopup.name}
            </p>

            {/* Capacity info */}
            <p className="text-sm text-slate-500 leading-relaxed mb-7">
              This event has reached its maximum capacity of{' '}
              <span className="font-bold text-slate-700">
                {eventFullPopup.capacity || eventFullPopup.max_capacity || eventFullPopup.max_participants}
              </span>{' '}
              participants. Registration is no longer available.
            </p>

            {/* OK button */}
            <button
              onClick={() => setEventFullPopup(null)}
              className="w-full py-3 rounded-xl text-sm font-bold text-white cursor-pointer transition-all hover:-translate-y-0.5 border-none"
              style={{
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                boxShadow: '0 4px 18px rgba(249,115,22,0.35)',
              }}
            >
              Got it
            </button>
          </div>

          <style>{`
            @keyframes efp-fadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes efp-slideUp {
              from { opacity: 0; transform: translateY(24px) scale(0.95); }
              to   { opacity: 1; transform: translateY(0)    scale(1); }
            }
          `}</style>
        </div>,
        document.body
      )}

      {/* Event Details Modal */}
      {viewingEvent && (
        <EventDetailModal
          event={viewingEvent}
          onClose={() => setViewingEvent(null)}
          tokens={tokens}
          BRAND={BRAND}
          onRegisterClick={handleRegisterClick}
          hasPendingPayment={hasPendingPayment}
          isDeadlinePassed={isDeadlinePassed}
          handleEventPayNow={handleEventPayNow}
          isEventFinished={isEventFinished}
          setFeedbackEvent={setFeedbackEvent}
          onCancelRegistration={setCancelConfirmEvent}
          hasAttendance={hasAttendance}
          hasFeedback={hasFeedback}
          timeRange={getFormattedEventTimeRange(viewingEvent)}
        />
      )}

      {/* Feedback Modal */}
      {feedbackEvent && (
        <FeedbackModal
          event={feedbackEvent}
          onClose={() => setFeedbackEvent(null)}
          tokens={tokens}
          BRAND={BRAND}
          showToast={showToast}
          onFeedbackChange={handleFeedbackChange}
        />
      )}

      {/* Cancel Registration Confirm Modal */}
      {cancelConfirmEvent && (
        <CancelConfirmModal
          event={cancelConfirmEvent}
          tokens={tokens}
          cancelling={cancellingEventId === cancelConfirmEvent.id}
          onConfirm={() => handleCancelRegistration(cancelConfirmEvent)}
          onClose={() => setCancelConfirmEvent(null)}
        />
      )}
    </div>
  )
}

function EventDetailModal({ event, onClose, tokens, BRAND, onRegisterClick, hasPendingPayment, isDeadlinePassed, handleEventPayNow, isEventFinished, setFeedbackEvent, onCancelRegistration, hasAttendance, hasFeedback, timeRange }) {
  const [isClosing, setIsClosing] = useState(false)
  const isDark = tokens?.dark ?? false
  const card = tokens?.card || (isDark ? '#0c1829' : '#ffffff')
  const border = tokens?.border || (isDark ? '#1a3050' : '#e2e8f0')
  const txt = tokens?.txtPri || (isDark ? '#e8f0fe' : '#0f172a')
  const txtSec = tokens?.txtSec || (isDark ? '#7a98bb' : '#64748b')
  const bgHeader = isDark ? '#162640' : '#f8fafc'
  const hoverBg = tokens?.hoverBg || (isDark ? '#162640' : '#f8fafc')
  const txtMuted = tokens?.txtMuted || (isDark ? '#475569' : '#94a3b8')

  const handleClose = (cb) => {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(() => {
      if (typeof cb === 'function') cb()
      else onClose()
    }, 180)
  }

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
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`} onClick={() => handleClose()} />

      <div
        className={`relative w-full max-w-lg max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col transition-all ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
        style={{ background: card, border: `1px solid ${border}` }}
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
            onClick={() => handleClose()}
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
            <p className="text-[13px] leading-relaxed m-0 text-justify" style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
              {event.description || 'No detailed description available for this event.'}
            </p>
          </div>

          {/* Registration Deadline Warning */}
          <div className="flex flex-col gap-2">
            <CountdownTimer event={event} tokens={tokens} />
            {event.registrationDeadline && (
              <div className="text-[11.5px] font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-2"
                style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.18)' }}>
                <Clock size={14} className="shrink-0 animate-pulse" />
                <span>Registration Deadline: <strong className="ml-1">{formatDeadline(event.registrationDeadline)}</strong></span>
              </div>
            )}
          </div>

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
                <div className="text-[12px] font-black mt-0.5" style={{ color: txt }}>{timeRange || event.time || 'TBD'}</div>
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
              onClick={() => handleClose()}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs border cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{ background: 'transparent', color: txtSec, borderColor: border }}
            >
              Close
            </button>
            {isEventFinished(event) ? (
              hasAttendance && hasAttendance(event) ? (
                hasFeedback && hasFeedback(event) ? (
                  <button
                    onClick={() => handleClose(() => setFeedbackEvent(event))}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                    style={{ background: tokens?.dark ? '#162640' : '#f1f5f9', color: BRAND, border: `1px solid ${BRAND}40` }}
                  >
                    <Star size={13} /> See Feedback
                  </button>
                ) : (
                  <button
                    onClick={() => handleClose(() => setFeedbackEvent(event))}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:opacity-90 shadow-md"
                    style={{ background: BRAND, boxShadow: `0 4px 14px ${BRAND}40` }}
                  >
                    <Star size={13} /> Give Feedback
                  </button>
                )
              ) : (
                <button
                  disabled
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs border-none cursor-not-allowed flex items-center justify-center gap-1.5"
                  style={{ background: hoverBg, color: txtMuted }}
                  title="You must attend the event to give feedback"
                >
                  <XCircle size={13} /> Not Attended
                </button>
              )
            ) : isDeadlinePassed(event) ? (
              <button
                disabled
                className="flex-1 py-2.5 rounded-xl font-bold text-xs border-none cursor-not-allowed flex items-center justify-center gap-1.5 bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400"
              >
                <XCircle size={13} /> Registration Closed
              </button>
            ) : event.registered ? (
              hasPendingPayment(event) ? (
                <button
                  onClick={() => handleClose(() => handleEventPayNow(event))}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:opacity-90 shadow-md"
                  style={{ background: BRAND }}
                >
                  <CreditCard size={13} /> Pay Now (₹{event.fees})
                </button>
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  {(event.mode === 'Both' || event.mode === 'Solo / Team' || (event.mode || '').toLowerCase().includes('both') || (event.mode || '').toLowerCase().includes('team')) && (
                    <button
                      onClick={() => handleClose(() => onRegisterClick(event, 'team'))}
                      className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:opacity-90 shadow-md"
                      style={{ background: BRAND }}
                    >
                      <Users size={13} /> Register Team
                    </button>
                  )}
                  <button
                    onClick={() => handleClose(() => onCancelRegistration && onCancelRegistration(event))}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                  >
                    <XCircle size={13} /> Cancel Registration
                  </button>
                </div>
              )
            ) : (
              <button
                onClick={() => handleClose(() => onRegisterClick(event))}
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

function CountdownTimer({ event, tokens }) {
  const [timerData, setTimerData] = useState({ text: '', isUrgent: false, type: '' })

  useEffect(() => {
    const getEventStartDate = (ev) => {
      if (!ev.date) return null
      let dateTimeStr = ev.date
      if (ev.time) {
        dateTimeStr += ` ${ev.time}`
      }
      const d = new Date(dateTimeStr)
      return isNaN(d.getTime()) ? null : d
    }

    const getRegDeadlineDate = (ev) => {
      const dl = ev.registration_deadline || ev.registrationDeadline || ev.deadline || ev.registration_end
      if (dl) {
        const d = new Date(dl)
        if (!isNaN(d.getTime())) return d
      }
      return getEventStartDate(ev)
    }

    const regDeadline = getRegDeadlineDate(event)
    const eventStart = getEventStartDate(event)

    const updateTimer = () => {
      const now = new Date()

      // Case 3: Event has started (Ongoing or Finished)
      if (eventStart && now >= eventStart) {
        const getEventEndDate = (ev) => {
          const end = ev.end_datetime || ev.endDateTime
          if (end) {
            const d = new Date(end)
            if (!isNaN(d.getTime())) return d
          }
          const start = getEventStartDate(ev)
          if (start) {
            return new Date(start.getTime() + 3 * 60 * 60 * 1000)
          }
          return null
        }
        
        const eventEnd = getEventEndDate(event)
        if (eventEnd && now >= eventEnd) {
          setTimerData({
            text: 'Event Finished 🎉',
            isUrgent: false,
            type: 'finished'
          })
          return
        }

        setTimerData({
          text: 'Event is Live! ⚡',
          isUrgent: false,
          type: 'live'
        })
        return
      }

      // Case 2: Registration closed, but event has not started yet
      if (regDeadline && now >= regDeadline) {
        if (!eventStart) {
          setTimerData({
            text: 'Registration Closed',
            isUrgent: false,
            type: 'closed'
          })
          return
        }

        const diff = eventStart.getTime() - now.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((diff / (1000 * 60)) % 60)
        const seconds = Math.floor((diff / 1000) % 60)

        const urgent = diff < 24 * 60 * 60 * 1000 // urgent if starts in less than 24 hours
        let timeStr = ''
        if (days > 0) {
          timeStr = `${days}d ${hours}h ${minutes}m left`
        } else if (hours > 0) {
          timeStr = `${hours}h ${minutes}m ${seconds}s left`
        } else {
          timeStr = `${minutes}m ${seconds}s left`
        }

        setTimerData({
          text: `Event starts in: ${timeStr}`,
          isUrgent: urgent,
          type: 'start'
        })
        return
      }

      // Case 1: Registration open
      if (regDeadline) {
        const diff = regDeadline.getTime() - now.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((diff / (1000 * 60)) % 60)
        const seconds = Math.floor((diff / 1000) % 60)

        const urgent = diff < 24 * 60 * 60 * 1000
        let timeStr = ''
        if (days > 0) {
          timeStr = `${days}d ${hours}h ${minutes}m left`
        } else if (hours > 0) {
          timeStr = `${hours}h ${minutes}m ${seconds}s left`
        } else {
          timeStr = `${minutes}m ${seconds}s left`
        }

        setTimerData({
          text: `Registration closes in: ${timeStr}`,
          isUrgent: urgent,
          type: 'reg'
        })
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [event])

  if (!timerData.text) return null

  let styleClasses = 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20'
  if (timerData.type === 'live') {
    styleClasses = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20'
  } else if (timerData.type === 'finished') {
    styleClasses = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
  } else if (timerData.isUrgent) {
    styleClasses = 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse'
  } else if (timerData.type === 'closed') {
    styleClasses = 'bg-red-500/10 text-red-500 border-red-500/20'
  }

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold mb-3 border transition-all duration-300 ${styleClasses}`}>
      <Clock size={13} className={timerData.isUrgent ? 'animate-bounce' : ''} />
      <span>{timerData.text}</span>
    </div>
  )
}

function FeedbackModal({ event, onClose, tokens, BRAND, showToast, onFeedbackChange }) {
  const [isClosing, setIsClosing] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [myFeedback, setMyFeedback] = useState(null)
  const [allFeedbacks, setAllFeedbacks] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isDark = tokens?.dark ?? false
  const card = tokens?.card || (isDark ? '#0c1829' : '#ffffff')
  const border = tokens?.border || (isDark ? '#1a3050' : '#e2e8f0')
  const txt = tokens?.txtPri || (isDark ? '#e8f0fe' : '#0f172a')
  const txtSec = tokens?.txtSec || (isDark ? '#7a98bb' : '#64748b')

  const handleClose = () => {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(onClose, 180)
  }

  const loadFeedbackData = async () => {
    setLoading(true)
    try {
      const [myRes, eventRes] = await Promise.all([
        studentService.fetchMyFeedbacks(),
        studentService.fetchEventFeedbacks(event.id)
      ])

      if (myRes.success) {
        const found = myRes.data.find(f => String(f.event_id || f.eventId) === String(event.id))
        setMyFeedback(found || null)
        if (found) {
          setRating(found.rating)
          setComment(found.review || found.comment || '')
        }
      }

      if (eventRes.success) {
        setAllFeedbacks(eventRes.data)
      }
    } catch (err) {
      showToast('Failed to load feedback data.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeedbackData()
  }, [event.id])

  const handleSubmit = async () => {
    if (!comment.trim()) {
      showToast('Please enter your review comment.', 'warning')
      return
    }
    setSubmitting(true)
    try {
      const res = await studentService.submitFeedback(event.id, rating, comment)
      if (res.success) {
        showToast('Feedback submitted successfully! Thank you ❤️', 'success')
        onFeedbackChange && onFeedbackChange(event.id, true)
        loadFeedbackData()
      } else {
        showToast(res.message || 'Failed to submit feedback.', 'error')
      }
    } catch (err) {
      showToast('An error occurred during submission.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const executeDelete = async (feedbackId) => {
    setSubmitting(true)
    try {
      const res = await studentService.deleteFeedback(feedbackId)
      if (res.success) {
        showToast('Feedback deleted successfully.', 'success')
        setMyFeedback(null)
        setComment('')
        setRating(5)
        onFeedbackChange && onFeedbackChange(event.id, false)
        setShowDeleteConfirm(false)
        loadFeedbackData()
      } else {
        showToast(res.message || 'Failed to delete feedback.', 'error')
      }
    } catch (err) {
      showToast('An error occurred during deletion.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center px-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`} onClick={handleClose} />
      <div
        className={`relative w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl flex flex-col transition-all max-h-[90vh] ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
        style={{ background: card, border: `1px solid ${border}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-[#1a3050]">
          <div>
            <h3 className="text-lg font-black m-0" style={{ color: txt }}>Feedback & Review</h3>
            <span className="text-[11px] font-semibold" style={{ color: txtSec }}>
              {event.title}
            </span>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center transition-all hover:bg-slate-100 dark:hover:bg-slate-800" style={{ color: txtSec }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 size={32} className="animate-spin" style={{ color: BRAND }} />
              <span className="text-xs font-semibold" style={{ color: txtSec }}>Loading feedback...</span>
            </div>
          ) : (
            <>
              {/* My Feedback Section */}
              <div className="rounded-2xl p-4 border" style={{ borderColor: border, background: tokens.dark ? '#07101e' : '#f8fafc' }}>
                {myFeedback ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                        ✓ Your Submitted Feedback
                      </span>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={submitting}
                        className="text-red-500 hover:text-red-600 bg-transparent border-none cursor-pointer flex items-center gap-1 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>

                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={16}
                          fill={star <= myFeedback.rating ? '#fbbf24' : 'none'}
                          stroke={star <= myFeedback.rating ? '#fbbf24' : '#d1d5db'}
                        />
                      ))}
                    </div>

                    <p className="text-xs m-0 leading-relaxed font-medium" style={{ color: txt }}>
                      {myFeedback.review || myFeedback.comment}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-extrabold m-0" style={{ color: txt }}>Write a Review</h4>
                    
                    {/* Rating Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11.5px] font-bold" style={{ color: txtSec }}>Rating</label>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="border-none bg-transparent cursor-pointer transition-transform hover:scale-110 p-0"
                          >
                            <Star
                              size={24}
                              fill={star <= rating ? '#fbbf24' : 'none'}
                              stroke={star <= rating ? '#fbbf24' : '#cbd5e1'}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review Comments Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11.5px] font-bold" style={{ color: txtSec }}>Review Comment</label>
                      <textarea
                        rows={3}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Share your experience (what went well, areas of improvement)..."
                        className="w-full px-3 py-2 rounded-xl text-xs outline-none resize-none border font-medium"
                        style={{
                          border: `1px solid ${border}`,
                          background: tokens.dark ? '#060e1c' : '#ffffff',
                          color: txt
                        }}
                      />
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: BRAND, boxShadow: `0 4px 14px ${BRAND}40` }}
                    >
                      {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </div>
                )}
              </div>

              {/* Public Event Feedbacks List */}
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-black m-0" style={{ color: txt }}>All Feedbacks for this Event ({allFeedbacks.length})</h4>
                
                <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {allFeedbacks.length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-2xl" style={{ borderColor: border }}>
                      <p className="text-xs font-semibold m-0" style={{ color: txtSec }}>No feedback submitted for this event yet.</p>
                    </div>
                  ) : (
                    allFeedbacks.map((f, idx) => (
                      <div
                        key={f.id || f.feedback_id || idx}
                        className="p-3.5 rounded-xl border flex flex-col gap-2"
                        style={{ borderColor: border, background: tokens.dark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold" style={{ color: txtSec }}>
                            {f.student_name || f.studentName || f.user?.name || `Participant #${idx + 1}`}
                          </span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                size={10}
                                fill={star <= f.rating ? '#fbbf24' : 'none'}
                                stroke={star <= f.rating ? '#fbbf24' : '#d1d5db'}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs m-0 leading-relaxed font-medium" style={{ color: txt }}>
                          {f.review || f.comment}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#1a3050] flex justify-end">
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-xl font-bold text-xs border cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ background: 'transparent', color: txtSec, borderColor: border }}
          >
            Close
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <DeleteFeedbackConfirmModal
            event={event}
            tokens={tokens}
            deleting={submitting}
            onConfirm={() => executeDelete(myFeedback.id || myFeedback.feedback_id)}
            onClose={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    </div>,
    document.body
  )
}

function CancelConfirmModal({ event, tokens, cancelling, onConfirm, onClose }) {
  const [isClosing, setIsClosing] = useState(false)
  const isDark = tokens?.dark ?? false
  const card = tokens?.card || (isDark ? '#0c1829' : '#ffffff')
  const border = tokens?.border || (isDark ? '#1a3050' : '#e2e8f0')
  const txt = tokens?.txtPri || (isDark ? '#e8f0fe' : '#0f172a')
  const txtSec = tokens?.txtSec || (isDark ? '#7a98bb' : '#64748b')

  const handleClose = () => {
    if (isClosing || cancelling) return
    setIsClosing(true)
    setTimeout(onClose, 180)
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
      <div className={`absolute inset-0 bg-black/70 backdrop-blur-sm ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`} onClick={() => handleClose()} />

      <div
        className={`relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
        style={{
          background: card,
          border: `1px solid ${border}`
        }}
      >
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />

        <div className="p-6 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <AlertTriangle size={32} style={{ color: '#ef4444' }} />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-black m-0 mb-1" style={{ color: txt }}>Cancel Registration?</h3>
            <p className="text-[13px] font-medium m-0 leading-relaxed" style={{ color: txtSec }}>
              Are you sure you want to cancel your registration for
            </p>
            <p className="text-[13px] font-extrabold mt-0.5 m-0" style={{ color: txt }}>
              "{event.title}"
            </p>
          </div>

          {Number(event.fees || event.fee || event.price || 0) > 0 || String(event.paymentStatus || event.payment_status || '').toLowerCase() === 'paid' ? (
            <div
              className="w-full px-4 py-2.5 rounded-xl text-[12px] font-semibold leading-relaxed"
              style={{ background: 'rgba(59,130,246,0.08)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              💳 Paid Event: Payment refund will be processed soon after cancellation.
            </div>
          ) : null}

          <div
            className="w-full px-4 py-3 rounded-xl text-[12px] font-semibold leading-relaxed"
            style={{ background: 'rgba(239,68,68,0.06)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            ⚠️ This action cannot be undone. Your registration slot will be released.
          </div>

          <div className="flex gap-3 w-full mt-1">
            <button
              onClick={() => handleClose()}
              disabled={cancelling}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs border cursor-pointer transition-all hover:opacity-80 disabled:opacity-40"
              style={{ background: 'transparent', color: txtSec, borderColor: border }}
            >
              Keep Registration
            </button>
            <button
              onClick={onConfirm}
              disabled={cancelling}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
            >
              {cancelling ? (
                <><Loader2 size={13} className="animate-spin" /> Cancelling...</>
              ) : (
                <><XCircle size={13} /> Yes, Cancel It</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function DeleteFeedbackConfirmModal({ event, tokens, deleting, onConfirm, onClose }) {
  const [isClosing, setIsClosing] = useState(false)
  const isDark = tokens?.dark ?? false
  const card = tokens?.card || (isDark ? '#0c1829' : '#ffffff')
  const border = tokens?.border || (isDark ? '#1a3050' : '#e2e8f0')
  const txt = tokens?.txtPri || (isDark ? '#e8f0fe' : '#0f172a')
  const txtSec = tokens?.txtSec || (isDark ? '#7a98bb' : '#64748b')

  const handleClose = () => {
    if (isClosing || deleting) return
    setIsClosing(true)
    setTimeout(onClose, 180)
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
      <div className={`absolute inset-0 bg-black/70 backdrop-blur-sm ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`} onClick={() => handleClose()} />

      <div
        className={`relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
        style={{
          background: card,
          border: `1px solid ${border}`
        }}
      >
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />

        <div className="p-6 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <Trash2 size={32} style={{ color: '#ef4444' }} />
          </div>

          <div>
            <h3 className="text-lg font-black m-0 mb-1" style={{ color: txt }}>Delete Feedback?</h3>
            <p className="text-[13px] font-medium m-0 leading-relaxed" style={{ color: txtSec }}>
              Are you sure you want to delete your feedback for
            </p>
            <p className="text-[13px] font-extrabold mt-0.5 m-0" style={{ color: txt }}>
              "{event?.title || event?.name}"
            </p>
          </div>

          <div
            className="w-full px-4 py-3 rounded-xl text-[12px] font-semibold leading-relaxed"
            style={{ background: 'rgba(239,68,68,0.06)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            ⚠️ This action cannot be undone. Your review will be permanently removed.
          </div>

          <div className="flex gap-3 w-full mt-1">
            <button
              onClick={() => handleClose()}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs border cursor-pointer transition-all hover:opacity-80 disabled:opacity-40"
              style={{ background: 'transparent', color: txtSec, borderColor: border }}
            >
              Keep Feedback
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
            >
              {deleting ? (
                <><Loader2 size={13} className="animate-spin" /> Deleting...</>
              ) : (
                <><Trash2 size={13} /> Yes, Delete</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
