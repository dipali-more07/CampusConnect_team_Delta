import { useState, useEffect } from 'react'
import { Download, Plus } from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../data/dashboardData'
import studentsService from '../../services/studentsService'
import { useToast } from '../../context/ToastContext'

// Sub-components
import StudentStats from '../../components/admin/adminStudent/StudentStats'
import StudentFilters from '../../components/admin/adminStudent/StudentFilters'
import StudentTable from '../../components/admin/adminStudent/StudentTable'
import StudentFormModal from '../../components/admin/adminStudent/StudentFormModal'
import StudentViewModal from '../../components/admin/adminStudent/StudentViewModal'
import StudentDeleteModal from '../../components/admin/adminStudent/StudentDeleteModal'
import StudentStatusModal from '../../components/admin/adminStudent/StudentStatusModal'

const DEPTS = ['All', 'CSE', 'ECE', 'ME', 'MBA', 'EEE', 'Civil']
const YEARS = ['All', '1st', '2nd', '3rd', '4th']
const STATUSES = ['All', 'Active', 'Suspended']

export default function StudentsPage({ tokens }) {
  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND
  const showToast = useToast()
  const [students, setStudents] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('All')
  const [year, setYear] = useState('All')
  const [status, setStatus] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewStudent, setViewStudent] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [form, setForm] = useState({ name: '', rollNo: '', email: '', password: '', department: 'CSE', year: '1st', phone: '' })
  const [errors, setErrors] = useState({})

  const card = { background: tokens.card, border: `1px solid ${tokens.border}`, boxShadow: tokens.shadow }
  const inp = { background: tokens.inputBg, borderColor: tokens.border, color: tokens.txtPri }
  const skBg = dark ? '#162640' : '#e2e8f0'

  const load = async () => {
    setLoading(true)
    const res = await studentsService.fetchAll()
    if (res.success) { setStudents(res.students); setStats(res.stats) }
    else showToast(res.message || 'Failed to load.', 'error')
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    return matchQ && (dept === 'All' || s.department === dept) && (year === 'All' || s.year === year) && (status === 'All' || s.status === status)
  })

  const openCreate = () => { setEditing(null); setForm({ name: '', rollNo: '', email: '', password: '', department: 'CSE', year: '1st', phone: '' }); setErrors({}); setModalOpen(true) }
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, rollNo: s.rollNo, email: s.email, password: '', department: s.department, year: s.year, phone: s.phone || '' }); setErrors({}); setModalOpen(true) }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.rollNo.trim()) e.rollNo = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    if (!editing && !form.password.trim()) e.password = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    const res = editing ? await studentsService.update(editing.id, form) : await studentsService.create(form)
    setSaving(false)
    if (res.success) { showToast(editing ? 'Student updated.' : 'Student added.', 'success'); setModalOpen(false); load() }
    else showToast(res.message, 'error')
  }

  const handleDelete = async () => {
    const res = await studentsService.delete(deleteTarget.id)
    if (res.success) { showToast('Student deleted.', 'success'); setDeleteTarget(null); load() }
    else showToast(res.message, 'error')
  }

  const handleToggleStatus = (s) => {
    setStatusTarget(s)
  }

  const handleConfirmStatus = async () => {
    if (!statusTarget) return
    const next = statusTarget.status === 'Active' ? 'Suspended' : 'Active'
    setStatusSaving(true)
    const res = await studentsService.updateStatus(statusTarget.id, next)
    setStatusSaving(false)
    if (res.success) {
      showToast(`Student ${next === 'Active' ? 'activated' : 'suspended'} successfully.`, 'success')
      setStatusTarget(null)

      // ✅ Local state update — backend /users/students sirf active users return karta hai
      // isliye load() mat karo, warna suspended student gayab ho jaata hai
      setStudents(prev =>
        prev.map(s => s.id === statusTarget.id ? { ...s, status: next } : s)
      )
      setStats(prev => ({
        ...prev,
        total: prev.total,
        active: next === 'Active' ? prev.active + 1 : Math.max(0, prev.active - 1),
        suspended: next === 'Suspended' ? prev.suspended + 1 : Math.max(0, prev.suspended - 1)
      }))
    } else {
      showToast(res.message || 'Failed to update status.', 'error')
    }
  }

  const handleExport = () => {
    const csv = 'data:text/csv;charset=utf-8,Name,Roll No,Department,Year,Email,Status,Events,Attendance,Certificates\n' +
      students.map(s => `"${s.name}",${s.rollNo},${s.department},${s.year},${s.email},${s.status},${s.eventsAttended},${s.attendancePercent}%,${s.certificatesCount}`).join('\n')
    const a = document.createElement('a'); a.href = encodeURI(csv); a.download = 'students.csv'; a.click()
    showToast('Exported successfully.', 'success')
  }

  const badgeSt = (st) => st === 'Active'
    ? { bg: dark ? 'rgba(0,188,125,.15)' : '#e6fbf2', text: '#00BC7D' }
    : { bg: dark ? 'rgba(239,68,68,.15)' : '#fef2f2', text: '#ef4444' }

  return (
    <div className="p-5 px-6 space-y-5">
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold m-0 tracking-tight" style={{ color: tokens.txtPri }}>Students</h1>
          <p className="text-[13px] mt-1" style={{ color: tokens.txtSec }}>Manage student accounts and profiles</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-transparent border transition-all"
            style={{ borderColor: tokens.border, color: tokens.txtSec }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.txtSec }}>
            <Download size={14} /> Export
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer hover:-translate-y-px transition-all"
            style={{ background: BRAND, boxShadow: '0 4px 14px rgba(97,95,255,0.4)' }}>
            <Plus size={15} /> Add Student
          </button>
        </div>
      </div>

      {/* Stats */}
      <StudentStats
        loading={loading}
        stats={stats}
        cardStyle={card}
        skBg={skBg}
        dark={dark}
        tokens={tokens}
      />

      {/* Filters */}
      <StudentFilters
        search={search}
        setSearch={setSearch}
        dept={dept}
        setDept={setDept}
        DEPTS={DEPTS}
        year={year}
        setYear={setYear}
        YEARS={YEARS}
        status={status}
        setStatus={setStatus}
        STATUSES={STATUSES}
        tokens={tokens}
        BRAND={BRAND}
        inpStyle={inp}
      />

      {/* Table */}
      <StudentTable
        loading={loading}
        filtered={filtered}
        students={students}
        badgeSt={badgeSt}
        handleToggleStatus={handleToggleStatus}
        setViewStudent={setViewStudent}
        openEdit={openEdit}
        setDeleteTarget={setDeleteTarget}
        tokens={tokens}
        BRAND={BRAND}
        skBg={skBg}
        cardStyle={card}
        dark={dark}
      />

      {/* Add/Edit Modal */}
      <StudentFormModal
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
        inpStyle={inp}
        DEPTS={DEPTS}
        YEARS={YEARS}
      />

      {/* View Profile Modal */}
      <StudentViewModal
        viewStudent={viewStudent}
        setViewStudent={setViewStudent}
        badgeSt={badgeSt}
        tokens={tokens}
        dark={dark}
        BRAND={BRAND}
      />

      {/* Delete Confirmation Modal */}
      <StudentDeleteModal
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        handleDelete={handleDelete}
        tokens={tokens}
        dark={dark}
      />

      {/* Activate / Suspend Confirmation Modal */}
      <StudentStatusModal
        statusTarget={statusTarget}
        setStatusTarget={setStatusTarget}
        handleConfirmStatus={handleConfirmStatus}
        saving={statusSaving}
        tokens={tokens}
        dark={dark}
      />
    </div>
  )
}
