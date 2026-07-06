import { useState, useEffect, useRef, useCallback } from 'react'
import {
  QrCode, ScanLine, Activity, BarChart2,
  Users, UserX, Percent, Clock,
  Download, Search, Loader2, FileText,
  RefreshCw, Wifi,
  Share2, Printer, Camera, Play, ZapOff,
  ChevronLeft, ChevronRight, X
} from 'lucide-react'
import attendanceService from '../../services/attendanceService'
import { ATTENDANCE_EVENTS, ATTENDANCE_SESSIONS } from '../../data/attendanceData'
import { BRAND as DEFAULT_BRAND } from '../../data/dashboardData'
import { useToast } from '../../context/ToastContext'

/* ─── tiny QR placeholder SVG ─── */
function QrPlaceholder({ size = 140, color = '#615FFF' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none">
      <rect x="4" y="4" width="56" height="56" rx="6" stroke={color} strokeWidth="6" fill="none" />
      <rect x="18" y="18" width="28" height="28" rx="3" fill={color} opacity=".25" />
      <rect x="80" y="4" width="56" height="56" rx="6" stroke={color} strokeWidth="6" fill="none" />
      <rect x="94" y="18" width="28" height="28" rx="3" fill={color} opacity=".25" />
      <rect x="4" y="80" width="56" height="56" rx="6" stroke={color} strokeWidth="6" fill="none" />
      <rect x="18" y="94" width="28" height="28" rx="3" fill={color} opacity=".25" />
      <rect x="80" y="80" width="14" height="14" rx="2" fill={color} />
      <rect x="100" y="80" width="14" height="14" rx="2" fill={color} />
      <rect x="120" y="16" width="2" height="14" rx="2" fill={color} />
      <rect x="80" y="100" width="14" height="14" rx="2" fill={color} />
      <rect x="100" y="100" width="36" height="14" rx="2" fill={color} />
      <rect x="80" y="120" width="30" height="16" rx="2" fill={color} />
      <rect x="116" y="120" width="20" height="16" rx="2" fill={color} />
    </svg>
  )
}

