import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Trash2 } from 'lucide-react'

export default function OrganizerDeleteModal({
  deleteTarget,
  setDeleteTarget,
  handleDelete,
  tokens,
  dark
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (deleteTarget && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal()
    }
  }, [deleteTarget])

  if (!deleteTarget) return null

  return createPortal(
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-9999 m-0 p-0 w-full h-full border-none bg-transparent"
      onClose={() => setDeleteTarget(null)}
      style={{ maxWidth: '100vw', maxHeight: '100vh' }}
    >
      <button
        type="button"
        className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-sm border-none cursor-default"
        onClick={() => setDeleteTarget(null)}
        aria-label="Close overlay"
      />
      <div
        className="fixed inset-0 pointer-events-none flex items-center justify-center p-5"
      >
        <div
          className="pointer-events-auto rounded-[20px] w-full max-w-[380px] p-7 text-center"
          style={{
            background: dark ? '#0c1829' : '#fff',
            border: `1px solid ${tokens.border}`,
            boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
            animation: 'slideUp 0.25s ease'
          }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <Trash2 size={24} color="#ef4444" />
          </div>
          <h3 className="text-[17px] font-extrabold m-0 mb-2" style={{ color: tokens.txtPri }}>Delete Organizer?</h3>
          <p className="text-[13px] mb-5" style={{ color: tokens.txtSec }}>
            This will permanently delete the account of <strong>{deleteTarget.name}</strong>. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border cursor-pointer bg-transparent"
              style={{ borderColor: tokens.border, color: tokens.txtSec }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer"
              style={{ background: '#ef4444' }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </dialog>,
    document.body
  )
}
