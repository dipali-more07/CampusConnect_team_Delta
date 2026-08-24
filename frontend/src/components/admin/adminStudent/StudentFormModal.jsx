import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Eye, EyeOff, User, Mail, Phone, Building, BookOpen, GraduationCap, Lock } from 'lucide-react'
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
  DEPTS = ['CSE', 'ECE', 'ME', 'MBA', 'EEE', 'Civil'],
  YEARS = ['1st', '2nd', '3rd', '4th', '5th', '6th']
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const password = form.password || ''
  const confirmPassword = form.confirmPassword || ''
  const strength = evaluatePasswordStrength(password)

  if (!modalOpen) return null

  // Ensure year options include 1st to 6th
  const yearOptions = (YEARS || []).filter(y => y !== 'All')
  const defaultYears = ['1st', '2nd', '3rd', '4th', '5th', '6th']
  defaultYears.forEach(y => {
    if (!yearOptions.includes(y)) yearOptions.push(y)
  })

  const deptOptions = (DEPTS || []).filter(d => d !== 'All')
  const genderOptions = ['Select Gender', 'Male', 'Female', 'Other']

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
    >
      <div
        className="rounded-[24px] w-full max-w-[580px] overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          background: dark ? '#0c1829' : '#fff',
          border: `1px solid ${tokens.border}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          animation: 'slideUp 0.25s ease'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-4 border-b shrink-0" style={{ borderColor: tokens.border }}>
          <div>
            <h2 className="text-[18px] font-extrabold m-0" style={{ color: tokens.txtPri }}>
              {editing ? `Edit Student — ${editing.rollNo || ''}` : 'Add New Student'}
            </h2>
            <p className="text-[12px] font-semibold text-slate-400 m-0 mt-0.5">
              {editing ? 'Update student account details' : 'Enter student details to create a new account'}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(false)}
            className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="px-7 py-5 overflow-y-auto space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>
              Full Name <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <User size={15} />
              </span>
              <input
                type="text"
                value={form.name || ''}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. John Doe"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                style={{ ...inpStyle, borderColor: errors.name ? '#ef4444' : tokens.border }}
              />
            </div>
            {errors.name && <span className="text-[11px] text-red-500 mt-1 block">{errors.name}</span>}
          </div>

          {/* Email Address & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>
                Email Address <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  value={form.email || ''}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                  style={{ ...inpStyle, borderColor: errors.email ? '#ef4444' : tokens.border }}
                />
              </div>
              {errors.email && <span className="text-[11px] text-red-500 mt-1 block">{errors.email}</span>}
            </div>

            <div>
              <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>
                Mobile Number <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Phone size={15} />
                </span>
                <input
                  type="text"
                  value={form.phone || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setForm(p => ({ ...p, phone: val }))
                  }}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                  style={{ ...inpStyle, borderColor: tokens.border }}
                />
              </div>
            </div>
          </div>

          {/* College Name & Course Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>
                College Name <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Building size={15} />
                </span>
                <input
                  type="text"
                  value={form.collegeName || ''}
                  onChange={e => setForm(p => ({ ...p, collegeName: e.target.value }))}
                  placeholder="e.g. IIT Bombay"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                  style={{ ...inpStyle, borderColor: tokens.border }}
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>
                Course Name <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <BookOpen size={15} />
                </span>
                <input
                  type="text"
                  value={form.courseName || ''}
                  onChange={e => setForm(p => ({ ...p, courseName: e.target.value }))}
                  placeholder="e.g. B.Tech"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                  style={{ ...inpStyle, borderColor: tokens.border }}
                />
              </div>
            </div>
          </div>

          {/* Department & Year of Study */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <CustomSelect
                label="Department"
                required={true}
                value={form.department || deptOptions[0]}
                onChange={(e, val) => setForm(p => ({ ...p, department: val }))}
                options={deptOptions.map(d => ({ value: d, label: d }))}
                dark={tokens.dark ?? true}
              />
            </div>

            <div>
              <CustomSelect
                label="Year of Study"
                required={true}
                value={form.year || '1st'}
                onChange={(e, val) => setForm(p => ({ ...p, year: val }))}
                options={yearOptions.map(y => ({ value: y, label: y }))}
                dark={tokens.dark ?? true}
              />
            </div>
          </div>

          {/* Gender & Roll Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <CustomSelect
                label="Gender"
                required={true}
                value={form.gender || 'Select Gender'}
                onChange={(e, val) => setForm(p => ({ ...p, gender: val }))}
                options={genderOptions.map(g => ({ value: g, label: g }))}
                dark={tokens.dark ?? true}
              />
            </div>

            <div>
              <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>
                Roll Number / ID <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <GraduationCap size={15} />
                </span>
                <input
                  type="text"
                  value={form.rollNo || ''}
                  onChange={e => setForm(p => ({ ...p, rollNo: e.target.value }))}
                  placeholder="e.g. 21CS001"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                  style={{ ...inpStyle, borderColor: errors.rollNo ? '#ef4444' : tokens.border }}
                />
              </div>
              {errors.rollNo && <span className="text-[11px] text-red-500 mt-1 block">{errors.rollNo}</span>}
            </div>
          </div>

          {/* Password & Confirm Password (with Eye Toggle) */}
          {!editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>
                  Password <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={15} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password || ''}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                    style={{ ...inpStyle, borderColor: errors.password ? '#ef4444' : tokens.border }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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

              <div>
                <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>
                  Confirm Password <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={15} />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword || ''}
                    onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Confirm password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                    style={{ ...inpStyle, borderColor: errors.confirmPassword ? '#ef4444' : tokens.border }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div 
                  className="overflow-hidden transition-all duration-500 ease-in-out"
                  style={{
                    maxHeight: confirmPassword ? '80px' : '0px',
                    opacity: confirmPassword ? 1 : 0,
                    marginTop: confirmPassword ? '8px' : '0px',
                  }}
                >
                  <div 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-300 ${
                      password === confirmPassword 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                        : 'bg-red-500/10 border-red-500/20 text-red-600'
                    }`}
                  >
                    {password === confirmPassword ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span>Passwords match</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Passwords do not match</span>
                      </>
                    )}
                  </div>
                </div>
                {errors.confirmPassword && <span className="text-[11px] text-red-500 mt-1 block">{errors.confirmPassword}</span>}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t flex gap-3 shrink-0" style={{ borderColor: tokens.border }}>
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
