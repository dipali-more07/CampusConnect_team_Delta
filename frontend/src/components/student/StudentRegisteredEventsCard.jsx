import React from 'react'
import { ArrowRight, Calendar, MapPin } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function StudentRegisteredEventsCard({ tokens, onNavigate, eventsList }) {
  const { accentColor } = useTheme()
  const BRAND = accentColor || '#615FFF'

  const events = eventsList ? eventsList.slice(0, 5) : []

  return (
    <div
      className="rounded-3xl p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between h-full"
      style={{
        background: tokens.dark ? '#0f1e30' : '#ffffff',
        border: `1px solid ${tokens.dark ? '#1a3050' : '#e2e8f0'}`,
        boxShadow: tokens.shadow,
      }}
    >
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white m-0 tracking-tight">
            Registered Events
          </h3>
          <button
            onClick={() => onNavigate('Events')}
            className="flex items-center gap-1.5 text-xs font-bold border-none bg-transparent p-0 cursor-pointer transition-colors hover:gap-2"
            style={{ color: BRAND }}
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </button>
        </div>



        <div className="flex flex-col gap-3 mb-5">
          {events.length > 0 ? (
            events.map((event) => (
              <div
                key={event.id}
                className="group flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: tokens.dark ? '#162640' : '#f8fafc',
                  borderColor: tokens.dark ? '#1e3048' : '#f1f5f9',
                }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white text-[12px] font-black shadow-xs group-hover:scale-105 transition-transform"
                    style={{ background: event.avatarBg || BRAND }}
                  >
                    {event.code}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <h4 className="text-[13.5px] font-extrabold text-slate-800 dark:text-[#e8f0fe] m-0 truncate group-hover:text-indigo-500 transition-colors">
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-[#7a98bb] mt-0.5 truncate">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {event.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={12} className="text-slate-400" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  {event.status}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 px-4 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-2"
              style={{ borderColor: tokens.border }}>
              <Calendar size={28} className="text-slate-400/60" />
              <p className="text-[12px] font-bold text-slate-400 m-0">No registered events yet</p>
            </div>
          )}
        </div>
        <button
          onClick={() => onNavigate('Events')}
          className="flex items-center gap-1.5 text-xs font-bold border-none bg-transparent p-0 cursor-pointer transition-colors hover:gap-2"
          style={{ color: BRAND }}
        >
          <span>Explore more events</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
