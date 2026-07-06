import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function StudentPerformanceCard({ tokens, performanceData }) {
  const { accentColor } = useTheme()
  const BRAND = accentColor || '#615FFF'
  const [timeframe, setTimeframe] = useState(performanceData?.timeframe || 'This Year')

  const categories = performanceData?.categories || [
    { name: 'Technical Events', percentage: 87, color: BRAND },
    { name: 'Cultural Events', percentage: 40, color: '#a78bfa' },
    { name: 'Workshops / Seminars', percentage: 78, color: '#38bdf8' },
    { name: 'Sports Events', percentage: 24, color: '#f43f5e' },
    { name: 'Others', percentage: 10, color: '#94a3b8' },
  ]

  const score = performanceData?.score || 84
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div
      className="rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-start"
      style={{
        background: tokens.dark ? '#0f1e30' : '#ffffff',
        border: `1px solid ${tokens.dark ? '#1a3050' : '#e2e8f0'}`,
        boxShadow: tokens.shadow,
      }}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-4 mb-1">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white m-0 tracking-tight">
              Performance
            </h3>
          </div>

          <div className="relative">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="appearance-none text-xs font-bold px-3 py-1.5 pr-8 rounded-xl cursor-pointer outline-none transition-colors border"
              style={{
                background: tokens.dark ? '#162640' : '#f8fafc',
                borderColor: tokens.dark ? '#1a3050' : '#e2e8f0',
                color: tokens.dark ? '#e8f0fe' : '#334155',
              }}
            >
              <option value="This Year">This Year</option>
              <option value="This Semester">This Semester</option>
              <option value="All Time">All Time</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
            />
          </div>
        </div>

        <p className="text-xs font-medium text-slate-500 dark:text-[#7a98bb] mt-0.5 mb-4">
          {performanceData?.subtitle || 'Your performance is calculated based on certificates earned from events.'}
        </p>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Left Donut Score */}
          <div className="md:col-span-4 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke={tokens.dark ? '#1a3050' : '#f1f5f9'}
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke={BRAND}
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                  {score}%
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-[#4a6a8a] uppercase mt-1">
                  Score
                </span>
              </div>
            </div>
          </div>

          {/* Right Category Progress Bars */}
          <div className="md:col-span-8 flex flex-col gap-2.5">
            {categories.map((cat) => (
              <div key={cat.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">{cat.name}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{cat.percentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-[#162640] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${cat.percentage}%`,
                      background: cat.color || BRAND,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
