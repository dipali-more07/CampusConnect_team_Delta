import { useState, useEffect, useRef } from 'react'
import {
  Award, ShieldCheck, Palette, Zap, Loader2
} from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../data/dashboardData'
import certificatesService from '../../services/certificatesService'
import registrationsService from '../../services/registrationsService'
import eventsService from '../../services/eventsService'
import studentsService from '../../services/studentsService'
import resultsService from '../../services/resultsService'
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
  const [eventResults, setEventResults] = useState([])
  const [optimisticGenerated, setOptimisticGenerated] = useState(() => {
    try {
      const saved = localStorage.getItem('cc_generated_certs')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })
  const [regsLoaded, setRegsLoaded] = useState(false)
  const [regsLoading, setRegsLoading] = useState(false)
  const initialLoadDone = useRef(false)

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
  const [generatingId, setGeneratingId] = useState(null)
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
      const evs = eventRes.events || []
      setAllEvents(evs)
      if (!initialLoadDone.current && evs.length > 0) {
        const sorted = [...evs].sort((a, b) => {
          const dA = new Date(a.date || a.start_time || a.created_at || 0)
          const dB = new Date(b.date || b.start_time || b.created_at || 0)
          return dB - dA
        })
        setActiveEvent(sorted[0].name)
        initialLoadDone.current = true
      }
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
        const [regRes, stuRes, resRes] = await Promise.all([
          eventsService.fetchRegistrations(selectedEvId),
          studentsService.fetchAll(),
          resultsService.fetchByEventId(selectedEvId)
        ])
        if (regRes.success) setRegistrations(regRes.registrations || [])
        if (stuRes.success) setStudents(stuRes.students || [])
        if (resRes?.success) setEventResults(resRes.results || resRes.data || [])
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
    displayList = certs.map(c => {
      const ev = allEvents.find(e => String(e.id || e.event_id) === String(c.eventId || c.event_id))
      return { ...c, organizerName: ev?.organizer || 'Event Organizer', venue: ev?.venue, eventDate: ev?.date }
    })
  } else {
    const selectedEv = allEvents.find(e => e.name === activeEvent)
    const selectedEvId = selectedEv?.id || selectedEv?.event_id
    const orgName = selectedEv?.organizer || 'Event Organizer'
    const venueName = selectedEv?.venue || 'Event Venue'
    const eventDate = selectedEv?.date || ''

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

      const matchedResult = eventResults.find(r => 
        (r.participantId && String(r.participantId) === String(resolvedUserId)) ||
        (r.user_id && String(r.user_id) === String(resolvedUserId)) ||
        (r.roll_no && String(r.roll_no) === String(regRollNo)) ||
        (r.rollNo && String(r.rollNo) === String(regRollNo))
      )
      
      let computedPosition = 'Participation'
      if (matchedResult) {
        if (matchedResult.rank === 1 || matchedResult.resultTitle?.includes('1st')) computedPosition = 'Winner (1st Place)'
        else if (matchedResult.rank === 2 || matchedResult.resultTitle?.includes('2nd')) computedPosition = 'Runner Up (2nd Place)'
        else if (matchedResult.rank === 3 || matchedResult.resultTitle?.includes('3rd')) computedPosition = 'Runner Up (3rd Place)'
        else computedPosition = matchedResult.resultTitle || 'Participation'
      }

      if (matchingCert) {
        displayList.push({
          ...matchingCert,
          studentName: regStudentName || matchingCert.studentName,
          rollNo: regRollNo || matchingCert.rollNo,
          eventId: regEventId,
          eventName: activeEvent,
          userId: regUserId,
          organizerName: orgName,
          venue: venueName,
          eventDate: eventDate,
          position: matchingCert.position || computedPosition
        })
      } else {
        const dept = reg.department || student?.department || 'N/A'
        const yr = reg.course || reg.year || student?.year || 'N/A'
        const email = reg.email || student?.email || ''

        const optKey1 = `${regEventId}-${regUserId}`
        const optKey2 = `${regEventId}-${regRollNo}`
        const optKey3 = `${regEventId}-${regStudentName}`
        const isGen = optimisticGenerated.has(optKey1) ||
                      optimisticGenerated.has(optKey2) ||
                      optimisticGenerated.has(optKey3) ||
                      optimisticGenerated.has(String(reg.id)) ||
                      optimisticGenerated.has(String(reg.registration_id))

        displayList.push({
          id: `VIRT-${reg.id || reg.registration_id || Math.random()}`,
          studentName: regStudentName,
          rollNo: regRollNo,
          department: dept,
          year: yr,
          eventId: regEventId,
          eventName: activeEvent,
          issuedDate: isGen ? new Date().toISOString().split('T')[0] : 'N/A',
          verifyCode: 'N/A',
          status: isGen ? 'Generated' : 'Pending',
          email: email,
          userId: regUserId,
          organizerName: orgName,
          venue: venueName,
          eventDate: eventDate,
          position: computedPosition
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
      showToast(res.message || 'Bulk generation completed.', 'success')
      setOptimisticGenerated(prev => {
        const next = new Set(prev)
        registrations.forEach(reg => {
          const uId = reg.user_id || reg.student_id || reg.userId || reg.id
          if (eventId && uId) next.add(`${eventId}-${uId}`)
          if (eventId && reg.rollNo) next.add(`${eventId}-${reg.rollNo}`)
          if (eventId && (reg.studentName || reg.name)) next.add(`${eventId}-${reg.studentName || reg.name}`)
          if (reg.id) next.add(String(reg.id))
        })
        try {
          localStorage.setItem('cc_generated_certs', JSON.stringify([...next]))
        } catch {}
        return next
      })
      setSelected([])
      setRefreshTrigger(prev => prev + 1)
      await load()
    } else {
      showToast(res.message || 'Failed to bulk generate.', 'error')
    }
    setBulkLoading(false)
  }

  const handleGenerate = async (target) => {
    if (!target) return
    
    let listToGen = []
    let genKey = null
    if (Array.isArray(target)) {
      // It's an array of certificate IDs (bulk selection)
      genKey = 'bulk'
      listToGen = target.map(id => {
        const cert = displayList.find(c => c.id === id)
        return {
          id: cert.id,
          eventId: cert.eventId || cert.event_id,
          userId: cert.userId || cert.user_id || cert.rollNo || cert.id,
          studentName: cert.studentName,
          rollNo: cert.rollNo,
          eventName: cert.eventName,
          position: cert.position,
          venue: cert.venue,
          organizerName: cert.organizerName
        }
      })
    } else {
      // It's a single certificate object
      genKey = target.id
      listToGen = [{
        id: target.id,
        eventId: target.eventId || target.event_id,
        userId: target.userId || target.user_id || target.rollNo || target.id,
        studentName: target.studentName,
        rollNo: target.rollNo,
        eventName: target.eventName,
        position: target.position,
        venue: target.venue,
        organizerName: target.organizerName
      }]
    }

    if (listToGen.length === 0) return

    setGeneratingId(genKey)
    try {
      let res = await certificatesService.generate(listToGen)

      if (res.success) {
        showToast(res.message || 'Certificate(s) generated successfully.', 'success')
        
        setOptimisticGenerated(prev => {
          const next = new Set(prev)
          listToGen.forEach(item => {
            if (item.eventId && item.userId) next.add(`${item.eventId}-${item.userId}`)
            if (item.eventId && item.rollNo) next.add(`${item.eventId}-${item.rollNo}`)
            if (item.eventId && item.studentName) next.add(`${item.eventId}-${item.studentName}`)
            if (item.id) next.add(String(item.id))
          })
          try {
            localStorage.setItem('cc_generated_certs', JSON.stringify([...next]))
          } catch {}
          return next
        })

        setSelected([])
        setRefreshTrigger(prev => prev + 1)
        await load()
      } else {
        showToast(res.message || 'Failed to generate certificate(s).', 'error')
      }
    } catch {
      showToast('Failed to generate certificate(s).', 'error')
    } finally {
      setGeneratingId(null)
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
            onClick={() => setBulkGenerateOpen(true)}
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
        generatingId={generatingId}
        sendLoading={sendLoading}
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
        tmpl={tmpl}
        allEvents={allEvents}
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
