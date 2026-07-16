import { useState, useEffect } from 'react'
import {
  Award, ShieldCheck, Palette, Zap, Loader2
} from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../data/dashboardData'
import certificatesService from '../../services/certificatesService'
import registrationsService from '../../services/registrationsService'
import eventsService from '../../services/eventsService'
import studentsService from '../../services/studentsService'
import { useToast } from '../../context/ToastContext'

// Sub-components
import CertificateStats from '../../components/admin/adminCertificate/CertificateStats'
import CertificateFilters from '../../components/admin/adminCertificate/CertificateFilters'
import CertificateTable from '../../components/admin/adminCertificate/CertificateTable'
import CertPreviewModal from '../../components/admin/adminCertificate/CertPreviewModal'
import CertVerifyModal from '../../components/admin/adminCertificate/CertVerifyModal'
import CertDesignerModal from '../../components/admin/adminCertificate/CertDesignerModal'
import CertBulkGenerateModal from '../../components/admin/adminCertificate/CertBulkGenerateModal'

export default function CertificatesPage({ tokens }) {
  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND
  const showToast = useToast()

  const [certs, setCerts] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [students, setStudents] = useState([])
  const [regsLoaded, setRegsLoaded] = useState(false)
  const [regsLoading, setRegsLoading] = useState(false)

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
  const [bulkGenerateOpen, setBulkGenerateOpen] = useState(false)
  const [tmpl, setTmpl] = useState({
    org: 'State University',
    title: 'Certificate of Participation',
    subtitle: 'This is to certify that',
    body: 'has successfully participated in',
    footer: 'campusconnect.university.edu/verify',
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

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const load = async () => {
    setLoading(true)
    const [certRes, eventRes, tmplRes] = await Promise.all([
      certificatesService.fetchAll(),
      eventsService.fetchAll(),
      certificatesService.fetchTemplates()
    ])

    if (certRes.success) {
      setCerts(certRes.certificates || [])
      
      // Initial stats
      const total = certRes.certificates?.length || 0
      const pending = certRes.certificates?.filter(c => c.status === 'Pending').length || 0
      const generatedSent = certRes.certificates?.filter(c => c.status === 'Generated' || c.status === 'Sent').length || 0
      setStats({ total, pending, generatedSent })
    }
    if (eventRes.success) {
      setAllEvents(eventRes.events || [])
    }
    if (tmplRes?.success && tmplRes.templates?.length > 0) {
      const activeTmpl = tmplRes.templates.find(t => t.is_active) || tmplRes.templates[0]
      if (activeTmpl) {
        setTmpl({
          org: activeTmpl.organisation_name || 'State University',
          title: activeTmpl.certificate_title || 'Certificate of Participation',
          subtitle: 'This is to certify that',
          body: 'has successfully participated in',
          footer: 'campusconnect.university.edu/verify',
          gradFrom: activeTmpl.background_gradient_from || activeTmpl.background_image || '#1a1060',
          gradMid: activeTmpl.background_gradient_mid || '#0f0a45',
          gradTo: activeTmpl.background_gradient_to || '#0a0838',
          accentColor: activeTmpl.accent_color || activeTmpl.font_color || '#615FFF',
          borderStyle: activeTmpl.border_style || 'none',
          fontFamily: activeTmpl.font_family || 'Manrope, sans-serif',
          showLogo: activeTmpl.show_logo !== undefined ? activeTmpl.show_logo : true,
          showSignatures: activeTmpl.show_signatures !== undefined ? activeTmpl.show_signatures : true,
          templateSaved: true
        })
      }
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Load registrations on demand when activeEvent is not 'All'
  useEffect(() => {
    if (activeEvent === 'All') {
      setRegistrations([])
      return
    }

    const loadRegs = async () => {
      setRegsLoading(true)
      const selectedEv = allEvents.find(e => e.name === activeEvent)
      const selectedEvId = selectedEv?.id || selectedEv?.event_id
      if (selectedEvId) {
        const [regRes, stuRes] = await Promise.all([
          eventsService.fetchRegistrations(selectedEvId),
          studentsService.fetchAll()
        ])
        if (regRes.success) setRegistrations(regRes.registrations || [])
        if (stuRes.success) setStudents(stuRes.students || [])
      }
      setRegsLoading(false)
    }
    loadRegs()
  }, [activeEvent, allEvents, refreshTrigger])

  const statuses = ['All', 'Pending', 'Generated', 'Sent']
  const events = ['All', ...allEvents.map(e => e.name)]

  // Construct displayList dynamically based on activeEvent
  let displayList = []

  if (activeEvent === 'All') {
    displayList = [...certs]
  } else {
    const selectedEv = allEvents.find(e => e.name === activeEvent)
    const selectedEvId = selectedEv?.id || selectedEv?.event_id

    registrations.forEach(reg => {
      const regEventId = reg.eventId || reg.event_id || selectedEvId
      const resolvedUserId = reg.user_id || reg.student_id || reg.userId || reg.studentId || reg.rollNo || reg.id
      const student = students.find(s => String(s.id) === String(resolvedUserId) || String(s.rollNo) === String(resolvedUserId))
      
      const regStudentName = reg.full_name || reg.name || reg.studentName || reg.student_name || student?.name || 'Unknown Student'
      const regRollNo = reg.college_id || reg.roll_no || reg.rollNo || student?.rollNo || 'N/A'
      const regUserId = resolvedUserId

      // Check if there is already a certificate in certs
      const matchingCert = certs.find(c => {
        const certEventId = c.eventId || c.event_id
        const matchEvent = String(certEventId) === String(regEventId)
        const matchUser = (c.userId && String(c.userId) === String(regUserId)) ||
                          (c.user_id && String(c.user_id) === String(regUserId)) ||
                          (c.rollNo && String(c.rollNo) === String(regRollNo)) ||
                          (c.studentName && c.studentName.toLowerCase() === regStudentName.toLowerCase())
        return matchEvent && matchUser
      })

      if (matchingCert) {
        displayList.push({
          ...matchingCert,
          studentName: regStudentName || matchingCert.studentName,
          rollNo: regRollNo || matchingCert.rollNo,
          eventId: regEventId,
          eventName: activeEvent,
          userId: regUserId
        })
      } else {
        const dept = reg.department || student?.department || 'N/A'
        const yr = reg.course || reg.year || student?.year || 'N/A'
        const email = reg.email || student?.email || ''

        displayList.push({
          id: `VIRT-${reg.id || reg.registration_id || Math.random()}`,
          studentName: regStudentName,
          rollNo: regRollNo,
          department: dept,
          year: yr,
          eventId: regEventId,
          eventName: activeEvent,
          issuedDate: 'N/A',
          verifyCode: 'N/A',
          status: 'Pending',
          email: email,
          userId: regUserId
        })
      }
    })
  }

  // Update dynamic stats based on displayList (for selected event or all certs)
  useEffect(() => {
    const total = displayList.length
    const pending = displayList.filter(c => c.status === 'Pending').length
    const generatedSent = displayList.filter(c => c.status === 'Generated' || c.status === 'Sent').length
    setStats({ total, pending, generatedSent })
  }, [displayList.length, activeEvent])

  const filtered = displayList.filter(c => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q ||
      c.studentName.toLowerCase().includes(q) ||
      c.rollNo.toLowerCase().includes(q) ||
      c.verifyCode.toLowerCase().includes(q) ||
      c.eventName.toLowerCase().includes(q)
    const matchStatus = activeStatus === 'All' || c.status === activeStatus
    // We already filtered by event if activeEvent !== 'All'
    const matchEvent = activeEvent === 'All' || c.eventName === activeEvent || String(c.eventId || c.event_id) === String(allEvents.find(e => e.name === activeEvent)?.id)
    return matchSearch && matchStatus && matchEvent
  })

  const allSelected = filtered.length > 0 && filtered.every(c => selected.includes(c.id))

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const toggleAll = () =>
    setSelected(allSelected ? [] : filtered.map(c => c.id))

  const handleBulkGenerate = async (eventId) => {
    setBulkLoading(true)
    const res = await certificatesService.bulkGenerate(eventId)
    if (res.success) {
      showToast(res.message, 'success')
      setSelected([])
      setRefreshTrigger(prev => prev + 1)
      load()
    } else {
      showToast(res.message, 'error')
    }
    setBulkLoading(false)
  }

  const handleGenerate = async (target) => {
    if (!target) return
    
    let listToGen = []
    if (Array.isArray(target)) {
      // It's an array of certificate IDs (bulk selection)
      listToGen = target.map(id => {
        const cert = displayList.find(c => c.id === id)
        return {
          id: cert.id,
          eventId: cert.eventId || cert.event_id,
          userId: cert.userId || cert.user_id || cert.rollNo || cert.id
        }
      })
    } else {
      // It's a single certificate object
      listToGen = [{
        id: target.id,
        eventId: target.eventId || target.event_id,
        userId: target.userId || target.user_id || target.rollNo || target.id
      }]
    }

    if (listToGen.length === 0) return

    let res
    if (listToGen.length === 1) {
      res = await certificatesService.generate(listToGen[0].eventId, listToGen[0].userId)
    } else {
      res = await certificatesService.generate(listToGen)
    }

    if (res.success) {
      showToast(res.message || 'Certificate(s) generated successfully.', 'success')
      setSelected([])
      setRefreshTrigger(prev => prev + 1)
      load()
    } else {
      showToast(res.message || 'Failed to generate certificate(s).', 'error')
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
            onClick={() => setBulkGenerateOpen(true)}
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

      {/* ── Bulk Generate Modal ── */}
      <CertBulkGenerateModal
        open={bulkGenerateOpen}
        onClose={() => setBulkGenerateOpen(false)}
        onConfirm={handleBulkGenerate}
        certs={certs}
        tokens={tokens}
        dark={dark}
        BRAND={BRAND}
        inputStyle={inputStyle}
      />
    </div>
  )
}
