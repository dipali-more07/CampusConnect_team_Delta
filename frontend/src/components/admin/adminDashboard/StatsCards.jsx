import React from 'react'
import { TrendingUp } from 'lucide-react'

export default function StatsCards({ tokens, stats = [], loading = false }) {
  const { dark } = tokens
  const skeletonBg = dark ? '#162640' : '#e2e8f0'

  const { card: cardBg, border: borderCol, shadow: cardShadow } = tokens

  if (loading || stats.length === 0) {
    return (
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className="rounded-[18px] p-5 border"
            style={{
              background: cardBg,
              borderColor: borderCol,
              boxShadow: cardShadow,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl" style={{ background: skeletonBg }} />
              <div className="w-10 h-3 rounded-md" style={{ background: skeletonBg }} />
            </div>
            <div className="w-[60%] h-6 rounded-md mb-2" style={{ background: skeletonBg }} />
            <div className="w-[40%] h-3 rounded-md" style={{ background: skeletonBg }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
      {stats.map(({ label, value, delta, icon: Icon, iconBg, iconColor }) => (
        <div
          key={label}
          className="rounded-[18px] p-5 border transition-all duration-300 cursor-default"
          style={{
            background: cardBg,
            borderColor: borderCol,
            boxShadow: cardShadow,
          }}
          onMouseEnter={e => { 
            e.currentTarget.style.transform = 'translateY(-2px)'; 
            e.currentTarget.style.boxShadow = dark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 28px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.transform = 'translateY(0)'; 
            e.currentTarget.style.boxShadow = cardShadow;
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
              <Icon size={22} style={{ color: iconColor }} />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500">
              <TrendingUp size={12} /> {delta}
            </span>
          </div>
          <p className="text-[26px] font-extrabold text-slate-900 dark:text-[#e8f0fe] m-0 leading-[1.1] tracking-tight">{value}</p>
          <p className="text-[13px] font-medium text-slate-500 dark:text-[#7a98bb] mt-1.5">{label}</p>
        </div>
      ))}
    </div>
  )
}
