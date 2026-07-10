import { useState, useEffect } from 'react'
import { Download, Plus } from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../data/dashboardData'
import organizersService from '../../services/organizersService'
import { useToast } from '../../context/ToastContext'

// Sub-components
import OrganizerFilters from '../../components/admin/adminOrganizer/OrganizerFilters'
import OrganizerGrid from '../../components/admin/adminOrganizer/OrganizerGrid'
import OrganizerFormModal from '../../components/admin/adminOrganizer/OrganizerFormModal'
import OrganizerViewModal from '../../components/admin/adminOrganizer/OrganizerViewModal'
import OrganizerDeleteModal from '../../components/admin/adminOrganizer/OrganizerDeleteModal'

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
    phone: '',
    collegeId: '',
    password: ''
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
      phone: '',
      collegeId: '',
      password: ''
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
      phone: o.phone || '',
      collegeId: o.collegeId || '',
      password: ''
    })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.email.trim()) errs.email = 'Required'
    if (!form.collegeId.trim()) errs.collegeId = 'Required'
    if (!editing && !form.password.trim()) {
      errs.password = 'Required'
    } else if (!editing && form.password.length < 6) {
      errs.password = 'Must be at least 6 characters'
    }
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
      showToast(res.message || 'Failed to save organizer.', 'error')
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

      {/* Header */}
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

      {/* Search Bar */}
      <OrganizerFilters
        search={search}
        setSearch={setSearch}
        tokens={tokens}
        BRAND={BRAND}
        inputStyle={inputStyle}
      />

      {/* Organizer Grid */}
      <OrganizerGrid
        loading={loading}
        filtered={filtered}
        badgeStyle={badgeStyle}
        setViewOrg={setViewOrg}
        openEdit={openEdit}
        setDeleteTarget={setDeleteTarget}
        tokens={tokens}
        BRAND={BRAND}
        skBg={skBg}
        cardStyle={cardStyle}
        dark={dark}
      />

      {/* Add/Edit Modal */}
      <OrganizerFormModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        editing={editing}
        form={form}
        setForm={setForm}
        errors={errors}
        handleSave={handleSave}
        saving={saving}
        tokens={tokens}
        dark={dark}
        BRAND={BRAND}
        inputStyle={inputStyle}
      />

      {/* View Profile Modal */}
      <OrganizerViewModal
        viewOrg={viewOrg}
        setViewOrg={setViewOrg}
        badgeStyle={badgeStyle}
        tokens={tokens}
        dark={dark}
        BRAND={BRAND}
      />

      {/* Delete Confirmation Modal */}
      <OrganizerDeleteModal
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        handleDelete={handleDelete}
        tokens={tokens}
        dark={dark}
      />
    </div>
  )
}
