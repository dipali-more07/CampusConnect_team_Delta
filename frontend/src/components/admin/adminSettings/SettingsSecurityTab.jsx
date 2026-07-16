import React, { useState } from 'react'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function SettingsSecurityTab({
  passwordForm,
  setPasswordForm,
  saving,
  handleUpdatePassword,
  tfaEnabled,
  tfaLoading,
  handleToggleTFA,
  tokens,
  BRAND,
  inputStyle
}) {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>Security Settings</h3>
      </div>

      <div className="space-y-4 max-w-[500px]">
        <div>
          <label className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Current Password</label>
          <div className="relative">
            <input
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
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>New Password</label>
          <div className="relative">
            <input
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
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Confirm New Password</label>
          <div className="relative">
            <input
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
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
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
