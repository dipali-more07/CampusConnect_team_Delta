import React from 'react'
import { Loader2 } from 'lucide-react'

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

export default function AnalyticsTrendChart({
  trendLoading,
  trendData,
  dark,
  label,
  cardStyle
}) {
  return (
    <div className="lg:col-span-3 rounded-2xl border p-6 flex flex-col" style={cardStyle}>
      <div className="mb-6">
        <h3 className="text-[15px] font-extrabold m-0 text-slate-900 dark:text-slate-100">Monthly Trend</h3>
      </div>

      {trendLoading ? (
        <div className="h-[240px] flex items-center justify-center">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      ) : (() => {
        const maxDataVal = Math.max(5, ...trendData.map(d => d.value || 0))
        const MAX_VAL = Math.max(10, Math.ceil(maxDataVal / 5) * 5)
        const yTicks = [0, Math.round(MAX_VAL * 0.25), Math.round(MAX_VAL * 0.5), Math.round(MAX_VAL * 0.75), MAX_VAL]
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
  )
}
