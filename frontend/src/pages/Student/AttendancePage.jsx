import { useState, useEffect } from 'react'
import { QrCode, FileText, CheckCircle2, Activity, Clock, Search, TrendingUp, Users, User } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import studentService from '../../services/studentService'
import QRScannerModal from '../../components/student/QRScannerModal'

export default function AttendancePage({ tokens, user }) {
  const { dark, accentColor } = useTheme()
  const BRAND = accentColor || '#615FFF'
  const showToast = useToast()

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [showScanModal, setShowScanModal] = useState(false)
  const [scanning, setScanning] = useState(false)

  // Interactive Graph Hover State (default to Sep - index 2 matching reference image)
  const [hoveredPointIndex, setHoveredPointIndex] = useState(2)

  const [attendanceData, setAttendanceData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    studentService.fetchAttendanceData().then(res => {
      if (cancelled) return
      if (res.success) {
        setAttendanceData(res.data)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const records = attendanceData?.records || []
  const summary = attendanceData?.summary || {}

  // Filter records based on activeFilter pill & search query
  const filteredRecords = records.filter(record => {
    const matchesSearch =
      record.event.toLowerCase().includes(search.toLowerCase()) ||
      record.id.toLowerCase().includes(search.toLowerCase()) ||
      record.venue.toLowerCase().includes(search.toLowerCase()) ||
      (record.teamName && record.teamName.toLowerCase().includes(search.toLowerCase()))

    let matchesFilter = true
    if (activeFilter === 'Team') {
      matchesFilter = record.eventType === 'Team'
    } else if (activeFilter === 'Solo') {
      matchesFilter = record.eventType === 'Solo'
    } else if (activeFilter !== 'All') {
      matchesFilter = record.status.toLowerCase() === activeFilter.toLowerCase()
    }

    return matchesSearch && matchesFilter
  })

  // Simulated QR Code Scanner Action
  const handleSimulateScan = async () => {
    setScanning(true)
    const res = await studentService.scanAttendanceQR('EVT-QR-SCAN-2024')
    setScanning(false)

    if (res.success) {
      setAttendanceData(res.data)
      showToast('QR Scan Verified! Attendance updated successfully.', 'success')
      setShowScanModal(false)
    } else {
      showToast(res.message || 'QR Scan Failed.', 'error')
    }
  }

  // ── GRAPH DATA & COORDINATES COMPUTATION ──
  const chartPoints = [
    { month: 'Jul', total: 4, attended: 4, xPercent: 6, xSvg: 50, ySvg: 90 },
    { month: 'Aug', total: 6, attended: 6, xPercent: 24.4, xSvg: 186, ySvg: 55 },
    { month: 'Sep', total: 3, attended: 2, xPercent: 42.8, xSvg: 322, ySvg: 110 },
    { month: 'Oct', total: 5, attended: 5, xPercent: 61.2, xSvg: 458, ySvg: 72.5 },
    { month: 'Nov', total: 4, attended: 4, xPercent: 79.6, xSvg: 594, ySvg: 90 },
    { month: 'Dec', total: 2, attended: 2, xPercent: 98, xSvg: 730, ySvg: 125 },
  ]

  const activePoint = chartPoints[hoveredPointIndex !== null ? hoveredPointIndex : 2]

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full font-[Manrope,sans-serif]">

      {/* ── 1. Page Header: Title + Scan QR Button ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white m-0">
            Attendance
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-[#7a98bb] mt-1 m-0">
            Track your event attendance records
          </p>
        </div>

        {/* Scan QR Pill Button */}
        <button
          onClick={() => setShowScanModal(true)}
          className="self-start sm:self-auto flex items-center gap-2.5 px-6 py-2.5 rounded-full text-xs font-extrabold text-white border-none cursor-pointer shadow-lg hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200"
          style={{ background: `linear-gradient(135deg, ${BRAND}, #4f46e5)` }}
        >
          <QrCode size={16} />
          <span>Scan QR</span>
        </button>
      </div>

      {/* ── 2. Stat Cards Grid (4 Cards matching Figma layout) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: TOTAL EVENTS */}
        <div
          className="rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-4 shadow-sm"
          style={{
            background: dark ? '#0b1322' : '#ffffff',
            borderColor: dark ? '#182438' : '#e2e8f0',
          }}
        >
          <div className="w-12 h-12 rounded-full bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center shrink-0">
            <FileText size={22} className="text-blue-500" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-[#6a84a6]">
              TOTAL EVENTS
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white m-0 mt-0.5 leading-none">
              {summary.totalEvents ?? 8}
            </h3>
          </div>
        </div>

        {/* Card 2: ATTENDED */}
        <div
          className="rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-4 shadow-sm"
          style={{
            background: dark ? '#0b1322' : '#ffffff',
            borderColor: dark ? '#182438' : '#e2e8f0',
          }}
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} className="text-emerald-500" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-[#6a84a6]">
              ATTENDED
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white m-0 mt-0.5 leading-none">
              {summary.attended ?? 6}
            </h3>
          </div>
        </div>

        {/* Card 3: ATTENDANCE % */}
        <div
          className="rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-4 shadow-sm"
          style={{
            background: dark ? '#0b1322' : '#ffffff',
            borderColor: dark ? '#182438' : '#e2e8f0',
          }}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 flex items-center justify-center shrink-0">
            <Activity size={22} style={{ color: BRAND }} />
          </div>
          <div>
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-[#6a84a6]">
              ATTENDANCE %
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white m-0 mt-0.5 leading-none">
              {summary.percentage ?? '75%'}
            </h3>
          </div>
        </div>

        {/* Card 4: PENDING */}
        <div
          className="rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-4 shadow-sm"
          style={{
            background: dark ? '#0b1322' : '#ffffff',
            borderColor: dark ? '#182438' : '#e2e8f0',
          }}
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
            <Clock size={22} className="text-amber-500" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-[#6a84a6]">
              PENDING
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white m-0 mt-0.5 leading-none">
              {summary.pending ?? 1}
            </h3>
          </div>
        </div>

      </div>

      {/* ── 3. Interactive Attendance Analytics Chart Card ── */}
      <div
        className="rounded-3xl p-6 border transition-colors duration-300 shadow-sm relative overflow-hidden"
        style={{
          background: dark ? '#0b1322' : '#ffffff',
          borderColor: dark ? '#182438' : '#e2e8f0',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white m-0">
            Attendance Analytics
          </h3>
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <TrendingUp size={13} /> {summary.analyticsChange || '↑ 87.5%'}
          </span>
        </div>

        {/* SVG Interactive Wave Chart */}
        <div className="w-full relative h-52 sm:h-60 pt-2 pb-6">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 770 180" preserveAspectRatio="none">
            <defs>
              <linearGradient id="analyticsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BRAND} stopOpacity="0.22" />
                <stop offset="100%" stopColor={BRAND} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Y-Axis Grid Lines & Numbers */}
            {[
              { label: '8', y: 20 },
              { label: '6', y: 55 },
              { label: '4', y: 90 },
              { label: '2', y: 125 },
              { label: '0', y: 160 }
            ].map(tick => (
              <g key={tick.label}>
                <text x="8" y={tick.y + 4} fill={dark ? '#4d6a8f' : '#94a3b8'} fontSize="11" fontWeight="600">
                  {tick.label}
                </text>
                <line
                  x1="35"
                  y1={tick.y}
                  x2="750"
                  y2={tick.y}
                  stroke={dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}
                  strokeDasharray="4 4"
                />
              </g>
            ))}

            {/* Smooth Filled Gradient Area */}
            <path
              d="M 50 90 C 110 50, 130 55, 186 55 C 240 55, 270 107.5, 322 107.5 C 370 107.5, 410 72.5, 458 72.5 C 500 72.5, 540 90, 594 90 C 640 90, 680 125, 730 125 L 730 160 L 50 160 Z"
              fill="url(#analyticsAreaGrad)"
            />

            {/* Main Glowing Smooth Wave Stroke */}
            <path
              d="M 50 90 C 110 50, 130 55, 186 55 C 240 55, 270 107.5, 322 107.5 C 370 107.5, 410 72.5, 458 72.5 C 500 72.5, 540 90, 594 90 C 640 90, 680 125, 730 125"
              fill="none"
              stroke={BRAND}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Interactive Vertical Cursor Indicator Line */}
            {activePoint && (
              <line
                x1={activePoint.xSvg}
                y1={20}
                x2={activePoint.xSvg}
                y2={160}
                stroke={dark ? '#94a3b8' : '#cbd5e1'}
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Interactive Clean Node Dot on Curve */}
            {activePoint && (
              <g>
                <circle
                  cx={activePoint.xSvg}
                  cy={activePoint.ySvg}
                  r="7"
                  fill={BRAND}
                  opacity="0.25"
                />
                <circle
                  cx={activePoint.xSvg}
                  cy={activePoint.ySvg}
                  r="4.5"
                  fill="#ffffff"
                  stroke={BRAND}
                  strokeWidth="3"
                />
              </g>
            )}

            {/* Transparent Interactive Hover Triggers */}
            {chartPoints.map((pt, idx) => (
              <rect
                key={pt.month}
                x={pt.xSvg - 40}
                y={0}
                width={80}
                height={180}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPointIndex(idx)}
              />
            ))}
          </svg>

          {/* ── Floating Tooltip Card (Matching Reference Image) ── */}
          {activePoint && (
            <div
              className="absolute pointer-events-none z-20 rounded-2xl p-3 shadow-2xl transition-all duration-150 ease-out flex flex-col gap-1 text-xs"
              style={{
                left: `${activePoint.xPercent}%`,
                top: `${activePoint.ySvg - 60}px`,
                transform: 'translateX(-50%)',
                background: dark ? '#0a111f' : '#0f172a',
                border: '1px solid #1e293b',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
                minWidth: '105px'
              }}
            >
              {/* Tooltip Header / Month Name */}
              <span className="text-[11px] font-bold text-slate-400">
                {activePoint.month}
              </span>

              {/* Total Count */}
              <div className="text-[11.5px] font-semibold text-slate-300">
                Total : <span className="font-bold text-white">{activePoint.total}</span>
              </div>

              {/* Attended Count with Brand Highlight */}
              <div className="text-[11.5px] font-extrabold" style={{ color: '#818cf8' }}>
                Attended : <span>{activePoint.attended}</span>
              </div>
            </div>
          )}

          {/* X-Axis Month Labels */}
          <div className="flex justify-between pl-8 pr-3 mt-2 text-xs font-semibold text-slate-400 dark:text-[#4d6a8f]">
            {chartPoints.map((pt, idx) => (
              <span
                key={pt.month}
                onClick={() => setHoveredPointIndex(idx)}
                className={`cursor-pointer transition-colors ${
                  hoveredPointIndex === idx ? 'text-indigo-500 font-extrabold' : 'hover:text-slate-200'
                }`}
              >
                {pt.month}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Search, Filter Pills & Table Section ── */}
      <div
        className="rounded-3xl p-6 border transition-colors duration-300 shadow-sm"
        style={{
          background: dark ? '#0b1322' : '#ffffff',
          borderColor: dark ? '#182438' : '#e2e8f0',
        }}
      >
        {/* Search & Filter Pills Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold border outline-none transition-colors"
              style={{
                background: dark ? '#111b2e' : '#f8fafc',
                borderColor: dark ? '#1b2c47' : '#e2e8f0',
                color: dark ? '#ffffff' : '#0f172a',
              }}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['All', 'Present', 'Absent', 'Pending', 'Team', 'Solo'].map((filter) => {
              const active = activeFilter === filter
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full text-xs font-extrabold cursor-pointer border transition-all ${
                    active
                      ? 'text-white border-transparent shadow-md'
                      : dark
                      ? 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                      : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                  style={{
                    background: active ? BRAND : 'transparent',
                  }}
                >
                  {filter}
                </button>
              )
            })}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#16263e] text-slate-400 dark:text-[#4d6a8f]">
                <th className="py-3.5 px-4 font-extrabold">ID</th>
                <th className="py-3.5 px-4 font-extrabold">EVENT NAME & TYPE</th>
                <th className="py-3.5 px-4 font-extrabold">SCAN TIME</th>
                <th className="py-3.5 px-4 font-extrabold">STATUS</th>
                <th className="py-3.5 px-4 font-extrabold">VENUE</th>
                <th className="py-3.5 px-4 font-extrabold">EVENT DATE</th>
                <th className="py-3.5 px-4 font-extrabold">REGISTRATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#16263e]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 text-xs">
                    No matching attendance records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#121e33] transition-colors"
                  >
                    {/* ID */}
                    <td className="py-4 px-4 font-bold text-slate-400 dark:text-[#4d6a8f]">
                      {item.id}
                    </td>

                    {/* EVENT NAME & TYPE / TEAM NAME */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {item.event}
                        </span>
                        {item.eventType === 'Team' ? (
                          <span className="inline-flex items-center gap-1 w-max px-2.5 py-0.5 rounded-md text-[10.5px] font-extrabold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                            <Users size={11} /> Team: <span className="underline">{item.teamName}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 w-max px-2.5 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                            <User size={11} /> Solo
                          </span>
                        )}
                      </div>
                    </td>

                    {/* SCAN TIME */}
                    <td className="py-4 px-4 font-semibold text-slate-500 dark:text-[#7a98bb]">
                      {item.scanTime}
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-4">
                      {item.status === 'Present' && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                          Present
                        </span>
                      )}
                      {item.status === 'Absent' && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
                          Absent
                        </span>
                      )}
                      {item.status === 'Pending' && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* VENUE */}
                    <td className="py-4 px-4 font-medium text-slate-600 dark:text-[#7a98bb]">
                      {item.venue}
                    </td>

                    {/* EVENT DATE */}
                    <td className="py-4 px-4 font-medium text-slate-500 dark:text-[#4d6a8f]">
                      {item.date}
                    </td>

                    {/* REGISTRATION */}
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                        {item.registration}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Scan QR Interactive Modal (Matching Figma Workflow) ── */}
      <QRScannerModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        user={user}
        onAttendanceConfirmed={(updatedData) => {
          setAttendanceData(updatedData)
        }}
      />

    </div>
  )
}
