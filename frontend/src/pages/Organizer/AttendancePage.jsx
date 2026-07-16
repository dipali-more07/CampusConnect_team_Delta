import { useState, useEffect, useRef, useCallback } from 'react'
import {
  QrCode, Activity, BarChart2,
  Users, UserX, Percent, Clock
} from 'lucide-react'
import attendanceService from '../../services/attendanceService'
import eventsService from '../../services/eventsService'
import studentsService from '../../services/studentsService'
import { ATTENDANCE_EVENTS } from '../../data/attendanceData'
import { BRAND as DEFAULT_BRAND } from '../../data/dashboardData'
import { useToast } from '../../context/ToastContext'

// Sub-components
import AttendanceStats from '../../components/admin/adminAttendance/AttendanceStats'
import AttendanceTabQR from '../../components/admin/adminAttendance/AttendanceTabQR'
import AttendanceTabMonitor from '../../components/admin/adminAttendance/AttendanceTabMonitor'
import AttendanceTabReports from '../../components/admin/adminAttendance/AttendanceTabReports'

/* ─── Tabs config ─── */
const TABS = [
  { id: 'qr', label: 'Generate QR', Icon: QrCode },
  { id: 'monitor', label: 'Live Monitor', Icon: Activity },
  { id: 'reports', label: 'Reports', Icon: BarChart2 },
]

