import React from 'react'

export default function ResultStats({ statsList, cardStyle }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      {statsList.map(({ title, value, Icon, background }) => (
        <div 
          key={title} 
          className="rounded-2xl p-4 flex items-center gap-4 border transition-transform duration-200 hover:scale-[1.02]" 
          style={cardStyle}
        >
          <div 
            style={{ background }} 
            className="w-[46px] h-[46px] rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
          >
            <Icon size={22} />
          </div>
          <div>
            <div className="text-[26px] font-black leading-none">{value}</div>
            <div className="text-[12px] font-bold text-slate-400 dark:text-[#7a98bb] mt-1.5 uppercase tracking-wide">
              {title}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
