import React from 'react'

export default function AnalyticsRadarChart({
  radarData,
  dark,
  BRAND,
  cardStyle
}) {
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
    <div className="lg:col-span-2 rounded-2xl border p-6 flex flex-col" style={cardStyle}>
      <div className="mb-4">
        <h3 className="text-[15px] font-extrabold m-0 text-slate-900 dark:text-slate-100">Engagement Radar</h3>
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
  )
}
