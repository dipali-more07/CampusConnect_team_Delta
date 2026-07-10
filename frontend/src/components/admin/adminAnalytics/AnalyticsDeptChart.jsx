import React from 'react'

export default function AnalyticsDeptChart({
  depts,
  hoveredDept,
  setHoveredDept,
  tokens,
  cardStyle
}) {
  return (
    <div className="rounded-2xl border p-6 flex flex-col" style={cardStyle}>
      <div className="mb-6">
        <h3 className="text-[15px] font-extrabold m-0 text-slate-900 dark:text-slate-100">Department Distribution</h3>
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
  )
}
