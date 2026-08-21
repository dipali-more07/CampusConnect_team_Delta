import React, { useState } from 'react'
import { RADAR_DATA } from '../../../data/analyticsData'

export default function AnalyticsRadarChart({
  radarData,
  dark,
  BRAND = '#615FFF',
  cardStyle
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // Use provided data or fallback to standard RADAR_DATA if empty
  const data = (Array.isArray(radarData) && radarData.length >= 3) ? radarData : RADAR_DATA
  const total = data.length

  const radarWidth = 320
  const radarHeight = 270
  const cx = radarWidth / 2
  const cy = radarHeight / 2 - 8
  const R = 85

  const getRadarPoint = (angle, val, maxVal = 100) => {
    const r = (Math.max(0, Math.min(maxVal, val)) / maxVal) * R
    return {
      x: cx + r * Math.sin(angle),
      y: cy - r * Math.cos(angle)
    }
  }

  // Calculate average score
  const avgScore = Math.round(
    data.reduce((sum, d) => sum + (Number(d.value) || 0), 0) / (total || 1)
  )

  return (
    <div className="lg:col-span-2 rounded-2xl border p-6 flex flex-col relative" style={cardStyle}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-extrabold m-0 text-slate-900 dark:text-slate-100">
            Engagement Radar
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Holistic performance index</p>
        </div>
        <span 
          className="px-2.5 py-1 rounded-full text-xs font-bold"
          style={{
            background: dark ? 'rgba(97, 95, 255, 0.15)' : '#eef2ff',
            color: BRAND
          }}
        >
          Avg: {avgScore}%
        </span>
      </div>

      <div className="flex items-center justify-center flex-1 relative min-h-[260px]">
        <svg width={radarWidth} height={radarHeight} className="overflow-visible select-none">
          <defs>
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={BRAND} stopOpacity="0.35" />
              <stop offset="100%" stopColor={BRAND} stopOpacity="0.08" />
            </radialGradient>
          </defs>

          {/* Ring grids (20, 40, 60, 80, 100) */}
          {[20, 40, 60, 80, 100].map(level => {
            const points = data.map((_, i) => {
              const angle = i * (2 * Math.PI / total)
              const pt = getRadarPoint(angle, level)
              return `${pt.x},${pt.y}`
            }).join(' ')

            return (
              <polygon
                key={level}
                points={points}
                fill="none"
                stroke={dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                strokeWidth={level === 100 ? '1.5' : '1'}
                strokeDasharray={level === 100 ? 'none' : '3 3'}
              />
            )
          })}

          {/* Radial axis lines */}
          {data.map((d, i) => {
            const angle = i * (2 * Math.PI / total)
            const outerPt = getRadarPoint(angle, 100)
            return (
              <line
                key={d.axis || `axis-line-${i}`}
                x1={cx}
                y1={cy}
                x2={outerPt.x}
                y2={outerPt.y}
                stroke={dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)'}
                strokeWidth="1"
              />
            )
          })}

          {/* Data polygon */}
          {(() => {
            const points = data.map((d, i) => {
              const angle = i * (2 * Math.PI / total)
              const pt = getRadarPoint(angle, d.value)
              return `${pt.x},${pt.y}`
            }).join(' ')

            return (
              <polygon
                points={points}
                fill="url(#radarGradient)"
                stroke={BRAND}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            )
          })()}

          {/* Vertex Points */}
          {data.map((d, i) => {
            const angle = i * (2 * Math.PI / total)
            const pt = getRadarPoint(angle, d.value)
            const isHovered = hoveredPoint?.axis === d.axis

            return (
              <g key={`vertex-${i}`} className="cursor-pointer">
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill={BRAND}
                  stroke={dark ? '#0f172a' : '#ffffff'}
                  strokeWidth={2}
                  className="transition-all duration-150"
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            )
          })}

          {/* Axis Labels */}
          {data.map((d, i) => {
            const angle = i * (2 * Math.PI / total)
            const textR = 108
            const textPt = {
              x: cx + textR * Math.sin(angle),
              y: cy - textR * Math.cos(angle)
            }

            const sin = Math.sin(angle)
            const cos = Math.cos(angle)

            let textAnchor = 'middle'
            if (sin > 0.3) textAnchor = 'start'
            else if (sin < -0.3) textAnchor = 'end'

            let dy = '0.35em'
            if (cos > 0.6) dy = '-0.5em'
            else if (cos < -0.6) dy = '1.1em'

            const isHovered = hoveredPoint?.axis === d.axis

            return (
              <text
                key={d.axis || `axis-text-${i}`}
                x={textPt.x}
                y={textPt.y}
                textAnchor={textAnchor}
                dy={dy}
                className="text-[11px] font-bold cursor-pointer transition-colors"
                style={{
                  fill: isHovered ? BRAND : (dark ? '#94a3b8' : '#64748b'),
                  fontWeight: isHovered ? 800 : 600
                }}
                onMouseEnter={() => setHoveredPoint(d)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {d.axis} ({d.value}%)
              </text>
            )
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div 
            className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg border pointer-events-none transition-all"
            style={{
              background: dark ? '#1e293b' : '#ffffff',
              color: dark ? '#f1f5f9' : '#0f172a',
              borderColor: BRAND
            }}
          >
            <span style={{ color: BRAND }}>{hoveredPoint.axis}:</span> {hoveredPoint.value}%
          </div>
        )}
      </div>
    </div>
  )
}