export default function AttendancePage({ tokens }) {
  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND
  const showToast = useToast()

  /* shared state */
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('cc_attendance_active_tab')
    return (saved && saved !== 'scan') ? saved : 'qr'
  })

  useEffect(() => {
    localStorage.setItem('cc_attendance_active_tab', activeTab)
  }, [activeTab])

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [eventsList, setEventsList] = useState([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [students, setStudents] = useState([])

  /* qr state */
  const [qrGenerated, setQrGenerated] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrImageUrl, setQrImageUrl] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef(null)

  // Fetch events list
  useEffect(() => {
    eventsService.fetchAll().then(res => {
      if (res.success && Array.isArray(res.events)) {
        const mapped = res.events.map(ev => ({
          id: ev.id || ev.event_id,
          name: ev.name || ev.event_name || ev.title || 'Untitled Event'
        }))
        setEventsList(mapped)
        if (mapped.length > 0) {
          setSelectedEvent(mapped[0].id)
        }
      } else {
        setEventsList(ATTENDANCE_EVENTS)
        if (ATTENDANCE_EVENTS.length > 0) {
          setSelectedEvent(ATTENDANCE_EVENTS[0].id)
        }
      }
    }).catch(err => {
      console.error(err)
      setEventsList(ATTENDANCE_EVENTS)
      if (ATTENDANCE_EVENTS.length > 0) {
        setSelectedEvent(ATTENDANCE_EVENTS[0].id)
      }
    })
  }, [])

  // Clear QR image when event changes
  useEffect(() => {
    setQrGenerated(false)
    if (qrImageUrl) {
      URL.revokeObjectURL(qrImageUrl)
      setQrImageUrl(null)
    }
  }, [selectedEvent])

  // Revoke URL on unmount
  useEffect(() => {
    return () => {
      if (qrImageUrl) {
        URL.revokeObjectURL(qrImageUrl)
      }
    }
  }, [qrImageUrl])

  /* start countdown when QR is generated */
  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    const expiresAt = Date.now() + (8 * 3600 + 32 * 60 + 14) * 1000
    setCountdown(Math.floor((expiresAt - Date.now()) / 1000))
    countdownRef.current = setInterval(() => {
      const secs = Math.floor((expiresAt - Date.now()) / 1000)
      if (secs <= 0) { clearInterval(countdownRef.current); setCountdown(0) }
      else setCountdown(secs)
    }, 1000)
  }, [])

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current) }, [])

  const fmtCountdown = (s) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0')
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  /* live monitor chart state */
  const [chartData, setChartData] = useState([])
  const [chartLoading, setChartLoading] = useState(false)

  const loadChart = async (evtId) => {
    setChartLoading(true)
    const res = await attendanceService.fetchLiveChart(evtId || selectedEvent)
    if (res.success) setChartData(res.chart)
    setChartLoading(false)
  }

  /* dept state */
  const [deptData, setDeptData] = useState([])
  const [deptLoading, setDeptLoading] = useState(false)

  const loadDeptData = async (evtId) => {
    setDeptLoading(true)
    const res = await attendanceService.fetchDeptAttendance(evtId || selectedEvent)
    if (res.success) setDeptData(res.depts)
    setDeptLoading(false)
  }

  /* table state */
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [updatingId, setUpdatingId] = useState(null)
  const [registrations, setRegistrations] = useState([])

  /* fetch */
  const loadRegistrations = async (evtId) => {
    const [res, stuRes] = await Promise.all([
      eventsService.fetchRegistrations(evtId || selectedEvent),
      studentsService.fetchAll()
    ])
    if (stuRes.success) setStudents(stuRes.students || [])
    if (res.success) setRegistrations(res.registrations || [])
  }

  const loadRecords = async (evtId) => {
    setLoading(true)
    const res = await attendanceService.fetchAll(evtId || selectedEvent)
    if (res.success) setRecords(res.records)
    else showToast(res.message || 'Failed to load attendance.', 'error')
    setLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'monitor' || activeTab === 'reports') {
      loadRegistrations(selectedEvent)
      loadRecords(selectedEvent)
    }
  }, [selectedEvent, activeTab])

  useEffect(() => {
    if (activeTab === 'monitor' || activeTab === 'reports') loadChart(selectedEvent)
  }, [selectedEvent, activeTab])

  useEffect(() => {
    if (activeTab === 'reports') loadDeptData(selectedEvent)
  }, [selectedEvent, activeTab])

  /* stats */
  const mappedRecords = records.map(r => {
    const reg = registrations.find(regItem => (regItem.id === r.registrationId) || (regItem.registration_id === r.registrationId))
    const student = reg ? students.find(s => s.id === reg.userId || s.id === reg.user_id) : null
    return {
      ...r,
      studentName: r.studentName && r.studentName !== 'Student' && r.studentName.length < 20
        ? r.studentName
        : (student?.name || reg?.studentName || reg?.student_name || reg?.full_name || r.studentName),
      rollNo: r.rollNo && r.rollNo !== 'N/A'
        ? r.rollNo
        : (student?.rollNo || reg?.rollNo || reg?.roll_no || r.rollNo)
    }
  })

  const totalPresent = mappedRecords.filter(r => r.status === 'Present').length
  const totalAbsent = mappedRecords.filter(r => r.status === 'Absent').length
  const totalLate = mappedRecords.filter(r => r.status === 'Late').length
  const pct = mappedRecords.length ? Math.round(((totalPresent + totalLate) / mappedRecords.length) * 100) : 0

  const statsCards = [
    { label: 'Total Present', value: totalPresent, Icon: Users, bg: '#00BC7D' },
    { label: 'Total Absent', value: totalAbsent, Icon: UserX, bg: '#FB2C36' },
    { label: 'Attendance %', value: `${pct}%`, Icon: Percent, bg: '#615FFF' },
    { label: 'Late Entries', value: totalLate, Icon: Clock, bg: '#FE9A00' },
  ]

  /* pagination state */
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  /* filter */
  const filtered = mappedRecords.filter(r => {
    const sm = filterStatus === 'All' || r.status === filterStatus
    const q = search.toLowerCase()
    const tm = !q || r.studentName.toLowerCase().includes(q) || r.rollNo.toLowerCase().includes(q)
    return sm && tm
  })

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterStatus, selectedEvent])

  const totalItems = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedRecords = filtered.slice(startIndex, startIndex + itemsPerPage)

  /* export csv */
  const handleExport = () => {
    try {
      const headers = ['ID', 'Student', 'Roll No', 'Event', 'Check In', 'Check Out', 'Status']
      const rows = filtered.map(r => [r.id, r.studentName, r.rollNo, r.eventName || r.eventId, r.checkIn, r.checkOut, r.status])
      const csv = [headers, ...rows].map(e => e.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      showToast('Exported successfully!', 'success')
    } catch { showToast('Export failed.', 'error') }
  }

  /* styles */
  const card = {
    background: tokens.card,
    border: `1px solid ${tokens.border}`,
    boxShadow: tokens.shadow,
  }
  const inp = {
    border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`,
    background: dark ? '#060e1c' : '#fff',
    color: dark ? '#e8f0fe' : '#0f172a',
  }
  const label = { color: dark ? '#7a98bb' : '#64748b' }

  const badgeStyle = (s) => {
    const map = {
      Present: { bg: dark ? 'rgba(0,188,125,.15)' : '#e6fbf2', text: '#00BC7D' },
      Absent: { bg: dark ? 'rgba(251,44,54,.15)' : '#fee2e2', text: '#FB2C36' },
      Late: { bg: dark ? 'rgba(254,154,0,.15)' : '#fef3c7', text: '#d97706' },
    }
    return map[s] || { bg: dark ? '#162640' : '#f1f5f9', text: dark ? '#7a98bb' : '#64748b' }
  }

  /* Initials from full name e.g. "Arjun Patel" → "AP" */
  const getInitials = (name = '') =>
    name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')

  const selectedEvtName = eventsList.find(e => String(e.id) === String(selectedEvent))?.name || ''

  const handleGenerateQR = async () => {
    if (!selectedEvent) {
      showToast('No event selected.', 'error')
      return
    }
    setQrLoading(true)
    const res = await eventsService.getQRCodeBlob(selectedEvent)
    setQrLoading(false)
    if (res.success && (res.qrUrl || res.blob)) {
      const url = res.qrUrl || URL.createObjectURL(res.blob)
      setQrImageUrl(url)
      setQrGenerated(true)
      startCountdown()
      showToast(`QR generated for ${selectedEvtName}`, 'success')
    } else {
      showToast(res.message || 'Failed to generate QR code.', 'error')
    }
  }

  return (
    <div className="animate-fadeIn p-6" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>

      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>CampusConnect</span><span>&gt;</span>
            <span style={{ color: BRAND }}>Attendance</span>
          </div>
          <h1 className="text-[28px] font-extrabold m-0 tracking-tight">Attendance Management</h1>
          <p className="text-[13px] mt-1 mb-0" style={label}>QR-based contactless attendance system</p>
        </div>

        {/* Global Event Select Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold uppercase tracking-wider" style={label}>Active Event:</span>
          <select
            value={selectedEvent}
            onChange={e => {
              setSelectedEvent(e.target.value)
              setQrGenerated(false)
            }}
            className="px-4 py-2.5 rounded-xl text-[13px] outline-none cursor-pointer border font-bold transition-all hover:opacity-90"
            style={{ ...inp, minWidth: '220px' }}
          >
            {(eventsList || []).map(ev => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* stats */}
      <AttendanceStats statsCards={statsCards} cardStyle={card} />

      {/* tab bar */}
      <div className="flex items-center gap-1 rounded-2xl p-1.5 mb-6 border w-fit" style={{ ...card, padding: '6px' }}>
        {TABS.map(({ id, label: lbl, Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold border-none cursor-pointer transition-all duration-200"
              style={{
                background: active ? BRAND : 'transparent',
                color: active ? '#fff' : (dark ? '#7a98bb' : '#5c6f84'),
                boxShadow: active ? '0 3px 10px rgba(97,95,255,0.3)' : 'none',
              }}
            >
              <Icon size={14} /> {lbl}
            </button>
          )
        })}
      </div>

      {/* ── QR GENERATOR TAB ── */}
      {activeTab === 'qr' && (
        <AttendanceTabQR
          eventsList={eventsList}
          qrImageUrl={qrImageUrl}
          handleGenerateQR={handleGenerateQR}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
          qrGenerated={qrGenerated}
          setQrGenerated={setQrGenerated}
          qrLoading={qrLoading}
          setQrLoading={setQrLoading}
          countdown={countdown}
          startCountdown={startCountdown}
          showToast={showToast}
          selectedEvtName={selectedEvtName}
          dark={dark}
          BRAND={BRAND}
          cardStyle={card}
          inp={inp}
          label={label}
          fmtCountdown={fmtCountdown}
        />
      )}

      {/* ── LIVE MONITOR TAB ── */}
      {activeTab === 'monitor' && (
        <AttendanceTabMonitor
          chartLoading={chartLoading}
          chartData={chartData}
          loading={loading}
          filtered={filtered}
          paginatedRecords={paginatedRecords}
          search={search}
          setSearch={setSearch}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          updatingId={updatingId}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          selectedEvtName={selectedEvtName}
          dark={dark}
          BRAND={BRAND}
          cardStyle={card}
          inp={inp}
          label={label}
          badgeStyle={badgeStyle}
        />
      )}

      {/* ── REPORTS TAB ── */}
      {activeTab === 'reports' && (
        <AttendanceTabReports
          handleExport={handleExport}
          chartLoading={chartLoading}
          chartData={chartData}
          deptLoading={deptLoading}
          deptData={deptData}
          dark={dark}
          BRAND={BRAND}
          card={card}
          inp={inp}
          label={label}
        />
      )}
    </div>
  )
}
