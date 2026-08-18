import React from 'react'
import { Search } from 'lucide-react'
import CustomSelect from '../../common/CustomSelect'

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
  const dark = tokens.dark ?? true

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px] max-w-[320px]">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: tokens.txtMuted }} />
        <input
          type="text"
          placeholder="Search by name, roll no, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 h-[42px] rounded-full text-xs outline-none transition-all"
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
        <div key={key} className="min-w-[130px]">
          <CustomSelect
            value={val}
            onChange={(e, value) => setter(value)}
            options={opts.map(o => ({ value: o, label: o }))}
            dark={dark}
          />
        </div>
      ))}
    </div>
  )
}
