import React from 'react'
import { createPortal } from 'react-dom'
import { FileSpreadsheet, X, Loader2 } from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../../data/dashboardData'

export default function ImportModal({
  open,
  onClose,
  importing,
  importText,
  setImportText,
  onImportDemo,
  onImportCustom,
  tokens
}) {
  if (!open) return null

  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND

  const inputStyle = {
    border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`,
    color: dark ? '#e8f0fe' : '#0f172a',
    background: dark ? '#060e1c' : '#f8fafc',
  }

  return createPortal(
    <div
      className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-[20px] w-full max-w-[480px] overflow-hidden"
        style={{
          background: dark ? '#0c1829' : '#ffffff',
          border: `1px solid ${dark ? '#1a3050' : '#e8edf5'}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${dark ? '#1a3050' : '#e8edf5'}` }}>
          <h2 className="text-[17px] font-extrabold m-0 flex items-center gap-2" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
            <FileSpreadsheet size={18} style={{ color: BRAND }} /> Import Events
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
            style={{ color: dark ? '#4a6a8a' : '#94a3b8' }}
            onMouseEnter={e => { e.currentTarget.style.background = dark ? '#162640' : '#f1f5f9'; e.currentTarget.style.color = dark ? '#e8f0fe' : '#475569' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dark ? '#4a6a8a' : '#94a3b8' }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          
          {/* Option 1: Demo Import */}
          <div className="p-4 rounded-xl border border-dashed flex flex-col gap-3" style={{ borderColor: dark ? '#1a3050' : '#e2e8f0', background: dark ? '#060e1c' : '#f8fafc' }}>
            <div>
              <h4 className="text-[13.5px] font-extrabold m-0" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>Option 1: Import Demo Events</h4>
              <p className="text-[12px] mt-1 mb-0" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                Quickly load 3 pre-configured campus events to populate the dashboard table for testing.
              </p>
            </div>
            <button
              onClick={onImportDemo}
              disabled={importing}
              className="w-full py-2 flex items-center justify-center gap-1.5 rounded-[8px] text-[12px] font-bold text-white border-none cursor-pointer transition-all duration-200"
              style={{ background: BRAND, boxShadow: '0 2px 8px rgba(97,95,255,0.3)' }}
            >
              {importing ? <Loader2 size={13} className="animate-spin" /> : 'Load Demo Events'}
            </button>
          </div>

          <div className="text-center text-[11px] font-bold" style={{ color: dark ? '#3d5470' : '#94a3b8' }}>— OR —</div>

          {/* Option 2: Custom JSON */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-bold" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
              Option 2: Paste JSON List
            </label>
            <textarea
              rows={6}
              placeholder={`[\n  {\n    "name": "Custom Hackathon",\n    "organizer": "Dr. Anita Nair",\n    "category": "Technical",\n    "venue": "Lab C",\n    "date": "2025-10-15",\n    "capacity": 100,\n    "status": "Upcoming"\n  }\n]`}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] text-[12px] outline-none resize-none box-border font-mono transition-all duration-200"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
              onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
            />
            <button
              onClick={onImportCustom}
              disabled={importing || !importText.trim()}
              className="w-full py-2.5 rounded-[8px] text-[12px] font-bold text-white border-none cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: BRAND }}
            >
              Import Paste JSON
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
