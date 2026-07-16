import React from 'react'
import { Download, Loader2 } from 'lucide-react'

/* ─── generate trendline SVG path ─── */
const generateTrendPath = (data, MAX = 220) => {
  if (!data || data.length === 0) return { linePath: '', fillPath: '' }
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

export default function AttendanceTabReports({
  handleExport,
  chartLoading,
  chartData,
  deptLoading,
  deptData,
  dark,
  BRAND,
  card,
  inp,
  label
}) {
  return (
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
            const maxDataVal = Math.max(5, ...(chartData || []).map(d => d.count || 0))
            const MAX = Math.max(10, Math.ceil(maxDataVal / 5) * 5)
            const yTicks = [0, Math.round(MAX * 0.25), Math.round(MAX * 0.5), Math.round(MAX * 0.75), MAX]
            const CHART_H = 240
            const { linePath, fillPath } = generateTrendPath(chartData, MAX)

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
                        {(chartData || []).map((d, i) => {
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
            const maxDeptVal = Math.max(5, ...(deptData || []).map(d => d.count || 0))
            const MAX_DEPT = Math.max(10, Math.ceil(maxDeptVal / 5) * 5)
            const xTicks = [0, Math.round(MAX_DEPT * 0.25), Math.round(MAX_DEPT * 0.5), Math.round(MAX_DEPT * 0.75), MAX_DEPT]
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
                  {(deptData || []).map(({ dept, count, color }) => {
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
  )
}
