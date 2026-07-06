import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, Download, Plus, Eye, Pencil, Trash2, X, Loader2, GraduationCap, Users, UserCheck, UserX } from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../data/dashboardData'
import studentsService from '../../services/studentsService'
import { useToast } from '../../context/ToastContext'

const DEPTS = ['All', 'CSE', 'ECE', 'ME', 'MBA', 'EEE', 'Civil']
const YEARS = ['All', '1st', '2nd', '3rd', '4th']
const STATUSES = ['All', 'Active', 'Suspended']

function Avatar({ name, color, size = 36 }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 font-bold text-white text-[13px]"
      style={{ width: size, height: size, background: color }}>
      {initials}
    </div>
  )
}

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
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', rollNo: '', email: '', department: 'CSE', year: '1st', phone: '' })
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

  const openCreate = () => { setEditing(null); setForm({ name: '', rollNo: '', email: '', department: 'CSE', year: '1st', phone: '' }); setErrors({}); setModalOpen(true) }
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, rollNo: s.rollNo, email: s.email, department: s.department, year: s.year, phone: s.phone || '' }); setErrors({}); setModalOpen(true) }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.rollNo.trim()) e.rollNo = 'Required'
    if (!form.email.trim()) e.email = 'Required'
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

  const handleToggleStatus = async (s) => {
    const next = s.status === 'Active' ? 'Suspended' : 'Active'
    const res = await studentsService.updateStatus(s.id, next)
    if (res.success) { showToast(`Student ${next.toLowerCase()}.`, 'success'); load() }
    else showToast(res.message, 'error')
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
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
        {loading ? [1,2,3].map(i => (
          <div key={i} className="rounded-[18px] p-5 border flex items-center gap-4" style={card}>
            <div className="w-12 h-12 rounded-xl shrink-0" style={{ background: skBg }} />
            <div className="flex-1"><div className="w-16 h-6 rounded mb-2" style={{ background: skBg }} /><div className="w-24 h-3 rounded" style={{ background: skBg }} /></div>
          </div>
        )) : [
          { label: 'Total Students', value: stats.total, Icon: Users, color: '#fff', bg: '#635BFF' },
          { label: 'Active', value: stats.active, Icon: UserCheck, color: '#fff', bg: '#10B981' },
          { label: 'Suspended', value: stats.suspended, Icon: UserX, color: '#fff', bg: '#ef4444' },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="rounded-[18px] p-4 border flex items-center gap-4 transition-all duration-300 cursor-default" style={card}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = dark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 28px rgba(0,0,0,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = tokens.shadow }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
              <Icon size={22} style={{ color }} />
            </div>
            <div>
              <p className="text-[26px] font-extrabold m-0 leading-tight" style={{ color: tokens.txtPri }}>{value}</p>
              <p className="text-[12px] font-medium mt-0.5" style={{ color: tokens.txtSec }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-[320px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: tokens.txtMuted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, roll, department..."
            className="w-full pl-10 pr-4 h-[42px] rounded-xl text-[13px] outline-none border transition-all"
            style={{ ...inp, borderColor: tokens.border }}
            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
            onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }} />
        </div>
        {[['dept', dept, setDept, DEPTS], ['year', year, setYear, YEARS], ['status', status, setStatus, STATUSES]].map(([key, val, setter, opts]) => (
          <div key={key} className="relative">
            <select value={val} onChange={e => setter(e.target.value)}
              className="pl-4 pr-9 h-[42px] rounded-full text-[12.5px] outline-none border appearance-none cursor-pointer font-bold"
              style={{ background: tokens.card, borderColor: tokens.border, color: tokens.txtPri }}>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: tokens.txtSec }}>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1.5L5 4.5L9 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={card}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                {['STUDENT','ROLL NO','DEPT','YEAR','EVENTS','ATTENDANCE','CERTIFICATES','STATUS','ACTIONS'].map(h => (
                  <th key={h} className="px-5 py-4 text-[11px] font-bold tracking-wider" style={{ color: tokens.txtSec }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [1,2,3,4,5].map(i => (
                <tr key={i} style={{ borderBottom: `1px solid ${tokens.border}` }}>
                  {[40,80,40,30,30,100,50,60,60].map((w, j) => (
                    <td key={j} className="px-5 py-4"><div className={`h-3.5 rounded`} style={{ width: w, background: skBg }} /></td>
                  ))}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan="9" className="p-12 text-center">
                  <GraduationCap size={40} className="block mx-auto mb-3" style={{ color: tokens.txtMuted }} />
                  <p className="text-[14px] font-medium" style={{ color: tokens.txtSec }}>No students found</p>
                </td></tr>
              ) : filtered.map((s, i) => {
                const badge = badgeSt(s.status)
                const attColor = s.attendancePercent >= 85 ? '#00BC7D' : s.attendancePercent >= 70 ? '#FE9A00' : '#ef4444'
                return (
                  <tr key={s.id} className="transition-colors duration-150"
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${tokens.border}` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = tokens.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} color={s.avatarColor} />
                        <div>
                          <div className="text-[13.5px] font-bold" style={{ color: tokens.txtPri }}>{s.name}</div>
                          <div className="text-[11px] font-medium mt-0.5" style={{ color: BRAND }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: tokens.txtSec }}>{s.rollNo}</td>
                    <td className="px-5 py-3.5 text-[13px] font-bold" style={{ color: tokens.txtPri }}>{s.department}</td>
                    <td className="px-5 py-3.5 text-[13px]" style={{ color: tokens.txtSec }}>{s.year}</td>
                    <td className="px-5 py-3.5 text-[13px] font-bold" style={{ color: tokens.txtPri }}>{s.eventsAttended}</td>
                    <td className="px-5 py-3.5 min-w-[130px]">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold min-w-[36px]" style={{ color: attColor }}>{s.attendancePercent}%</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: dark ? '#1a3050' : '#e2e8f0' }}>
                          <div className="h-full rounded-full" style={{ width: `${s.attendancePercent}%`, background: attColor }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-bold" style={{ color: tokens.txtPri }}>{s.certificatesCount}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                        style={{ background: badge.bg, color: badge.text }}
                        onClick={() => handleToggleStatus(s)}
                        title="Click to toggle status">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {[
                          { Icon: Eye, action: () => setViewStudent(s), hover: BRAND },
                          { Icon: Pencil, action: () => openEdit(s), hover: BRAND },
                          { Icon: Trash2, action: () => setDeleteTarget(s), hover: '#ef4444' },
                        ].map(({ Icon, action, hover }) => (
                          <button key={hover + Icon.name} onClick={action}
                            className="w-[28px] h-[28px] rounded-lg border bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
                            style={{ borderColor: tokens.border, color: tokens.txtSec }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = hover; e.currentTarget.style.color = hover }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.txtSec }}>
                            <Icon size={12.5} />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${tokens.border}` }}>
            <span className="text-[12px] font-medium" style={{ color: tokens.txtSec }}>Showing {filtered.length} of {students.length} students</span>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="rounded-[24px] w-full max-w-[520px] overflow-hidden"
            style={{ background: dark ? '#0c1829' : '#fff', border: `1px solid ${tokens.border}`, boxShadow: '0 32px 80px rgba(0,0,0,0.45)', animation: 'slideUp 0.25s ease' }}>
            <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: `1px solid ${tokens.border}` }}>
              <h2 className="text-[18px] font-extrabold m-0" style={{ color: tokens.txtPri }}>{editing ? `Edit — ${editing.rollNo}` : 'Add New Student'}</h2>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center" style={{ color: tokens.txtSec }}
                onMouseEnter={e => e.currentTarget.style.background = tokens.hoverBg} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <X size={18} />
              </button>
            </div>
            <div className="px-7 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Full Name', placeholder: 'e.g. Arjun Patel', col: 2 },
                { key: 'rollNo', label: 'Roll Number', placeholder: 'e.g. 21CS001' },
                { key: 'email', label: 'Email', placeholder: 'e.g. arjun@college.edu' },
                { key: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
              ].map(({ key, label, placeholder, col }) => (
                <div key={key} style={{ gridColumn: col === 2 ? '1 / -1' : undefined }}>
                  <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>{label}</label>
                  <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                    style={{ ...inp, borderColor: errors[key] ? '#ef4444' : tokens.border }}
                    onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                    onBlur={e => { e.target.style.borderColor = errors[key] ? '#ef4444' : tokens.border; e.target.style.boxShadow = 'none' }} />
                  {errors[key] && <span className="text-[11px] text-red-500 mt-1 block">{errors[key]}</span>}
                </div>
              ))}
              {[['department', 'Department', DEPTS.filter(d => d !== 'All')], ['year', 'Year', YEARS.filter(y => y !== 'All')]].map(([key, label, opts]) => (
                <div key={key}>
                  <label className="text-[12px] font-bold block mb-1.5" style={{ color: tokens.txtSec }}>{label}</label>
                  <select value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none border transition-all appearance-none cursor-pointer"
                    style={inp}>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="px-7 pb-6 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl text-[13px] font-bold border cursor-pointer transition-all" style={{ borderColor: tokens.border, color: tokens.txtSec, background: 'transparent' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ background: BRAND }}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : (editing ? 'Update Student' : 'Add Student')}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* View Modal */}
      {viewStudent && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={e => { if (e.target === e.currentTarget) setViewStudent(null) }}>
          <div className="rounded-[24px] w-full max-w-[440px] overflow-hidden"
            style={{ background: dark ? '#0c1829' : '#fff', border: `1px solid ${tokens.border}`, boxShadow: '0 32px 80px rgba(0,0,0,0.45)', animation: 'slideUp 0.25s ease' }}>
            <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: `1px solid ${tokens.border}` }}>
              <h2 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>Student Profile</h2>
              <button onClick={() => setViewStudent(null)} className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center" style={{ color: tokens.txtSec }}
                onMouseEnter={e => e.currentTarget.style.background = tokens.hoverBg} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <X size={17} />
              </button>
            </div>
            <div className="px-7 py-6 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar name={viewStudent.name} color={viewStudent.avatarColor} size={56} />
                <div>
                  <p className="text-[18px] font-extrabold m-0" style={{ color: tokens.txtPri }}>{viewStudent.name}</p>
                  <p className="text-[13px] mt-0.5" style={{ color: BRAND }}>{viewStudent.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Roll No', viewStudent.rollNo], ['Department', viewStudent.department],
                  ['Year', viewStudent.year], ['Phone', viewStudent.phone || '—'],
                  ['Events', viewStudent.eventsAttended], ['Certificates', viewStudent.certificatesCount],
                  ['Attendance', `${viewStudent.attendancePercent}%`], ['Joined', viewStudent.joinedDate],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl p-3" style={{ background: tokens.hoverBg }}>
                    <p className="text-[11px] font-bold m-0 mb-0.5" style={{ color: tokens.txtSec }}>{k}</p>
                    <p className="text-[13.5px] font-bold m-0" style={{ color: tokens.txtPri }}>{v}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold" style={{ color: tokens.txtSec }}>Status</span>
                <span className="px-3 py-1 rounded-full text-[12px] font-bold" style={badgeSt(viewStudent.status)}>{viewStudent.status}</span>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Delete Confirm */}
      {deleteTarget && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
          <div className="rounded-[20px] w-full max-w-[380px] p-7 text-center"
            style={{ background: dark ? '#0c1829' : '#fff', border: `1px solid ${tokens.border}`, boxShadow: '0 32px 80px rgba(0,0,0,0.45)', animation: 'slideUp 0.25s ease' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <Trash2 size={24} color="#ef4444" />
            </div>
            <h3 className="text-[17px] font-extrabold m-0 mb-2" style={{ color: tokens.txtPri }}>Delete Student?</h3>
            <p className="text-[13px] mb-5" style={{ color: tokens.txtSec }}>This will permanently remove <strong>{deleteTarget.name}</strong> and all their records.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border cursor-pointer" style={{ borderColor: tokens.border, color: tokens.txtSec, background: 'transparent' }}>Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer" style={{ background: '#ef4444' }}>Delete</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
