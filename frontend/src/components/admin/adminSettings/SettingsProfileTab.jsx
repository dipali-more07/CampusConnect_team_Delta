import React from 'react'
import { Loader2 } from 'lucide-react'

export default function SettingsProfileTab({
  profileForm,
  setProfileForm,
  saving,
  handleSaveProfile,
  tokens,
  BRAND,
  inputStyle
}) {

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>Profile Settings</h3>
      </div>

      {/* Initials Avatar */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-white text-[18px] shrink-0"
          style={{ background: profileForm.avatarColor || BRAND }}
        >
          {profileForm.name ? profileForm.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CC'}
        </div>
        <div>
          <p className="text-[13px] font-bold m-0" style={{ color: tokens.txtPri }}>{profileForm.name || 'User'}</p>
          <p className="text-[11.5px] m-0 mt-0.5" style={{ color: tokens.txtSec }}>{profileForm.email || ''}</p>
        </div>
      </div>

      {/* Profile Form fields */}
      <div className="space-y-4 max-w-[500px]">
        <div>
          <label htmlFor="profileName" className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Full Name</label>
          <input
            id="profileName"
            value={profileForm.name}
            onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
            onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div>
          <label htmlFor="profileEmail" className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Email</label>
          <input
            id="profileEmail"
            value={profileForm.email}
            onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
            onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div>
          <label htmlFor="profilePhone" className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Phone</label>
          <input
            id="profilePhone"
            value={profileForm.phone || ''}
            onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
            className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
            onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div>
          <label htmlFor="profileGender" className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Gender</label>
          <select
            id="profileGender"
            value={profileForm.gender || ''}
            onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all cursor-pointer"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
            onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
          >
            <option value="" style={{ background: tokens.card }}>Select Gender</option>
            <option value="male" style={{ background: tokens.card }}>Male</option>
            <option value="female" style={{ background: tokens.card }}>Female</option>
            <option value="other" style={{ background: tokens.card }}>Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="profileBio" className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Bio</label>
          <textarea
            id="profileBio"
            value={profileForm.bio || ''}
            onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all resize-none"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
            onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-5 py-3 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer flex items-center gap-2 hover:-translate-y-px transition-all"
            style={{ background: BRAND, boxShadow: '0 4px 14px rgba(97,95,255,0.4)' }}
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
