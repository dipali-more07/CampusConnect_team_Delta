import React from 'react'

export default function NotificationStats({ statsDisplay, cardStyle, dark, tokens }) {
  return (
    <div className="grid gap-3.5 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      {statsDisplay.map(s => {
        const Icon = s.icon
        return (
          <div
            key={s.label}
            className="rounded-xl px-4 py-3.5 flex items-center gap-3.5 transition-all duration-200 hover:shadow-lg"
            style={cardStyle}
          >
            <div className="w-[38px] h-[38px] rounded-[10px] shrink-0 flex items-center justify-center" style={{ background: `${s.color}20` }}>
              <Icon size={17} style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[20px] font-extrabold leading-none" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{s.value}</div>
              <div className="text-[12px] mt-0.5 font-medium" style={{ color: dark ? '#7a98bb' : '#64748b' }}>{s.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
