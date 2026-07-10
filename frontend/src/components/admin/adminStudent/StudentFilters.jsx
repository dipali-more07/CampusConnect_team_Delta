import React from 'react'
import { Search } from 'lucide-react'

export default function StudentFilters({
  search,
  setSearch,
  dept,
  setDept,
  DEPTS,
  year,
  setYear,
  YEARS,
  status,
  setStatus,
  STATUSES,
  tokens,
  BRAND,
  inpStyle
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px] max-w-[320px]">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: tokens.txtMuted }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, roll, department..."
          className="w-full pl-10 pr-4 h-[42px] rounded-xl text-[13px] outline-none border transition-all"
          style={{ ...inpStyle, borderColor: tokens.border }}
          onFocus={e => {
            e.target.style.borderColor = BRAND
            e.target.style.boxShadow = `0 0 0 3px ${BRAND}20`
          }}
          onBlur={e => {
            e.target.style.borderColor = tokens.border
            e.target.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* Select fields */}
      {[
        ['dept', dept, setDept, DEPTS],
        ['year', year, setYear, YEARS],
        ['status', status, setStatus, STATUSES]
      ].map(([key, val, setter, opts]) => (
        <div key={key} className="relative">
          <select
            value={val}
            onChange={e => setter(e.target.value)}
            className="pl-4 pr-9 h-[42px] rounded-full text-[12.5px] outline-none border appearance-none cursor-pointer font-bold"
            style={{ background: tokens.card, borderColor: tokens.border, color: tokens.txtPri }}
          >
            {opts.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: tokens.txtSec }}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1.5L5 4.5L9 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
}
