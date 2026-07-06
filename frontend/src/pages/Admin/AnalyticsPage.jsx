import { useState, useEffect } from 'react'
import {
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
} from 'lucide-react'
import analyticsService from '../../services/analyticsService'
import { BRAND } from '../../data/dashboardData'

/* ─── generate trendline SVG path ─── */
const generateTrendPath = (data, maxVal = 12) => {
  if (!data || data.length === 0) return { linePath: '', fillPath: '', points: [] }
  const width = 800
  const height = 240

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (d.value / maxVal) * height
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

  return { linePath, fillPath, points }
}


export default function AnalyticsPage({ tokens }) {
  const { dark } = tokens
  
  const [activeTab, setActiveTab] = useState('event')
  const [stats, setStats] = useState([])
  const [trendData, setTrendData] = useState([])
  const [radarData, setRadarData] = useState([])
  const [categories, setCategories] = useState([])
  const [depts, setDepts] = useState([])
  const [hoveredDept, setHoveredDept] = useState(null)

  const [loading, setLoading] = useState(true)
  const [trendLoading, setTrendLoading] = useState(false)

  // ── styles based on tokens ──
  const card = { background: tokens.card, borderColor: tokens.border, boxShadow: tokens.shadow }
  const label = { color: tokens.txtSec }
  const inp = { background: tokens.inputBg, borderColor: tokens.border, color: tokens.txtPri }
  const hoverStyle = { background: tokens.hoverBg }

  const loadData = async () => {
    setLoading(true)
    const [statsRes, radarRes, catRes, deptRes] = await Promise.all([
      analyticsService.fetchStats(),
      analyticsService.fetchRadarData(),
      analyticsService.fetchCategories(),
      analyticsService.fetchDeptDistribution()
    ])

    if (statsRes.success) setStats(statsRes.stats)
    if (radarRes.success) setRadarData(radarRes.radar)
    if (catRes.success) setCategories(catRes.categories)
    if (deptRes.success) setDepts(deptRes.depts)
    setLoading(false)
  }

  const loadTrend = async (tab) => {
    setTrendLoading(true)
    const res = await analyticsService.fetchMonthlyTrend(tab)
    if (res.success) setTrendData(res.trend)
    setTrendLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadTrend(activeTab)
  }, [activeTab])

  // ── CSV Export ──
  const handleExport = (type) => {
    // Generate simple mock export
    let headers = ''
    let rows = []
    let filename = `analytics_report_${activeTab}`

    if (activeTab === 'event') {
      headers = 'Category,Count,Percentage\n'
      rows = categories.map(c => `"${c.name}",${c.count},${c.percentage}%`)
    } else {
      headers = 'Department,Count,Percentage\n'
      rows = depts.map(d => `"${d.dept}",${d.count},${d.percentage}%`)
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + rows.join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${filename}.${type === 'csv' ? 'csv' : type === 'excel' ? 'xls' : 'txt'}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ── SVG Radar Calculations ──
  const radarWidth = 320
  const radarHeight = 270
  const cx = radarWidth / 2
  const cy = radarHeight / 2 - 10
  const R = 85

  const getRadarPoint = (angle, val, maxVal = 100) => {
    const r = (val / maxVal) * R
    return {
      x: cx + r * Math.sin(angle),
      y: cy - r * Math.cos(angle)
    }
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* ── HEADER ROW ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-slate-900 dark:text-slate-100 m-0 tracking-tight">Analytics</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Advanced insights and performance metrics</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border cursor-pointer transition-all"
            style={inp}
          >
            <FileText size={13} className="text-red-500" /> PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border cursor-pointer transition-all"
            style={inp}
          >
            <FileSpreadsheet size={13} className="text-emerald-500" /> Excel
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border cursor-pointer transition-all"
            style={inp}
          >
            <Download size={13} style={{ color: BRAND }} /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : (
        <>
          {/* ── STATS ROW (6 Cards) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
            {stats.map(({ title, value, sub, color }) => (
              <div key={title} className="rounded-2xl p-5 border flex flex-col justify-between" style={card}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={label}>{title}</p>
                  <div className="text-[17px] font-extrabold mb-1 truncate" style={{ color }}>{value}</div>
                </div>
                <p className="text-[12px] font-semibold mt-2" style={label}>{sub}</p>
              </div>
            ))}
          </div>

          {/* ── CHARTS ROW 1 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Left Card: Monthly Trend */}
            <div className="lg:col-span-3 rounded-2xl border p-6 flex flex-col" style={card}>
              <div className="mb-6">
                <h3 className="text-[15px] font-extrabold m-0">Monthly Trend</h3>
              </div>

              {trendLoading ? (
                <div className="h-[240px] flex items-center justify-center">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                </div>
              ) : (() => {
                const MAX_VAL = 12
                const yTicks = [0, 3, 6, 9, 12]
                const CHART_H = 240
                const { linePath, fillPath, points } = generateTrendPath(trendData, MAX_VAL)

                return (
                  <div className="w-full pl-8 pr-2">
                    <div className="flex flex-col w-full relative">
                      {/* Grid lines & Y labels */}
                      {yTicks.map(t => (
                        <div
                          key={t}
                          className="absolute left-0 right-0 flex items-center"
                          style={{
                            bottom: `${(t / MAX_VAL) * 100}%`,
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

                      {/* SVG line */}
                      <div className="relative w-full" style={{ height: CHART_H }}>
                        {linePath && (
                          <svg
                            className="absolute inset-0 w-full h-full overflow-visible z-10"
                            viewBox="0 0 800 240"
                            preserveAspectRatio="none"
                          >
                            <defs>
                              <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                              </linearGradient>
                            </defs>
                            <path d={fillPath} fill="url(#analyticsGradient)" />
                            <path
                              d={linePath}
                              fill="none"
                              stroke="#6366f1"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            {/* Points dots */}
                            {points.map((pt, i) => (
                              <g key={i} className="group/dot cursor-pointer">
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="4"
                                  fill="#ffffff"
                                  stroke="#6366f1"
                                  strokeWidth="2.5"
                                  className="transition-all duration-200 group-hover/dot:r-6"
                                />
                              </g>
                            ))}
                          </svg>
                        )}
                      </div>

                      {/* X-axis labels */}
                      <div className="flex gap-2 mt-3 z-10">
                        {trendData.map(({ month }) => (
                          <div key={month} className="flex-1 text-center text-[10.5px] font-semibold" style={label}>
                            {month}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Right Card: Engagement Radar */}
            <div className="lg:col-span-2 rounded-2xl border p-6 flex flex-col" style={card}>
              <div className="mb-4">
                <h3 className="text-[15px] font-extrabold m-0">Engagement Radar</h3>
              </div>

              <div className="flex items-center justify-center flex-1">
                {radarData.length > 0 && (
                  <svg width={radarWidth} height={radarHeight} className="overflow-visible">
                    {/* Ring grids (20, 40, 60, 80, 100) */}
                    {[20, 40, 60, 80, 100].map(level => {
                      const points = radarData.map((d, i) => {
                        const angle = i * (Math.PI / 3)
                        const pt = getRadarPoint(angle, level)
                        return `${pt.x},${pt.y}`
                      }).join(' ')

                      return (
                        <polygon
                          key={level}
                          points={points}
                          fill="none"
                          stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}
                          strokeWidth="1"
                        />
                      )
                    })}

                    {/* Radial axis lines */}
                    {radarData.map((d, i) => {
                      const angle = i * (Math.PI / 3)
                      const outerPt = getRadarPoint(angle, 100)
                      return (
                        <line
                          key={i}
                          x1={cx}
                          y1={cy}
                          x2={outerPt.x}
                          y2={outerPt.y}
                          stroke={dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                          strokeWidth="1"
                        />
                      )
                    })}

                    {/* Data polygon */}
                    {(() => {
                      const points = radarData.map((d, i) => {
                        const angle = i * (Math.PI / 3)
                        const pt = getRadarPoint(angle, d.value)
                        return `${pt.x},${pt.y}`
                      }).join(' ')

                      return (
                        <polygon
                          points={points}
                          fill="rgba(97, 95, 255, 0.15)"
                          stroke={BRAND}
                          strokeWidth="2"
                        />
                      )
                    })()}

                    {/* Axis Labels */}
                    {radarData.map((d, i) => {
                      const angle = i * (Math.PI / 3)
                      const textPt = getRadarPoint(angle, 112)

                      let textAnchor = 'middle'
                      let dy = '0.35em'

                      if (i === 0) {
                        textAnchor = 'middle'
                        dy = '-0.6em'
                      } else if (i === 3) {
                        textAnchor = 'middle'
                        dy = '1.3em'
                      } else if (i === 1 || i === 2) {
                        textAnchor = 'start'
                      } else {
                        textAnchor = 'end'
                      }

                      return (
                        <text
                          key={i}
                          x={textPt.x}
                          y={textPt.y}
                          textAnchor={textAnchor}
                          dy={dy}
                          className="text-[10px] font-bold"
                          style={{ fill: dark ? '#7a98bb' : '#64748b' }}
                        >
                          {d.axis}
                        </text>
                      )
                    })}
                  </svg>
                )}
              </div>
            </div>

          </div>

          {/* ── CHARTS ROW 2 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Event Categories Breakdown */}
            <div className="rounded-2xl border p-6 flex flex-col" style={card}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[15px] font-extrabold m-0">Event Categories Breakdown</h3>
                {/* Small legend */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold" style={label}>
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#615FFF' }} />
                    Workshops
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold" style={label}>
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#00BC7D' }} />
                    Seminars
                  </div>
                </div>
              </div>

              <div className="w-full pl-8 pr-2 relative" style={{ height: 240 + 30 }}>
                {/* Grid lines and Y labels */}
                {[0, 25, 50, 75, 100].map(val => (
                  <div
                    key={val}
                    className="absolute left-8 right-2 flex items-center"
                    style={{
                      bottom: `${(val / 100) * 240 + 30}px`,
                      borderBottom: dark ? '1px dashed rgba(255,255,255,0.08)' : '1px dashed rgba(0,0,0,0.08)',
                    }}
                  >
                    <span
                      className="absolute text-[11px] font-semibold text-right pr-3"
                      style={{ ...label, width: 40, left: -48, top: '50%', transform: 'translateY(-50%)' }}
                    >
                      {val}
                    </span>
                  </div>
                ))}

                {/* Bars group container */}
                <div className="absolute left-8 right-2 top-0 bottom-[30px] flex justify-between items-end">
                  {categories.map((item) => {
                    const wHeight = (item.workshops / 100) * 240
                    const sHeight = (item.seminars / 100) * 240

                    return (
                      <div key={item.month} className="flex-1 flex flex-col items-center h-full justify-end relative">
                        {/* Double bars */}
                        <div className="flex items-end gap-1.5">
                          <div
                            className="w-[8px] rounded-t-[3px] transition-all duration-700 hover:opacity-85 cursor-pointer"
                            style={{ height: wHeight, background: '#615FFF' }}
                            title={`Workshops: ${item.workshops}%`}
                          />
                          <div
                            className="w-[24px] rounded-t-[6px] transition-all duration-700 hover:opacity-85 cursor-pointer"
                            style={{ height: sHeight, background: '#00BC7D' }}
                            title={`Seminars: ${item.seminars}%`}
                          />
                        </div>
                        {/* X-axis label */}
                        <span className="absolute bottom-[-24px] text-[11px] font-semibold" style={label}>
                          {item.month}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right: Department Distribution */}
            <div className="rounded-2xl border p-6 flex flex-col" style={card}>
              <div className="mb-6">
                <h3 className="text-[15px] font-extrabold m-0">Department Distribution</h3>
              </div>
              <div className="flex items-center justify-center flex-1" style={{ minHeight: 310 }}>
                {depts.length > 0 && (() => {
                  let accum = 0
                  const R_PIE = 56
                  const cxPie = 200
                  const cyPie = 150

                  return (
                    <svg viewBox="0 0 400 300" width="100%" height="100%" className="overflow-visible w-full max-w-[600px]">
                      {depts.map((item) => {
                        const pctVal = item.percentage
                        const startAngle = (accum / 100) * 2 * Math.PI - Math.PI / 2
                        const endAngle = ((accum + pctVal) / 100) * 2 * Math.PI - Math.PI / 2
                        accum += pctVal

                        const x1 = cxPie + R_PIE * Math.cos(startAngle)
                        const y1 = cyPie + R_PIE * Math.sin(startAngle)
                        const x2 = cxPie + R_PIE * Math.cos(endAngle)
                        const y2 = cyPie + R_PIE * Math.sin(endAngle)

                        const midAngle = (startAngle + endAngle) / 2
                        const lx1 = cxPie + (R_PIE + 2) * Math.cos(midAngle)
                        const ly1 = cyPie + (R_PIE + 2) * Math.sin(midAngle)
                        const lx2 = cxPie + (R_PIE + 16) * Math.cos(midAngle)
                        const ly2 = cyPie + (R_PIE + 16) * Math.sin(midAngle)

                        const right = Math.cos(midAngle) > 0.1
                        const left = Math.cos(midAngle) < -0.1
                        const lx3 = right ? lx2 + 12 : left ? lx2 - 12 : lx2
                        const ly3 = ly2

                        const tx = right ? lx3 + 4 : left ? lx3 - 4 : lx3
                        const ty = ly3 + 3
                        const anchor = right ? 'start' : left ? 'end' : 'middle'

                        const largeArc = pctVal > 50 ? 1 : 0
                        const d = `M ${cxPie} ${cyPie} L ${x1} ${y1} A ${R_PIE} ${R_PIE} 0 ${largeArc} 1 ${x2} ${y2} Z`

                        const isHovered = hoveredDept === item.dept
                        const dx = isHovered ? Math.cos(midAngle) * 6 : 0
                        const dy = isHovered ? Math.sin(midAngle) * 6 : 0

                        return (
                          <g
                            key={item.dept}
                            className="group/slice cursor-pointer"
                            onMouseEnter={() => setHoveredDept(item.dept)}
                            onMouseLeave={() => setHoveredDept(null)}
                            style={{
                              transform: `translate(${dx}px, ${dy}px)`,
                              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          >
                            {/* Slice */}
                            <path
                              d={d}
                              fill={item.color}
                              stroke={tokens.card}
                              strokeWidth="2"
                              className="transition-all duration-300 hover:opacity-90"
                            />
                            {/* Connection Line */}
                            <path
                              d={`M ${lx1} ${ly1} L ${lx2} ${ly2} L ${lx3} ${ly3}`}
                              fill="none"
                              stroke={item.color}
                              strokeWidth="1.5"
                              strokeDasharray="2,2"
                              opacity="0.6"
                              className="transition-all duration-300 group-hover/slice:opacity-100"
                            />
                            {/* Label */}
                            <text
                              x={tx}
                              y={ty}
                              textAnchor={anchor}
                              className="text-[11px] font-bold"
                              style={{ fill: item.color }}
                            >
                              {item.dept} {pctVal}%
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  )
                })()}
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  )
}
