import React from 'react'
import { Search } from 'lucide-react'

export default function ResultFilters({
  searchQuery,
  setSearchQuery,
  selectedEvent,
  setSelectedEvent,
  uniqueEvents,
  activeTab,
  setActiveTab,
  inputStyle,
  dark,
  BRAND
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      
      {/* Search & Event Dropdown */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        {/* Search bar */}
        <div className="relative w-full sm:w-[260px]">
          <Search 
            className="absolute left-3.5 top-1/2 -translate-y-1/2" 
            size={15} 
            style={{ color: dark ? '#4a6a8a' : '#94a3b8' }} 
          />
          <input
            type="text"
            placeholder="Search results, rolls..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none transition-all duration-200"
            style={inputStyle}
            onFocus={e => { 
              e.target.style.borderColor = BRAND
              e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` 
            }}
            onBlur={e => { 
              e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'
              e.target.style.boxShadow = 'none' 
            }}
          />
        </div>

        {/* Event Filter */}
        <div className="w-full sm:w-[200px]">
          <select
            value={selectedEvent}
            onChange={e => setSelectedEvent(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none font-semibold cursor-pointer"
            style={inputStyle}
          >
            <option value="All">All Events</option>
            {uniqueEvents.filter(e => e !== 'All').map(evName => (
              <option key={evName} value={evName}>{evName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Tabs (Solo / Team) */}
      <div
        className="flex items-center rounded-xl p-1 border h-[42px] box-border"
        style={{
          borderColor: dark ? '#1a3050' : '#e2e8f0',
          background: dark ? '#0f1e30' : '#ffffff',
        }}
      >
        {['All', 'Solo', 'Team'].map(tab => {
          const active = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 h-[32px] rounded-xl text-[12px] border-none cursor-pointer flex items-center justify-center transition-all duration-200 font-bold"
              style={{
                background: active ? BRAND : 'transparent',
                color: active ? '#ffffff' : (dark ? '#7a98bb' : '#5c6f84'),
                boxShadow: active ? '0 3px 10px rgba(97,95,255,0.3)' : 'none',
              }}
            >
              {tab}
            </button>
          )
        })}
      </div>
    </div>
  )
}
