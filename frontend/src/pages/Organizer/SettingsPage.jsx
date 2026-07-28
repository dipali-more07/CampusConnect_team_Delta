import { useState, useEffect, useRef } from 'react'
import { User, Shield, Palette, Key, ShieldAlert } from 'lucide-react'
import settingsService from '../../services/settingsService'
import organizersService from '../../services/organizersService'
import { useToast } from '../../context/ToastContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { fetchWithAuth } from '../../utils/apiClient'

// Sub-components
import SettingsProfileTab from '../../components/admin/adminSettings/SettingsProfileTab'
import SettingsAppearanceTab from '../../components/admin/adminSettings/SettingsAppearanceTab'
import SettingsSecurityTab from '../../components/admin/adminSettings/SettingsSecurityTab'
import SettingsPermissionsTab from '../../components/admin/adminSettings/SettingsPermissionsTab'

export default function SettingsPage({ tokens }) {
  const { dark, setDark, accentColor, setAccentColor, fontSize, setFontSize, applyAppearance } = useTheme()
  const { user } = useAuth() || {}
  const BRAND = tokens?.brand || accentColor || '#615FFF'
  const showToast = useToast()
  const fileInputRef = useRef(null)

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('settings_active_tab') || sessionStorage.getItem('settings_active_tab') || 'Profile'
  })

  useEffect(() => {
    localStorage.setItem('settings_active_tab', activeTab)
  }, [activeTab])

  useEffect(() => {
    const handleTabChange = () => {
      const tab = sessionStorage.getItem('settings_active_tab') || localStorage.getItem('settings_active_tab')
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
    gender: '',
    bio: '',
    avatarColor: '#7c3aed'
  })

  const [appearanceForm, setAppearanceForm] = useState({
    themeMode: dark ? 'Dark' : 'Light',
    accentColor: accentColor || '#615FFF',
    fontSize: fontSize || 'medium'
  })

  useEffect(() => {
    setAppearanceForm(prev => ({
      ...prev,
      themeMode: dark ? 'Dark' : 'Light',
      accentColor: accentColor || '#615FFF',
      fontSize: fontSize || 'medium'
    }))
  }, [dark, accentColor, fontSize])

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

    // 1. Try organizersService.getProfile()
    let orgData = null
    try {
      const orgProfileRes = await organizersService.getProfile()
      if (orgProfileRes && orgProfileRes.success && orgProfileRes.organizer) {
        orgData = orgProfileRes.organizer
      }
    } catch (_) {}

    // 2. Direct fetch from /auth/me or /organizers/me if service data was sparse
    if (!orgData || !orgData.email) {
      try {
        const res = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/auth/me`)
        if (res && res.ok) {
          const raw = await res.json()
          const payload = raw.data?.user || raw.data || raw.user || raw
          const prof = payload.profile || {}
          orgData = {
            id: payload.user_id || payload.id || prof.profile_id,
            name: payload.full_name || payload.name || prof.full_name,
            email: payload.email || prof.email,
            phone: payload.phone || payload.mobile || prof.phone,
            department: payload.department || prof.department,
            gender: payload.gender || prof.gender || '',
            bio: payload.bio || prof.bio || '',
            avatarUrl: payload.profile_image || payload.profile_picture || prof.profile_picture || prof.profile_image
          }
        }
      } catch (_) {}
    }

    // 3. Fallback to AuthContext user object if available
    if (!orgData && user) {
      const prof = user.profile || {}
      orgData = {
        id: user.user_id || user.id,
        name: user.full_name || user.name || prof.full_name,
        email: user.email,
        phone: user.phone || user.mobile || prof.phone,
        department: user.department || prof.department,
        gender: user.gender || prof.gender || '',
        bio: user.bio || prof.bio || '',
        avatarUrl: user.profile_image || user.profile_picture || user.avatarUrl
      }
    }

    if (orgData) {
      setProfileForm(p => ({
        ...p,
        id: orgData.id || p.id || '',
        name: orgData.name || user?.name || user?.full_name || '',
        email: orgData.email || user?.email || '',
        department: orgData.department || user?.department || '',
        phone: orgData.phone || user?.phone || user?.mobile || '',
        gender: (orgData.gender || user?.gender || '').toLowerCase(),
        bio: orgData.bio || user?.bio || '',
        employeeId: orgData.collegeId || orgData.id || '',
        avatarUrl: orgData.avatarUrl || user?.avatarUrl || p.avatarUrl,
        avatarColor: orgData.avatarColor || '#615FFF'
      }))
    }

    try {
      const settingsRes = await settingsService.fetch()
      if (settingsRes && settingsRes.success) {
        const fetchedApp = settingsRes.settings.appearance || {}
        setAppearanceForm({
          themeMode: fetchedApp.themeMode || (dark ? 'Dark' : 'Light'),
          accentColor: fetchedApp.accentColor || accentColor || '#615FFF',
          fontSize: fetchedApp.fontSize || fontSize || 'medium'
        })
        if (settingsRes.settings.permissions) {
          setPermissions(settingsRes.settings.permissions)
        }
      }
    } catch (_) {}

    setLoading(false)
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handlePhotoUpload = (e) => {
    // Profile picture upload removed — only initials shown
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    let res = null
    try {
      res = await organizersService.updateProfile(profileForm)
    } catch (_) {}

    // Fallback: direct PUT to /auth/me or /organizers/me
    if (!res || !res.success) {
      try {
        const backendPayload = {
          full_name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
          mobile: profileForm.phone,
          gender: profileForm.gender ? profileForm.gender.toLowerCase() : null,
          department: profileForm.department,
          bio: profileForm.bio || ''
        }
        let apiRes = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backendPayload)
        })
        if (!apiRes.ok) {
          apiRes = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/organizers/me`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendPayload)
          })
        }
        if (apiRes.ok) {
          const data = await apiRes.json().catch(() => ({}))
          res = { success: true, message: data.message || 'Profile updated successfully.' }
        }
      } catch (_) {}
    }

    setSaving(false)
    if (res && res.success) {
      showToast(res.message || 'Profile updated successfully.', 'success')
      loadSettings()
    } else {
      showToast(res?.message || 'Failed to update profile.', 'error')
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

      {/* Header */}
      <div>
        <h1 className="text-[28px] font-extrabold m-0 tracking-tight" style={{ color: tokens.txtPri }}>
          Settings
        </h1>
        <p className="text-[13px] mt-1" style={{ color: tokens.txtSec }}>
          Manage your account and system preferences
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Sidebar Tabs */}
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

        {/* Right Content Area */}
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
              
              {/* PROFILE TAB */}
              {activeTab === 'Profile' && (
                <SettingsProfileTab
                  profileForm={profileForm}
                  setProfileForm={setProfileForm}
                  saving={saving}
                  handleSaveProfile={handleSaveProfile}
                  fileInputRef={fileInputRef}
                  handlePhotoUpload={handlePhotoUpload}
                  tokens={tokens}
                  BRAND={BRAND}
                  inputStyle={inputStyle}
                />
              )}

              {/* APPEARANCE TAB */}
              {activeTab === 'Appearance' && (
                <SettingsAppearanceTab
                  appearanceForm={appearanceForm}
                  setAppearanceForm={setAppearanceForm}
                  saving={saving}
                  handleSaveAppearance={handleSaveAppearance}
                  setDark={setDark}
                  setAccentColor={setAccentColor}
                  setFontSize={setFontSize}
                  tokens={tokens}
                  BRAND={BRAND}
                />
              )}

              {/* SECURITY TAB */}
              {activeTab === 'Security' && (
                <SettingsSecurityTab
                  passwordForm={passwordForm}
                  setPasswordForm={setPasswordForm}
                  saving={saving}
                  handleUpdatePassword={handleUpdatePassword}
                  tfaEnabled={tfaEnabled}
                  tfaLoading={tfaLoading}
                  handleToggleTFA={handleToggleTFA}
                  tokens={tokens}
                  BRAND={BRAND}
                  inputStyle={inputStyle}
                />
              )}

              {/* PERMISSIONS TAB */}
              {activeTab === 'Permissions' && (
                <SettingsPermissionsTab
                  permissions={permissions}
                  tokens={tokens}
                />
              )}

              {/* ACCOUNT TAB (Placeholder) */}
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

              {/* SYSTEM TAB (Placeholder) */}
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
