import React from 'react'
import { Award, Clock, CheckCircle2 } from 'lucide-react'

export default function CertificateStats({ loading, stats, cardStyle, skBg, dark, tokens }) {
  if (loading) {
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-[18px] p-5 border flex items-center gap-4" style={cardStyle}>
            <div className="w-12 h-12 rounded-xl shrink-0" style={{ background: skBg }} />
            <div className="flex-1">
              <div className="w-16 h-7 rounded-md mb-2" style={{ background: skBg }} />
              <div className="w-24 h-3 rounded-md" style={{ background: skBg }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const items = [
    { label: 'Total Certificates', value: stats.total.toLocaleString(), icon: Award, color: '#fff', bg: `#635BFF` },
    { label: 'Pending Generation', value: stats.pending.toLocaleString(), icon: Clock, color: '#fff', bg: '#F59E0B' },
    { label: 'Generated & Sent', value: stats.generatedSent.toLocaleString(), icon: CheckCircle2, color: '#fff', bg: '#10B981' },
  ]

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      {items.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="rounded-[18px] p-3 border flex items-center gap-4 transition-all duration-300 cursor-default"
          style={cardStyle}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = dark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 28px rgba(0,0,0,0.1)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = tokens.shadow
          }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
            <Icon size={22} style={{ color }} />
          </div>
          <div>
            <p className="text-[26px] font-extrabold m-0 leading-tight tracking-tight" style={{ color: tokens.txtPri }}>{value}</p>
            <p className="text-[12px] font-medium mt-0.5" style={{ color: tokens.txtSec }}>{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
