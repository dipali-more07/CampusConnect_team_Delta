import React from 'react'
import { Activity, Award, Ticket, ArrowRight } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function StudentStatsCards({ tokens, onNavigate, statsData }) {
  const { accentColor } = useTheme()
  const BRAND = accentColor || '#615FFF'

  const STATS_DATA = [
    {
      id: 'attendance',
      title: 'Attendance',
      value: statsData?.attendance || '85%',
      subtitle: statsData?.attendanceSubtitle || 'Overall Attendance',
      icon: Activity,
      iconBg: 'rgba(59, 130, 246, 0.15)',
      iconColor: '#3b82f6',
      strokeColor: '#3b82f6',
      targetTab: 'Attendance',
      gradientId: 'grad-blue',
    },
    {
      id: 'certificates',
      title: 'Certificates',
      value: statsData?.certificates !== undefined ? statsData.certificates : '12',
      subtitle: statsData?.certificatesSubtitle || 'Certificates Earned',
      icon: Award,
      iconBg: 'rgba(16, 185, 129, 0.15)',
      iconColor: '#10b981',
      strokeColor: '#10b981',
      targetTab: 'Certificates',
      gradientId: 'grad-emerald',
    },
    {
      id: 'events',
      title: 'Registered Events',
      value: statsData?.registeredEvents !== undefined ? statsData.registeredEvents : '8',
      subtitle: statsData?.registeredEventsSubtitle || 'Events Registered',
      icon: Ticket,
      iconBg: `${BRAND}20`,
      iconColor: BRAND,
      strokeColor: BRAND,
      targetTab: 'Events',
      gradientId: 'grad-brand',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {STATS_DATA.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.id}
            className="group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between shadow-md"
            style={{
              background: tokens.dark ? '#0b1322' : '#ffffff',
              border: `1px solid ${tokens.dark ? '#182438' : '#e2e8f0'}`,
            }}
          >
            {/* Top Content: Icon on Left, Title/Value/Subtitle on Right */}
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: item.iconBg }}
              >
                <Icon size={22} style={{ color: item.iconColor }} />
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 dark:text-[#7a95b8]">
                  {item.title}
                </span>
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white my-0.5 leading-none">
                  {item.value}
                </h3>
                <p className="text-[11px] font-medium text-slate-500 dark:text-[#587396] m-0">
                  {item.subtitle}
                </p>
              </div>
            </div>

            {/* Sparkline Curve Area Chart */}
            <div className="mt-6 mb-3 h-14 w-full relative opacity-85 group-hover:opacity-100 transition-opacity">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 320 50" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={item.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={item.strokeColor} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={item.strokeColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Filled Gradient Area */}
                <path
                  d="M 0 38 Q 90 32, 180 22 T 320 10 L 320 50 L 0 50 Z"
                  fill={`url(#${item.gradientId})`}
                />

                {/* Curved Sparkline Stroke */}
                <path
                  d="M 0 38 Q 90 32, 180 22 T 320 10"
                  fill="none"
                  stroke={item.strokeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
            </div>

            {/* Bottom Link Action */}
            <div className="pt-1 flex items-center">
              <button
                onClick={() => onNavigate(item.targetTab)}
                className="flex items-center gap-1 text-xs font-bold border-none bg-transparent p-0 cursor-pointer transition-colors group-hover:gap-2"
                style={{ color: item.iconColor }}
              >
                <span>View Details</span>
                <span className="text-sm transition-transform duration-200 group-hover:translate-x-1">→</span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
