import { createPortal } from 'react-dom'
import { X, Loader2 } from 'lucide-react'

export default function StudentFormModal({
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
  inpStyle,
  DEPTS,
  YEARS
}) {
  if (!modalOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
    >
      <div
        className="rounded-[24px] w-full max-w-[520px] overflow-hidden"
        style={{
          background: dark ? '#0c1829' : '#fff',
          border: `1px solid ${tokens.border}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          animation: 'slideUp 0.25s ease'
        }}
      >
        <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: `1px solid ${tokens.border}` }}>
          <h2 className="text-[18px] font-extrabold m-0" style={{ color: tokens.txtPri }}>
            {editing ? `Edit — ${editing.rollNo}` : 'Add New Student'}
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
        <div className="px-7 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'name', label: 'Full Name', placeholder: 'e.g. Arjun Patel', col: 2 },
            { key: 'rollNo', label: 'Roll Number', placeholder: 'e.g. 21CS001' },
            { key: 'email', label: 'Email', placeholder: 'e.g. arjun@college.edu' },
            { key: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
            ...(!editing ? [{ key: 'password', label: 'Password', placeholder: 'Enter password', type: 'password', col: 2 }] : [])
          ].map(({ key, label, placeholder, col, type }) => (
            <div key={key} style={{ gridColumn: col === 2 ? '1 / -1' : undefined }}>
              <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>{label}</label>
              <input
                type={type || 'text'}
                value={form[key]}
                onChange={e => {
                  let val = e.target.value
                  if (key === 'phone') {
                    val = val.replace(/\D/g, '').slice(0, 10)
                  }
                  setForm(p => ({ ...p, [key]: val }))
                }}
                placeholder={placeholder}
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                style={{ ...inpStyle, borderColor: errors[key] ? '#ef4444' : tokens.border }}
                onFocus={e => {
                  e.target.style.borderColor = BRAND
                  e.target.style.boxShadow = `0 0 0 3px ${BRAND}20`
                }}
                onBlur={e => {
                  e.target.style.borderColor = errors[key] ? '#ef4444' : tokens.border
                  e.target.style.boxShadow = 'none'
                }}
              />
              {errors[key] && <span className="text-[11px] text-red-500 mt-1 block">{errors[key]}</span>}
            </div>
          ))}
          {[
            ['department', 'Department', DEPTS.filter(d => d !== 'All')],
            ['year', 'Year', YEARS.filter(y => y !== 'All')]
          ].map(([key, label, opts]) => (
            <div key={key}>
              <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>{label}</label>
              <select
                value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all appearance-none cursor-pointer"
                style={inpStyle}
              >
                {opts.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
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
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : (editing ? 'Update Student' : 'Add Student')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
