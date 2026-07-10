import React from 'react'

export default function AnalyticsStats({ stats, cardStyle, label }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
      {stats.map(({ title, value, sub, color }) => (
        <div key={title} className="rounded-2xl p-5 border flex flex-col justify-between" style={cardStyle}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={label}>{title}</p>
            <div className="text-[17px] font-extrabold mb-1 truncate" style={{ color }}>{value}</div>
          </div>
          <p className="text-[12px] font-semibold mt-2" style={label}>{sub}</p>
        </div>
      ))}
    </div>
  )
}
