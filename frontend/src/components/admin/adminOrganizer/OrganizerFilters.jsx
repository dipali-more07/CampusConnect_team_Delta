import React from 'react'
import { Search } from 'lucide-react'

export default function OrganizerFilters({
  search,
  setSearch,
  tokens,
  BRAND,
  inputStyle
}) {
  return (
    <div className="relative max-w-[320px]">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: tokens.txtMuted }} />
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, department, email..."
        className="w-full pl-10 pr-4 h-[42px] rounded-xl text-[13px] outline-none border transition-all"
        style={{ ...inputStyle, borderColor: tokens.border }}
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
  )
}
