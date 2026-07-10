import React from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2 } from 'lucide-react'

export default function OrganizerFormModal({
  modalOpen,
  setModalOpen,
  editing,
  form,
  setForm,
  errors,
  handleSave,
  saving,
  tokens,
  dark,
  BRAND,
  inputStyle
}) {
  if (!modalOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
    >
      <div
        className="rounded-[24px] w-full max-w-[500px] overflow-hidden"
        style={{
          background: dark ? '#0c1829' : '#fff',
          border: `1px solid ${tokens.border}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          animation: 'slideUp 0.25s ease'
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: `1px solid ${tokens.border}` }}>
          <h2 className="text-[18px] font-extrabold m-0" style={{ color: tokens.txtPri }}>
            {editing ? 'Edit Organizer Account' : 'Add New Organizer'}
          </h2>
          <button
            onClick={() => setModalOpen(false)}
            className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center"
            style={{ color: tokens.txtSec }}
            onMouseEnter={e => e.currentTarget.style.background = tokens.hoverBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Fields */}
        <div className="px-7 py-6 space-y-4">
          <div>
            <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Full Name</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Dr. Priya Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
              style={{ ...inputStyle, borderColor: errors.name ? '#ef4444' : tokens.border }}
              onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
              onBlur={e => { e.target.style.borderColor = errors.name ? '#ef4444' : tokens.border; e.target.style.boxShadow = 'none' }}
            />
            {errors.name && <span className="text-[11px] text-red-500 mt-1 block">{errors.name}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Email Address</label>
              <input
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="e.g. priya.s@university.edu"
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                style={{ ...inputStyle, borderColor: errors.email ? '#ef4444' : tokens.border }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = errors.email ? '#ef4444' : tokens.border; e.target.style.boxShadow = 'none' }}
              />
              {errors.email && <span className="text-[11px] text-red-500 mt-1 block">{errors.email}</span>}
            </div>

            <div>
              <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>College ID</label>
              <input
                value={form.collegeId}
                onChange={e => setForm(p => ({ ...p, collegeId: e.target.value }))}
                placeholder="e.g. COL1002"
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                style={{ ...inputStyle, borderColor: errors.collegeId ? '#ef4444' : tokens.border }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = errors.collegeId ? '#ef4444' : tokens.border; e.target.style.boxShadow = 'none' }}
              />
              {errors.collegeId && <span className="text-[11px] text-red-500 mt-1 block">{errors.collegeId}</span>}
            </div>
          </div>

          {!editing && (
            <div>
              <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Enter password (min 6 chars)"
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                style={{ ...inputStyle, borderColor: errors.password ? '#ef4444' : tokens.border }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = errors.password ? '#ef4444' : tokens.border; e.target.style.boxShadow = 'none' }}
              />
              {errors.password && <span className="text-[11px] text-red-500 mt-1 block">{errors.password}</span>}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Department</label>
              <input
                value={form.department}
                onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                placeholder="e.g. Computer Science"
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Phone</label>
              <input
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          
        </div>

        {/* Action Buttons */}
        <div className="px-7 pb-6 flex gap-3">
          <button
            onClick={() => setModalOpen(false)}
            className="flex-1 py-3 rounded-xl text-[13px] font-bold border cursor-pointer transition-all"
            style={{ borderColor: tokens.border, color: tokens.txtSec, background: 'transparent' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            style={{ background: BRAND }}
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving…</>
            ) : (
              editing ? 'Update Account' : 'Create Account'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
