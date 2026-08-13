import React, { useState, useEffect } from 'react'
import { Award, Download, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import studentService from '../../services/studentService'
import certificatesService from '../../services/certificatesService'
import { downloadCertificatePDF } from '../../utils/pdfGenerator'

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
          org:         active.organisation_name  || 'State University',
          title:       active.certificate_title  || 'Certificate of Participation',
          subtitle:    'This is to certify that',
          body:        'has successfully participated in',
          footer:      'campusconnect.university.edu/verify',
          gradFrom:    active.background_gradient_from || active.background_image || '#1a1060',
          gradMid:     active.background_gradient_mid  || '#0f0a45',
          gradTo:      active.background_gradient_to   || '#0a0838',
          accentColor: active.accent_color  || active.font_color || '#615FFF',
          borderStyle: active.border_style  || 'none',
          fontFamily:  active.font_family   || 'Manrope, sans-serif',
          showLogo:        active.show_logo       !== false,
          showSignatures:  active.show_signatures !== false,
        })
      }
    })
    return () => { cancelled = true }
  }, [])

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
                    onClick={() => handleDownload(cert)}
                    disabled={downloadingId !== null}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: BRAND }}
                  >
                    {downloadingId === cert.id ? <><Loader2 size={14} className="animate-spin" /> Downloading...</> : <><Download size={14} /> Download PDF</>}
                  </button>
                  <button
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
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c1829] border border-slate-200 dark:border-[#1a3050] rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg" style={{ background: BRAND }}>
              <Award size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white m-0">Certificate of Achievement</h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">Verified by CampusConnect University Platform</p>
            <div className="p-5 rounded-2xl text-left text-xs space-y-2 mb-6 border" style={{ background: tokens.dark ? '#162640' : '#f8fafc', borderColor: tokens.dark ? '#1a3050' : '#e2e8f0' }}>
              <p><strong className="text-slate-900 dark:text-white">Awarded to:</strong> {user?.name || 'Student'}</p>
              <p><strong className="text-slate-900 dark:text-white">Event:</strong> {selectedCert.event || selectedCert.event_name || 'Campus Event'}</p>
              <p><strong className="text-slate-900 dark:text-white">Achievement:</strong> {selectedCert.position || selectedCert.certificate_type || 'Participation'}</p>
              <p><strong className="text-slate-900 dark:text-white">Verification Code:</strong> {selectedCert.verifyCode || selectedCert.certificate_number || selectedCert.id}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelectedCert(null)} className="flex-1 py-2.5 rounded-xl font-bold text-xs border border-slate-200 dark:border-[#1a3050] text-slate-600 dark:text-slate-300 bg-transparent cursor-pointer">Close</button>
              <button
                onClick={() => handleDownload(selectedCert)}
                disabled={downloadingId !== null}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: BRAND }}
              >
                {downloadingId === selectedCert.id ? <><Loader2 size={14} className="animate-spin" /> Downloading...</> : 'Download Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
