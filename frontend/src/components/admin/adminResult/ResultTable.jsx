import React from 'react'
import { Trophy, Award, Trash2, ChevronLeft, ChevronRight, FileText } from 'lucide-react'

export default function ResultTable({
  loading,
  filteredResults,
  paginatedResults,
  startIndex,
  endIndex,
  totalItems,
  itemsPerPage,
  setItemsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
  BRAND,
  dark,
  cardStyle,
  handleDeleteResult
}) {
  const tableHeaders = ['Participant / Team', 'Department', 'Year', 'Event', 'Rank', 'Date']

  const renderRankBadge = (rankNum) => {
    const num = Number(rankNum)
    if (num === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs">
          <Trophy size={13} className="text-amber-500 fill-amber-500" />
          1st Rank
        </span>
      )
    }
    if (num === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-extrabold bg-slate-400/15 text-slate-600 dark:text-slate-300 border border-slate-400/30 shadow-xs">
          <Award size={13} className="text-slate-400 fill-slate-400" />
          2nd Rank
        </span>
      )
    }
    if (num === 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-extrabold bg-orange-600/15 text-orange-600 dark:text-orange-400 border border-orange-600/30 shadow-xs">
          <Award size={13} className="text-orange-500 fill-orange-500" />
          3rd Rank
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
        <Award size={12} />
        Rank {num}
      </span>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden border" style={cardStyle}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr style={{ background: dark ? '#060e1c' : '#f8fafc', borderBottom: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}>
              {tableHeaders.map((header) => (
                <th key={header} className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ divideColor: dark ? '#1a3050' : '#e2e8f0' }}>
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <tr key={i}>
                  <td className="p-4"><div className="w-36 h-4 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
                  <td className="p-4"><div className="w-16 h-4 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
                  <td className="p-4"><div className="w-12 h-4 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
                  <td className="p-4"><div className="w-28 h-4 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
                  <td className="p-4"><div className="w-24 h-6 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
                  <td className="p-4"><div className="w-20 h-4 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
                </tr>
              ))
            ) : filteredResults.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-12 text-center">
                  <FileText size={40} className="block mx-auto mb-3 text-slate-400" />
                  <span className="text-[13px] font-semibold text-slate-500">No results found for current filters</span>
                </td>
              </tr>
            ) : (
              paginatedResults.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-slate-50/30 dark:hover:bg-slate-850/10"
                >
                  {/* Participant / Team */}
                  <td className="p-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13.5px] font-bold text-slate-900 dark:text-slate-100">{row.participantName}</span>
                      {row.type === 'Team' && row.members && row.members.length > 0 && (
                        <span className="text-[11px] text-slate-400 dark:text-[#7a98bb] font-semibold">
                          Members: {row.members.join(', ')}
                        </span>
                      )}
                      <span className="inline-block mt-0.5 w-max px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 dark:text-indigo-400">
                        {row.type}
                      </span>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="p-4 text-[13.5px] font-semibold text-slate-700 dark:text-slate-300">{row.department}</td>

                  {/* Year */}
                  <td className="p-4 text-[13.5px] font-medium text-slate-600 dark:text-slate-400">{row.year}</td>

                  {/* Event */}
                  <td className="p-4 text-[13.5px] font-bold" style={{ color: BRAND }}>{row.eventName}</td>

                  {/* Rank with Icon */}
                  <td className="p-4">
                    {renderRankBadge(row.rank)}
                  </td>

                  {/* Date */}
                  <td className="p-4 text-[13px] font-medium text-slate-500 dark:text-slate-400">{row.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Table Pagination Bar ── */}
      <div 
        className="flex items-center justify-between flex-wrap gap-4 px-6 py-4"
        style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}
      >
        {/* Showing status & Items per page */}
        <div className="flex items-center gap-4">
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
                background: dark ? '#0f1e30' : '#ffffff',
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

        {/* Pagination Page Controls */}
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
                className="w-8 h-8 rounded-lg text-[12.5px] font-extrabold cursor-pointer transition-all border-none"
                style={{
                  background: active ? BRAND : (dark ? '#0f1e30' : '#f1f5f9'),
                  color: active ? '#ffffff' : (dark ? '#7a98bb' : '#475569'),
                  boxShadow: active ? '0 3px 10px rgba(97,95,255,0.3)' : 'none'
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
      </div>
    </div>
  )
}
