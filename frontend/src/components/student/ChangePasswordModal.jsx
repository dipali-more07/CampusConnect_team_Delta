import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Lock, Shield, Eye, EyeOff } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import studentService from '../../services/studentService'

const getEmail = () => {
  try {
    const keys = ['cc_session', 'cc_user', 'user', 'cc_auth']
    for (const key of keys) {
      const raw = sessionStorage.getItem(key) || localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        const found = parsed.email || parsed.user?.email
        if (found) return found
      }
    }
  } catch {
    // ignore error
  }
  return ''
}

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

async function verifyPassword(email, currentPassword, isMock) {
  if (isMock) {
    try {
      const raw = localStorage.getItem('campus_connect_mock_users')
      if (raw) {
        const userList = JSON.parse(raw)
        const matchedUser = userList.find(
          u => u.email.toLowerCase() === email.toLowerCase()
        )
        if (matchedUser) {
          return matchedUser.password === currentPassword
        }
      }
    } catch {
      /* ignore */
    }
  }

  try {
    const API_BASE = import.meta.env.VITE_API_BASE_URL
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: currentPassword }),
    })
    if (res.ok) {
      const data = await res.json()
      return data.success !== false
    }
  } catch {
    // ignore
  }
  return false
}

function CurrentPasswordFeedback({ currentPassword, checkingPassword, isCurrentPasswordCorrect }) {
  if (!currentPassword) return null

  const currentStrength = evaluatePasswordStrength(currentPassword)
  if (currentStrength.label === 'Weak') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-300 bg-red-500/10 border-red-500/20 text-red-600">
        <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <span>Weak format (must meet strong criteria to verify)</span>
      </div>
    )
  }
  if (currentStrength.label === 'Medium') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-300 bg-amber-500/10 border-amber-500/20 text-amber-600">
        <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <span>Medium format (must meet strong criteria to verify)</span>
      </div>
    )
  }
  if (checkingPassword) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-300 bg-slate-500/10 border-slate-500/20 text-slate-500 dark:text-slate-400">
        <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span>Verifying current password…</span>
      </div>
    )
  }
  if (isCurrentPasswordCorrect === true) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-300 bg-emerald-500/10 border-emerald-500/20 text-emerald-600">
        <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <span>Current password is correct</span>
      </div>
    )
  }
  if (isCurrentPasswordCorrect === false) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-300 bg-red-500/10 border-red-500/20 text-red-600">
        <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>Incorrect current password</span>
      </div>
    )
  }
  return null
}

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { dark, accentColor } = useTheme()
  const BRAND = accentColor || '#615FFF'
  const showToast = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const email = getEmail()
  const [checkingPassword, setCheckingPassword] = useState(false)
  const [isCurrentPasswordCorrect, setIsCurrentPasswordCorrect] = useState(null)

  const handleClose = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setIsCurrentPasswordCorrect(null)
    onClose()
  }

  React.useEffect(() => {
    if (!currentPassword) {
      return
    }

    // ONLY perform background check if the current password meets the Strong format criteria
    const currentStrength = evaluatePasswordStrength(currentPassword)
    if (currentStrength.label !== 'Strong') {
      return
    }

    const timer = setTimeout(async () => {
      setCheckingPassword(true)
      const isMock = import.meta.env.VITE_USE_MOCK === 'true'
      const correct = await verifyPassword(email, currentPassword, isMock)
      setIsCurrentPasswordCorrect(correct)
      setCheckingPassword(false)
    }, 600) // Increase debounce to 600ms to ensure better throttling

    return () => clearTimeout(timer)
  }, [currentPassword, email])

  const strength = evaluatePasswordStrength(newPassword)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!currentPassword.trim()) {
      showToast('Current password is required.', 'error')
      return
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error')
      return
    }

    setSubmitting(true)
    const res = await studentService.changeStudentPassword({ currentPassword, newPassword, confirmPassword })
    setSubmitting(false)

    if (res.success) {
      showToast('Password changed successfully!', 'success')
      handleClose()
    } else {
      showToast(res.message || 'Failed to change password.', 'error')
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-xs border-none cursor-default w-full h-full"
        onClick={handleClose}
        aria-label="Close backdrop"
      />

      {/* Modal Dialog */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl transition-colors duration-300 shadow-2xl overflow-hidden p-6 sm:p-7"
        style={{
          background: dark ? '#0c1626' : '#ffffff',
          border: `1px solid ${dark ? '#1b2a42' : '#e2e8f0'}`,
          color: dark ? '#f8fafc' : '#0f172a',
          animation: 'modalScaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-[#1b2a42]">
          <h3 className="text-lg font-extrabold m-0 text-slate-900 dark:text-white">Change Password</h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a2d48] border-none bg-transparent cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          {/* Current Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="current-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="current-password"
                type={showCurrentPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value)
                  setIsCurrentPasswordCorrect(null)
                }}
                placeholder="Enter current password"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111f36] border border-slate-200 dark:border-[#1d304d] text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-transparent border-none cursor-pointer"
              >
                {showCurrentPass ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            <div 
              className="overflow-hidden transition-all duration-500 ease-in-out"
              style={{
                maxHeight: currentPassword ? '80px' : '0px',
                opacity: currentPassword ? 1 : 0,
                marginTop: currentPassword ? '8px' : '0px',
              }}
            >
              <CurrentPasswordFeedback
                currentPassword={currentPassword}
                checkingPassword={checkingPassword}
                isCurrentPasswordCorrect={isCurrentPasswordCorrect}
              />
            </div>
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="new-password"
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111f36] border border-slate-200 dark:border-[#1d304d] text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-transparent border-none cursor-pointer"
              >
                {showNewPass ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            <div 
              className="overflow-hidden transition-all duration-500 ease-in-out"
              style={{
                maxHeight: newPassword ? '80px' : '0px',
                opacity: newPassword ? 1 : 0,
                marginTop: newPassword ? '8px' : '0px',
              }}
            >
              <div className="flex justify-between items-center mb-1 text-[11px] font-semibold">
                <span className="text-slate-500 dark:text-slate-400">Password Strength:</span>
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
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="confirm-password"
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111f36] border border-slate-200 dark:border-[#1d304d] text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-transparent border-none cursor-pointer"
              >
                {showConfirmPass ? <Eye size={16} /> : <EyeOff size={16} />}
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
                  newPassword === confirmPassword 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                    : 'bg-red-500/10 border-red-500/20 text-red-600'
                }`}
              >
                {newPassword === confirmPassword ? (
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
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1b2a42] mt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#14233a] border border-slate-200 dark:border-[#213554] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1a2d48] cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white border-none cursor-pointer shadow-lg hover:opacity-90 transition-opacity"
              style={{ background: BRAND }}
            >
              {submitting ? 'Updating...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  )
}
