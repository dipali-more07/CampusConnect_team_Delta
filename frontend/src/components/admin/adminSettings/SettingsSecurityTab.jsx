import React from 'react'
import { Loader2, Shield } from 'lucide-react'

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
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>Security Settings</h3>
      </div>

      <div className="space-y-4 max-w-[500px]">
        <div>
          <label className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Current Password</label>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
            onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div>
          <label className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>New Password</label>
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
            placeholder="min. 8 characters"
            className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
            onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div>
          <label className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Confirm New Password</label>
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
            placeholder="repeat new password"
            className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
            onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
          />
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

        {/* TFA Section */}
        <div className="pt-6 border-t space-y-3" style={{ borderColor: tokens.border }}>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h4 className="text-[14px] font-bold m-0" style={{ color: tokens.txtPri }}>Two-Factor Authentication</h4>
              <p className="text-[12px] mt-1" style={{ color: tokens.txtSec }}>Add an extra layer of protection to your account settings</p>
            </div>
            <button
              onClick={handleToggleTFA}
              disabled={tfaLoading}
              className="px-4 py-2 rounded-xl text-[12px] font-bold border-none cursor-pointer transition-all text-white"
              style={{ background: tfaEnabled ? '#ef4444' : '#00BC7D' }}
            >
              {tfaLoading ? 'Loading...' : tfaEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>

          <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: tokens.hoverBg }}>
            <div className="p-2 rounded-lg bg-[#00BC7D]/10 text-[#00BC7D] shrink-0">
              <Shield size={16} />
            </div>
            <div>
              <p className="text-[13px] font-bold m-0" style={{ color: tokens.txtPri }}>Authenticator App</p>
              <p className="text-[11.5px] mt-0.5" style={{ color: tokens.txtSec }}>Use Google Authenticator or similar to scan the QR security code at login</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
