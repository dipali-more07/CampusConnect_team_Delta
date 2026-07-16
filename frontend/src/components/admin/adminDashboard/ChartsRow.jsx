import React, { useState, useEffect } from 'react'
import { LineDotRightHorizontal } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { CHART_DATA, DEPT_DATA } from '../../../data/dashboardData'
import analyticsService from '../../../services/analyticsService'

function CustomTooltip({ active, payload, label, dark }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 text-[11px]"
      style={{
        background: dark ? '#0c1829' : '#fff',
        border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      <p className="font-bold mb-1" style={{ color: dark ? '#e8f0fe' : '#334155' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} className="m-0.5" style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function ChartsRow({ dark, tokens }) {
  const { card, border, shadow, txtPri, inputBg } = tokens
  const [deptData, setDeptData] = useState(DEPT_DATA)
  const [chartData, setChartData] = useState(CHART_DATA)

  useEffect(() => {
    const loadDeptParticipation = async () => {
      const res = await analyticsService.fetchDeptDistribution()
      if (res.success && res.depts && res.depts.length > 0) {
        setDeptData(res.depts)
      }
    }
    const loadGrowth = async () => {
      const res = await analyticsService.fetchGrowth()
      if (res.success && res.data && res.data.length > 0) {
        const mapped = res.data.map(item => {
          let label = item.month || item.date || ''
          if (label.includes('-')) {
            try {
              const dObj = new Date(label)
              if (!isNaN(dObj.getTime())) {
                label = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }
            } catch {}
          }
          const hasEvCount = item.events_count !== undefined
          return {
            month: label,
            registrations: Number(item.registrations !== undefined ? item.registrations : (item.registrations_count !== undefined ? item.registrations_count : 0)),
            attendance: Number(item.attendance !== undefined ? item.attendance : (item.events_count !== undefined ? item.events_count : 0)),
            isGrowthApi: hasEvCount
          }
        })
        setChartData(mapped)
      }
    }
    loadDeptParticipation()
    loadGrowth()
  }, [])

  const isGrowthApi = chartData.some(item => item.isGrowthApi)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

      {/* Area Chart */}
      <div
        className="lg:col-span-2 rounded-2xl border p-5 transition-all duration-300"
        style={{
          background: card,
          borderColor: border,
          boxShadow: shadow,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-extrabold text-slate-900 dark:text-[#e8f0fe] m-0">Event &amp; Registration Growth</h2>
            <p className="text-[12px] text-slate-500 dark:text-[#7a98bb] mt-0.5">{isGrowthApi ? "Last 30 Days" : "January — August 2025"}</p>
          </div>
          <select
            className="text-[12px] border rounded-lg px-3 py-1.5 text-slate-500 dark:text-[#7a98bb] outline-none cursor-pointer"
            style={{
              borderColor: border,
              background: inputBg,
            }}
          >
            <option>2025</option>
            <option>2024</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={border} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: dark ? '#7a98bb' : '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: dark ? '#7a98bb' : '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip dark={dark} />} />
            <Area type="monotone" dataKey="registrations" name="Registrations" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRegistrations)" activeDot={{ r: 6 }} />
            <Area type="monotone" dataKey="attendance" name={isGrowthApi ? "Events Created" : "Attendance %"} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAttendance)" strokeDasharray="4 2" activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-5 mt-3 pl-2">
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#4f46e5]">
            <LineDotRightHorizontal /> Registrations
          </span>
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#10b981]">
            <LineDotRightHorizontal /> {isGrowthApi ? "Events Created" : "Attendance %"}
          </span>
        </div>
      </div>

      {/* Donut Chart */}
      <div
        className="rounded-2xl border p-5 transition-all duration-300"
        style={{
          background: card,
          borderColor: border,
          boxShadow: shadow,
        }}
      >
        <div className="mb-2">
          <h2 className="text-[15px] font-extrabold text-slate-900 dark:text-[#e8f0fe] m-0">Dept. Participation</h2>
          <p className="text-[12px] text-slate-500 dark:text-[#7a98bb] mt-0.5">By department share</p>
        </div>
        <ResponsiveContainer width="100%" height={170}>
          <PieChart>
            <Pie data={deptData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={2} dataKey="value">
              {deptData.map(entry => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, n) => [`${v}%`, n]}
              contentStyle={{
                fontSize: 11, borderRadius: 10,
                border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`,
                background: dark ? '#0c1829' : '#fff',
                color: dark ? '#e8f0fe' : '#0f172a',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-y-2 gap-x-6 mt-3">
          {deptData.map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-[12px] text-slate-500 dark:text-[#7a98bb] font-medium">{d.name}</span>
              <span className="text-[12px] font-bold text-slate-900 dark:text-[#e8f0fe] ml-auto">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
