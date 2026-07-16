import React from 'react'
import { Search, X, FileText, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

export default function AttendanceTabMonitor({
  chartLoading,
  chartData,
  loading,
  filtered,
  paginatedRecords,
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  updatingId,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  selectedEvtName,
  dark,
  BRAND,
  cardStyle,
  inp,
  label,
  badgeStyle
}) {
  return (
    <div className="space-y-5">
      {/* ── BAR CHART CARD ── */}
      <div className="rounded-2xl border p-6" style={cardStyle}>
        {/* chart header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-extrabold m-0">
            Live Attendance — <span style={{ color: BRAND }}>{selectedEvtName}</span>
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00BC7D' }} />
            <span className="text-[12px] font-bold" style={{ color: '#00BC7D' }}>Live</span>
          </div>
        </div>

        {chartLoading ? (
          <div className="flex items-end gap-2 h-[200px] pt-6">
            {Array(11).fill(0).map((_, i) => (
              <div key={i} className="flex-1 rounded-t-lg animate-pulse"
                style={{ height: `${30 + Math.random() * 60}%`, background: dark ? '#1a3050' : '#f1f5f9' }} />
            ))}
          </div>
        ) : (() => {
          const MAX = 220
          const yTicks = [0, 55, 110, 165, 220]
          const CHART_H = 240  // Fixed px height

          return (
            <div className="w-full pl-8 pr-2 pt-4">
              <div className="flex flex-col w-full">
                {/* Chart area */}
                <div className="relative w-full" style={{ height: CHART_H }}>
                  {/* Horizontal grid lines & Y-labels */}
                  {yTicks.map(t => (
                    <div
                      key={t}
                      className="absolute left-0 right-0 flex items-center"
                      style={{
                        bottom: `${(t / MAX) * 100}%`,
                        height: 1,
                        background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                      }}
                    >
                      <span
                        className="absolute text-[11px] font-semibold text-right pr-3"
                        style={{ ...label, width: 40, left: -40, top: '50%', transform: 'translateY(-50%)' }}
                      >
                        {t}
                      </span>
                    </div>
                  ))}

                  {/* Bars */}
                  <div className="absolute inset-0 flex items-end gap-2 sm:gap-3 z-10">
                    {chartData.map(({ hour, count }) => {
                      const heightPct = Math.max((count / MAX) * 100, 1)
                      return (
                        <div key={hour} className="flex-1 flex flex-col items-center justify-end h-full group">
                          <div
                            className="w-full rounded-t-md transition-all duration-700 relative cursor-pointer"
                            style={{
                              height: `${heightPct}%`,
                              background: '#6366f1',
                              opacity: 0.95,
                            }}
                            title={`${hour}: ${count} check-ins`}
                          >
                            {/* hover tooltip */}
                            <div
                              className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded text-[11px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md"
                              style={{ background: '#4f46e5' }}
                            >
                              {count}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* X-axis labels */}
                <div className="flex gap-2 sm:gap-3 mt-3 z-10">
                  {chartData.map(({ hour }) => (
                    <div key={hour} className="flex-1 text-center text-[10.5px] font-semibold" style={label}>
                      {hour}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── ATTENDANCE TABLE ── */}
      <div className="rounded-2xl overflow-hidden border" style={cardStyle}>
        {/* ── Search & Filter Header Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b" style={{ borderColor: dark ? '#1a3050' : '#e2e8f0' }}>
          {/* Search Bar */}
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15} style={{ color: dark ? '#4a6a8a' : '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search student or roll no..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl text-[13px] outline-none transition-all duration-200"
              style={inp}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer border-none bg-transparent p-0 flex items-center justify-center"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div
            className="flex items-center rounded-xl p-1 border h-[38px] box-border"
            style={{
              borderColor: dark ? '#1a3050' : '#e2e8f0',
              background: dark ? '#060e1c' : '#ffffff',
            }}
          >
            {['All', 'Present', 'Absent', 'Late'].map(tab => {
              const active = filterStatus === tab
              return (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className="px-3.5 h-[28px] rounded-lg text-[12px] border-none cursor-pointer flex items-center justify-center transition-all duration-200 font-bold"
                  style={{
                    background: active ? BRAND : 'transparent',
                    color: active ? '#ffffff' : (dark ? '#7a98bb' : '#5c6f84'),
                    boxShadow: active ? '0 2px 8px rgba(97,95,255,0.3)' : 'none',
                  }}
                >
                  {tab}
                </button>
              )
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr style={{ background: dark ? '#060e1c' : '#f8fafc', borderBottom: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}>
                {['Student', 'Roll No', 'Check-In', 'Attendance ID', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: h === 'Check-In' || h === 'Attendance ID' ? BRAND : (dark ? '#4a6a8a' : '#94a3b8') }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#f1f5f9'}` }}>
                    {[160, 80, 80, 80, 70].map((w, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 rounded animate-pulse" style={{ width: w, background: dark ? '#1a3050' : '#f1f5f9' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <FileText size={36} className="block mx-auto mb-2 text-slate-400" />
                    <span className="text-[13px] font-semibold text-slate-400">No attendance records found matching filters</span>
                  </td>
                </tr>
              ) : paginatedRecords.map((row, idx) => {
                const badge = badgeStyle(row.status)
                const isUpd = updatingId === row.id
                return (
                  <tr key={row.id}
                    className="transition-colors hover:bg-slate-50/30 dark:hover:bg-slate-800/20"
                    style={{ borderTop: idx === 0 ? 'none' : `1px solid ${dark ? '#1a3050' : '#f1f5f9'}` }}
                  >
                    <td className="px-6 py-4 text-[13.5px] font-bold">{row.studentName}</td>
                    <td className="px-6 py-4 text-[13px] font-semibold" style={label}>{row.rollNo}</td>
                    <td className="px-6 py-4 text-[13px]" style={label}>{row.checkIn}</td>
                    <td className="px-6 py-4 text-[13px]" style={label}>
                      <span className="font-mono text-[11.5px] bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/50" title={row.id}>
                        {row.id ? `${row.id.slice(0, 8)}...` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isUpd ? (
                        <Loader2 size={14} className="animate-spin text-slate-400" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                            style={{ background: badge.bg, color: badge.text }}>
                            {row.status}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer with Pagination Controls ── */}
        {!loading && (
          <div
            className="flex items-center justify-between flex-wrap gap-4 px-6 py-3.5 border-t"
            style={{ borderColor: dark ? '#1a3050' : '#e2e8f0' }}
          >
            {/* Showing entries & Per page count */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-[12.5px] font-medium" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                Showing <strong style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{totalItems > 0 ? startIndex + 1 : 0}</strong> to{' '}
                <strong style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{endIndex}</strong> of{' '}
                <strong style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{totalItems}</strong> entries
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500">Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={e => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-2.5 py-1 rounded-lg text-[12px] font-bold outline-none cursor-pointer border"
                  style={{
                    background: dark ? '#060e1c' : '#ffffff',
                    borderColor: dark ? '#1a3050' : '#cbd5e1',
                    color: dark ? '#e8f0fe' : '#334155'
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border bg-transparent cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    borderColor: dark ? '#1a3050' : '#e2e8f0',
                    color: dark ? '#e8f0fe' : '#475569'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  const active = page === currentPage
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className="w-7.5 h-7.5 rounded-lg text-[12.5px] font-extrabold cursor-pointer transition-all border-none"
                      style={{
                        background: active ? BRAND : (dark ? '#0f1e30' : '#f1f5f9'),
                        color: active ? '#ffffff' : (dark ? '#7a98bb' : '#475569'),
                        boxShadow: active ? '0 2px 8px rgba(97,95,255,0.3)' : 'none'
                      }}
                    >
                      {page}
                    </button>
                  )
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 rounded-lg border bg-transparent cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    borderColor: dark ? '#1a3050' : '#e2e8f0',
                    color: dark ? '#e8f0fe' : '#475569'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
