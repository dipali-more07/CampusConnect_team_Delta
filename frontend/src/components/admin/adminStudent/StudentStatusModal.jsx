import React from 'react'
import { createPortal } from 'react-dom'
import { UserCheck, UserX, Loader2 } from 'lucide-react'

export default function StudentStatusModal({
  statusTarget,
  setStatusTarget,
  handleConfirmStatus,
  saving,
  tokens,
  dark
}) {
  if (!statusTarget) return null

  const isActivating = statusTarget.status !== 'Active'
  const actionColor = isActivating ? '#00BC7D' : '#f97316'
  const iconBg = isActivating ? 'rgba(0,188,125,0.12)' : 'rgba(249,115,22,0.12)'
  const Icon = isActivating ? UserCheck : UserX
  const actionLabel = isActivating ? 'Activate' : 'Suspend'
  const actionDesc = isActivating
    ? `This will activate <strong>${statusTarget.name}</strong>'s account. They will be able to log in again.`
    : `This will suspend <strong>${statusTarget.name}</strong>'s account. They won't be able to log in.`

  return createPortal(
    <div
      className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={e => { if (e.target === e.currentTarget && !saving) setStatusTarget(null) }}
    >
      <div
        className="rounded-[20px] w-full max-w-[400px] p-7 text-center"
        style={{
          background: dark ? '#0c1829' : '#fff',
          border: `1px solid ${tokens.border}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          animation: 'slideUp 0.25s ease'
        }}
      >
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: iconBg }}
        >
          <Icon size={24} color={actionColor} />
        </div>

        {/* Title */}
        <h3 className="text-[17px] font-extrabold m-0 mb-2" style={{ color: tokens.txtPri }}>
          {actionLabel} Student?
        </h3>

        {/* Description */}
        <p
          className="text-[13px] mb-1 leading-relaxed"
          style={{ color: tokens.txtSec }}
          dangerouslySetInnerHTML={{ __html: actionDesc }}
        />

        {/* Current status badge */}
        <div className="flex items-center justify-center gap-2 my-4">
          <span className="text-[11px] font-semibold" style={{ color: tokens.txtSec }}>Current:</span>
          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
            style={{
              background: statusTarget.status === 'Active'
                ? (dark ? 'rgba(0,188,125,.15)' : '#e6fbf2')
                : (dark ? 'rgba(239,68,68,.15)' : '#fef2f2'),
              color: statusTarget.status === 'Active' ? '#00BC7D' : '#ef4444'
            }}
          >
            {statusTarget.status}
          </span>
          <span className="text-[11px]" style={{ color: tokens.txtSec }}>→</span>
          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
            style={{
              background: isActivating
                ? (dark ? 'rgba(0,188,125,.15)' : '#e6fbf2')
                : (dark ? 'rgba(249,115,22,.15)' : '#fff7ed'),
              color: isActivating ? '#00BC7D' : '#f97316'
            }}
          >
            {isActivating ? 'Active' : 'Suspended'}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => setStatusTarget(null)}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border cursor-pointer transition-all"
            style={{ borderColor: tokens.border, color: tokens.txtSec, background: 'transparent', opacity: saving ? 0.5 : 1 }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmStatus}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all"
            style={{ background: actionColor, opacity: saving ? 0.8 : 1 }}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {actionLabel}ing…
              </>
            ) : (
              <>{actionLabel}</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
