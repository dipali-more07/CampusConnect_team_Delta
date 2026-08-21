import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Award, Download, ExternalLink, ShieldCheck, Loader2, Users, Trophy, Medal } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import studentService from '../../services/studentService'
import certificatesService from '../../services/certificatesService'
import { downloadCertificatePDF, renderCertificateCanvas } from '../../utils/pdfGenerator'

function WinnerRosetteMedal({ rank = 1, size = 56 }) {
  const isRank1 = rank === 1
  const isRank2 = rank === 2

  const gradId = `medal-grad-${rank}`
  const rimGradId = `medal-rim-${rank}`
  const ribGradId = `ribbon-grad-${rank}`

  const primaryGold = isRank1 ? '#f59e0b' : isRank2 ? '#94a3b8' : '#ea580c'
  const lightGold = isRank1 ? '#fef08a' : isRank2 ? '#f8fafc' : '#fed7aa'
  const darkGold = isRank1 ? '#92400e' : isRank2 ? '#475569' : '#9a3412'
  const ribbonColor1 = isRank1 ? '#ef4444' : isRank2 ? '#3b82f6' : '#d97706'
  const ribbonColor2 = isRank1 ? '#991b1b' : isRank2 ? '#1e3a8a' : '#78350f'

  return (
    <div
      className="absolute -top-3.5 -right-3.5 pointer-events-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)] select-none z-20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
      style={{ width: `${size}px`, height: `${size * 1.35}px` }}
      title={isRank1 ? '1st Place Winner' : isRank2 ? '2nd Place Runner-Up' : '3rd Place Runner-Up'}
    >
      <svg
        viewBox="0 0 100 135"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={gradId} cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor={lightGold} />
            <stop offset="45%" stopColor={primaryGold} />
            <stop offset="85%" stopColor={darkGold} />
            <stop offset="100%" stopColor="#451a03" stopOpacity={isRank1 ? 0.9 : 0.6} />
          </radialGradient>

          <linearGradient id={rimGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={lightGold} />
            <stop offset="30%" stopColor={primaryGold} />
            <stop offset="70%" stopColor={darkGold} />
            <stop offset="100%" stopColor={lightGold} />
          </linearGradient>

          <linearGradient id={ribGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ribbonColor1} />
            <stop offset="60%" stopColor={ribbonColor2} />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>

          <filter id={`shadow-${rank}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Left Ribbon */}
        <path
          d="M 32 45 L 18 118 L 36 102 L 48 114 L 44 45 Z"
          fill={`url(#${ribGradId})`}
          filter={`url(#shadow-${rank})`}
        />
        <path
          d="M 21 114 L 36 100 L 45 110"
          stroke={lightGold}
          strokeWidth="1.2"
          fill="none"
          opacity="0.8"
        />

        {/* Right Ribbon */}
        <path
          d="M 56 45 L 52 114 L 64 102 L 82 118 L 68 45 Z"
          fill={`url(#${ribGradId})`}
          filter={`url(#shadow-${rank})`}
        />
        <path
          d="M 55 110 L 64 100 L 79 114"
          stroke={lightGold}
          strokeWidth="1.2"
          fill="none"
          opacity="0.8"
        />

        {/* Outer Rosette Teeth (24-point star) */}
        <g filter={`url(#shadow-${rank})`}>
          <polygon
            points={(() => {
              const pts = []
              const numPoints = 24
              const cx = 50
              const cy = 48
              const rOuter = 46
              const rInner = 40
              for (let i = 0; i < numPoints * 2; i++) {
                const angle = (i * Math.PI) / numPoints - Math.PI / 2
                const r = i % 2 === 0 ? rOuter : rInner
                pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
              }
              return pts.join(' ')
            })()}
            fill={`url(#${rimGradId})`}
            stroke={darkGold}
            strokeWidth="0.8"
          />
        </g>

        {/* Main Circular Medal Body */}
        <circle cx="50" cy="48" r="38" fill={`url(#${gradId})`} stroke={lightGold} strokeWidth="1.5" />

        {/* Embossed Inner Ring with Beaded Studs */}
        <circle
          cx="50"
          cy="48"
          r="32"
          fill="none"
          stroke={darkGold}
          strokeWidth="2.2"
          strokeDasharray="2.2 2.6"
          opacity="0.85"
        />
        <circle
          cx="50"
          cy="48"
          r="30"
          fill="none"
          stroke={lightGold}
          strokeWidth="0.8"
          opacity="0.9"
        />

        {/* Inner Center Sunken Plate */}
        <circle cx="50" cy="48" r="27" fill={`url(#${gradId})`} opacity="0.95" />

        {/* Top Gloss Arc Highlight */}
        <path
          d="M 28 36 A 24 24 0 0 1 72 36 A 25 15 0 0 0 28 36 Z"
          fill="#ffffff"
          opacity="0.4"
        />

        {/* 3D Bold Numeral */}
        <text
          x="50"
          y="59"
          textAnchor="middle"
          fontSize="32"
          fontWeight="900"
          fontFamily="'Arial Black', 'Impact', 'Montserrat', sans-serif"
          fill="#451a03"
          opacity="0.65"
          dx="1.5"
          dy="1.5"
        >
          {rank}
        </text>
        <text
          x="50"
          y="59"
          textAnchor="middle"
          fontSize="32"
          fontWeight="900"
          fontFamily="'Arial Black', 'Impact', 'Montserrat', sans-serif"
          fill={lightGold}
          stroke={darkGold}
          strokeWidth="1"
          style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }}
        >
          {rank}
        </text>
      </svg>
    </div>
  )
}

function getRankMeta(cert, BRAND) {
  const rawPos = String(cert.position || cert.certificate_type || cert.rank || '').toLowerCase().trim()
  const rawRank = Number(cert.rank || 0)

  if (rawRank === 1 || rawPos === '1' || rawPos === '1st' || rawPos.includes('winner_1st') || rawPos.includes('1st place') || rawPos === 'winner') {
    return {
      label: '1st Place (Winner)',
      icon: '🥇',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-[0_2px_10px_rgba(245,158,11,0.15)] font-black',
      cardIconBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      isWinner: true,
      rankNum: 1
    }
  }
  if (rawRank === 2 || rawPos === '2' || rawPos === '2nd' || rawPos.includes('runner_up_2nd') || rawPos.includes('2nd place') || rawPos.includes('runner-up') || rawPos.includes('runner up')) {
    return {
      label: '2nd Place (Runner-Up)',
      icon: '🥈',
      badgeClass: 'bg-slate-400/15 text-slate-700 dark:text-slate-200 border-slate-400/40 shadow-[0_2px_10px_rgba(148,163,184,0.15)] font-black',
      cardIconBg: 'linear-gradient(135deg, #94a3b8, #64748b)',
      isWinner: true,
      rankNum: 2
    }
  }
  if (rawRank === 3 || rawPos === '3' || rawPos === '3rd' || rawPos.includes('runner_up_3rd') || rawPos.includes('3rd place')) {
    return {
      label: '3rd Place (Runner-Up)',
      icon: '🥉',
      badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/40 shadow-[0_2px_10px_rgba(249,115,22,0.15)] font-black',
      cardIconBg: 'linear-gradient(135deg, #f97316, #c2410c)',
      isWinner: true,
      rankNum: 3
    }
  }
  return {
    label: cert.position || cert.certificate_type || 'Certificate of Participation',
    icon: '🎖️',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold',
    cardIconBg: `linear-gradient(135deg, ${BRAND}, #4338ca)`,
    isWinner: false,
    rankNum: null
  }
}

export default function CertificatesPage({ tokens, user }) {
  const { accentColor } = useTheme()
  const BRAND = accentColor || '#615FFF'

  const [certificatesList, setCertificatesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCert, setSelectedCert] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [activeTmpl, setActiveTmpl] = useState({})

  const handleDownload = async (cert) => {
    if (!cert) return
    setDownloadingId(cert.id)
    try {
      const certEventTitle = (cert.event || cert.eventName || cert.event_name || cert.title || '').trim().toLowerCase();
      const certEventId = String(cert.event_id || cert.eventId || cert.event?.id || '');
      const matchedEv = eventsList.find(e => {
        const eId = String(e.id || e.event_id || '');
        const eTitle = (e.title || e.name || e.event_name || '').trim().toLowerCase();
        return (certEventId && eId && certEventId === eId) || (certEventTitle && eTitle && certEventTitle === eTitle);
      }) || {};

      const studentName = user?.name || user?.full_name || user?.username || cert.studentName || cert.student_name || cert.recipient_name || cert.userName || ''
      const dynamicVenue = cert.venue || cert.location || matchedEv.venue || matchedEv.location || 'Main Campus Auditorium'
      const dynamicDate = cert.eventDate || cert.date || matchedEv.date || matchedEv.event_date || cert.issueDate

      downloadCertificatePDF({
        ...cert,
        userName: studentName,
        studentName,
        venue: dynamicVenue,
        eventDate: dynamicDate,
        teamName: cert.teamName || cert.team_name || '',
        members: cert.members || [studentName],
        rank: cert.rank || cert.position
      }, activeTmpl)
    } catch (err) {
      alert('Error occurred during download.')
    } finally {
      setDownloadingId(null)
    }
  }

  useEffect(() => {
    let cancelled = false
    // Fetch certificates & registrations to enrich with team info
    Promise.all([
      studentService.fetchCertificatesData(),
      studentService.fetchMyRegistrations().catch(() => ({ success: false, data: [] }))
    ]).then(([certRes, regRes]) => {
      if (cancelled) return
      let certs = (certRes.success && Array.isArray(certRes.data)) ? certRes.data : []
      const myRegs = (regRes.success && Array.isArray(regRes.data)) ? regRes.data : []
      const savedTeams = (() => {
        try { return JSON.parse(localStorage.getItem('cc_team_registrations') || '{}') } catch { return {} }
      })()

      certs = certs.map(c => {
        const matchingReg = myRegs.find(r => 
          String(r.event_id || r.eventId) === String(c.event_id || c.eventId) ||
          (r.event_name && c.event && r.event_name.toLowerCase() === c.event.toLowerCase())
        )
        const savedTeamData = savedTeams[c.event_id || c.eventId] || {}
        const teamName = c.team_name || c.teamName || matchingReg?.team_name || matchingReg?.teamName || savedTeamData?.teamName || ''
        const rawMembers = c.members || matchingReg?.members || matchingReg?.team_members || savedTeamData?.members || []
        const members = Array.isArray(rawMembers)
          ? rawMembers.map(m => typeof m === 'object' ? (m.name || m.studentName || m.full_name || m.email) : String(m)).filter(Boolean)
          : []

        return {
          ...c,
          teamName: teamName || null,
          members: members.length > 0 ? members : null
        }
      })

      setCertificatesList(certs)
      setLoading(false)
    })
    // Fetch active template to use in PDF
    certificatesService.fetchTemplates().then(res => {
      if (cancelled || !res.success) return
      const templates = res.templates || []
      const active = templates.find(t => t.is_active) || templates[0]
      if (active) {
        setActiveTmpl({
          org: active.organisation_name || 'State University',
          title: active.certificate_title || 'Certificate of Participation',
          subtitle: 'This is to certify that',
          body: 'has successfully participated in',
          footer: 'campusconnect.university.edu/verify',
          gradFrom: active.background_gradient_from || active.background_image || '#1a1060',
          gradMid: active.background_gradient_mid || '#0f0a45',
          gradTo: active.background_gradient_to || '#0a0838',
          accentColor: active.accent_color || active.font_color || '#615FFF',
          borderStyle: active.border_style || 'none',
          fontFamily: active.font_family || 'Manrope, sans-serif',
          showLogo: active.show_logo !== false,
          showSignatures: active.show_signatures !== false,
        })
      }
    })
    return () => { cancelled = true }
  }, [])

  const [imgSrc, setImgSrc] = useState(null)
  const [eventsList, setEventsList] = useState([])

  useEffect(() => {
    studentService.fetchEventsData().then(res => {
      if (res.success) setEventsList(res.data)
    })
  }, [])

  useEffect(() => {
    if (selectedCert) {
      const position = selectedCert.position || selectedCert.certificate_type || selectedCert.rank || '';
      const certType = (selectedCert.certificate_type || '').toLowerCase();
      const certTitle = selectedCert.certificate_title || '';
      const rankVal = Number(selectedCert.rank || 0);

      const isAchievement = (certType && certType !== 'participation' && certType !== 'participant') ||
        (position &&
          !position.toLowerCase().includes('participant') &&
          !position.toLowerCase().includes('participation') &&
          !position.toLowerCase().includes('completed') &&
          !position.toLowerCase().includes('n/a'));

      const template = { ...activeTmpl };

      if (isAchievement) {
        template.title = certTitle || 'Certificate of Merit';
        if (certType === 'winner_1st' || rankVal === 1) {
          template.body = 'has achieved 1st Place (Winner) in';
        } else if (certType === 'runner_up_2nd' || rankVal === 2) {
          template.body = 'has achieved 2nd Place (Runner Up) in';
        } else if (certType === 'runner_up_3rd' || rankVal === 3) {
          template.body = 'has achieved 3rd Place (Runner Up) in';
        } else {
          template.body = `has achieved ${position} in`;
        }
      } else if (certTitle) {
        template.title = certTitle;
      }

      // Try to find matching event for venue and date (case-insensitive & id matching)
      const certEventTitle = (selectedCert.event || selectedCert.eventName || selectedCert.event_name || selectedCert.title || '').trim().toLowerCase();
      const certEventId = String(selectedCert.event_id || selectedCert.eventId || selectedCert.event?.id || '');
      const matchedEv = eventsList.find(e => {
        const eId = String(e.id || e.event_id || '');
        const eTitle = (e.title || e.name || e.event_name || '').trim().toLowerCase();
        return (certEventId && eId && certEventId === eId) || (certEventTitle && eTitle && certEventTitle === eTitle);
      }) || {};

      const savedTeams = (() => {
        try {
          return JSON.parse(localStorage.getItem('cc_team_registrations') || '{}')
        } catch {
          return {}
        }
      })()

      let teamName = selectedCert.teamName || selectedCert.team_name || ''
      if (!teamName) {
        teamName = savedTeams[selectedCert.eventId]?.teamName || savedTeams[matchedEv.id]?.teamName || ''
      }

      const dynamicVenue = selectedCert.venue || selectedCert.location || matchedEv.venue || matchedEv.location || 'Main Campus Auditorium';
      const dynamicDate = selectedCert.eventDate || matchedEv.date || matchedEv.event_date || selectedCert.date || selectedCert.issueDate;

      const rawMembers = selectedCert.members || savedTeams[selectedCert.eventId]?.members || savedTeams[matchedEv.id]?.members || [];
      let membersList = Array.isArray(rawMembers)
        ? rawMembers.map(m => typeof m === 'object' ? (m.name || m.studentName || m.full_name || m.email) : String(m)).filter(Boolean)
        : [];
      if (membersList.length === 0 && user?.name) {
        membersList = [user.name];
      }

      const certData = {
        userName: user?.name || user?.full_name || selectedCert.studentName || selectedCert.name || 'Student',
        eventName: selectedCert.eventName || selectedCert.event,
        certCode: selectedCert.verifyCode || selectedCert.certificate_number || selectedCert.id,
        issueDate: selectedCert.issuedDate || selectedCert.date || selectedCert.issueDate,
        position: position,
        rank: rankVal,
        teamName: teamName,
        members: membersList,
        certificate_number: selectedCert.certificate_number || selectedCert.verifyCode,
        organizerName: selectedCert.organizerName || selectedCert.organizer || matchedEv.organizer,
        venue: dynamicVenue,
        eventDate: dynamicDate
      }

      const dataUrl = renderCertificateCanvas(certData, template)
      setImgSrc(dataUrl)
    } else {
      setImgSrc(null)
    }
  }, [selectedCert, activeTmpl, user, eventsList])

  return (
    <div className="p-6 flex flex-col gap-6" style={{ fontFamily: 'Manrope, sans-serif' }}>

      {/* Top Banner */}
      <div className="rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border shadow-sm" style={{ background: tokens.dark ? '#0f1e30' : '#ffffff', borderColor: tokens.dark ? '#1a3050' : '#e2e8f0' }}>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2 bg-emerald-500/10 text-emerald-500">
            <Award size={14} /> My Certificates
          </div>
          <h2 className="text-2xl font-black m-0" style={{ color: tokens.txtPri }}>Earned Certificates</h2>
          <p className="text-xs font-medium mt-1 m-0" style={{ color: tokens.txtSec }}>
            Download verified digital certificates issued for your event participations.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold" style={{ background: tokens.dark ? '#162640' : '#f1f5f9', borderColor: tokens.dark ? '#1a3050' : '#e2e8f0', color: tokens.txtPri }}>
          <ShieldCheck size={16} className="text-emerald-500" />
          {loading ? '...' : certificatesList.length} Verified Certificates
        </div>
      </div>

      {/* Full Width Certificates Grid */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={28} className="animate-spin" style={{ color: BRAND }} />
          </div>
        ) : certificatesList.length === 0 ? (
          <div className="rounded-3xl p-12 border flex flex-col items-center justify-center text-center gap-3 shadow-sm" style={{ background: tokens.dark ? '#0f1e30' : '#ffffff', borderColor: tokens.dark ? '#1a3050' : '#e2e8f0' }}>
            <Award size={48} style={{ color: tokens.txtSec, opacity: 0.4 }} />
            <p className="text-base font-bold" style={{ color: tokens.txtPri }}>No certificates earned yet</p>
            <p className="text-xs" style={{ color: tokens.txtSec }}>Participate in campus events to earn verified digital certificates!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificatesList.map((cert) => {
              const rankMeta = getRankMeta(cert, BRAND)
              return (
                <div
                  key={cert.id}
                  className={`group relative rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between shadow-xs hover:shadow-xl ${
                    rankMeta.isWinner ? 'border-amber-500/40' : ''
                  }`}
                  style={{
                    background: tokens.dark ? '#0f1e30' : '#ffffff',
                    borderColor: rankMeta.isWinner ? (tokens.dark ? '#d9770660' : '#fde68a') : (tokens.dark ? '#1a3050' : '#e2e8f0'),
                    boxShadow: rankMeta.isWinner ? '0 12px 36px -8px rgba(245,158,11,0.22)' : tokens.shadow
                  }}
                >
                  {/* 3D Rosette Ribbon Medal on Top-Right Corner */}
                  {rankMeta.isWinner && rankMeta.rankNum && (
                    <WinnerRosetteMedal rank={rankMeta.rankNum} size={62} />
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300 relative overflow-hidden"
                        style={{ background: rankMeta.cardIconBg }}
                      >
                        {rankMeta.rankNum === 1 ? (
                          <Trophy size={24} className="animate-pulse" />
                        ) : rankMeta.rankNum === 2 || rankMeta.rankNum === 3 ? (
                          <Medal size={24} />
                        ) : (
                          <Award size={24} />
                        )}
                      </div>
                      <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border ${rankMeta.isWinner ? 'mr-10' : ''}`} style={{ background: tokens.dark ? '#162640' : '#f1f5f9', borderColor: tokens.dark ? '#1a3050' : '#e2e8f0', color: tokens.txtSec }}>
                        {cert.verifyCode || cert.certificate_number || 'CC-2026'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-2.5">
                      <span className={`text-[11.5px] px-3 py-1 rounded-full border flex items-center gap-1.5 ${rankMeta.badgeClass}`}>
                        <span>{rankMeta.icon}</span>
                        <span>{rankMeta.label}</span>
                      </span>
                      {cert.teamName && (
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                          <Users size={12} /> Team: {cert.teamName}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-extrabold mt-3 mb-1 tracking-tight" style={{ color: tokens.txtPri }}>
                      {cert.event || cert.event_name || cert.title || 'Campus Event'}
                    </h3>
                    <p className="text-xs font-medium m-0" style={{ color: tokens.txtSec }}>
                      Issued on: {cert.issueDate || cert.issued_at?.split('T')[0] || cert.generated_at || 'N/A'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t flex items-center gap-3" style={{ borderColor: tokens.dark ? '#1a3050' : '#f1f5f9' }}>
                    <button
                      type='button'
                      onClick={() => handleDownload(cert)}
                      disabled={downloadingId !== null}
                      className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: BRAND }}
                    >
                      {downloadingId === cert.id ? <><Loader2 size={14} className="animate-spin" /> Downloading...</> : <><Download size={14} /> Download PDF</>}
                    </button>
                    <button
                      type='button'
                      onClick={() => setSelectedCert(cert)}
                      className="px-3.5 py-2.5 rounded-xl font-bold text-xs border cursor-pointer transition-colors flex items-center gap-1.5"
                      style={{ background: tokens.dark ? '#162640' : '#f8fafc', borderColor: tokens.dark ? '#1e2d45' : '#e2e8f0', color: tokens.txtPri }}
                    >
                      <ExternalLink size={14} /> Preview
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedCert && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCert(null)}>
          <div
            role="button"
            tabIndex={0}
            aria-label="Close modal"
            className="bg-white dark:bg-[#0c1829] border border-slate-200 dark:border-[#1a3050] rounded-[20px] max-w-[600px] w-full text-center shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-slate-200 dark:border-[#1a3050]">
              <h2 className="text-[16px] font-extrabold m-0 text-slate-900 dark:text-white">Certificate Preview</h2>
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 p-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1a3050]"
              ><ExternalLink size={17} style={{ transform: 'rotate(45deg)' }} /></button>
            </div>

            {/* Certificate Visual Preview */}
            <div className="p-5 flex-1 overflow-y-auto flex items-center justify-center bg-slate-50 dark:bg-black/20">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt="Certificate Preview"
                  className="w-full h-auto object-contain rounded shadow-lg border border-slate-200 dark:border-[#1a3050]"
                  style={{ maxHeight: '60vh' }}
                />
              ) : (
                <div className="w-full aspect-[1.414] animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              )}
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t border-slate-200 dark:border-[#1a3050] flex gap-3">
              <button type='button' onClick={() => setSelectedCert(null)} className="flex-1 py-3 rounded-xl font-bold text-xs border border-slate-200 dark:border-[#1a3050] text-slate-600 dark:text-slate-300 bg-transparent cursor-pointer hover:bg-slate-50 dark:hover:bg-[#162640] transition-colors">Close</button>
              <button
                type='button'
                onClick={() => handleDownload(selectedCert)}
                disabled={downloadingId !== null}
                className="flex-1 py-3 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 transition-transform hover:-translate-y-px"
                style={{ background: BRAND, boxShadow: '0 4px 14px rgba(97,95,255,0.4)' }}
              >
                {downloadingId === selectedCert.id ? <><Loader2 size={14} className="animate-spin" /> Downloading...</> : <><Download size={14} /> Download PDF</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
