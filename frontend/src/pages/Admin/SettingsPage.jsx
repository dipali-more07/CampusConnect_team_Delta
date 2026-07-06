import { useState, useEffect, useRef } from 'react'
import { User, Shield, Palette, Key, ShieldAlert, Check, Loader2, Camera } from 'lucide-react'
import settingsService from '../../services/settingsService'
import { useToast } from '../../context/ToastContext'
import { useTheme } from '../../context/ThemeContext'

export default function SettingsPage({ tokens }) {
  const { dark, setDark, accentColor, setAccentColor, fontSize, setFontSize, applyAppearance } = useTheme()
  const BRAND = tokens?.brand || accentColor || '#615FFF'
  const showToast = useToast()
  const fileInputRef = useRef(null)

  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('settings_active_tab') || 'Profile'
  })

  useEffect(() => {
    const handleTabChange = () => {
      const tab = sessionStorage.getItem('settings_active_tab')
      if (tab) setActiveTab(tab)
    }
    window.addEventListener('settings_tab_change', handleTabChange)
    return () => window.removeEventListener('settings_tab_change', handleTabChange)
  }, [])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    department: '',
    employeeId: '',
    phone: '',
    avatarColor: '#7c3aed',
    avatarUrl: null
  })

  const [appearanceForm, setAppearanceForm] = useState({
    themeMode: dark ? 'Dark' : 'Light',
    accentColor: accentColor || '#615FFF',
    fontSize: fontSize || 'medium'
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [permissions, setPermissions] = useState({
    Admin: [],
    Organizer: [],
    Student: []
  })

  const [tfaEnabled, setTfaEnabled] = useState(false)
  const [tfaLoading, setTfaLoading] = useState(false)

  const cardStyle = {
    background: tokens.card,
    border: `1px solid ${tokens.border}`,
    boxShadow: tokens.shadow
  }

  const inputStyle = {
    background: tokens.inputBg,
    borderColor: tokens.border,
    color: tokens.txtPri
  }

  const loadSettings = async () => {
    setLoading(true)
    const res = await settingsService.fetch()
    if (res.success) {
      if (res.settings.profile) {
        setProfileForm(p => ({ ...p, ...res.settings.profile }))
      }
      const fetchedApp = res.settings.appearance || {}
      setAppearanceForm({
        themeMode: dark ? 'Dark' : 'Light',
        accentColor: accentColor || fetchedApp.accentColor || '#615FFF',
        fontSize: fontSize || fetchedApp.fontSize || 'medium'
      })
      if (res.settings.permissions) {
        setPermissions(res.settings.permissions)
      }
    } else {
      showToast(res.message || 'Failed to fetch settings.', 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setProfileForm(p => ({ ...p, avatarUrl: url }))
      showToast('Profile photo updated.', 'success')
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    const res = await settingsService.updateProfile(profileForm)
    setSaving(false)
    if (res.success) {
      showToast(res.message, 'success')
    } else {
      showToast(res.message, 'error')
    }
  }

  const handleSaveAppearance = async () => {
    setSaving(true)
    const res = await settingsService.updateAppearance(appearanceForm)
    setSaving(false)
    if (res.success) {
      applyAppearance(appearanceForm)
      showToast(res.message || 'Appearance preferences updated successfully.', 'success')
    } else {
      showToast(res.message || 'Failed to save preferences.', 'error')
    }
  }

  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Passwords do not match.', 'error')
      return
    }
    setSaving(true)
    const res = await settingsService.updatePassword(passwordForm)
    setSaving(false)
    if (res.success) {
      showToast(res.message, 'success')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } else {
      showToast(res.message, 'error')
    }
  }

  const handleToggleTFA = () => {
    setTfaLoading(true)
    setTimeout(() => {
      setTfaLoading(false)
      setTfaEnabled(!tfaEnabled)
      showToast(tfaEnabled ? 'Two-factor authentication disabled.' : 'Two-factor authentication enabled successfully.', 'success')
    }, 800)
  }

  const TABS = [
    { name: 'Profile', icon: User, desc: 'Personal details and profile picture' },
    { name: 'Appearance', icon: Palette, desc: 'Color themes and styling' },
    { name: 'Security', icon: Key, desc: 'Authentication and password config' },
    { name: 'Permissions', icon: Shield, desc: 'Role privileges and access' },
    { name: 'System', icon: ShieldAlert, desc: 'System maintenance logs' }
  ]

  const skBg = dark ? '#162640' : '#e2e8f0'

  return (
    <div className="p-5 px-6 space-y-5">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Header ── */}
      <div>
        <h1 className="text-[28px] font-extrabold m-0 tracking-tight" style={{ color: tokens.txtPri }}>
          Settings
        </h1>
        <p className="text-[13px] mt-1" style={{ color: tokens.txtSec }}>
          Manage your account and system preferences
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* ── Left Sidebar Tabs ── */}
        <div className="w-full md:w-[240px] shrink-0 rounded-2xl p-2.5 space-y-1" style={cardStyle}>
          {TABS.map(t => {
            const active = activeTab === t.name
            const Icon = t.icon
            return (
              <button
                key={t.name}
                onClick={() => setActiveTab(t.name)}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border-none cursor-pointer text-left transition-all duration-200"
                style={{
                  background: active ? `${BRAND}12` : 'transparent',
                  color: active ? BRAND : tokens.txtSec
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = tokens.hoverBg }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <Icon size={16} style={{ color: active ? BRAND : tokens.txtMuted }} />
                <div>
                  <div className="text-[13.5px] font-bold">{t.name}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Right Content Area ── */}
        <div className="flex-1 w-full rounded-2xl p-6 md:p-8" style={cardStyle}>
          {loading ? (
            <div className="space-y-5 animate-pulse">
              <div className="w-40 h-5 rounded-md" style={{ background: skBg }} />
              <div className="space-y-2 pt-4">
                <div className="w-full h-10 rounded-xl" style={{ background: skBg }} />
                <div className="w-full h-10 rounded-xl" style={{ background: skBg }} />
              </div>
            </div>
          ) : (
            <div style={{ animation: 'slideUp 0.25s ease' }}>
              
              {/* ── PROFILE TAB ── */}
              {activeTab === 'Profile' && (
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
              )}

              {/* ── APPEARANCE TAB ── */}
              {activeTab === 'Appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>Appearance Settings</h3>
                  </div>

                  <div className="space-y-5 max-w-[500px]">
                    {/* Theme Mode Toggle */}
                    <div>
                      <label className="text-[11.5px] font-bold block mb-2" style={{ color: tokens.txtSec }}>Theme Mode</label>
                      <div className="flex gap-3">
                        {['Light', 'Dark'].map(mode => {
                          const active = appearanceForm.themeMode === mode
                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => {
                                setAppearanceForm(p => ({ ...p, themeMode: mode }))
                                setDark(mode === 'Dark')
                              }}
                              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border cursor-pointer capitalize transition-all"
                              style={{
                                background: active ? `${BRAND}18` : 'transparent',
                                borderColor: active ? BRAND : tokens.border,
                                color: active ? BRAND : tokens.txtSec,
                                boxShadow: active ? `0 0 0 1px ${BRAND}` : 'none'
                              }}
                            >
                              {mode} Mode
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Accent Color Swatches */}
                    <div>
                      <label className="text-[11.5px] font-bold block mb-2" style={{ color: tokens.txtSec }}>Accent Color</label>
                      <div className="flex gap-2.5">
                        {['#615FFF', '#00BC7D', '#FE9A00', '#0284c7', '#e11d48', '#7c3aed'].map(c => {
                          const active = appearanceForm.accentColor === c
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setAppearanceForm(p => ({ ...p, accentColor: c }))
                                setAccentColor(c)
                              }}
                              className="w-8 h-8 rounded-full border-2 cursor-pointer transition-all hover:scale-110 flex items-center justify-center relative"
                              style={{
                                background: c,
                                borderColor: active ? '#ffffff' : 'transparent',
                                boxShadow: active ? `0 0 0 3px ${c}` : '0 2px 5px rgba(0,0,0,0.1)'
                              }}
                            >
                              {active && <Check size={14} color="#fff" strokeWidth={3} />}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Font Size slider */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[11.5px] font-bold" style={{ color: tokens.txtSec }}>Font Size</label>
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: BRAND }}>{appearanceForm.fontSize}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold" style={{ color: tokens.txtMuted }}>Sm</span>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          value={appearanceForm.fontSize === 'small' ? 0 : appearanceForm.fontSize === 'medium' ? 1 : 2}
                          onChange={e => {
                            const val = parseInt(e.target.value)
                            const label = val === 0 ? 'small' : val === 1 ? 'medium' : 'large'
                            setAppearanceForm(p => ({ ...p, fontSize: label }))
                            setFontSize(label)
                          }}
                          className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer"
                          style={{ accentColor: BRAND }}
                        />
                        <span className="text-[10px] font-bold" style={{ color: tokens.txtMuted }}>Lg</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSaveAppearance}
                        disabled={saving}
                        className="px-5 py-3 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer flex items-center gap-2 hover:-translate-y-px transition-all"
                        style={{ background: BRAND, boxShadow: `0 4px 14px ${BRAND}60` }}
                      >
                        {saving && <Loader2 size={13} className="animate-spin" />}
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SECURITY TAB ── */}
              {activeTab === 'Security' && (
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
              )}

              {/* ── PERMISSIONS TAB ── */}
              {activeTab === 'Permissions' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>Role Permissions</h3>
                  </div>

                  <div className="space-y-4 max-w-[600px]">
                    {Object.entries(permissions).map(([role, list]) => {
                      const color = role === 'Admin' ? '#ef4444' : role === 'Organizer' ? '#FE9A00' : '#00BC7D'
                      return (
                        <div key={role} className="border rounded-2xl p-5 space-y-3" style={{ borderColor: tokens.border }}>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                            <h4 className="text-[14px] font-extrabold m-0 capitalize" style={{ color: tokens.txtPri }}>{role}</h4>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {list.map(perm => (
                              <span
                                key={perm}
                                className="px-3 py-1.5 rounded-xl text-[12px] font-medium"
                                style={{ background: tokens.hoverBg, color: tokens.txtSec }}
                              >
                                {perm}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── ACCOUNT TAB (Placeholder) ── */}
              {activeTab === 'Account' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>Account Settings</h3>
                    <p className="text-[12.5px] mt-1" style={{ color: tokens.txtSec }}>Configure default workspaces and account notifications.</p>
                  </div>
                  <div className="p-8 border-2 border-dashed rounded-2xl text-center" style={{ borderColor: tokens.border }}>
                    <p className="text-[13px] font-semibold m-0" style={{ color: tokens.txtMuted }}>Default preferences are loaded from config.json</p>
                  </div>
                </div>
              )}

              {/* ── SYSTEM TAB (Placeholder) ── */}
              {activeTab === 'System' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>System Settings</h3>
                    <p className="text-[12.5px] mt-1" style={{ color: tokens.txtSec }}>System-wide configurations, database statuses, and logs.</p>
                  </div>
                  <div className="p-8 border-2 border-dashed rounded-2xl text-center" style={{ borderColor: tokens.border }}>
                    <p className="text-[13px] font-semibold m-0" style={{ color: tokens.txtMuted }}>All database migrations are up to date.</p>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
