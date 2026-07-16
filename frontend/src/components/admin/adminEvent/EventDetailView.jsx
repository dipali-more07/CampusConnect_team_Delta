import { useState, useEffect } from 'react'
import { 
  ChevronLeft, Search, ChevronRight, Pencil, Clock, MapPin, Users, Loader2, Check, XCircle, BarChart2, Award, Image 
} from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../../data/dashboardData'
import eventsService from '../../../services/eventsService'
import studentsService from '../../../services/studentsService'
import analyticsService from '../../../services/analyticsService'

export default function EventDetailView({ event, onBack, onEdit, tokens, showToast }) {
  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND
  const [activeTab, setActiveTab] = useState('Overview')

  const [registrations, setRegistrations] = useState([])
  const [loadingRegs, setLoadingRegs] = useState(false)
  const [attendance, setAttendance] = useState([])
  const [loadingAtt, setLoadingAtt] = useState(false)
  const [students, setStudents] = useState([])
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  // Search and Pagination states for Registrations
  const [regSearch, setRegSearch] = useState('')
  const [regPage, setRegPage] = useState(1)
  const [regPerPage, setRegPerPage] = useState(5)

  // Search and Pagination states for Attendance
  const [attSearch, setAttSearch] = useState('')
  const [attPage, setAttPage] = useState(1)
  const [attPerPage, setAttPerPage] = useState(5)

  const loadRegistrations = async () => {
    setLoadingRegs(true)
    const [regRes, stuRes] = await Promise.all([
      eventsService.fetchRegistrations(event.id),
      studentsService.fetchAll()
    ])
    if (stuRes.success) {
      setStudents(stuRes.students || [])
    }
    if (regRes.success) {
      setRegistrations(regRes.registrations || [])
    }
    setLoadingRegs(false)
  }

  const loadAttendance = async () => {
    setLoadingAtt(true)
    const res = await eventsService.fetchAttendance(event.id)
    if (res.success) {
      setAttendance(res.attendance)
    }
    setLoadingAtt(false)
  }

  const loadAnalytics = async () => {
    setLoadingAnalytics(true)
    const res = await analyticsService.fetchEventAnalytics(event.id)
    if (res.success) {
      setAnalyticsData(res.data)
    }
    setLoadingAnalytics(false)
  }

  useEffect(() => {
    if (activeTab === 'Overview' || activeTab === 'Registrations') {
      loadRegistrations()
    }
  }, [event.id, activeTab])

  useEffect(() => {
    if (activeTab === 'Attendance') {
      loadAttendance()
    }
  }, [event.id, activeTab])

  useEffect(() => {
    if (activeTab === 'Analytics') {
      loadAnalytics()
    }
  }, [event.id, activeTab])

  const handleStatusChange = async (regId, status) => {
    const res = await eventsService.updateRegistrationStatus(regId, status)
    if (res.success) {
      showToast(`Registration status updated to ${status}.`, 'success')
      setRegistrations(prev =>
        prev.map(r => {
          const rId = r.id || r.registration_id
          if (rId === regId) {
            return { ...r, registration_status: status, status }
          }
          return r
        })
      )
      
      let change = 0
      const oldReg = registrations.find(r => (r.id === regId) || (r.registration_id === regId))
      const oldStatus = oldReg?.registration_status || oldReg?.status
      if (oldStatus !== 'Approved' && status === 'Approved') change = 1
      else if (oldStatus === 'Approved' && status !== 'Approved') change = -1
      if (change !== 0) {
        event.registrationsCount = Math.max(0, (event.registrationsCount || 0) + change)
      }
    } else {
      showToast(res.message || 'Failed to update registration status.', 'error')
    }
  }
  
  // Custom status badge style
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Upcoming':
        return { bg: '#e0f2fe', text: '#0369a1' } // Sky/Blue
      case 'Ongoing':
        return { bg: '#dcfce7', text: '#15803d' } // Green
      case 'Completed':
        return { bg: '#f1f5f9', text: '#475569' } // Slate
      case 'Cancelled':
        return { bg: '#fee2e2', text: '#b91c1c' } // Red
      default:
        return { bg: '#e2e8f0', text: '#475569' }
    }
  }

  const getRegStatusStyle = (status) => {
    const norm = String(status || '').trim().toLowerCase()
    if (norm === 'approved' || norm === 'completed' || norm === 'confirmed') {
      return {
        bg: dark ? 'rgba(16, 185, 129, 0.15)' : '#e6fbf2',
        text: '#00BC7D',
      }
    }
    if (norm === 'pending' || norm === 'upcoming' || norm === 'ongoing') {
      return {
        bg: dark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
        text: '#d97706',
      }
    }
    if (norm === 'rejected' || norm === 'cancelled') {
      return {
        bg: dark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
        text: '#ef4444',
      }
    }
    return {
      bg: dark ? '#162640' : '#f1f5f9',
      text: dark ? '#7a98bb' : '#64748b',
    }
  }

  const badge = getStatusStyle(event.status)
  const isApproved = (event.approvalStatus || 'Approved') === 'Approved'
  const regCount = registrations.length
  const effectiveRegs = isApproved ? regCount : 0
  const regPercent = isApproved && event.capacity ? Math.min(Math.round((effectiveRegs / event.capacity) * 100), 100) : 0
  const remaining = isApproved ? Math.max(event.capacity - effectiveRegs, 0) : event.capacity

  // Filtered & Paginated Registrations
  const filteredRegs = registrations.map(r => {
    const student = students.find(s => s.id === r.userId || s.id === r.user_id)
    return {
      ...r,
      studentName: student?.name || r.studentName || r.student_name || 'N/A',
      rollNo: student?.rollNo || r.rollNo || r.roll_no || (r.user_id ? r.user_id.slice(0, 8) : 'N/A'),
      department: student?.department || r.department || 'N/A',
      year: student?.year || r.year || 'N/A',
      date: r.registeredAt || r.registered_at ? new Date(r.registeredAt || r.registered_at).toLocaleDateString() : (r.date || 'N/A'),
      status: r.registrationStatus || r.registration_status || r.status || 'Pending'
    }
  }).filter(r => {
    const q = regSearch.toLowerCase().trim()
    if (!q) return true
    return (
      (r.studentName || '').toLowerCase().includes(q) ||
      (r.rollNo || '').toLowerCase().includes(q) ||
      (r.department || '').toLowerCase().includes(q) ||
      (r.year || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q) ||
      (r.date || '').toLowerCase().includes(q)
    )
  })

  const totalRegItems = filteredRegs.length
  const totalRegPages = Math.ceil(totalRegItems / regPerPage)
  const currentRegPage = Math.min(regPage, totalRegPages || 1)
  const regStartIndex = (currentRegPage - 1) * regPerPage
  const regEndIndex = Math.min(regStartIndex + regPerPage, totalRegItems)
  const paginatedRegs = filteredRegs.slice(regStartIndex, regEndIndex)

  // Filtered & Paginated Attendance
  const filteredAtt = attendance.map(a => {
    const reg = registrations.find(r => (r.id === a.registrationId) || (r.registration_id === a.registrationId))
    const student = reg ? students.find(s => s.id === reg.userId || s.id === reg.user_id) : null
    return {
      ...a,
      studentName: a.studentName && a.studentName !== 'Student' && a.studentName.length < 20
        ? a.studentName
        : (student?.name || reg?.studentName || reg?.student_name || reg?.full_name || a.studentName),
      rollNo: a.rollNo && a.rollNo !== 'N/A'
        ? a.rollNo
        : (student?.rollNo || reg?.rollNo || reg?.roll_no || a.rollNo)
    }
  }).filter(a => {
    const q = attSearch.toLowerCase().trim()
    if (!q) return true
    return (
      (a.studentName || '').toLowerCase().includes(q) ||
      (a.rollNo || '').toLowerCase().includes(q) ||
      (a.status || '').toLowerCase().includes(q) ||
      (a.checkIn || '').toLowerCase().includes(q) ||
      (a.checkOut || '').toLowerCase().includes(q)
    )
  })

  const totalAttItems = filteredAtt.length
  const totalAttPages = Math.ceil(totalAttItems / attPerPage)
  const currentAttPage = Math.min(attPage, totalAttPages || 1)
  const attStartIndex = (currentAttPage - 1) * attPerPage
  const attEndIndex = Math.min(attStartIndex + attPerPage, totalAttItems)
  const paginatedAtt = filteredAtt.slice(attStartIndex, attEndIndex)

  // Sub-tabs list
  const tabs = ['Overview', 'Registrations', 'Attendance', 'Analytics', 'Certificates', 'Gallery']

  return (
    <div className="animate-fadeIn m-4" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
      
      {/* ── TOP HEADER ROW ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              localStorage.removeItem('cc_event_detail_active_tab')
              onBack()
            }}
            className="w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all duration-200"
            style={{ 
              borderColor: dark ? '#1a3050' : '#e2e8f0', 
              background: dark ? '#0f1e30' : '#ffffff',
              color: dark ? '#7a98bb' : '#64748b'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#7a98bb' : '#64748b' }}
          >
            <ChevronLeft size={18} />
          </button>
          
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-extrabold m-0 leading-tight">
                {event.name}
              </h1>
              <span 
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: badge.bg, color: badge.text }}
              >
                {event.status}
              </span>
              <span 
                className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                style={{ 
                  background: dark ? `${BRAND}25` : `${BRAND}15`, 
                  color: BRAND 
                }}
              >
                {event.eventType || 'Individual'} Event
              </span>
              <span 
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                  (event.approvalStatus || 'Approved') === 'Approved'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400'
                }`}
              >
                Admin {(event.approvalStatus || 'Approved')}
              </span>
            </div>
            <p className="text-[12px] mt-1 mb-0 font-semibold" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
              ID: {event.id} &middot; Organized by {event.organizer}
            </p>
          </div>
        </div>

        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-bold text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-px"
          style={{ background: BRAND, boxShadow: '0 4px 14px rgba(97,95,255,0.4)' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(97,95,255,0.55)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(97,95,255,0.4)' }}
        >
          <Pencil size={13} /> Edit Event
        </button>
      </div>

      {/* ── BANNER CARD ── */}
      <div 
        className="rounded-[24px] p-8 md:p-10 mb-6 relative overflow-hidden flex flex-col justify-end min-h-[160px]"
        style={{ 
          background: `linear-gradient(135deg, ${BRAND} 0%, #4c49d8 100%)`,
          boxShadow: '0 12px 32px rgba(97,95,255,0.25)' 
        }}
      >
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute bottom-[-30px] left-[-30px] w-36 h-36 rounded-full bg-white/5 blur-lg pointer-events-none" />

        <div className="relative z-10 text-white">
          <div className="text-[12px] font-extrabold uppercase tracking-widest opacity-80 flex items-center gap-1.5 mb-2">
            <Clock size={12} /> {event.date} &bull; {event.time}
          </div>
          <h2 className="text-[28px] md:text-[34px] font-black m-0 leading-tight tracking-tight">
            {event.name}
          </h2>
          <div className="flex flex-wrap items-center gap-5 mt-4 text-[13.5px] font-bold opacity-90">
            <span className="flex items-center gap-1.5">
              <MapPin size={15} /> {event.venue}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={15} /> {regCount} / {event.capacity} registered
            </span>
          </div>
        </div>
      </div>

      {/* ── SUB-TABS BAR ── */}
      <div 
        className="rounded-2xl p-1 mb-6 border flex flex-wrap gap-1.5"
        style={{ 
          borderColor: dark ? '#1a3050' : '#e2e8f0', 
          background: dark ? '#0f1e30' : '#ffffff' 
        }}
      >
        {tabs.map(tab => {
          const active = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2.5 rounded-xl text-[13px] font-bold border-none cursor-pointer transition-all duration-200"
              style={{
                background: active ? BRAND : 'transparent',
                color: active ? '#ffffff' : (dark ? '#7a98bb' : '#5c6f84'),
                boxShadow: active ? '0 3px 10px rgba(97,95,255,0.3)' : 'none'
              }}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div>
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* About card */}
              <div 
                className="rounded-2xl p-6 border"
                style={{ 
                  borderColor: dark ? '#1a3050' : '#e2e8f0', 
                  background: dark ? '#0f1e30' : '#ffffff' 
                }}
              >
                <h3 className="text-[16px] font-extrabold m-0 mb-4" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
                  About this Event
                </h3>
                <p className="text-[13.5px] leading-relaxed font-medium m-0" style={{ color: dark ? '#7a98bb' : '#5c6f84' }}>
                  {event.description}
                </p>
              </div>

              {/* Schedule card */}
              <div 
                className="rounded-2xl p-6 border"
                style={{ 
                  borderColor: dark ? '#1a3050' : '#e2e8f0', 
                  background: dark ? '#0f1e30' : '#ffffff' 
                }}
              >
                <h3 className="text-[16px] font-extrabold m-0 mb-5" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
                  Schedule
                </h3>
                <div className="flex flex-col gap-5">
                  {event.schedule && event.schedule.map((item, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="text-[12.5px] font-black w-20 shrink-0 mt-0.5 text-center py-0.5 rounded bg-slate-100 dark:bg-slate-800" style={{ color: BRAND }}>
                        {item.time}
                      </div>
                      <div>
                        <h4 className="text-[13.5px] font-extrabold m-0" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
                          {item.title}
                        </h4>
                        <p className="text-[12px] font-semibold mt-1 mb-0" style={{ color: dark ? '#7a98bb' : '#94a3b8' }}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              
              {/* Event Details card */}
              <div 
                className="rounded-2xl p-6 border"
                style={{ 
                  borderColor: dark ? '#1a3050' : '#e2e8f0', 
                  background: dark ? '#0f1e30' : '#ffffff' 
                }}
              >
                <h3 className="text-[16px] font-extrabold m-0 mb-4" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
                  Event Details
                </h3>
                <div className="flex flex-col gap-3.5">
                  {[
                    { label: 'Category', value: event.category },
                    { label: 'Venue', value: event.venue },
                    { label: 'Date', value: event.date },
                    { label: 'Time', value: event.time },
                    { label: 'Capacity', value: `${event.capacity} seats` },
                    { label: 'Registered', value: `${regCount} students` },
                    { label: 'Organizer', value: event.organizer },
                    { label: 'QR Attendance', value: event.qrAttendance || 'Enabled' }
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between text-[13px] font-semibold">
                      <span style={{ color: dark ? '#7a98bb' : '#94a3b8' }}>{row.label}</span>
                      <span style={{ color: dark ? '#e8f0fe' : '#334155' }} className="text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Registration Progress card */}
              <div 
                className="rounded-2xl p-6 border"
                style={{ 
                  borderColor: dark ? '#1a3050' : '#e2e8f0', 
                  background: dark ? '#0f1e30' : '#ffffff' 
                }}
              >
                <h3 className="text-[16px] font-extrabold m-0 mb-4" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
                  Registration Progress
                </h3>
                
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-[34px] font-black leading-none" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
                    {regPercent}%
                  </span>
                  <span className="text-[12px] font-bold" style={{ color: dark ? '#7a98bb' : '#94a3b8' }}>
                    capacity filled
                  </span>
                </div>

                <div className="h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3.5">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${regPercent}%`, background: BRAND }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                  <span>{regCount} registered</span>
                  <span>{remaining} remaining</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'Registrations' && (
          <div 
            className="rounded-2xl p-6 border"
            style={{ 
              borderColor: dark ? '#1a3050' : '#e2e8f0', 
              background: dark ? '#0f1e30' : '#ffffff' 
            }}
          >
            {/* Header controls with Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-[16px] font-extrabold m-0" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
                  Registered Students List
                </h3>
                <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500 mt-1 block">
                  {registrations.length} registrations total
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    value={regSearch}
                    onChange={e => {
                      setRegSearch(e.target.value)
                      setRegPage(1)
                    }}
                    placeholder="Search registrations..."
                    className="pl-9 pr-8 py-2 rounded-xl text-[12.5px] font-semibold outline-none w-56 transition-all duration-200 border"
                    style={{
                      background: dark ? '#0f1e30' : '#f8fafc',
                      borderColor: dark ? '#1a3050' : '#cbd5e1',
                      color: dark ? '#e8f0fe' : '#0f172a',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = BRAND}
                    onBlur={e => e.currentTarget.style.borderColor = dark ? '#1a3050' : '#cbd5e1'}
                  />
                  {regSearch && (
                    <button
                      onClick={() => {
                        setRegSearch('')
                        setRegPage(1)
                      }}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-transparent border-none"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {loadingRegs ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center p-12 text-slate-500">
                No registrations found for this event.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto transition-height" style={{ minHeight: '325px' }}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}>
                        <th className="py-3 text-[11px] font-bold tracking-wider" style={{ color: dark ? '#7a98bb' : '#64748b' }}>STUDENT NAME</th>
                        <th className="py-3 text-[11px] font-bold tracking-wider" style={{ color: dark ? '#7a98bb' : '#64748b' }}>ROLL NO</th>
                        <th className="py-3 text-[11px] font-bold tracking-wider" style={{ color: dark ? '#7a98bb' : '#64748b' }}>DEPARTMENT</th>
                        <th className="py-3 text-[11px] font-bold tracking-wider" style={{ color: dark ? '#7a98bb' : '#64748b' }}>YEAR</th>
                        <th className="py-3 text-[11px] font-bold tracking-wider" style={{ color: dark ? '#7a98bb' : '#64748b' }}>DATE</th>
                        <th className="py-3 text-[11px] font-bold tracking-wider" style={{ color: dark ? '#7a98bb' : '#64748b' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody key={`${regPage}-${regSearch}`} className="divide-y" style={{ divideColor: dark ? '#1a3050' : '#e2e8f0' }}>
                      {paginatedRegs.length === 0 ? (
                        <tr className="animate-slide-up-fade">
                          <td colSpan="6" className="p-12 text-center text-[13.5px]" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                            No matching registrations found.
                          </td>
                        </tr>
                      ) : (
                        paginatedRegs.map((att, i) => {
                          const statusBadge = getRegStatusStyle(att.status)
                          const regId = att.id || att.registration_id
                          return (
                            <tr 
                              key={regId} 
                              className="animate-slide-up-fade" 
                              style={{ 
                                borderBottom: i < paginatedRegs.length - 1 ? `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` : 'none',
                                animationDelay: `${i * 40}ms`
                              }}
                            >
                              <td className="py-3.5 text-[13px] font-bold" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{att.studentName}</td>
                              <td className="py-3.5 text-[13px] font-semibold text-slate-500 dark:text-[#7a98bb]">{att.rollNo}</td>
                              <td className="py-3.5 text-[13px] font-semibold text-slate-600 dark:text-[#7a98bb]">{att.department}</td>
                              <td className="py-3.5 text-[13px] font-semibold text-slate-500 dark:text-[#7a98bb]">{att.year}</td>
                              <td className="py-3.5 text-[13px] font-medium text-slate-500 dark:text-[#7a98bb]">{att.date}</td>
                              <td className="py-3.5 text-[13px]">
                                <span 
                                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider inline-block text-center"
                                  style={{ background: statusBadge.bg, color: statusBadge.text }}
                                >
                                  {att.status}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── Table Pagination Bar ── */}
                <div 
                  className="flex items-center justify-between flex-wrap gap-4 pt-5 mt-4"
                  style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}
                >
                  {/* Showing status & Items per page */}
                  <div className="flex items-center gap-4">
                    <span className="text-[12.5px] font-medium" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                      Showing <strong style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{totalRegItems > 0 ? regStartIndex + 1 : 0}</strong> to{' '}
                      <strong style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{regEndIndex}</strong> of{' '}
                      <strong style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{totalRegItems}</strong> entries
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500">Per page:</span>
                      <select
                        value={regPerPage}
                        onChange={e => {
                          setRegPerPage(Number(e.target.value))
                          setRegPage(1)
                        }}
                        className="px-2.5 py-1 rounded-lg text-[12px] font-bold outline-none cursor-pointer border"
                        style={{
                          background: dark ? '#0f1e30' : '#ffffff',
                          borderColor: dark ? '#1a3050' : '#cbd5e1',
                          color: dark ? '#e8f0fe' : '#334155'
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>

                  {/* Pagination Page Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setRegPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentRegPage === 1}
                      className="p-1.5 rounded-lg border bg-transparent cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        borderColor: dark ? '#1a3050' : '#e2e8f0',
                        color: dark ? '#e8f0fe' : '#475569'
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalRegPages }, (_, i) => i + 1).map(page => {
                      const active = page === currentRegPage
                      return (
                        <button
                          key={page}
                          onClick={() => setRegPage(page)}
                          className="w-8 h-8 rounded-lg text-[12.5px] font-extrabold cursor-pointer transition-all border-none"
                          style={{
                            background: active ? BRAND : (dark ? '#0f1e30' : '#f1f5f9'),
                            color: active ? '#ffffff' : (dark ? '#7a98bb' : '#475569'),
                            boxShadow: active ? '0 3px 10px rgba(97,95,255,0.3)' : 'none'
                          }}
                        >
                          {page}
                        </button>
                      )
                    })}

                    <button
                      onClick={() => setRegPage(prev => Math.min(prev + 1, totalRegPages))}
                      disabled={currentRegPage === totalRegPages || totalRegPages === 0}
                      className="p-1.5 rounded-lg border bg-transparent cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        borderColor: dark ? '#1a3050' : '#e2e8f0',
                        color: dark ? '#e8f0fe' : '#475569'
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'Attendance' && (
          <div className="flex flex-col gap-6">
            {loadingAtt ? (
              <div 
                className="rounded-2xl p-12 border text-center flex flex-col items-center justify-center gap-3"
                style={{ 
                  borderColor: dark ? '#1a3050' : '#e2e8f0', 
                  background: dark ? '#0f1e30' : '#ffffff' 
                }}
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} />
                <span className="text-[13px] font-semibold text-slate-500">Loading attendance data...</span>
              </div>
            ) : (
              <>
                {/* ── STATS ROW ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Present */}
                  <div 
                    className="rounded-2xl p-6 text-center border"
                    style={{
                      borderColor: dark ? '#1a3050' : '#e2e8f0', 
                      background: dark ? '#0f1e30' : '#ffffff' 
                    }}
                  >
                    <div className="text-[32px] font-black text-emerald-500">
                      {attendance.filter(a => a.status === 'Present').length}
                    </div>
                    <div className="text-[13px] font-bold text-slate-500 mt-1">Present</div>
                  </div>

                  {/* Card 2: Absent */}
                  <div 
                    className="rounded-2xl p-6 text-center border"
                    style={{
                      borderColor: dark ? '#1a3050' : '#e2e8f0', 
                      background: dark ? '#0f1e30' : '#ffffff' 
                    }}
                  >
                    <div className="text-[32px] font-black text-rose-500">
                      {attendance.filter(a => a.status === 'Absent').length}
                    </div>
                    <div className="text-[13px] font-bold text-slate-500 mt-1">Absent</div>
                  </div>

                  {/* Card 3: Late */}
                  <div 
                    className="rounded-2xl p-6 text-center border"
                    style={{
                      borderColor: dark ? '#1a3050' : '#e2e8f0', 
                      background: dark ? '#0f1e30' : '#ffffff' 
                    }}
                  >
                    <div className="text-[32px] font-black text-amber-500">
                      {attendance.filter(a => a.status === 'Late').length}
                    </div>
                    <div className="text-[13px] font-bold text-slate-500 mt-1">Late</div>
                  </div>

                  {/* Card 4: Attendance % */}
                  <div 
                    className="rounded-2xl p-6 text-center border"
                    style={{
                      borderColor: dark ? '#1a3050' : '#e2e8f0', 
                      background: dark ? '#0f1e30' : '#ffffff' 
                    }}
                  >
                    <div className="text-[32px] font-black text-indigo-500">
                      {attendance.length > 0 
                        ? Math.round(
                            ((attendance.filter(a => a.status === 'Present').length + 
                              attendance.filter(a => a.status === 'Late').length) / 
                             attendance.length) * 100
                          ) 
                        : 0}%
                    </div>
                    <div className="text-[13px] font-bold text-slate-500 mt-1">Attendance %</div>
                  </div>
                </div>

                {/* ── ATTENDANCE TABLE ── */}
                <div 
                  className="rounded-2xl border"
                  style={{
                    borderColor: dark ? '#1a3050' : '#e2e8f0', 
                    background: dark ? '#0f1e30' : '#ffffff' 
                  }}
                >
                  {/* Table Header controls with Search Bar */}
                  <div 
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b"
                    style={{ borderColor: dark ? '#1a3050' : '#e2e8f0' }}
                  >
                    <div>
                      <h3 className="text-[16px] font-extrabold m-0" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
                        Attendance Records
                      </h3>
                      <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500 mt-1 block">
                        {attendance.length} total check-ins
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Search size={15} />
                        </span>
                        <input
                          type="text"
                          value={attSearch}
                          onChange={e => {
                            setAttSearch(e.target.value)
                            setAttPage(1)
                          }}
                          placeholder="Search attendance..."
                          className="pl-9 pr-8 py-2 rounded-xl text-[12.5px] font-semibold outline-none w-56 transition-all duration-200 border"
                          style={{
                            background: dark ? '#0f1e30' : '#f8fafc',
                            borderColor: dark ? '#1a3050' : '#cbd5e1',
                            color: dark ? '#e8f0fe' : '#0f172a',
                          }}
                          onFocus={e => e.currentTarget.style.borderColor = BRAND}
                          onBlur={e => e.currentTarget.style.borderColor = dark ? '#1a3050' : '#cbd5e1'}
                        />
                        {attSearch && (
                          <button
                            onClick={() => {
                              setAttSearch('')
                              setAttPage(1)
                            }}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-transparent border-none"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto transition-height" style={{ minHeight: '325px' }}>
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr style={{ background: dark ? '#060e1c' : '#f8fafc', borderBottom: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}>
                          <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Student</th>
                          <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Roll No</th>
                          <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Check-in</th>
                          <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Attendance ID</th>
                          <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                        </tr>
                      </thead>
                      <tbody key={`${attPage}-${attSearch}`}>
                        {paginatedAtt.length === 0 ? (
                          <tr className="animate-slide-up-fade">
                            <td colSpan="5" className="p-12 text-center text-[13.5px]" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                              No matching attendance records found.
                            </td>
                          </tr>
                        ) : (
                          paginatedAtt.map((row, i) => {
                            let statusColor = { bg: '#e2e8f0', text: '#475569' }
                            if (row.status === 'Present') {
                              statusColor = {
                                bg: dark ? 'rgba(16, 185, 129, 0.15)' : '#e6fbf2',
                                text: '#00BC7D',
                              }
                            } else if (row.status === 'Late') {
                              statusColor = {
                                bg: dark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
                                text: '#d97706',
                              }
                            } else if (row.status === 'Absent') {
                              statusColor = {
                                bg: dark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
                                text: '#ef4444',
                              }
                            }

                            return (
                              <tr 
                                key={row.id} 
                                className="border-b last:border-b-0 transition-colors animate-slide-up-fade"
                                style={{ 
                                  borderColor: dark ? '#1a3050' : '#e2e8f0',
                                  animationDelay: `${i * 40}ms`
                                }}
                              >
                                <td className="p-4 text-[13.5px] font-bold text-slate-900 dark:text-slate-100">{row.studentName}</td>
                                <td className="p-4 text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">{row.rollNo}</td>
                                <td className="p-4 text-[13.5px] font-medium text-slate-600 dark:text-slate-300">{row.checkIn}</td>
                                <td className="p-4 text-[13.5px] font-medium text-slate-600 dark:text-slate-300">
                                  <span className="font-mono text-[11.5px] bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/50" title={row.id}>
                                    {row.id ? `${row.id.slice(0, 8)}...` : '-'}
                                  </span>
                                </td>
                                <td className="p-4 text-[13.5px]">
                                  <span 
                                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                                    style={{ background: statusColor.bg, color: statusColor.text }}
                                  >
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Table Pagination Bar ── */}
                  <div 
                    className="flex items-center justify-between flex-wrap gap-4 px-6 py-4"
                    style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}
                  >
                    {/* Showing status & Items per page */}
                    <div className="flex items-center gap-4">
                      <span className="text-[12.5px] font-medium" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                        Showing <strong style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{totalAttItems > 0 ? attStartIndex + 1 : 0}</strong> to{' '}
                        <strong style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{attEndIndex}</strong> of{' '}
                        <strong style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{totalAttItems}</strong> entries
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500">Per page:</span>
                        <select
                          value={attPerPage}
                          onChange={e => {
                            setAttPerPage(Number(e.target.value))
                            setAttPage(1)
                          }}
                          className="px-2.5 py-1 rounded-lg text-[12px] font-bold outline-none cursor-pointer border"
                          style={{
                            background: dark ? '#0f1e30' : '#ffffff',
                            borderColor: dark ? '#1a3050' : '#cbd5e1',
                            color: dark ? '#e8f0fe' : '#334155'
                          }}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>

                    {/* Pagination Page Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setAttPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentAttPage === 1}
                        className="p-1.5 rounded-lg border bg-transparent cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                          borderColor: dark ? '#1a3050' : '#e2e8f0',
                          color: dark ? '#e8f0fe' : '#475569'
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {Array.from({ length: totalAttPages }, (_, i) => i + 1).map(page => {
                        const active = page === currentAttPage
                        return (
                          <button
                            key={page}
                            onClick={() => setAttPage(page)}
                            className="w-8 h-8 rounded-lg text-[12.5px] font-extrabold cursor-pointer transition-all border-none"
                            style={{
                              background: active ? BRAND : (dark ? '#0f1e30' : '#f1f5f9'),
                              color: active ? '#ffffff' : (dark ? '#7a98bb' : '#475569'),
                              boxShadow: active ? '0 3px 10px rgba(97,95,255,0.3)' : 'none'
                            }}
                          >
                            {page}
                          </button>
                        )
                      })}

                      <button
                        onClick={() => setAttPage(prev => Math.min(prev + 1, totalAttPages))}
                        disabled={currentAttPage === totalAttPages || totalAttPages === 0}
                        className="p-1.5 rounded-lg border bg-transparent cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                          borderColor: dark ? '#1a3050' : '#e2e8f0',
                          color: dark ? '#e8f0fe' : '#475569'
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'Analytics' && (() => {
          const regs = analyticsData?.registrations || {}
          const att = analyticsData?.attendance || {}
          const certs = analyticsData?.certificates || {}
          
          const regTotal = regs.total ?? registrations.length ?? 0
          const regConfirmed = regs.confirmed ?? registrations.filter(r => {
            const s = String(r.status || r.registrationStatus || r.registration_status || '').trim().toLowerCase()
            return s === 'approved' || s === 'completed' || s === 'confirmed'
          }).length
          const regPending = regs.pending ?? registrations.filter(r => {
            const s = String(r.status || r.registrationStatus || r.registration_status || '').trim().toLowerCase()
            return s === 'pending' || s === ''
          }).length
          const regCancelled = regs.cancelled ?? registrations.filter(r => {
            const s = String(r.status || r.registrationStatus || r.registration_status || '').trim().toLowerCase()
            return s === 'rejected' || s === 'cancelled'
          }).length
          
          const attPresent = att.present ?? attendance.filter(a => a.status === 'Present').length
          const attAbsent = att.absent ?? attendance.filter(a => a.status === 'Absent').length
          const attPercentage = att.percentage ?? (attPresent + attAbsent > 0 ? ((attPresent / (attPresent + attAbsent)) * 100).toFixed(1) : 0)
          
          const certsGenerated = certs.generated ?? 0
          
          return (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {loadingAnalytics ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 size={32} className="animate-spin text-indigo-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Registrations Card */}
                  <div 
                    className="rounded-2xl p-6 border flex flex-col justify-between transition-all hover:scale-[1.01] duration-300"
                    style={{ 
                      borderColor: dark ? '#1a3050' : '#e2e8f0', 
                      background: dark ? 'linear-gradient(145deg, #0f1e30 0%, #0b1524 100%)' : '#ffffff',
                      boxShadow: dark ? 'none' : '0 10px 25px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[12px] font-black uppercase tracking-wider text-slate-400">Registrations</span>
                        <Users size={18} className="text-indigo-500" />
                      </div>
                      <div className="text-[36px] font-black tracking-tight leading-none mb-4" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
                        {regTotal}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2.5 border-t pt-4" style={{ borderColor: dark ? '#1a3050' : '#f1f5f9' }}>
                      <div className="flex items-center justify-between text-[13px] font-bold">
                        <span className="flex items-center gap-1.5 text-emerald-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Confirmed
                        </span>
                        <span style={{ color: dark ? '#e8f0fe' : '#475569' }}>{regConfirmed}</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px] font-bold">
                        <span className="flex items-center gap-1.5 text-amber-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending
                        </span>
                        <span style={{ color: dark ? '#e8f0fe' : '#475569' }}>{regPending}</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px] font-bold">
                        <span className="flex items-center gap-1.5 text-rose-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Cancelled
                        </span>
                        <span style={{ color: dark ? '#e8f0fe' : '#475569' }}>{regCancelled}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Card */}
                  <div 
                    className="rounded-2xl p-6 border flex flex-col justify-between transition-all hover:scale-[1.01] duration-300"
                    style={{ 
                      borderColor: dark ? '#1a3050' : '#e2e8f0', 
                      background: dark ? 'linear-gradient(145deg, #0f1e30 0%, #0b1524 100%)' : '#ffffff',
                      boxShadow: dark ? 'none' : '0 10px 25px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[12px] font-black uppercase tracking-wider text-slate-400">Attendance</span>
                        <Clock size={18} className="text-emerald-500" />
                      </div>
                      <div className="text-[36px] font-black tracking-tight leading-none mb-4 flex items-baseline gap-1.5" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
                        {attPercentage}%
                        <span className="text-[12px] font-bold text-slate-400">ratio</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2.5 border-t pt-4" style={{ borderColor: dark ? '#1a3050' : '#f1f5f9' }}>
                      <div className="flex items-center justify-between text-[13px] font-bold">
                        <span className="flex items-center gap-1.5 text-emerald-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Present
                        </span>
                        <span style={{ color: dark ? '#e8f0fe' : '#475569' }}>{attPresent}</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px] font-bold">
                        <span className="flex items-center gap-1.5 text-rose-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Absent
                        </span>
                        <span style={{ color: dark ? '#e8f0fe' : '#475569' }}>{attAbsent}</span>
                      </div>
                    </div>
                  </div>

                  {/* Certificates Card */}
                  <div 
                    className="rounded-2xl p-6 border flex flex-col justify-between transition-all hover:scale-[1.01] duration-300"
                    style={{ 
                      borderColor: dark ? '#1a3050' : '#e2e8f0', 
                      background: dark ? 'linear-gradient(145deg, #0f1e30 0%, #0b1524 100%)' : '#ffffff',
                      boxShadow: dark ? 'none' : '0 10px 25px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[12px] font-black uppercase tracking-wider text-slate-400">Certificates Issued</span>
                        <Award size={18} className="text-amber-500" />
                      </div>
                      <div className="text-[36px] font-black tracking-tight leading-none mb-4" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
                        {certsGenerated}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 border-t pt-4" style={{ borderColor: dark ? '#1a3050' : '#f1f5f9' }}>
                      <p className="text-[12px] font-medium m-0 leading-relaxed" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                        Digital certificates are automatically distributed upon verified event check-in and completion.
                      </p>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )
        })()}

        {activeTab === 'Certificates' && (
          <div 
            className="rounded-2xl p-6 border text-center"
            style={{ 
              borderColor: dark ? '#1a3050' : '#e2e8f0', 
              background: dark ? '#0f1e30' : '#ffffff' 
            }}
          >
            <Award size={40} className="mx-auto mb-3" style={{ color: BRAND }} />
            <h3 className="text-[16px] font-extrabold m-0 mb-2" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
              Certificate Generation
            </h3>
            <p className="text-[13.5px] max-w-md mx-auto leading-relaxed mb-5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
              Create and distribute digital certificates of participation. You can trigger automated email delivery to all attendees who completed check-in.
            </p>
            <button
              className="px-5 py-2.5 rounded-xl text-[12.5px] font-bold text-white border-none cursor-pointer transition-all duration-200"
              style={{ background: BRAND, boxShadow: '0 4px 14px rgba(97,95,255,0.4)' }}
            >
              Issue Certificates
            </button>
          </div>
        )}

        {activeTab === 'Gallery' && (
          <div 
            className="rounded-2xl p-6 border text-center"
            style={{ 
              borderColor: dark ? '#1a3050' : '#e2e8f0', 
              background: dark ? '#0f1e30' : '#ffffff' 
            }}
          >
            <Image size={40} className="mx-auto mb-3" style={{ color: BRAND }} />
            <h3 className="text-[16px] font-extrabold m-0 mb-2" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
              Event Gallery
            </h3>
            <p className="text-[13.5px] max-w-sm mx-auto leading-relaxed mb-0" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
              Upload event photos and media. Shared images will be visible in the student mobile application feed.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
