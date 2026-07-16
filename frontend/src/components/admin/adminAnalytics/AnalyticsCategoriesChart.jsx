import React from 'react'

export default function AnalyticsCategoriesChart({
  categories,
  dark,
  label,
  cardStyle
}) {
  // Check if it's dynamic API data or fallback mock trend data
  const isApiData = categories.some(c => c.isApiData)

  const legendLabel1 = isApiData ? 'Events' : 'Workshops'
  const legendLabel2 = isApiData ? 'Registrations' : 'Seminars'

  // Calculate dynamic maximum value for Y-axis scaling
  const maxVal = Math.max(
    5,
    ...categories.map(c => {
      const v1 = c.events !== undefined ? c.events : (c.workshops || 0)
      const v2 = c.registrations !== undefined ? c.registrations : (c.seminars || 0)
      return Math.max(v1, v2)
    })
  )
  const yAxisMax = Math.max(10, Math.ceil(maxVal / 5) * 5)
  const gridVals = [0, Math.round(yAxisMax * 0.25), Math.round(yAxisMax * 0.5), Math.round(yAxisMax * 0.75), yAxisMax]

  return (
    <div className="rounded-2xl border p-6 flex flex-col" style={cardStyle}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[15px] text-slate-900 dark:text-slate-100 font-extrabold m-0">Event Categories Breakdown</h3>
        {/* Small legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold" style={label}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#615FFF' }} />
            {legendLabel1}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold" style={label}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#00BC7D' }} />
            {legendLabel2}
          </div>
        </div>
      </div>

      <div className="w-full pl-8 pr-2 relative" style={{ height: 240 + 30 }}>
        {/* Grid lines and Y labels */}
        {gridVals.map(val => (
          <div
            key={val}
            className="absolute left-8 right-2 flex items-center"
            style={{
              bottom: `${(val / yAxisMax) * 240 + 30}px`,
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
        <div className="absolute left-8 right-2 top-0 bottom-[30px] flex justify-around items-end">
          {categories.map((item, idx) => {
            const v1 = item.events !== undefined ? item.events : (item.workshops || 0)
            const v2 = item.registrations !== undefined ? item.registrations : (item.seminars || 0)

            const wHeight = (v1 / yAxisMax) * 240
            const sHeight = (v2 / yAxisMax) * 240
            const xLabel = item.name || item.month || ''

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end relative">
                {/* Double bars */}
                <div className="flex items-end gap-1.5">
                  <div
                    className="w-[8px] rounded-t-[3px] transition-all duration-700 hover:opacity-85 cursor-pointer"
                    style={{ height: wHeight, background: '#615FFF' }}
                    title={`${legendLabel1}: ${v1}`}
                  />
                  <div
                    className="w-[24px] rounded-t-[6px] transition-all duration-700 hover:opacity-85 cursor-pointer"
                    style={{ height: sHeight, background: '#00BC7D' }}
                    title={`${legendLabel2}: ${v2}`}
                  />
                </div>
                {/* X-axis label */}
                <span className="absolute bottom-[-24px] text-[11px] font-semibold truncate max-w-[80px]" style={label} title={xLabel}>
                  {xLabel}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
