import React from 'react'
import { Search, X } from 'lucide-react'

export default function CertificateFilters({
  searchQuery,
  setSearchQuery,
  activeStatus,
  setActiveStatus,
  activeEvent,
  setActiveEvent,
  statuses,
  events,
  selected,
  setSelected,
  certs,
  handleGenerate,
  handleSend,
  sendLoading,
  inputStyle,
  tokens,
  BRAND
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full max-w-[280px]">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: tokens.txtMuted }} />
        <input
          type="text"
          placeholder="Search certificates..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 h-[42px] rounded-xl text-[13px] outline-none border transition-all duration-200"
          style={{ ...inputStyle, borderColor: tokens.border, fontWeight: 500 }}
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

      <div className="flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex items-center rounded-xl p-1 border h-[42px]" style={{ borderColor: tokens.border, background: tokens.card }}>
          {statuses.map(st => {
            const active = activeStatus === st
            return (
              <button
                key={st}
                onClick={() => setActiveStatus(st)}
                className="px-4 h-[32px] rounded-xl text-[12px] border-none cursor-pointer flex items-center transition-all duration-200"
                style={{
                  background: active ? BRAND : 'transparent',
                  color: active ? '#fff' : tokens.txtSec,
                  fontWeight: active ? 700 : 600,
                  boxShadow: active ? '0 3px 10px rgba(97,95,255,0.3)' : 'none',
                }}
              >
                {st}
              </button>
            )
          })}
        </div>

        {/* Event filter */}
        <div className="relative">
          <select
            value={activeEvent}
            onChange={e => setActiveEvent(e.target.value)}
            className="pl-4 pr-9 h-[42px] rounded-full text-[12.5px] outline-none cursor-pointer border appearance-none font-bold"
            style={{ background: tokens.card, borderColor: tokens.border, color: tokens.txtPri }}
          >
            {events.map(ev => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: tokens.txtSec }}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1.5L5 4.5L9 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Bulk actions */}
        {selected.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold" style={{ color: tokens.txtSec }}>{selected.length} selected</span>
            <button
              onClick={() => handleGenerate(selected.filter(id => certs.find(c => c.id === id)?.status === 'Pending'))}
              className="px-3 py-1.5 rounded-lg text-[12px] font-bold border-none cursor-pointer text-white"
              style={{ background: BRAND }}
            >
              Generate
            </button>
            <button
              onClick={() => handleSend(selected.filter(id => certs.find(c => c.id === id)?.status === 'Generated'))}
              disabled={sendLoading}
              className="px-3 py-1.5 rounded-lg text-[12px] font-bold border-none cursor-pointer text-white"
              style={{ background: '#00BC7D' }}
            >
              {sendLoading ? '...' : 'Send'}
            </button>
            <button
              onClick={() => setSelected([])}
              className="w-7 h-7 rounded-lg border-none bg-transparent cursor-pointer flex items-center justify-center"
              style={{ color: tokens.txtSec }}
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
