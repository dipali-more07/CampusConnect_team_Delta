import React from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../../data/dashboardData'

export default function DeleteConfirmModal({
  open,
  selectedEvent,
  onClose,
  onConfirm,
  tokens
}) {
  if (!open || !selectedEvent) return null

  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND

  return createPortal(
    <div
      className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-[20px] w-full max-w-[400px] overflow-hidden"
        style={{
          background: dark ? '#0c1829' : '#ffffff',
          border: `1px solid ${dark ? '#1a3050' : '#e8edf5'}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Body */}
        <div className="px-6 py-6 flex flex-col items-center text-center">
          <div className="w-[50px] h-[50px] rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-[17px] font-extrabold m-0 mb-2" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
            Delete Event?
          </h3>
          <p className="text-[13px] leading-relaxed m-0" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
            Are you sure you want to delete <strong style={{ color: dark ? '#e8f0fe' : '#334155' }}>{selectedEvent.name}</strong> ({selectedEvent.id})? This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#e8edf5'}` }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold bg-transparent transition-all duration-150 border cursor-pointer"
            style={{ borderColor: dark ? '#1a3050' : '#e2e8f0', color: dark ? '#7a98bb' : '#64748b' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#7a98bb' : '#64748b' }}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer bg-red-500 transition-all duration-200"
            style={{ boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.4)' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
