import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Award, Download, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import studentService from '../../services/studentService'
import certificatesService from '../../services/certificatesService'
import { downloadCertificatePDF, renderCertificateCanvas } from '../../utils/pdfGenerator'

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
      downloadCertificatePDF({ ...cert, userName: user?.name || cert.studentName }, activeTmpl)
    } catch (err) {
      alert('Error occurred during download.')
    } finally {
      setDownloadingId(null)
    }
  }

  useEffect(() => {
    let cancelled = false
    // Fetch certificates
    studentService.fetchCertificatesData().then(res => {
      if (cancelled) return
      if (res.success) setCertificatesList(res.data)
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

      // Try to find matching event for venue and date
      const matchedEv = eventsList.find(e => e.title === selectedCert.event || e.id === selectedCert.eventId) || {};

      const certData = {
        userName: user?.name || user?.full_name || selectedCert.studentName || selectedCert.name || 'Student',
        eventName: selectedCert.eventName || selectedCert.event,
        certCode: selectedCert.verifyCode || selectedCert.certificate_number || selectedCert.id,
        issueDate: selectedCert.issuedDate || selectedCert.date || selectedCert.issueDate,
        position: position,
        certificate_number: selectedCert.certificate_number || selectedCert.verifyCode,
        organizerName: selectedCert.organizerName || selectedCert.organizer || matchedEv.organizer,
        venue: selectedCert.venue || matchedEv.venue,
        eventDate: selectedCert.eventDate || matchedEv.date || selectedCert.date || selectedCert.issueDate
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
          <h2 className="text-2xl font-black m-0" style={{ color: tokens.txtPri }}>Earned Certificates & Badges</h2>
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
            {certificatesList.map((cert) => (
              <div
                key={cert.id}
                className="group relative rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between shadow-xs hover:shadow-md"
                style={{ background: tokens.dark ? '#0f1e30' : '#ffffff', borderColor: tokens.dark ? '#1a3050' : '#e2e8f0', boxShadow: tokens.shadow }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform" style={{ background: `linear-gradient(135deg, ${BRAND}, #4338ca)` }}>
                      <Award size={24} />
                    </div>
                    <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full border" style={{ background: tokens.dark ? '#162640' : '#f1f5f9', borderColor: tokens.dark ? '#1a3050' : '#e2e8f0', color: tokens.txtSec }}>
                      {cert.verifyCode || cert.certificate_number || 'CC-2026'}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {cert.position || cert.certificate_type || 'Certificate of Participation'}
                  </span>

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
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedCert && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCert(null)}>
          <div 
            role="button" 
            tabIndex={0} aria-label="Close modal" className="bg-white dark:bg-[#0c1829] border border-slate-200 dark:border-[#1a3050] rounded-[20px] max-w-[600px] w-full text-center shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
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
