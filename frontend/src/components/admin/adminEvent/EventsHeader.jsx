import React from 'react'
import { Search, Plus, Upload, Download } from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../../data/dashboardData'
import CustomSelect from '../../common/CustomSelect'

export default function EventsHeader({
  dark,
  tokens,
  searchQuery,
  setSearchQuery,
  activeStatus,
  setActiveStatus,
  activeCategory,
  setActiveCategory,
  categories,
  statuses,
  onOpenCreate,
  onOpenImport,
  onExport
}) {
  const BRAND = tokens?.brand || DEFAULT_BRAND

  return (
    <>
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-extrabold m-0 tracking-tight" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
            Events
          </h1>
          <p className="text-[13px] mt-1" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
            Manage all campus events
          </p>
        </div>
        
        {/* Actions Button */}
        <div className="flex gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-transparent cursor-pointer transition-all duration-200"
            style={{ border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`, color: dark ? '#7a98bb' : '#64748b' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#7a98bb' : '#64748b' }}
          >
            <Download size={14} /> Import
          </button>
          
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-transparent cursor-pointer transition-all duration-200"
            style={{ border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`, color: dark ? '#7a98bb' : '#64748b' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#7a98bb' : '#64748b' }}
          >
            <Upload size={14} /> Export
          </button>

          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-px"
            style={{ background: BRAND, boxShadow: '0 4px 14px rgba(97,95,255,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(97,95,255,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(97,95,255,0.4)' }}
          >
            <Plus size={15} /> Create Event
          </button>
        </div>
      </div>

      {/* ── Filter Row ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-[280px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: dark ? '#7a98bb' : '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-[42px] rounded-xl text-[13px] outline-none transition-all duration-200 border"
            style={{
              borderColor: dark ? '#1a3050' : '#e2e8f0',
              color: dark ? '#e8f0fe' : '#475569',
              background: dark ? '#0f1e30' : '#ffffff',
              fontWeight: 500,
            }}
            onFocus={e => { 
              e.target.style.borderColor = BRAND; 
              e.target.style.boxShadow = `0 0 0 3px ${BRAND}20`;
            }}
            onBlur={e => { 
              e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; 
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl border overflow-x-auto" style={{ background: dark ? '#0f1e30' : '#f8fafc', borderColor: dark ? '#1a3050' : '#e2e8f0' }}>
            {statuses.map(st => {
              const active = activeStatus === st
              const inactiveColor = dark ? '#7a98bb' : '#64748b'
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setActiveStatus(st)}
                  className="px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border-none whitespace-nowrap"
                  style={{
                    background: active ? BRAND : 'transparent',
                    color: active ? '#ffffff' : inactiveColor,
                  }}
                >
                  {st}
                </button>
              )
            })}
          </div>

          {/* Category Filter */}
          <div className="min-w-[150px]">
            <CustomSelect
              value={activeCategory}
              onChange={(e, val) => setActiveCategory(val)}
              options={categories.map(cat => ({
                value: cat,
                label: cat === 'All' ? 'All Categories' : cat
              }))}
              dark={dark}
            />
          </div>
        </div>
      </div>
    </>
  )
}
