import React, { useState, useEffect } from 'react'
import { Loader2, Eye, EyeOff } from 'lucide-react'

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

/** Check password against mock storage */
function checkMockPassword(email, currentPassword) {
  try {
    const raw = localStorage.getItem('campus_connect_mock_users')
    if (!raw) return null
    const userList = JSON.parse(raw)
    const matchedUser = userList.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    )
    if (matchedUser) return matchedUser.password === currentPassword
  } catch {
    /* ignore */
  }
  return null
}

/** Check password against real API */
async function checkApiPassword(email, currentPassword) {
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
  return false
}

/** Renders the current password verification status badge */
function PasswordVerificationStatus({ currentPassword, checkingPassword, isCurrentPasswordCorrect }) {
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

function useCurrentPasswordVerification(currentPassword, email) {
  const [checkingPassword, setCheckingPassword] = useState(false)
  const [isCurrentPasswordCorrect, setIsCurrentPasswordCorrect] = useState(null)

  useEffect(() => {
    if (!currentPassword) {
      setIsCurrentPasswordCorrect(null)
      return
    }

    const currentStrength = evaluatePasswordStrength(currentPassword)
    if (currentStrength.label !== 'Strong') {
      setIsCurrentPasswordCorrect(null)
      return
    }

    const timer = setTimeout(async () => {
      const isMock = import.meta.env.VITE_USE_MOCK === 'true'
      if (isMock) {
        const result = checkMockPassword(email, currentPassword)
        if (result !== null) {
          setIsCurrentPasswordCorrect(result)
          return
        }
      }

      setCheckingPassword(true)
      try {
        const result = await checkApiPassword(email, currentPassword)
        setIsCurrentPasswordCorrect(result)
      } catch {
        setIsCurrentPasswordCorrect(false)
      } finally {
        setCheckingPassword(false)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [currentPassword, email])

  return { checkingPassword, isCurrentPasswordCorrect }
}

function CurrentPasswordSection({
  passwordForm,
  setPasswordForm,
  showCurrent,
  setShowCurrent,
  checkingPassword,
  isCurrentPasswordCorrect,
  tokens,
  BRAND,
  inputStyle
}) {
  const currentPassword = passwordForm.currentPassword || ''
  return (
    <div>
      <label htmlFor="currentPassword" className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Current Password</label>
      <div className="relative">
        <input
          id="currentPassword"
          type={showCurrent ? 'text' : 'password'}
          value={passwordForm.currentPassword}
          onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
          onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
        />
        <button
          type="button"
          onClick={() => setShowCurrent(!showCurrent)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center"
        >
          {showCurrent ? <Eye size={16} /> : <EyeOff size={16} />}
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
        <PasswordVerificationStatus
          currentPassword={currentPassword}
          checkingPassword={checkingPassword}
          isCurrentPasswordCorrect={isCurrentPasswordCorrect}
        />
      </div>
    </div>
  )
}

function NewPasswordSection({
  passwordForm,
  setPasswordForm,
  showNew,
  setShowNew,
  tokens,
  BRAND,
  inputStyle
}) {
  const newPassword = passwordForm.newPassword || ''
  const strength = evaluatePasswordStrength(newPassword)
  return (
    <div>
      <label htmlFor="newPassword" className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>New Password</label>
      <div className="relative">
        <input
          id="newPassword"
          type={showNew ? 'text' : 'password'}
          value={passwordForm.newPassword}
          onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
          placeholder="min. 8 characters"
          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
          onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
        />
        <button
          type="button"
          onClick={() => setShowNew(!showNew)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center"
        >
          {showNew ? <Eye size={16} /> : <EyeOff size={16} />}
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
    </div>
  )
}

function ConfirmPasswordSection({
  passwordForm,
  setPasswordForm,
  showConfirm,
  setShowConfirm,
  tokens,
  BRAND,
  inputStyle
}) {
  const newPassword = passwordForm.newPassword || ''
  const confirmPassword = passwordForm.confirmPassword || ''
  const match = newPassword === confirmPassword
  const containerClass = match 
    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
    : 'bg-red-500/10 border-red-500/20 text-red-600'

  return (
    <div>
      <label htmlFor="confirmPassword" className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Confirm New Password</label>
      <div className="relative">
        <input
          id="confirmPassword"
          type={showConfirm ? 'text' : 'password'}
          value={passwordForm.confirmPassword}
          onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
          placeholder="repeat new password"
          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
          onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
        />
        <button
          type="button"
          onClick={() => setShowConfirm(!showConfirm)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center"
        >
          {showConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
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
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-300 ${containerClass}`}>
          {match ? (
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
  )
}

export default function SettingsSecurityTab({
  passwordForm,
  setPasswordForm,
  saving,
  handleUpdatePassword,
  tokens,
  BRAND,
  inputStyle,
  email = ''
}) {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const currentPassword = passwordForm.currentPassword || ''
  const { checkingPassword, isCurrentPasswordCorrect } = useCurrentPasswordVerification(currentPassword, email)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>Security Settings</h3>
      </div>

      <div className="space-y-4 max-w-[500px]">
        <CurrentPasswordSection
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          showCurrent={showCurrent}
          setShowCurrent={setShowCurrent}
          checkingPassword={checkingPassword}
          isCurrentPasswordCorrect={isCurrentPasswordCorrect}
          tokens={tokens}
          BRAND={BRAND}
          inputStyle={inputStyle}
        />

        <NewPasswordSection
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          showNew={showNew}
          setShowNew={setShowNew}
          tokens={tokens}
          BRAND={BRAND}
          inputStyle={inputStyle}
        />

        <ConfirmPasswordSection
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          showConfirm={showConfirm}
          setShowConfirm={setShowConfirm}
          tokens={tokens}
          BRAND={BRAND}
          inputStyle={inputStyle}
        />

        <div className="pt-2">
          <button
            type="button"
            onClick={handleUpdatePassword}
            disabled={saving}
            className="px-5 py-3 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer flex items-center gap-2 hover:-translate-y-px transition-all"
            style={{ background: BRAND, boxShadow: '0 4px 14px rgba(97,95,255,0.4)' }}
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Update Password
          </button>
        </div>
      </div>
    </div>
  )
}
