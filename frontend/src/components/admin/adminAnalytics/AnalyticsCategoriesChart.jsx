import React from 'react'

export default function AnalyticsCategoriesChart({
  categories,
  dark,
  label,
  cardStyle
}) {
  return (
    <div className="rounded-2xl border p-6 flex flex-col" style={cardStyle}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[15px] text-slate-900 dark:text-slate-100 font-extrabold m-0">Event Categories Breakdown</h3>
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
  )
}
