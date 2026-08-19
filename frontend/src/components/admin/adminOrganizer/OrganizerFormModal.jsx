import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Eye, EyeOff } from 'lucide-react'
import CustomSelect from '../../common/CustomSelect'

const evaluatePasswordStrength = (pass) => {
  if (!pass) return { label: '', colorClass: '', barColor: '', width: '0%' }
  
  let score = 0
  if (pass.length >= 6) score++
  if (pass.length >= 8) score++
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++
  if (/\d/.test(pass)) score++
  if (/[^A-Za-z0-9]/.test(pass)) score++

  if (score <= 2) {
    return {
      label: 'Weak',
      colorClass: 'text-red-500',
      barColor: 'bg-red-500',
      width: '33.33%'
    }
  } else if (score <= 4) {
    return {
      label: 'Medium',
      colorClass: 'text-amber-500',
      barColor: 'bg-amber-500',
      width: '66.66%'
    }
  } else {
    return {
      label: 'Strong',
      colorClass: 'text-emerald-500',
      barColor: 'bg-emerald-500',
      width: '100%'
    }
  }
}

function PersonalFields({ form, setForm, errors, tokens, BRAND, inputStyle }) {
  return (
    <>
      <div>
        <label htmlFor="orgName" className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Full Name</label>
        <input
          id="orgName"
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
          <label htmlFor="orgEmail" className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Email Address</label>
          <input
            id="orgEmail"
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
          <label htmlFor="orgCollegeId" className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>College ID</label>
          <input
            id="orgCollegeId"
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
    </>
  )
}

function PasswordField({ form, setForm, errors, tokens, BRAND, inputStyle }) {
  const [showPassword, setShowPassword] = useState(false)
  const password = form.password || ''
  const strength = evaluatePasswordStrength(password)

  return (
    <div>
      <label htmlFor="orgPassword" className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Password</label>
      <div className="relative flex items-center">
        <input
          id="orgPassword"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          placeholder="Enter password (min 6 chars)"
          className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-[13px] outline-none border transition-all"
          style={{ ...inputStyle, borderColor: errors.password ? '#ef4444' : tokens.border }}
          onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
          onBlur={e => { e.target.style.borderColor = errors.password ? '#ef4444' : tokens.border; e.target.style.boxShadow = 'none' }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(prev => !prev)}
          className="absolute right-3 bg-transparent border-none p-1 cursor-pointer flex items-center justify-center rounded-lg transition-colors"
          style={{ color: tokens.txtSec }}
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
      <div 
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: password ? '80px' : '0px',
          opacity: password ? 1 : 0,
          marginTop: password ? '8px' : '0px',
        }}
      >
        <div className="flex justify-between items-center mb-1 text-[11px] font-semibold">
          <span className="text-slate-500">Password Strength:</span>
          <span className={`${strength.colorClass} tracking-wide uppercase transition-colors duration-300`}>
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${strength.barColor} transition-all duration-500 ease-out`}
            style={{ width: strength.width }}
          />
        </div>
      </div>
      {errors.password && <span className="text-[11px] text-red-500 mt-1 block">{errors.password}</span>}
    </div>
  )
}

function ExtraFields({ form, setForm, tokens, BRAND, inputStyle, dark }) {
  const inactiveColor = dark ? '#7a98bb' : '#94a3b8'
  const genderColor = !form.gender ? inactiveColor : tokens.txtPri

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="orgDepartment" className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Department</label>
          <input
            id="orgDepartment"
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
          <label htmlFor="orgPhone" className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Phone</label>
          <input
            id="orgPhone"
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
            placeholder="e.g. 9876543210"
            className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
            onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="orgGender" className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Gender</label>
        <select
          id="orgGender"
          value={form.gender || ''}
          onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
          className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all cursor-pointer"
          style={{ ...inputStyle, background: dark ? '#060e1c' : '#ffffff', color: genderColor }}
          onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
          onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
        >
          <option value="" disabled>Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
    </>
  )
}

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
  const dialogRef = useRef(null)

  useEffect(() => {
    if (modalOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal()
    }
  }, [modalOpen])

  if (!modalOpen) return null

  const getSaveButtonText = () => {
    if (saving) return 'Saving…'
    return editing ? 'Update Account' : 'Create Account'
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-100 m-0 p-0 w-full h-full border-none bg-transparent"
      onClose={() => setModalOpen(false)}
      style={{ maxWidth: '100vw', maxHeight: '100vh' }}
    >
      <button
        type="button"
        className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-sm border-none cursor-default"
        onClick={() => setModalOpen(false)}
        aria-label="Close overlay"
      />
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center p-5">
        <div
          className="pointer-events-auto rounded-[24px] w-full max-w-[500px] overflow-hidden"
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
              type="button"
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
            <PersonalFields
              form={form}
              setForm={setForm}
              errors={errors}
              tokens={tokens}
              BRAND={BRAND}
              inputStyle={inputStyle}
            />

            {!editing && (
              <PasswordField
                form={form}
                setForm={setForm}
                errors={errors}
                tokens={tokens}
                BRAND={BRAND}
                inputStyle={inputStyle}
              />
            )}

            <ExtraFields
              form={form}
              setForm={setForm}
              tokens={tokens}
              BRAND={BRAND}
              inputStyle={inputStyle}
              dark={dark}
            />
          </div>

          {/* Action Buttons */}
          <div className="px-7 pb-6 flex gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-3 rounded-xl text-[13px] font-bold border cursor-pointer transition-all"
              style={{ borderColor: tokens.border, color: tokens.txtSec, background: 'transparent' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: BRAND }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {getSaveButtonText()}
            </button>
          </div>
        </div>
      </div>
    </dialog>,
    document.body
  )
}

