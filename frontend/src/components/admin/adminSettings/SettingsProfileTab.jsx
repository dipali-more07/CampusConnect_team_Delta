import React from 'react'
import { Camera, Loader2 } from 'lucide-react'

export default function SettingsProfileTab({
  profileForm,
  setProfileForm,
  saving,
  handleSaveProfile,
  fileInputRef,
  handlePhotoUpload,
  tokens,
  BRAND,
  inputStyle
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>Profile Settings</h3>
      </div>

      {/* Profile Picture Upload Section */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-white text-[18px] relative group overflow-hidden"
          style={{ background: profileForm.avatarColor || BRAND }}
        >
          {profileForm.avatarUrl ? (
            <img src={profileForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            profileForm.name ? profileForm.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CC'
          )}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          >
            <Camera size={14} color="#fff" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-2 rounded-xl text-[12.5px] font-bold border cursor-pointer bg-transparent transition-all"
          style={{ borderColor: tokens.border, color: tokens.txtPri }}
          onMouseEnter={e => e.currentTarget.style.background = tokens.hoverBg}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Change Photo
        </button>
      </div>

      {/* Profile Form fields */}
      <div className="space-y-4 max-w-[500px]">
        <div>
          <label className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Full Name</label>
          <input
            value={profileForm.name}
            onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
            onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div>
          <label className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Email</label>
          <input
            value={profileForm.email}
            onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
            onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div>
          <label className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Department</label>
          <input
            value={profileForm.department}
            onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
            onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Employee ID</label>
            <input
              value={profileForm.employeeId}
              onChange={e => setProfileForm(p => ({ ...p, employeeId: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
              onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div>
            <label className="text-[11.5px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Phone</label>
            <input
              value={profileForm.phone}
              onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
              onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>

        <div className="pt-2">
          <button
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