/* ─── generate trendline SVG path ─── */
const generateTrendPath = (data) => {
  if (!data || data.length === 0) return { linePath: '', fillPath: '' }
  const MAX = 220
  const width = 800
  const height = 240

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (d.count / MAX) * height
    return { x, y }
  })

  // Start path
  let linePath = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]
    const p1 = points[i]
    // Control points for smooth horizontal bezier curve
    const cp1x = p0.x + (p1.x - p0.x) / 3
    const cp1y = p0.y
    const cp2x = p1.x - (p1.x - p0.x) / 3
    const cp2y = p1.y
    linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`
  }

  const fillPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

  return { linePath, fillPath }
}

/* ─── Tabs config ─── */
const TABS = [
  { id: 'qr', label: 'Generate QR', Icon: QrCode },
  { id: 'scan', label: 'Scan QR', Icon: ScanLine },
  { id: 'monitor', label: 'Live Monitor', Icon: Activity },
  { id: 'reports', label: 'Reports', Icon: BarChart2 },
]

export default function AttendancePage({ tokens }) {
  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND
  const showToast = useToast()

  /* shared state */
  const [activeTab, setActiveTab] = useState('qr')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(ATTENDANCE_EVENTS[0].id)
  const [selectedSession, setSelectedSession] = useState('fullday')

  /* qr state */
  const [qrGenerated, setQrGenerated] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef(null)

  /* scan tab state */
  const [scannerActive, setScannerActive] = useState(false)
  const [recentScans, setRecentScans] = useState([])
  const [scansLoading, setScansLoading] = useState(false)

  /* load recent scans */
  const loadRecentScans = async () => {
    setScansLoading(true)
    const res = await attendanceService.fetchRecentScans()
    if (res.success) setRecentScans(res.scans)
    else showToast(res.message || 'Failed to load scans.', 'error')
    setScansLoading(false)
  }

  useEffect(() => { loadRecentScans() }, [])

  /* start 8h32m14s countdown when QR is generated */
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

  /* fetch */
  const loadRecords = async (evtId) => {
    setLoading(true)
    const res = await attendanceService.fetchAll(evtId || selectedEvent)
    if (res.success) setRecords(res.records)
    else showToast(res.message || 'Failed to load attendance.', 'error')
    setLoading(false)
  }

  useEffect(() => { loadRecords(selectedEvent) }, [selectedEvent])

  useEffect(() => { loadChart(selectedEvent) }, [selectedEvent])

  useEffect(() => { loadDeptData(selectedEvent) }, [selectedEvent])

  /* stats */
  const totalPresent = records.filter(r => r.status === 'Present').length
  const totalAbsent = records.filter(r => r.status === 'Absent').length
  const totalLate = records.filter(r => r.status === 'Late').length
  const pct = records.length ? Math.round(((totalPresent + totalLate) / records.length) * 100) : 0

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
  const filtered = records.filter(r => {
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

  /* mark present */
  const handleMarkPresent = async (id) => {
    setUpdatingId(id)
    const res = await attendanceService.markPresent(id)
    if (res.success) {
      showToast('Marked present!', 'success')
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...res.record } : r))
    } else showToast(res.message || 'Failed.', 'error')
    setUpdatingId(null)
  }

  /* update status */
  const handleUpdateStatus = async (id, status) => {
    setUpdatingId(id)
    const res = await attendanceService.updateStatus(id, status)
    if (res.success) {
      showToast(`Status updated to ${status}`, 'success')
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...res.record } : r))
    } else showToast(res.message || 'Failed.', 'error')
    setUpdatingId(null)
  }

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

  const selectedEvtName = ATTENDANCE_EVENTS.find(e => e.id === selectedEvent)?.name || ''

  return (
    <div className="animate-fadeIn p-6" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>

      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>EventHub</span><span>&gt;</span>
            <span style={{ color: BRAND }}>Attendance</span>
          </div>
          <h1 className="text-[28px] font-extrabold m-0 tracking-tight">Attendance Management</h1>
          <p className="text-[13px] mt-1 mb-0" style={label}>QR-based contactless attendance system</p>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {statsCards.map(({ label: lbl, value, Icon, bg }) => (
          <div key={lbl} className="rounded-2xl p-3 flex items-center gap-4 border" style={card}>
            <div style={{ background: bg }} className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0">
              <Icon size={20} />
            </div>
            <div>
              <div className="text-[26px] font-black">{value}</div>
              <div className="text-[12.5px] font-semibold text-slate-400 mt-0.5">{lbl}</div>
            </div>
          </div>
        ))}
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* left: form */}
          <div className="rounded-2xl p-6 border" style={card}>
            <h2 className="text-[17px] font-extrabold mb-5">QR Code Generator</h2>

            <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={label}>Select Event</label>
            <select
              value={selectedEvent}
              onChange={e => { setSelectedEvent(e.target.value); setQrGenerated(false) }}
              className="w-full px-3 py-2.5 rounded-xl text-[13px] mb-4 outline-none cursor-pointer"
              style={inp}
            >
              {ATTENDANCE_EVENTS.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>

            <label className="block text-[12px] font-bold uppercase tracking-wider mb-2" style={label}>Session</label>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {ATTENDANCE_SESSIONS.map(s => {
                const active = selectedSession === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSession(s.id); setQrGenerated(false) }}
                    className="py-2.5 px-3 rounded-xl text-[12.5px] font-semibold border cursor-pointer transition-all"
                    style={{
                      background: active ? `${BRAND}15` : (dark ? '#060e1c' : '#f8fafc'),
                      borderColor: active ? BRAND : (dark ? '#1a3050' : '#e2e8f0'),
                      color: active ? BRAND : (dark ? '#7a98bb' : '#64748b'),
                    }}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>

            <button
              onClick={async () => {
                setQrLoading(true)
                await new Promise(r => setTimeout(r, 900))
                setQrLoading(false)
                setQrGenerated(true)
                startCountdown()
                showToast(`QR generated for ${selectedEvtName}`, 'success')
              }}
              className="w-full py-3 rounded-xl text-[14px] font-bold text-white border-none cursor-pointer transition-all flex items-center justify-center gap-2"
              style={{ background: BRAND, boxShadow: '0 4px 16px rgba(97,95,255,0.35)' }}
            >
              {qrLoading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
              {qrLoading ? 'Generating…' : 'Generate QR Code'}
            </button>
          </div>

          {/* right: preview */}
          <div className="rounded-2xl p-6 border flex flex-col items-center justify-center min-h-[280px] gap-0" style={card}>
            {qrGenerated ? (
              <>
                {/* QR image */}
                <div className="mb-5 p-3 rounded-2xl" style={{ background: dark ? '#060e1c' : '#f8fafc' }}>
                  <QrPlaceholder size={160} color={dark ? '#e8f0fe' : '#0f172a'} />
                </div>

                {/* event name */}
                <p className="text-[15px] font-extrabold mb-1 text-center">{selectedEvtName}</p>

                {/* validity */}
                <p className="text-[12px] font-semibold mb-5 text-center" style={label}>
                  Valid for today
                  {countdown > 0 && (
                    <span> · Expires in <span style={{ color: BRAND, fontVariantNumeric: 'tabular-nums' }}>{fmtCountdown(countdown)}</span></span>
                  )}
                </p>

                {/* action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast('QR code downloaded!', 'success')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold border cursor-pointer transition-all hover:opacity-80"
                    style={inp}
                  >
                    <Download size={13} style={label} /> Download
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: selectedEvtName, text: 'Attendance QR Code' }).catch(() => { })
                      } else {
                        navigator.clipboard.writeText(window.location.href)
                        showToast('Link copied to clipboard!', 'success')
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold border cursor-pointer transition-all hover:opacity-80"
                    style={inp}
                  >
                    <Share2 size={13} style={label} /> Share Link
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold border cursor-pointer transition-all hover:opacity-80"
                    style={inp}
                  >
                    <Printer size={13} style={label} /> Print
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-3 opacity-20"><QrPlaceholder size={100} color={dark ? '#7a98bb' : '#94a3b8'} /></div>
                <p className="text-[13px] font-semibold" style={label}>Select an event and generate a QR code</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── SCAN QR TAB ── */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── Left: Camera View ── */}
          <div className="rounded-2xl border overflow-hidden flex flex-col" style={card}>
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-[17px] font-extrabold m-0">QR Scanner</h2>
            </div>

            {/* Camera viewport */}
            <div
              className="mx-5 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-3 flex-1"
              style={{
                background: '#0d1117',
                minHeight: 260,
                border: `1px solid ${scannerActive ? BRAND : '#1e2d3d'}`,
                boxShadow: scannerActive ? `0 0 0 2px ${BRAND}40` : 'none',
                transition: 'all .3s',
              }}
            >
              {scannerActive ? (
                <>
                  {/* Scanning animation */}
                  <div className="relative w-32 h-32">
                    <div
                      className="absolute inset-0 rounded-xl border-2 opacity-60"
                      style={{ borderColor: BRAND }}
                    />
                    {/* corner brackets */}
                    {[['top-0 left-0', 'border-t-2 border-l-2'], ['top-0 right-0', 'border-t-2 border-r-2'], ['bottom-0 left-0', 'border-b-2 border-l-2'], ['bottom-0 right-0', 'border-b-2 border-r-2']].map(([pos, cls], i) => (
                      <div key={i} className={`absolute w-5 h-5 ${pos} ${cls} rounded-sm`} style={{ borderColor: BRAND }} />
                    ))}
                    {/* scanning line */}
                    <div
                      className="absolute left-2 right-2 h-0.5 rounded-full"
                      style={{
                        background: BRAND,
                        animation: 'scanLine 1.8s ease-in-out infinite',
                        top: '50%',
                      }}
                    />
                    <ScanLine size={32} className="absolute inset-0 m-auto" style={{ color: BRAND, opacity: 0.5 }} />
                  </div>
                  <p className="text-[13px] font-semibold" style={{ color: BRAND }}>Scanning… Point at QR code</p>
                </>
              ) : (
                <>
                  <Camera size={36} className="opacity-30" style={{ color: '#7a98bb' }} />
                  <p className="text-[13px] font-semibold opacity-50" style={{ color: '#7a98bb' }}>Camera not active</p>
                </>
              )}
            </div>

            {/* Start / Stop button */}
            <div className="p-5">
              <button
                onClick={() => {
                  setScannerActive(prev => {
                    if (!prev) showToast('Scanner started!', 'success')
                    else showToast('Scanner stopped.', 'info')
                    return !prev
                  })
                }}
                className="w-full py-3 rounded-xl text-[14px] font-bold text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all"
                style={{
                  background: scannerActive ? '#FB2C36' : BRAND,
                  boxShadow: `0 4px 16px ${scannerActive ? 'rgba(251,44,54,.35)' : 'rgba(97,95,255,.35)'}`,
                }}
              >
                {scannerActive ? <ZapOff size={16} /> : <Play size={16} />}
                {scannerActive ? 'Stop Scanner' : 'Start Scanner'}
              </button>
            </div>
          </div>

          {/* ── Right: Recent Scans ── */}
          <div className="rounded-2xl border flex flex-col" style={card}>
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <h2 className="text-[17px] font-extrabold m-0">Recent Scans</h2>
              <button
                onClick={loadRecentScans}
                className="w-8 h-8 rounded-lg flex items-center justify-center border cursor-pointer transition-all hover:opacity-70"
                style={inp}
                title="Refresh"
              >
                <RefreshCw size={13} style={label} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1" style={{ maxHeight: 360 }}>
              {scansLoading ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 border-t" style={{ borderColor: dark ? '#1a3050' : '#f1f5f9' }}>
                    <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: dark ? '#1a3050' : '#f1f5f9', flexShrink: 0 }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 rounded animate-pulse w-28" style={{ background: dark ? '#1a3050' : '#f1f5f9' }} />
                      <div className="h-2.5 rounded animate-pulse w-20" style={{ background: dark ? '#1a3050' : '#f1f5f9' }} />
                    </div>
                  </div>
                ))
              ) : recentScans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <ScanLine size={32} className="text-slate-400 opacity-40" />
                  <p className="text-[13px] font-semibold" style={label}>No scans yet</p>
                </div>
              ) : recentScans.map((scan, idx) => {
                const badge = badgeStyle(scan.status)
                return (
                  <div
                    key={scan.id}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/30"
                    style={{ borderTop: idx === 0 ? 'none' : `1px solid ${dark ? '#1a3050' : '#f1f5f9'}` }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-extrabold shrink-0"
                      style={{ background: scan.avatarColor }}
                    >
                      {getInitials(scan.studentName)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-bold m-0 truncate">{scan.studentName}</p>
                      <p className="text-[12px] font-semibold m-0 truncate" style={label}>{scan.rollNo}</p>
                    </div>

                    {/* Status + time */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: badge.bg, color: badge.text }}
                      >
                        {scan.status}
                      </span>
                      <span className="text-[11px] font-semibold" style={label}>{scan.time}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* footer count */}
            {!scansLoading && recentScans.length > 0 && (
              <div className="px-5 py-3 text-[12px] font-semibold border-t flex items-center gap-2"
                style={{ borderColor: dark ? '#1a3050' : '#f1f5f9', color: dark ? '#7a98bb' : '#94a3b8' }}>
                <Wifi size={11} style={{ color: BRAND }} />
                {recentScans.length} scans recorded this session
              </div>
            )}
          </div>
        </div>
      )}

      {/* scanning line keyframe */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 10% }
          50%  { top: 85% }
          100% { top: 10% }
        }
      `}</style>


      {/* ── LIVE MONITOR TAB ── */}
      {activeTab === 'monitor' && (
        <div className="space-y-5">

          {/* ── BAR CHART CARD ── */}
          <div className="rounded-2xl border p-6" style={card}>
            {/* chart header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-extrabold m-0">
                Live Attendance — <span style={{ color: BRAND }}>{selectedEvtName}</span>
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00BC7D' }} />
                <span className="text-[12px] font-bold" style={{ color: '#00BC7D' }}>Live</span>
              </div>
            </div>

            {chartLoading ? (
              <div className="flex items-end gap-2 h-[200px] pt-6">
                {Array(11).fill(0).map((_, i) => (
                  <div key={i} className="flex-1 rounded-t-lg animate-pulse"
                    style={{ height: `${30 + Math.random() * 60}%`, background: dark ? '#1a3050' : '#f1f5f9' }} />
                ))}
              </div>
            ) : (() => {
              const MAX = 220
              const yTicks = [0, 55, 110, 165, 220]
              const CHART_H = 240  // Fixed px height

              return (
                <div className="w-full pl-8 pr-2 pt-4">
                  <div className="flex flex-col w-full">

                    {/* Chart area */}
                    <div className="relative w-full" style={{ height: CHART_H }}>

                      {/* Horizontal grid lines & Y-labels */}
                      {yTicks.map(t => (
                        <div
                          key={t}
                          className="absolute left-0 right-0 flex items-center"
                          style={{
                            bottom: `${(t / MAX) * 100}%`,
                            height: 1,
                            background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                          }}
                        >
                          <span
                            className="absolute text-[11px] font-semibold text-right pr-3"
                            style={{ ...label, width: 40, left: -40, top: '50%', transform: 'translateY(-50%)' }}
                          >
                            {t}
                          </span>
                        </div>
                      ))}

                      {/* Bars */}
                      <div className="absolute inset-0 flex items-end gap-2 sm:gap-3 z-10">
                        {chartData.map(({ hour, count }) => {
                          const heightPct = Math.max((count / MAX) * 100, 1)
                          return (
                            <div key={hour} className="flex-1 flex flex-col items-center justify-end h-full group">
                              <div
                                className="w-full rounded-t-md transition-all duration-700 relative cursor-pointer"
                                style={{
                                  height: `${heightPct}%`,
                                  background: '#6366f1',
                                  opacity: 0.95,
                                }}
                                title={`${hour}: ${count} check-ins`}
                              >
                                {/* hover tooltip */}
                                <div
                                  className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded text-[11px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md"
                                  style={{ background: '#4f46e5' }}
                                >
                                  {count}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* X-axis labels */}
                    <div className="flex gap-2 sm:gap-3 mt-3 z-10">
                      {chartData.map(({ hour }) => (
                        <div key={hour} className="flex-1 text-center text-[10.5px] font-semibold" style={label}>
                          {hour}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* ── ATTENDANCE TABLE ── */}
          <div className="rounded-2xl overflow-hidden border" style={card}>

            {/* ── Search & Filter Header Bar ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b" style={{ borderColor: dark ? '#1a3050' : '#e2e8f0' }}>
              {/* Search Bar */}
              <div className="relative w-full sm:w-[280px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15} style={{ color: dark ? '#4a6a8a' : '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search student or roll no..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 rounded-xl text-[13px] outline-none transition-all duration-200"
                  style={inp}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer border-none bg-transparent p-0 flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div
                className="flex items-center rounded-xl p-1 border h-[38px] box-border"
                style={{
                  borderColor: dark ? '#1a3050' : '#e2e8f0',
                  background: dark ? '#060e1c' : '#ffffff',
                }}
              >
                {['All', 'Present', 'Absent', 'Late'].map(tab => {
                  const active = filterStatus === tab
                  return (
                    <button
                      key={tab}
                      onClick={() => setFilterStatus(tab)}
                      className="px-3.5 h-[28px] rounded-lg text-[12px] border-none cursor-pointer flex items-center justify-center transition-all duration-200 font-bold"
                      style={{
                        background: active ? BRAND : 'transparent',
                        color: active ? '#ffffff' : (dark ? '#7a98bb' : '#5c6f84'),
                        boxShadow: active ? '0 2px 8px rgba(97,95,255,0.3)' : 'none',
                      }}
                    >
                      {tab}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr style={{ background: dark ? '#060e1c' : '#f8fafc', borderBottom: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}>
                    {['Student', 'Roll No', 'Check-In', 'Check-Out', 'Status'].map(h => (
                      <th key={h} className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: h === 'Check-In' || h === 'Check-Out' ? BRAND : (dark ? '#4a6a8a' : '#94a3b8') }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <tr key={i} style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#f1f5f9'}` }}>
                        {[160, 80, 80, 80, 70].map((w, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 rounded animate-pulse" style={{ width: w, background: dark ? '#1a3050' : '#f1f5f9' }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <FileText size={36} className="block mx-auto mb-2 text-slate-400" />
                        <span className="text-[13px] font-semibold text-slate-400">No attendance records found matching filters</span>
                      </td>
                    </tr>
                  ) : paginatedRecords.map((row, idx) => {
                    const badge = badgeStyle(row.status)
                    const isUpd = updatingId === row.id
                    return (
                      <tr key={row.id}
                        className="transition-colors hover:bg-slate-50/30 dark:hover:bg-slate-800/20"
                        style={{ borderTop: idx === 0 ? 'none' : `1px solid ${dark ? '#1a3050' : '#f1f5f9'}` }}
                      >
                        <td className="px-6 py-4 text-[13.5px] font-bold">{row.studentName}</td>
                        <td className="px-6 py-4 text-[13px] font-semibold" style={label}>{row.rollNo}</td>
                        <td className="px-6 py-4 text-[13px]" style={label}>{row.checkIn}</td>
                        <td className="px-6 py-4 text-[13px]" style={label}>{row.checkOut}</td>
                        <td className="px-6 py-4">
                          {isUpd ? (
                            <Loader2 size={14} className="animate-spin text-slate-400" />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                                style={{ background: badge.bg, color: badge.text }}>
                                {row.status}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Table Footer with Pagination Controls ── */}
            {!loading && (
              <div
                className="flex items-center justify-between flex-wrap gap-4 px-6 py-3.5 border-t"
                style={{ borderColor: dark ? '#1a3050' : '#e2e8f0' }}
              >
                {/* Showing entries & Per page count */}
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-[12.5px] font-medium" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                    Showing <strong style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{totalItems > 0 ? startIndex + 1 : 0}</strong> to{' '}
                    <strong style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{endIndex}</strong> of{' '}
                    <strong style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{totalItems}</strong> entries
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500">Per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={e => {
                        setItemsPerPage(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="px-2.5 py-1 rounded-lg text-[12px] font-bold outline-none cursor-pointer border"
                      style={{
                        background: dark ? '#060e1c' : '#ffffff',
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border bg-transparent cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        borderColor: dark ? '#1a3050' : '#e2e8f0',
                        color: dark ? '#e8f0fe' : '#475569'
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      const active = page === currentPage
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className="w-7.5 h-7.5 rounded-lg text-[12.5px] font-extrabold cursor-pointer transition-all border-none"
                          style={{
                            background: active ? BRAND : (dark ? '#0f1e30' : '#f1f5f9'),
                            color: active ? '#ffffff' : (dark ? '#7a98bb' : '#475569'),
                            boxShadow: active ? '0 2px 8px rgba(97,95,255,0.3)' : 'none'
                          }}
                        >
                          {page}
                        </button>
                      )
                    })}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-1.5 rounded-lg border bg-transparent cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        borderColor: dark ? '#1a3050' : '#e2e8f0',
                        color: dark ? '#e8f0fe' : '#475569'
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REPORTS TAB ── */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Header row with Export button */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-[12px] uppercase tracking-wider font-extrabold m-0" style={label}>Reports</p>
              <h2 className="text-[20px] font-extrabold m-0">Event Attendance Analytics</h2>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold border cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{ ...inp, color: BRAND, borderColor: BRAND }}
            >
              <Download size={14} /> Export CSV Report
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Hourly Attendance Trend */}
            <div className="lg:col-span-3 rounded-2xl border p-6 flex flex-col" style={card}>
              <div className="mb-6">
                <h3 className="text-[15px] font-extrabold m-0">Hourly Attendance Trend</h3>
              </div>

              {chartLoading ? (
                <div className="h-[240px] flex items-center justify-center">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                </div>
              ) : (() => {
                const { linePath, fillPath } = generateTrendPath(chartData)
                const yTicks = [0, 55, 110, 165, 220]
                const MAX = 220
                const CHART_H = 240

                return (
                  <div className="w-full pl-8 pr-2">
                    <div className="flex flex-col w-full relative">
                      {/* Grid lines and Y labels */}
                      {yTicks.map(t => (
                        <div
                          key={t}
                          className="absolute left-0 right-0 flex items-center"
                          style={{
                            bottom: `${(t / MAX) * 100}%`,
                            height: 1,
                            background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                          }}
                        >
                          <span
                            className="absolute text-[11px] font-semibold text-right pr-3"
                            style={{ ...label, width: 40, left: -40, top: '50%', transform: 'translateY(-50%)' }}
                          >
                            {t}
                          </span>
                        </div>
                      ))}

                      {/* SVG line trend */}
                      <div className="relative w-full" style={{ height: CHART_H }}>
                        {linePath && (
                          <svg
                            className="absolute inset-0 w-full h-full overflow-visible z-10"
                            viewBox="0 0 800 240"
                            preserveAspectRatio="none"
                          >
                            <defs>
                              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                              </linearGradient>
                            </defs>
                            {/* Area fill */}
                            <path d={fillPath} fill="url(#trendGradient)" />
                            {/* Trend line */}
                            <path
                              d={linePath}
                              fill="none"
                              stroke="#6366f1"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            {/* Dots on points */}
                            {chartData.map((d, i) => {
                              const x = (i / (chartData.length - 1)) * 800
                              const y = 240 - (d.count / MAX) * 240
                              return (
                                <g key={i} className="group/dot cursor-pointer">
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill="#ffffff"
                                    stroke="#6366f1"
                                    strokeWidth="2.5"
                                    className="transition-all duration-200 group-hover/dot:r-6"
                                  />
                                </g>
                              )
                            })}
                          </svg>
                        )}
                      </div>

                      {/* X-axis labels */}
                      <div className="flex gap-2 sm:gap-3 mt-3 z-10">
                        {chartData.map(({ hour }) => (
                          <div key={hour} className="flex-1 text-center text-[10.5px] font-semibold" style={label}>
                            {hour}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Right: Dept-wise Attendance */}
            <div className="lg:col-span-2 rounded-2xl border p-6 flex flex-col" style={card}>
              <div className="mb-6">
                <h3 className="text-[15px] font-extrabold m-0">Dept-wise Attendance</h3>
              </div>

              {deptLoading ? (
                <div className="h-[240px] flex items-center justify-center">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                </div>
              ) : (() => {
                const xTicks = [0, 9, 18, 27, 36]
                const MAX_DEPT = 36
                const CHART_H = 240

                return (
                  <div className="w-full relative flex flex-col" style={{ height: CHART_H + 30 }}>
                    {/* Vertical grid lines & X-labels at the bottom */}
                    <div className="absolute left-[45px] right-0 top-0 bottom-[30px] pointer-events-none">
                      {xTicks.map(t => (
                        <div
                          key={t}
                          className="absolute top-0 bottom-0"
                          style={{
                            left: `${(t / MAX_DEPT) * 100}%`,
                            width: 1,
                            borderLeft: dark ? '1px dashed rgba(255,255,255,0.06)' : '1px dashed rgba(0,0,0,0.07)',
                          }}
                        />
                      ))}
                    </div>

                    {/* Bars list */}
                    <div className="flex-1 flex flex-col justify-between pb-[10px]">
                      {deptData.map(({ dept, count, color }) => {
                        const widthPct = (count / MAX_DEPT) * 100
                        return (
                          <div key={dept} className="flex items-center h-7 relative group">
                            {/* Label */}
                            <span className="text-[12px] font-bold text-left shrink-0" style={{ ...label, width: 45 }}>
                              {dept}
                            </span>
                            {/* Bar container */}
                            <div className="flex-1 h-full relative flex items-center">
                              <div
                                className="h-[14px] rounded-r-md transition-all duration-700 relative cursor-pointer"
                                style={{
                                  width: `${widthPct}%`,
                                  background: color,
                                }}
                                title={`${dept}: ${count} present`}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* X-axis labels at the bottom */}
                    <div className="h-[20px] relative mt-2" style={{ marginLeft: 45 }}>
                      {xTicks.map(t => (
                        <span
                          key={t}
                          className="absolute text-[11px] font-semibold text-center"
                          style={{
                            ...label,
                            left: `${(t / MAX_DEPT) * 100}%`,
                            transform: 'translateX(-50%)',
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
