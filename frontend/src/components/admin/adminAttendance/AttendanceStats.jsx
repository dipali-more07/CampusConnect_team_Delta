import React from 'react'

export default function AttendanceStats({ statsCards, cardStyle }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      {statsCards.map(({ label: lbl, value, Icon, bg }) => (
        <div key={lbl} className="rounded-2xl p-3 flex items-center gap-4 border" style={cardStyle}>
          <div style={{ background: bg }} className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0">
            <Icon size={20} />
          </div>
          <div>
            <div className="text-[26px] font-black">{value}</div>
            <div className="text-[12.5px] font-semibold text-slate-400 mt-0.5">{lbl}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
