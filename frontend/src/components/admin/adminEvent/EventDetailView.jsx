import React, { useState, useEffect } from 'react'
import { 
  ChevronLeft, Pencil, Clock, MapPin, Users, Loader2, Check, XCircle, BarChart2, Award, Image 
} from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../../data/dashboardData'
import eventsService from '../../../services/eventsService'

export default function EventDetailView({ event, onBack, onEdit, tokens, showToast }) {
  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND
  const [activeTab, setActiveTab] = useState('Overview')
  const [registrations, setRegistrations] = useState([])
  const [loadingRegs, setLoadingRegs] = useState(false)
  const [attendance, setAttendance] = useState([])
  const [loadingAtt, setLoadingAtt] = useState(false)

  const loadRegistrations = async () => {
    setLoadingRegs(true)
    const res = await eventsService.fetchRegistrations(event.id)
    if (res.success) {
      setRegistrations(res.registrations)
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

  useEffect(() => {
    loadRegistrations()
    loadAttendance()
  }, [event.id])

  const handleStatusChange = async (regId, status) => {
    const res = await eventsService.updateRegistrationStatus(regId, status)
    if (res.success) {
      showToast(`Registration status updated to ${status}.`, 'success')
      setRegistrations(prev =>
        prev.map(r => r.id === regId ? { ...r, status } : r)
      )
      
      let change = 0
      const oldReg = registrations.find(r => r.id === regId)
      if (oldReg) {
        if (oldReg.status !== 'Approved' && status === 'Approved') change = 1
        else if (oldReg.status === 'Approved' && status !== 'Approved') change = -1
      }
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
    switch (status) {
      case 'Approved':
        return {
          bg: dark ? 'rgba(16, 185, 129, 0.15)' : '#e6fbf2',
          text: '#00BC7D',
        }
      case 'Pending':
        return {
          bg: dark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
          text: '#d97706',
        }
      case 'Rejected':
        return {
          bg: dark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
          text: '#ef4444',
        }
      default:
        return {
          bg: dark ? '#162640' : '#f1f5f9',
          text: dark ? '#7a98bb' : '#64748b',
        }
    }
  }

  const badge = getStatusStyle(event.status)
  const isApproved = (event.approvalStatus || 'Approved') === 'Approved'
  const effectiveRegs = isApproved ? (event.registrationsCount || 0) : 0
  const regPercent = isApproved && event.capacity ? Math.min(Math.round((effectiveRegs / event.capacity) * 100), 100) : 0
  const remaining = isApproved ? Math.max(event.capacity - effectiveRegs, 0) : event.capacity

  // Sub-tabs list
  const tabs = ['Overview', 'Registrations', 'Attendance', 'Analytics', 'Certificates', 'Gallery']

  return (
    <div className="animate-fadeIn m-4" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
      
      {/* ── TOP HEADER ROW ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
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
              <Users size={15} /> {event.registrationsCount} / {event.capacity} registered
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
                    { label: 'Registered', value: `${event.registrationsCount} students` },
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
                  <span>{event.registrationsCount} registered</span>
                  <span>{remaining} remaining</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'Registrations' && (
          <div 
            className="rounded-2xl p-6 border overflow-x-auto"
            style={{ 
              borderColor: dark ? '#1a3050' : '#e2e8f0', 
              background: dark ? '#0f1e30' : '#ffffff' 
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-extrabold m-0" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
                Registered Students List
              </h3>
              <span className="px-3 py-1 rounded-full text-[11.5px] font-bold" style={{ background: `${BRAND}15`, color: BRAND }}>
                {registrations.length} registrations
              </span>
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}>
                    <th className="py-3 text-[11px] font-bold tracking-wider" style={{ color: dark ? '#7a98bb' : '#64748b' }}>STUDENT NAME</th>
                    <th className="py-3 text-[11px] font-bold tracking-wider" style={{ color: dark ? '#7a98bb' : '#64748b' }}>ROLL NO</th>
                    <th className="py-3 text-[11px] font-bold tracking-wider" style={{ color: dark ? '#7a98bb' : '#64748b' }}>DEPARTMENT</th>
                    <th className="py-3 text-[11px] font-bold tracking-wider" style={{ color: dark ? '#7a98bb' : '#64748b' }}>YEAR</th>
                    <th className="py-3 text-[11px] font-bold tracking-wider" style={{ color: dark ? '#7a98bb' : '#64748b' }}>DATE</th>
                    <th className="py-3 text-[11px] font-bold tracking-wider" style={{ color: dark ? '#7a98bb' : '#64748b' }}>STATUS</th>
                    <th className="py-3 text-[11px] font-bold tracking-wider" style={{ color: dark ? '#7a98bb' : '#64748b' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: dark ? '#1a3050' : '#e2e8f0' }}>
                  {registrations.map((att, i) => {
                    const statusBadge = getRegStatusStyle(att.status)
                    return (
                      <tr key={att.id} style={{ borderBottom: i < registrations.length - 1 ? `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` : 'none' }}>
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
                        <td className="py-3.5 text-[13px]">
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => handleStatusChange(att.id, 'Approved')}
                              className="w-7 h-7 rounded-lg bg-transparent border-none cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              style={{ color: dark ? '#7a98bb' : '#64748b' }}
                              title="Approve"
                            >
                              <Check size={16} className="hover:text-emerald-500 transition-colors" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(att.id, 'Rejected')}
                              className="w-7 h-7 rounded-lg bg-transparent border-none cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              style={{ color: dark ? '#7a98bb' : '#64748b' }}
                              title="Reject"
                            >
                              <XCircle size={16} className="hover:text-rose-500 transition-colors" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
                  className="rounded-2xl border overflow-x-auto"
                  style={{
                    borderColor: dark ? '#1a3050' : '#e2e8f0', 
                    background: dark ? '#0f1e30' : '#ffffff' 
                  }}
                >
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr style={{ background: dark ? '#060e1c' : '#f8fafc', borderBottom: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}>
                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Student</th>
                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Roll No</th>
                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Check-in</th>
                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Check-out</th>
                        <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((row) => {
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
                            className="border-b last:border-b-0 transition-colors"
                            style={{ 
                              borderColor: dark ? '#1a3050' : '#e2e8f0',
                            }}
                          >
                            <td className="p-4 text-[13.5px] font-bold text-slate-900 dark:text-slate-100">{row.studentName}</td>
                            <td className="p-4 text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">{row.rollNo}</td>
                            <td className="p-4 text-[13.5px] font-medium text-slate-600 dark:text-slate-300">{row.checkIn}</td>
                            <td className="p-4 text-[13.5px] font-medium text-slate-600 dark:text-slate-300">{row.checkOut}</td>
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
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'Analytics' && (
          <div 
            className="rounded-2xl p-6 border text-center"
            style={{ 
              borderColor: dark ? '#1a3050' : '#e2e8f0', 
              background: dark ? '#0f1e30' : '#ffffff' 
            }}
          >
            <BarChart2 size={40} className="mx-auto mb-3" style={{ color: BRAND }} />
            <h3 className="text-[16px] font-extrabold m-0 mb-2" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
              Event Insights & Analytics
            </h3>
            <p className="text-[13.5px] max-w-sm mx-auto leading-relaxed m-0" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
              Detailed registration timelines, department conversions, and post-event attendance ratios are processing.
            </p>
          </div>
        )}

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
