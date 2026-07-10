import { useState, useEffect } from 'react'
import {
  Award, ShieldCheck, Palette, Zap, Loader2
} from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../data/dashboardData'
import certificatesService from '../../services/certificatesService'
import { useToast } from '../../context/ToastContext'

// Sub-components
import CertificateStats from '../../components/admin/adminCertificate/CertificateStats'
import CertificateFilters from '../../components/admin/adminCertificate/CertificateFilters'
import CertificateTable from '../../components/admin/adminCertificate/CertificateTable'
import CertPreviewModal from '../../components/admin/adminCertificate/CertPreviewModal'
import CertVerifyModal from '../../components/admin/adminCertificate/CertVerifyModal'
import CertDesignerModal from '../../components/admin/adminCertificate/CertDesignerModal'

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
    if (!ids || ids.length === 0) return
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
    if (!ids || ids.length === 0) return
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
            style={{ background: BRAND, boxShadow: `0 4px 14px ${BRAND}40` }}
          >
            {bulkLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Bulk Generate
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <CertificateStats
        loading={loading}
        stats={stats}
        cardStyle={cardStyle}
        skBg={skBg}
        dark={dark}
        tokens={tokens}
      />

      {/* ── Filters & Search ── */}
      <CertificateFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeStatus={activeStatus}
        setActiveStatus={setActiveStatus}
        activeEvent={activeEvent}
        setActiveEvent={setActiveEvent}
        statuses={statuses}
        events={events}
        selected={selected}
        setSelected={setSelected}
        certs={certs}
        handleGenerate={handleGenerate}
        handleSend={handleSend}
        sendLoading={sendLoading}
        inputStyle={inputStyle}
        tokens={tokens}
        BRAND={BRAND}
      />

      {/* ── Table ── */}
      <CertificateTable
        loading={loading}
        filtered={filtered}
        certs={certs}
        selected={selected}
        allSelected={allSelected}
        toggleSelect={toggleSelect}
        toggleAll={toggleAll}
        handleGenerate={handleGenerate}
        handleSend={handleSend}
        handleRevoke={handleRevoke}
        setPreviewCert={setPreviewCert}
        load={load}
        badgeStyle={badgeStyle}
        tokens={tokens}
        BRAND={BRAND}
        skBg={skBg}
      />

      {/* ── Certificate Preview Modal ── */}
      <CertPreviewModal
        previewCert={previewCert}
        setPreviewCert={setPreviewCert}
        tokens={tokens}
        dark={dark}
        BRAND={BRAND}
        showToast={showToast}
      />

      {/* ── Verify Modal ── */}
      <CertVerifyModal
        verifyOpen={verifyOpen}
        setVerifyOpen={setVerifyOpen}
        verifyCode={verifyCode}
        setVerifyCode={setVerifyCode}
        verifyResult={verifyResult}
        setVerifyResult={setVerifyResult}
        verifying={verifying}
        handleVerify={handleVerify}
        tokens={tokens}
        dark={dark}
        BRAND={BRAND}
        inputStyle={inputStyle}
      />

      {/* ── Certificate Template Designer ── */}
      <CertDesignerModal
        designerOpen={designerOpen}
        setDesignerOpen={setDesignerOpen}
        tmpl={tmpl}
        setTmpl={setTmpl}
        tokens={tokens}
        dark={dark}
        BRAND={BRAND}
        showToast={showToast}
      />
    </div>
  )
}
