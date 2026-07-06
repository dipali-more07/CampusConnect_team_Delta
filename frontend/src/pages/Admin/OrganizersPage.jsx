import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, Download, Plus, Eye, Pencil, Trash2, X, Loader2, Mail, Calendar, Shield, MapPin, Phone } from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../data/dashboardData'
import organizersService from '../../services/organizersService'
import { useToast } from '../../context/ToastContext'

function Avatar({ name, color, size = 44 }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 font-extrabold text-white text-[14px]"
      style={{ width: size, height: size, background: color }}>
      {initials}
    </div>
  )
}

export default function OrganizersPage({ tokens }) {
  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND
  const showToast = useToast()
  const [organizers, setOrganizers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewOrg, setViewOrg] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    department: 'Computer Science',
    email: '',
    role: 'Organizer',
    phone: '',
    office: ''
  })
  const [errors, setErrors] = useState({})

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
  const skBg = dark ? '#162640' : '#e2e8f0'

  const load = async () => {
    setLoading(true)
    const res = await organizersService.fetchAll()
    if (res.success) {
      setOrganizers(res.organizers)
    } else {
      showToast(res.message || 'Failed to load organizers.', 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = organizers.filter(o => {
    const q = search.toLowerCase()
    return !q ||
      o.name.toLowerCase().includes(q) ||
      o.department.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q)
  })

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: '',
      department: 'Computer Science',
      email: '',
      role: 'Organizer',
      phone: '',
      office: ''
    })
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (o) => {
    setEditing(o)
    setForm({
      name: o.name,
      department: o.department,
      email: o.email,
      role: o.role,
      phone: o.phone || '',
      office: o.office || ''
    })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.email.trim()) errs.email = 'Required'
    setErrors(errs)
    return !Object.keys(errs).length
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    const res = editing ? await organizersService.update(editing.id, form) : await organizersService.create(form)
    setSaving(false)
    if (res.success) {
      showToast(editing ? 'Organizer updated.' : 'Organizer added.', 'success')
      setModalOpen(false)
      load()
    } else {
      showToast(res.message, 'error')
    }
  }

  const handleDelete = async () => {
    const res = await organizersService.delete(deleteTarget.id)
    if (res.success) {
      showToast('Organizer deleted.', 'success')
      setDeleteTarget(null)
      load()
    } else {
      showToast(res.message, 'error')
    }
  }

  const handleExport = () => {
    const csv = 'data:text/csv;charset=utf-8,Name,Department,Email,Role,Events Managed,Phone,Office\n' +
      organizers.map(o => `"${o.name}","${o.department}","${o.email}","${o.role}",${o.eventsManaged},"${o.phone || ''}","${o.office || ''}"`).join('\n')
    const encodedUri = encodeURI(csv)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'organizers.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Exported successfully.', 'success')
  }

  const badgeStyle = (role) => {
    if (role === 'Senior') {
      return { bg: dark ? 'rgba(99, 91, 255, 0.15)' : '#eef2ff', text: '#635BFF' }
    }
    return { bg: dark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff', text: '#3b82f6' }
  }

  return (
    <div className="p-5 px-6 space-y-5">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold m-0 tracking-tight" style={{ color: tokens.txtPri }}>
            Organizers
          </h1>
          <p className="text-[13px] mt-1" style={{ color: tokens.txtSec }}>
            Manage event organizer accounts
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-transparent border transition-all cursor-pointer"
            style={{ borderColor: tokens.border, color: tokens.txtSec }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.txtSec }}
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer hover:-translate-y-px transition-all duration-200"
            style={{ background: BRAND, boxShadow: '0 4px 14px rgba(97,95,255,0.4)' }}
          >
            <Plus size={15} /> Add Organizer
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative max-w-[320px]">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: tokens.txtMuted }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, department, email..."
          className="w-full pl-10 pr-4 h-[42px] rounded-xl text-[13px] outline-none border transition-all"
          style={{ ...inputStyle, borderColor: tokens.border }}
          onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
          onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {/* ── Organizer Grid ── */}
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl p-5 border space-y-4" style={cardStyle}>
              <div className="flex justify-between items-start">
                <div className="w-11 h-11 rounded-full shrink-0" style={{ background: skBg }} />
                <div className="w-16 h-5 rounded-md" style={{ background: skBg }} />
              </div>
              <div className="space-y-2">
                <div className="w-32 h-4 rounded-md" style={{ background: skBg }} />
                <div className="w-24 h-3 rounded-md" style={{ background: skBg }} />
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="w-40 h-3 rounded-md" style={{ background: skBg }} />
                <div className="w-28 h-3 rounded-md" style={{ background: skBg }} />
              </div>
              <div className="w-full h-9 rounded-xl" style={{ background: skBg }} />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-2xl border" style={cardStyle}>
            <Shield size={40} className="block mx-auto mb-3" style={{ color: tokens.txtMuted }} />
            <p className="text-[14px] font-medium" style={{ color: tokens.txtSec }}>No organizers found</p>
          </div>
        ) : (
          filtered.map(org => {
            const badge = badgeStyle(org.role)
            return (
              <div
                key={org.id}
                className="rounded-2xl p-5 border flex flex-col justify-between transition-all duration-300 relative group"
                style={cardStyle}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = dark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 30px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = tokens.shadow }}
              >
                <div>
                  {/* Top: Avatar and Role */}
                  <div className="flex justify-between items-start">
                    <Avatar name={org.name} color={org.avatarColor} />
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold"
                      style={{ background: badge.bg, color: badge.text }}
                    >
                      {org.role}
                    </span>
                  </div>

                  {/* Identity */}
                  <div className="mt-3">
                    <h3 className="text-[15.5px] font-extrabold m-0" style={{ color: tokens.txtPri }}>
                      {org.name}
                    </h3>
                    <p className="text-[12px] font-semibold mt-0.5" style={{ color: tokens.txtSec }}>
                      {org.department}
                    </p>
                  </div>

                  {/* Info details */}
                  <div className="mt-4 space-y-2 text-[12px]" style={{ color: tokens.txtSec }}>
                    <div className="flex items-center gap-2">
                      <Mail size={13} style={{ color: tokens.txtMuted }} />
                      <span className="truncate">{org.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} style={{ color: tokens.txtMuted }} />
                      <span>{org.eventsManaged} events managed</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row Actions */}
                <div className="mt-5 pt-4 border-t flex gap-2" style={{ borderColor: tokens.border }}>
                  <button
                    onClick={() => setViewOrg(org)}
                    className="flex-1 py-2 rounded-xl text-[12px] font-bold border cursor-pointer bg-transparent transition-all duration-150"
                    style={{ borderColor: tokens.border, color: tokens.txtPri }}
                    onMouseEnter={e => { e.currentTarget.style.background = tokens.hoverBg }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => openEdit(org)}
                    title="Edit Profile"
                    className="w-9 h-9 rounded-xl border bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 shrink-0"
                    style={{ borderColor: tokens.border, color: tokens.txtSec }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.txtSec }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(org)}
                    title="Delete Account"
                    className="w-9 h-9 rounded-xl border bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 shrink-0"
                    style={{ borderColor: tokens.border, color: tokens.txtSec }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.txtSec }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {modalOpen && createPortal(
        <div
          className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div
            className="rounded-[24px] w-full max-w-[500px] overflow-hidden"
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
              <div>
                <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Full Name</label>
                <input
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
                  <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Email Address</label>
                  <input
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
                  <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Role Designation</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all appearance-none cursor-pointer"
                    style={inputStyle}
                  >
                    <option value="Organizer">Organizer</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Department</label>
                  <input
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
                  <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Phone (Optional)</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. +91 98765 00000"
                    className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                    onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>Office Room Location</label>
                <input
                  value={form.office}
                  onChange={e => setForm(p => ({ ...p, office: e.target.value }))}
                  placeholder="e.g. Block A, Room 302"
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                  onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-7 pb-6 flex gap-3">
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
                {saving ? (
                  <><Loader2 size={14} className="animate-spin" /> Saving…</>
                ) : (
                  editing ? 'Update Account' : 'Create Account'
                )}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ── View Profile Modal ── */}
      {viewOrg && createPortal(
        <div
          className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={e => { if (e.target === e.currentTarget) setViewOrg(null) }}
        >
          <div
            className="rounded-[24px] w-full max-w-[420px] overflow-hidden"
            style={{
              background: dark ? '#0c1829' : '#fff',
              border: `1px solid ${tokens.border}`,
              boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
              animation: 'slideUp 0.25s ease'
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: `1px solid ${tokens.border}` }}>
              <h2 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>
                Organizer Profile
              </h2>
              <button
                onClick={() => setViewOrg(null)}
                className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center"
                style={{ color: tokens.txtSec }}
                onMouseEnter={e => e.currentTarget.style.background = tokens.hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <X size={17} />
              </button>
            </div>

            {/* Profile Info */}
            <div className="px-7 py-6 space-y-5">
              <div className="flex items-center gap-4">
                <Avatar name={viewOrg.name} color={viewOrg.avatarColor} size={56} />
                <div>
                  <h3 className="text-[18px] font-extrabold m-0" style={{ color: tokens.txtPri }}>
                    {viewOrg.name}
                  </h3>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block mt-1"
                    style={badgeStyle(viewOrg.role)}
                  >
                    {viewOrg.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl p-3" style={{ background: tokens.hoverBg }}>
                  <p className="text-[11px] font-bold m-0 mb-0.5" style={{ color: tokens.txtSec }}>Department</p>
                  <p className="text-[13px] font-bold m-0" style={{ color: tokens.txtPri }}>{viewOrg.department}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: tokens.hoverBg }}>
                  <p className="text-[11px] font-bold m-0 mb-0.5" style={{ color: tokens.txtSec }}>Events Managed</p>
                  <p className="text-[13px] font-bold m-0" style={{ color: tokens.txtPri }}>{viewOrg.eventsManaged}</p>
                </div>
                <div className="rounded-xl p-3 col-span-2" style={{ background: tokens.hoverBg }}>
                  <p className="text-[11px] font-bold m-0 mb-0.5" style={{ color: tokens.txtSec }}>Office Address</p>
                  <div className="flex items-center gap-1.5 mt-0.5" style={{ color: tokens.txtPri }}>
                    <MapPin size={13} style={{ color: tokens.txtMuted }} />
                    <span className="text-[13px] font-bold">{viewOrg.office || 'Not assigned'}</span>
                  </div>
                </div>
                <div className="rounded-xl p-3 col-span-2" style={{ background: tokens.hoverBg }}>
                  <p className="text-[11px] font-bold m-0 mb-0.5" style={{ color: tokens.txtSec }}>Contact Number</p>
                  <div className="flex items-center gap-1.5 mt-0.5" style={{ color: tokens.txtPri }}>
                    <Phone size={13} style={{ color: tokens.txtMuted }} />
                    <span className="text-[13px] font-bold">{viewOrg.phone || 'Not assigned'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl" style={{ border: `1px dashed ${tokens.border}` }}>
                <span className="text-[12px] font-bold" style={{ color: tokens.txtSec }}>Email Address</span>
                <a href={`mailto:${viewOrg.email}`} className="text-[13px] font-bold transition-colors" style={{ color: BRAND }}>
                  {viewOrg.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ── Delete Confirmation ── */}
      {deleteTarget && createPortal(
        <div
          className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}
        >
          <div
            className="rounded-[20px] w-full max-w-[380px] p-7 text-center"
            style={{
              background: dark ? '#0c1829' : '#fff',
              border: `1px solid ${tokens.border}`,
              boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
              animation: 'slideUp 0.25s ease'
            }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <Trash2 size={24} color="#ef4444" />
            </div>
            <h3 className="text-[17px] font-extrabold m-0 mb-2" style={{ color: tokens.txtPri }}>Delete Organizer?</h3>
            <p className="text-[13px] mb-5" style={{ color: tokens.txtSec }}>
              This will permanently delete the account of <strong>{deleteTarget.name}</strong>. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border cursor-pointer"
                style={{ borderColor: tokens.border, color: tokens.txtSec, background: 'transparent' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer"
                style={{ background: '#ef4444' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
