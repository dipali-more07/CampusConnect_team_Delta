import React from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../../data/dashboardData'

export default function ApprovalConfirmModal({
  modalState,
  onClose,
  onConfirm,
  tokens
}) {
  if (!modalState.open || !modalState.event) return null

  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND
  const { event, targetStatus } = modalState

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
          <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center mb-4 ${
            targetStatus === 'Approved' 
              ? 'bg-emerald-500/10 text-emerald-500' 
              : 'bg-red-500/10 text-red-500'
          }`}>
            {targetStatus === 'Approved' ? (
              <CheckCircle2 size={26} />
            ) : (
              <AlertTriangle size={24} />
            )}
          </div>
          <h3 className="text-[17px] font-extrabold m-0 mb-2" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
            {targetStatus === 'Approved' ? 'Approve Event?' : 'Reject Event?'}
          </h3>
          <p className="text-[13px] leading-relaxed m-0" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
            Are you sure you want to {targetStatus === 'Approved' ? 'approve' : 'reject'}{' '}
            <strong style={{ color: dark ? '#e8f0fe' : '#334155' }}>{event.name}</strong>?
            {targetStatus === 'Approved' && ' Once approved, this decision cannot be reverted.'}
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
            className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-200 ${
              targetStatus === 'Approved'
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-red-500 hover:bg-red-600'
            }`}
            style={{ 
              boxShadow: targetStatus === 'Approved'
                ? '0 4px 14px rgba(16, 185, 129, 0.4)'
                : '0 4px 14px rgba(239, 68, 68, 0.4)'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
