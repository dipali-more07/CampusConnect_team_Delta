import React, { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../../data/dashboardData'

const PRESET_REASONS = [
  'Incomplete event details or missing schedule.',
  'Venue / Slot conflict with another university event.',
  'Violation of campus guidelines or policy.',
  'Budget or resource requirements not approved.',
  'Duplicate event submission.'
]

export default function ApprovalConfirmModal({
  modalState,
  onClose,
  onConfirm,
  tokens
}) {
  const dialogRef = useRef(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  useEffect(() => {
    if (modalState.open && modalState.event && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal()
      setRejectionReason('')
      setReasonError('')
    }
  }, [modalState.open, modalState.event])

  if (!modalState.open || !modalState.event) return null

  const { dark } = tokens || {}
  const BRAND = tokens?.brand || DEFAULT_BRAND
  const { event, targetStatus } = modalState
  const isRejecting = targetStatus === 'Rejected'

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    if (isRejecting) {
      const trimmed = rejectionReason.trim()
      if (!trimmed) {
        setReasonError('Please provide a reason for rejecting this event.')
        return
      }
      onConfirm(trimmed)
    } else {
      onConfirm(null)
    }
  }

  const handleSelectPreset = (preset) => {
    setRejectionReason(preset)
    setReasonError('')
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-100 m-0 p-0 w-full h-full border-none bg-transparent"
      onClose={onClose}
      style={{ maxWidth: '100vw', maxHeight: '100vh' }}
    >
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className={`rounded-[22px] w-full overflow-hidden transition-all duration-200 ${
            isRejecting ? 'max-w-[500px]' : 'max-w-[420px]'
          }`}
          style={{
            background: dark ? '#0c1829' : '#ffffff',
            border: `1px solid ${dark ? '#1a3050' : '#e8edf5'}`,
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Header & Body */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start gap-4 mb-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isRejecting 
                  ? 'bg-red-500/15 text-red-500 border border-red-500/20' 
                  : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
              }`}>
                {isRejecting ? (
                  <AlertTriangle size={24} />
                ) : (
                  <CheckCircle2 size={26} />
                )}
              </div>

              <div>
                <h3 className="text-[18px] font-extrabold m-0 leading-tight" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
                  {isRejecting ? 'Reject Event' : 'Approve Event'}
                </h3>
                <p className="text-[13px] leading-relaxed mt-1 mb-0" style={{ color: dark ? '#8faacb' : '#64748b' }}>
                  {isRejecting ? (
                    <>Specify the reason for rejecting <strong style={{ color: dark ? '#e8f0fe' : '#1e293b' }}>{event.name}</strong>. This reason will be displayed directly to the organizer.</>
                  ) : (
                    <>Are you sure you want to approve <strong style={{ color: dark ? '#e8f0fe' : '#1e293b' }}>{event.name}</strong>? Once approved, the event will be published.</>
                  )}
                </p>
              </div>
            </div>

            {/* Rejection Form Inputs */}
            {isRejecting && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: dark ? '#94a3b8' : '#475569' }}>
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value)
                      if (reasonError) setReasonError('')
                    }}
                    placeholder="Enter clear remarks explaining why this event was rejected..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed transition-all resize-none outline-none"
                    style={{
                      background: dark ? '#13233c' : '#f8fafc',
                      color: dark ? '#f1f5f9' : '#0f172a',
                      border: `1.5px solid ${reasonError ? '#ef4444' : dark ? '#22385b' : '#cbd5e1'}`,
                    }}
                  />
                  {reasonError && (
                    <div className="flex items-center gap-1.5 mt-1 text-[12px] text-red-500 font-medium">
                      <AlertCircle size={13} />
                      <span>{reasonError}</span>
                    </div>
                  )}
                </div>

                {/* Quick Presets */}
                <div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold mb-2" style={{ color: dark ? '#64748b' : '#94a3b8' }}>
                    <Sparkles size={12} />
                    <span>Quick Suggestions:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_REASONS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className="text-[11.5px] px-2.5 py-1 rounded-lg border text-left transition-all cursor-pointer leading-snug"
                        style={{
                          background: rejectionReason === preset
                            ? (dark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2')
                            : (dark ? '#112239' : '#f1f5f9'),
                          borderColor: rejectionReason === preset
                            ? '#ef4444'
                            : (dark ? '#1e3454' : '#e2e8f0'),
                          color: rejectionReason === preset
                            ? (dark ? '#fca5a5' : '#b91c1c')
                            : (dark ? '#94a3b8' : '#475569')
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 mt-2" style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#e8edf5'}` }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-[12px] text-[13px] font-semibold bg-transparent transition-all duration-150 border cursor-pointer"
              style={{ borderColor: dark ? '#1a3050' : '#e2e8f0', color: dark ? '#7a98bb' : '#64748b' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#7a98bb' : '#64748b' }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className={`flex-1 py-2.5 rounded-[12px] text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-200 ${
                isRejecting
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
              style={{ 
                boxShadow: isRejecting
                  ? '0 4px 14px rgba(239, 68, 68, 0.4)'
                  : '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              {isRejecting ? 'Reject Event' : 'Approve & Publish'}
            </button>
          </div>
        </div>
      </div>
    </dialog>,
    document.body
  )
}
