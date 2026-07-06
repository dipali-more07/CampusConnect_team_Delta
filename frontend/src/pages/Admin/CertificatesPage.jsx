import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Award, Search, Download, Eye, Send, RotateCcw, CheckCircle2,
  Clock, ShieldCheck, X, Loader2, RefreshCw, Zap, GraduationCap, Copy, Palette, Save, Check
} from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../data/dashboardData'
import certificatesService from '../../services/certificatesService'
import { useToast } from '../../context/ToastContext'

export default function CertificatesPage({ tokens }) {
  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND
  const showToast = useToast()

  const [certs, setCerts] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, generatedSent: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('All')
  const [activeEvent, setActiveEvent] = useState('All')
  const [selected, setSelected] = useState([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyResult, setVerifyResult] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [previewCert, setPreviewCert] = useState(null)
  const [designerOpen, setDesignerOpen] = useState(false)
  const [tmpl, setTmpl] = useState({
    org: 'State University',
    title: 'Certificate of Participation',
    subtitle: 'This is to certify that',
    body: 'has successfully participated in',
    footer: 'eventhub.university.edu/verify',
    gradFrom: '#1a1060',
    gradMid: '#0f0a45',
    gradTo: '#0a0838',
    accentColor: '#615FFF',
    borderStyle: 'none',
    fontFamily: 'Manrope, sans-serif',
    showLogo: true,
    showSignatures: true,
    templateSaved: false,
  })

  const cardStyle = {
    background: tokens.card,
    border: `1px solid ${tokens.border}`,
    boxShadow: tokens.shadow,
  }

  const inputStyle = {
    background: tokens.inputBg,
    borderColor: tokens.border,
    color: tokens.txtPri,
  }

  const load = async () => {
    setLoading(true)
    const res = await certificatesService.fetchAll()
    if (res.success) {
      setCerts(res.certificates)
      setStats(res.stats)
    } else {
      showToast(res.message || 'Failed to load certificates.', 'error')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const statuses = ['All', 'Pending', 'Generated', 'Sent']
  const events = ['All', ...Array.from(new Set(certs.map(c => c.eventName)))]

  const filtered = certs.filter(c => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q ||
      c.studentName.toLowerCase().includes(q) ||
      c.rollNo.toLowerCase().includes(q) ||
      c.verifyCode.toLowerCase().includes(q) ||
      c.eventName.toLowerCase().includes(q)
    const matchStatus = activeStatus === 'All' || c.status === activeStatus
    const matchEvent = activeEvent === 'All' || c.eventName === activeEvent
    return matchSearch && matchStatus && matchEvent
  })

  const allSelected = filtered.length > 0 && filtered.every(c => selected.includes(c.id))

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const toggleAll = () =>
    setSelected(allSelected ? [] : filtered.map(c => c.id))

  const handleBulkGenerate = async () => {
    setBulkLoading(true)
    const res = await certificatesService.bulkGenerate('ALL')
    if (res.success) {
      showToast(res.message, 'success')
      setSelected([])
      load()
    } else {
      showToast(res.message, 'error')
    }
    setBulkLoading(false)
  }

  const handleGenerate = async (ids) => {
    const res = await certificatesService.generate(ids)
    if (res.success) {
      showToast(res.message, 'success')
      setSelected([])
      load()
    } else {
      showToast(res.message, 'error')
    }
  }

  const handleSend = async (ids) => {
    setSendLoading(true)
    const res = await certificatesService.send(ids)
    if (res.success) {
      showToast(res.message, 'success')
      setSelected([])
      load()
    } else {
      showToast(res.message, 'error')
    }
    setSendLoading(false)
  }

  const handleRevoke = async (id) => {
    const res = await certificatesService.revoke(id)
    if (res.success) {
      showToast(res.message, 'success')
      load()
    } else {
      showToast(res.message, 'error')
    }
  }

  const handleVerify = async () => {
    if (!verifyCode.trim()) return
    setVerifying(true)
    setVerifyResult(null)
    const res = await certificatesService.verify(verifyCode.trim())
    setVerifyResult(res)
    setVerifying(false)
  }

  const badgeStyle = (status) => {
    if (status === 'Generated') return { bg: dark ? 'rgba(97,95,255,0.15)' : 'rgba(97,95,255,0.1)', text: BRAND }
    if (status === 'Sent') return { bg: dark ? 'rgba(0,188,125,0.15)' : 'rgba(0,188,125,0.1)', text: '#00BC7D' }
    return { bg: dark ? 'rgba(254,154,0,0.15)' : 'rgba(254,154,0,0.1)', text: '#FE9A00' }
  }

  const skBg = dark ? '#162640' : '#e2e8f0'

  return (
    <div className="p-5 px-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold m-0 tracking-tight" style={{ color: tokens.txtPri }}>
            Certificates
          </h1>
          <p className="text-[13px] mt-1" style={{ color: tokens.txtSec }}>
            Generate and manage participation certificates
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button
            onClick={() => { setVerifyOpen(true); setVerifyResult(null); setVerifyCode('') }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-transparent transition-all duration-200"
            style={{ border: `1px solid ${tokens.border}`, color: tokens.txtSec }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.txtSec }}
          >
            <ShieldCheck size={14} /> Verify
          </button>
          <button
            onClick={() => setDesignerOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-transparent transition-all duration-200"
            style={{ border: `1px solid ${tokens.border}`, color: tokens.txtSec }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.color = '#a855f7' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.txtSec }}
          >
            <Palette size={14} /> Design Template
          </button>
          <button
            onClick={handleBulkGenerate}
            disabled={bulkLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-px disabled:opacity-70"
            style={{ background: BRAND, boxShadow: '0 4px 14px rgba(97,95,255,0.4)' }}
          >
            {bulkLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Bulk Generate
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="rounded-[18px] p-5 border flex items-center gap-4" style={cardStyle}>
              <div className="w-12 h-12 rounded-xl shrink-0" style={{ background: skBg }} />
              <div className="flex-1">
                <div className="w-16 h-7 rounded-md mb-2" style={{ background: skBg }} />
                <div className="w-24 h-3 rounded-md" style={{ background: skBg }} />
              </div>
            </div>
          ))
        ) : [
          { label: 'Total Certificates', value: stats.total.toLocaleString(), icon: Award, color: '#fff', bg: `#635BFF` },
          { label: 'Pending Generation', value: stats.pending.toLocaleString(), icon: Clock, color: '#fff', bg: '#F59E0B' },
          { label: 'Generated & Sent', value: stats.generatedSent.toLocaleString(), icon: CheckCircle2, color: '#fff', bg: '#10B981' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-[18px] p-3 border flex items-center gap-4 transition-all duration-300 cursor-default"
            style={cardStyle}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = dark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 28px rgba(0,0,0,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = tokens.shadow }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
              <Icon size={22} style={{ color }} />
            </div>
            <div>
              <p className="text-[26px] font-extrabold m-0 leading-tight tracking-tight" style={{ color: tokens.txtPri }}>{value}</p>
              <p className="text-[12px] font-medium mt-0.5" style={{ color: tokens.txtSec }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-[280px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: tokens.txtMuted }} />
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-[42px] rounded-xl text-[13px] outline-none border transition-all duration-200"
            style={{ ...inputStyle, borderColor: tokens.border, fontWeight: 500 }}
            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
            onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status tabs */}
          <div className="flex items-center rounded-xl p-1 border h-[42px]" style={{ borderColor: tokens.border, background: tokens.card }}>
            {statuses.map(st => {
              const active = activeStatus === st
              return (
                <button
                  key={st}
                  onClick={() => setActiveStatus(st)}
                  className="px-4 h-[32px] rounded-xl text-[12px] border-none cursor-pointer flex items-center transition-all duration-200"
                  style={{
                    background: active ? BRAND : 'transparent',
                    color: active ? '#fff' : tokens.txtSec,
                    fontWeight: active ? 700 : 600,
                    boxShadow: active ? '0 3px 10px rgba(97,95,255,0.3)' : 'none',
                  }}
                >{st}</button>
              )
            })}
          </div>

          {/* Event filter */}
          <div className="relative">
            <select
              value={activeEvent}
              onChange={e => setActiveEvent(e.target.value)}
              className="pl-4 pr-9 h-[42px] rounded-full text-[12.5px] outline-none cursor-pointer border appearance-none font-bold"
              style={{ background: tokens.card, borderColor: tokens.border, color: tokens.txtPri }}
            >
              {events.map(ev => <option key={ev} value={ev}>{ev}</option>)}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: tokens.txtSec }}>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1.5L5 4.5L9 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>

          {/* Bulk actions */}
          {selected.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold" style={{ color: tokens.txtSec }}>{selected.length} selected</span>
              <button
                onClick={() => handleGenerate(selected.filter(id => certs.find(c => c.id === id)?.status === 'Pending'))}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold border-none cursor-pointer text-white"
                style={{ background: BRAND }}
              >Generate</button>
              <button
                onClick={() => handleSend(selected.filter(id => certs.find(c => c.id === id)?.status === 'Generated'))}
                disabled={sendLoading}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold border-none cursor-pointer text-white"
                style={{ background: '#00BC7D' }}
              >{sendLoading ? '...' : 'Send'}</button>
              <button
                onClick={() => setSelected([])}
                className="w-7 h-7 rounded-lg border-none bg-transparent cursor-pointer flex items-center justify-center"
                style={{ color: tokens.txtSec }}
              ><X size={13} /></button>
            </div>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                <th className="px-5 py-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 cursor-pointer accent-brand"
                  />
                </th>
                {['STUDENT', 'EVENT', 'ISSUED DATE', 'VERIFY CODE', 'STATUS', 'ACTIONS'].map(h => (
                  <th key={h} className="px-5 py-4 text-[11px] font-bold tracking-wider" style={{ color: tokens.txtSec }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} style={{ borderBottom: `1px solid ${tokens.border}` }}>
                    <td className="px-5 py-4"><div className="w-4 h-4 rounded" style={{ background: skBg }} /></td>
                    <td className="px-5 py-4"><div className="w-28 h-3.5 rounded" style={{ background: skBg }} /></td>
                    <td className="px-5 py-4"><div className="w-32 h-3.5 rounded" style={{ background: skBg }} /></td>
                    <td className="px-5 py-4"><div className="w-20 h-3.5 rounded" style={{ background: skBg }} /></td>
                    <td className="px-5 py-4"><div className="w-28 h-3.5 rounded" style={{ background: skBg }} /></td>
                    <td className="px-5 py-4"><div className="w-16 h-5 rounded-full" style={{ background: skBg }} /></td>
                    <td className="px-5 py-4"><div className="w-20 h-7 rounded ml-auto" style={{ background: skBg }} /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center">
                    <Award size={40} className="block mx-auto mb-3" style={{ color: tokens.txtMuted }} />
                    <p className="text-[14px] font-medium" style={{ color: tokens.txtSec }}>No certificates found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((cert, i) => {
                  const badge = badgeStyle(cert.status)
                  const isSelected = selected.includes(cert.id)
                  return (
                    <tr
                      key={cert.id}
                      className="transition-colors duration-150"
                      style={{
                        borderBottom: i < filtered.length - 1 ? `1px solid ${tokens.border}` : 'none',
                        background: isSelected ? `${BRAND}08` : 'transparent',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = tokens.hoverBg }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                    >
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(cert.id)}
                          className="w-4 h-4 cursor-pointer accent-brand"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[13.5px] font-bold" style={{ color: tokens.txtPri }}>{cert.studentName}</div>
                        <div className="text-[11px] mt-0.5 font-medium" style={{ color: tokens.txtSec }}>{cert.rollNo} · {cert.department}</div>
                      </td>
                      <td className="px-5 py-4 text-[13px]" style={{ color: BRAND }}>{cert.eventName}</td>
                      <td className="px-5 py-4 text-[13px]" style={{ color: tokens.txtSec }}>{cert.issuedDate}</td>
                      <td className="px-5 py-4 text-[13px] font-mono font-semibold" style={{ color: BRAND }}>{cert.verifyCode}</td>
                      <td className="px-5 py-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                          style={{ background: badge.bg, color: badge.text }}
                        >{cert.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {cert.status === 'Pending' && (
                            <button
                              onClick={() => handleGenerate([cert.id])}
                              title="Generate Certificate"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-all duration-150 text-white"
                              style={{ background: BRAND }}
                            ><Zap size={11} /> Generate</button>
                          )}
                          {cert.status === 'Generated' && (
                            <button
                              onClick={() => handleSend([cert.id])}
                              title="Send via Email"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-all duration-150 text-white"
                              style={{ background: '#00BC7D' }}
                            ><Send size={11} /> Send</button>
                          )}
                          {cert.status === 'Sent' && (
                            <button
                              onClick={() => handleRevoke(cert.id)}
                              title="Revoke Certificate"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-all duration-150"
                              style={{ border: `1px solid ${tokens.border}`, color: tokens.txtSec, background: 'transparent' }}
                            ><RotateCcw size={11} /> Revoke</button>
                          )}
                          <button
                            onClick={() => setPreviewCert(cert)}
                            title="Preview Certificate"
                            className="w-[28px] h-[28px] rounded-lg border bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
                            style={{ borderColor: tokens.border, color: tokens.txtSec }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.txtSec }}
                          ><Eye size={12} /></button>
                          <button
                            title="Download"
                            className="w-[28px] h-[28px] rounded-lg border bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
                            style={{ borderColor: tokens.border, color: tokens.txtSec }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.txtSec }}
                          ><Download size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${tokens.border}` }}>
            <span className="text-[12px] font-medium" style={{ color: tokens.txtSec }}>
              Showing {filtered.length} of {certs.length} certificates
            </span>
            <button
              onClick={load}
              className="flex items-center gap-1.5 text-[12px] font-semibold bg-transparent border-none cursor-pointer transition-all duration-150"
              style={{ color: tokens.txtSec }}
              onMouseEnter={e => e.currentTarget.style.color = BRAND}
              onMouseLeave={e => e.currentTarget.style.color = tokens.txtSec}
            ><RefreshCw size={12} /> Refresh</button>
          </div>
        )}
      </div>

      {/* ── Certificate Preview Modal ── */}
      {previewCert && createPortal(
        <div
          className="fixed inset-0 z-100 bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={e => { if (e.target === e.currentTarget) setPreviewCert(null) }}
        >
          <div
            className="rounded-[20px] w-full max-w-[500px] overflow-hidden"
            style={{
              background: dark ? '#0c1829' : '#ffffff',
              border: `1px solid ${tokens.border}`,
              boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
              animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${tokens.border}` }}>
              <h2 className="text-[16px] font-extrabold m-0" style={{ color: tokens.txtPri }}>Certificate Preview</h2>
              <button
                onClick={() => setPreviewCert(null)}
                className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
                style={{ color: tokens.txtSec }}
                onMouseEnter={e => { e.currentTarget.style.background = tokens.hoverBg }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              ><X size={17} /></button>
            </div>

            {/* Certificate Card */}
            <div className="p-5">
              <div
                className="rounded-2xl p-8 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #1a1060 0%, #0f0a45 40%, #1a0f60 70%, #0a0838 100%)',
                  minHeight: 280,
                }}
              >
                {/* Decorative blobs */}
                <div className="absolute top-[-40px] left-[-40px] w-[200px] h-[200px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #615FFF 0%, transparent 70%)' }} />
                <div className="absolute bottom-[-60px] right-[-40px] w-[220px] h-[220px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #00BC7D 0%, transparent 70%)' }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center gap-2">
                  {/* Logo */}
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-1" style={{ background: BRAND, boxShadow: '0 0 24px rgba(97,95,255,0.6)' }}>
                    <GraduationCap size={26} color="#fff" />
                  </div>

                  <p className="text-[10px] font-bold tracking-[3px] uppercase text-white/60 m-0">State University</p>

                  <h3 className="text-[22px] font-extrabold text-white m-0 leading-tight">Certificate of Participation</h3>

                  <div className="w-16 h-[2px] rounded-full my-1" style={{ background: BRAND }} />

                  <p className="text-[12px] text-white/60 m-0">This is to certify that</p>

                  <p className="text-[24px] font-extrabold text-white m-0 tracking-tight">{previewCert.studentName}</p>

                  <p className="text-[12px] text-white/60 m-0">has successfully participated in</p>

                  <p className="text-[17px] font-extrabold m-0" style={{ color: '#a5b4fc' }}>{previewCert.eventName}</p>

                  {/* Signature row */}
                  <div className="w-full flex justify-between items-end mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                    <div className="text-center">
                      <div className="w-20 h-px bg-white/30 mb-1" />
                      <p className="text-[10px] text-white/50 m-0">Event Organizer</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-semibold text-white/80 mb-1">{previewCert.issuedDate}</p>
                      <div className="w-20 h-px bg-white/30 mb-1" />
                      <p className="text-[10px] text-white/50 m-0">Date of Issue</p>
                    </div>
                    <div className="text-center">
                      <div className="w-20 h-px bg-white/30 mb-1" />
                      <p className="text-[10px] text-white/50 m-0">Principal / Dean</p>
                    </div>
                  </div>

                  {/* Verify URL */}
                  <p className="text-[9px] text-white/30 mt-2 m-0 font-mono">
                    Verify at: eventhub.university.edu/verify/{previewCert.verifyCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex gap-3">
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-px"
                style={{ background: BRAND, boxShadow: '0 4px 14px rgba(97,95,255,0.4)' }}
                onClick={() => showToast('PDF download started.', 'success')}
              >
                <Download size={14} /> Download PDF
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold border cursor-pointer transition-all duration-200 hover:-translate-y-px"
                style={{ borderColor: tokens.border, color: tokens.txtPri, background: 'transparent' }}
                onClick={() => {
                  navigator.clipboard.writeText(`https://eventhub.university.edu/verify/${previewCert.verifyCode}`)
                  showToast('Verify link copied!', 'success')
                }}
              >
                <Copy size={14} /> Copy Verify Link
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ── Verify Modal ── */}
      {verifyOpen && createPortal(
        <div
          className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={e => { if (e.target === e.currentTarget) setVerifyOpen(false) }}
        >
          <div
            className="rounded-[24px] w-full max-w-[440px] overflow-hidden"
            style={{
              background: dark ? '#0c1829' : '#ffffff',
              border: `1px solid ${tokens.border}`,
              boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
              animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }`}</style>
            <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: `1px solid ${tokens.border}` }}>
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={20} style={{ color: BRAND }} />
                <h2 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>Verify Certificate</h2>
              </div>
              <button
                onClick={() => setVerifyOpen(false)}
                className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
                style={{ color: tokens.txtSec }}
                onMouseEnter={e => { e.currentTarget.style.background = tokens.hoverBg }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              ><X size={17} /></button>
            </div>

            <div className="px-7 py-6 space-y-4">
              <div>
                <label className="text-[13px] font-bold block mb-2" style={{ color: tokens.txtSec }}>Enter Verify Code</label>
                <input
                  type="text"
                  placeholder="e.g. CERT-001-4706"
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none border transition-all duration-200 font-mono"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                  onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={verifying || !verifyCode.trim()}
                className="w-full py-3 rounded-xl text-[13.5px] font-bold text-white border-none cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: BRAND }}
              >
                {verifying ? <><Loader2 size={15} className="animate-spin" /> Verifying…</> : <><ShieldCheck size={15} /> Verify Certificate</>}
              </button>

              {verifyResult && (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: verifyResult.valid ? (dark ? 'rgba(0,188,125,0.1)' : '#e6fbf2') : (dark ? 'rgba(239,68,68,0.1)' : '#fef2f2'),
                    border: `1px solid ${verifyResult.valid ? '#00BC7D' : '#ef4444'}`,
                  }}
                >
                  {verifyResult.valid ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 size={16} style={{ color: '#00BC7D' }} />
                        <span className="text-[13px] font-bold" style={{ color: '#00BC7D' }}>Certificate Valid</span>
                      </div>
                      {[
                        ['Student', verifyResult.certificate.studentName],
                        ['Roll No', verifyResult.certificate.rollNo],
                        ['Event', verifyResult.certificate.eventName],
                        ['Issued', verifyResult.certificate.issuedDate],
                        ['Status', verifyResult.certificate.status],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-[12px]">
                          <span style={{ color: tokens.txtSec }}>{k}</span>
                          <span className="font-semibold" style={{ color: tokens.txtPri }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <X size={15} style={{ color: '#ef4444' }} />
                      <span className="text-[13px] font-bold" style={{ color: '#ef4444' }}>Invalid or not found</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body)}
      {/* ── Certificate Template Designer ── */}
      {designerOpen && createPortal(
        <div className="fixed inset-0 z-110 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-[24px] w-full flex overflow-hidden"
            style={{
              maxWidth: 980,
              maxHeight: '92vh',
              background: dark ? '#0c1829' : '#f8fafc',
              border: `1px solid ${tokens.border}`,
              boxShadow: '0 40px 100px rgba(0,0,0,0.55)',
              animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* ── Left Panel: Controls ── */}
            <div
              className="w-[300px] shrink-0 flex flex-col overflow-y-auto"
              style={{ background: dark ? '#0a1525' : '#ffffff', borderRight: `1px solid ${tokens.border}` }}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${tokens.border}` }}>
                <div className="flex items-center gap-2">
                  <Palette size={16} style={{ color: '#a855f7' }} />
                  <span className="text-[14px] font-extrabold" style={{ color: tokens.txtPri }}>Template Designer</span>
                </div>
                <button
                  onClick={() => setDesignerOpen(false)}
                  className="w-7 h-7 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center"
                  style={{ color: tokens.txtSec }}
                  onMouseEnter={e => e.currentTarget.style.background = tokens.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                ><X size={15} /></button>
              </div>

              <div className="flex-1 p-5 space-y-5">

                {/* Organisation Name */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: tokens.txtSec }}>Organisation Name</label>
                  <input
                    value={tmpl.org}
                    onChange={e => setTmpl(p => ({ ...p, org: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                    style={{ background: tokens.inputBg, borderColor: tokens.border, color: tokens.txtPri }}
                    onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                    onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                {/* Certificate Title */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: tokens.txtSec }}>Certificate Title</label>
                  <input
                    value={tmpl.title}
                    onChange={e => setTmpl(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                    style={{ background: tokens.inputBg, borderColor: tokens.border, color: tokens.txtPri }}
                    onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                    onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                {/* Gradient Colors */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: tokens.txtSec }}>Background Gradient</label>
                  <div className="flex gap-2">
                    {[['gradFrom', 'From'], ['gradMid', 'Mid'], ['gradTo', 'To']].map(([key, lbl]) => (
                      <div key={key} className="flex-1 text-center">
                        <input
                          type="color"
                          value={tmpl[key]}
                          onChange={e => setTmpl(p => ({ ...p, [key]: e.target.value }))}
                          className="w-full h-9 rounded-lg cursor-pointer border-none"
                          style={{ background: 'transparent' }}
                        />
                        <span className="text-[10px]" style={{ color: tokens.txtMuted }}>{lbl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: tokens.txtSec }}>Accent / Logo Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={tmpl.accentColor}
                      onChange={e => setTmpl(p => ({ ...p, accentColor: e.target.value }))}
                      className="w-10 h-10 rounded-xl cursor-pointer border-none shrink-0"
                    />
                    <div className="flex flex-wrap gap-2">
                      {['#615FFF', '#00BC7D', '#FE9A00', '#ef4444', '#0284c7', '#a855f7'].map(c => (
                        <button
                          key={c}
                          onClick={() => setTmpl(p => ({ ...p, accentColor: c }))}
                          className="w-6 h-6 rounded-full border-2 cursor-pointer transition-transform hover:scale-110"
                          style={{
                            background: c,
                            borderColor: tmpl.accentColor === c ? '#fff' : 'transparent',
                            boxShadow: tmpl.accentColor === c ? `0 0 0 2px ${c}` : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Border Style */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: tokens.txtSec }}>Border Style</label>
                  <div className="flex gap-2">
                    {['none', 'thin', 'thick', 'double'].map(b => (
                      <button
                        key={b}
                        onClick={() => setTmpl(p => ({ ...p, borderStyle: b }))}
                        className="flex-1 py-2 rounded-xl text-[11px] font-bold border cursor-pointer capitalize transition-all"
                        style={{
                          background: tmpl.borderStyle === b ? `${BRAND}18` : 'transparent',
                          borderColor: tmpl.borderStyle === b ? BRAND : tokens.border,
                          color: tmpl.borderStyle === b ? BRAND : tokens.txtSec,
                        }}
                      >{b}</button>
                    ))}
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: tokens.txtSec }}>Font Family</label>
                  <div className="relative">
                    <select
                      value={tmpl.fontFamily}
                      onChange={e => setTmpl(p => ({ ...p, fontFamily: e.target.value }))}
                      className="w-full pl-3 pr-8 py-2.5 rounded-xl text-[13px] outline-none border appearance-none cursor-pointer"
                      style={{ background: tokens.inputBg, borderColor: tokens.border, color: tokens.txtPri }}
                    >
                      {[
                        ['Manrope, sans-serif', 'Manrope'],
                        ['Georgia, serif', 'Georgia'],
                        ['Times New Roman, serif', 'Times New Roman'],
                        ['Trebuchet MS, sans-serif', 'Trebuchet MS'],
                        ['Palatino, serif', 'Palatino'],
                      ].map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: tokens.txtSec }}>
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1.5L5 4.5L9 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: tokens.txtSec }}>Options</label>
                  {[['showLogo', 'Show Logo'], ['showSignatures', 'Show Signatures']].map(([key, lbl]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-[13px] font-medium" style={{ color: tokens.txtPri }}>{lbl}</span>
                      <button
                        onClick={() => setTmpl(p => ({ ...p, [key]: !p[key] }))}
                        className="w-11 h-6 rounded-full transition-all duration-200 relative cursor-pointer border-none"
                        style={{ background: tmpl[key] ? BRAND : (dark ? '#1a3050' : '#cbd5e1') }}
                      >
                        <div
                          className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200"
                          style={{ left: tmpl[key] ? '26px' : '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="p-5" style={{ borderTop: `1px solid ${tokens.border}` }}>
                <button
                  onClick={() => {
                    setTmpl(p => ({ ...p, templateSaved: true }))
                    showToast('Certificate template saved!', 'success')
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-px"
                  style={{ background: tmpl.templateSaved ? '#00BC7D' : BRAND, boxShadow: `0 4px 14px ${tmpl.templateSaved ? 'rgba(0,188,125,0.4)' : 'rgba(97,95,255,0.4)'}` }}
                >
                  {tmpl.templateSaved ? <><Check size={14} /> Template Saved</> : <><Save size={14} /> Save Template</>}
                </button>
              </div>
            </div>

            {/* ── Right Panel: Live Preview ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${tokens.border}` }}>
                <span className="text-[13px] font-bold" style={{ color: tokens.txtSec }}>Live Preview</span>
                <span className="text-[11px] px-2.5 py-1 rounded-full font-bold" style={{ background: `${BRAND}15`, color: BRAND }}>Preview Mode</span>
              </div>

              <div className="flex-1 flex items-center justify-center p-8 overflow-auto" style={{ background: dark ? '#060e1c' : '#f1f5f9' }}>
                {/* Certificate Preview */}
                <div
                  className="rounded-2xl p-10 relative overflow-hidden w-full"
                  style={{
                    maxWidth: 560,
                    minHeight: 360,
                    background: `linear-gradient(135deg, ${tmpl.gradFrom} 0%, ${tmpl.gradMid} 45%, ${tmpl.gradTo} 100%)`,
                    fontFamily: tmpl.fontFamily,
                    outline: tmpl.borderStyle === 'none' ? 'none'
                      : tmpl.borderStyle === 'thin' ? `1px solid ${tmpl.accentColor}`
                      : tmpl.borderStyle === 'thick' ? `3px solid ${tmpl.accentColor}`
                      : `4px double ${tmpl.accentColor}`,
                    outlineOffset: '6px',
                  }}
                >
                  {/* Blobs */}
                  <div className="absolute top-[-50px] left-[-50px] w-[240px] h-[240px] rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${tmpl.accentColor} 0%, transparent 70%)` }} />
                  <div className="absolute bottom-[-70px] right-[-50px] w-[260px] h-[260px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #00BC7D 0%, transparent 70%)' }} />

                  <div className="relative z-10 flex flex-col items-center text-center gap-2.5">
                    {tmpl.showLogo && (
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-1"
                        style={{ background: tmpl.accentColor, boxShadow: `0 0 28px ${tmpl.accentColor}60` }}
                      >
                        <GraduationCap size={30} color="#fff" />
                      </div>
                    )}

                    <p className="text-[9px] font-bold tracking-[4px] uppercase m-0" style={{ color: 'rgba(255,255,255,0.55)' }}>{tmpl.org}</p>

                    <h2 className="text-[24px] font-extrabold text-white m-0 leading-tight">{tmpl.title}</h2>

                    <div className="w-14 h-[2px] rounded-full" style={{ background: tmpl.accentColor }} />

                    <p className="text-[12px] m-0" style={{ color: 'rgba(255,255,255,0.6)' }}>{tmpl.subtitle}</p>

                    <p className="text-[26px] font-extrabold text-white m-0 tracking-tight">Student Name</p>

                    <p className="text-[12px] m-0" style={{ color: 'rgba(255,255,255,0.6)' }}>{tmpl.body}</p>

                    <p className="text-[18px] font-extrabold m-0" style={{ color: `${tmpl.accentColor}cc` || '#a5b4fc' }}>Event Name</p>

                    {tmpl.showSignatures && (
                      <div className="w-full flex justify-between items-end mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                        <div className="text-center">
                          <div className="w-20 h-px mb-1" style={{ background: 'rgba(255,255,255,0.25)' }} />
                          <p className="text-[9px] m-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Event Organizer</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>DD MMM YYYY</p>
                          <div className="w-20 h-px mb-1" style={{ background: 'rgba(255,255,255,0.25)' }} />
                          <p className="text-[9px] m-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Date of Issue</p>
                        </div>
                        <div className="text-center">
                          <div className="w-20 h-px mb-1" style={{ background: 'rgba(255,255,255,0.25)' }} />
                          <p className="text-[9px] m-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Principal / Dean</p>
                        </div>
                      </div>
                    )}

                    <p className="text-[8px] m-0 font-mono mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      Verify at: {tmpl.footer}/CERT-XXX-XXXX
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
