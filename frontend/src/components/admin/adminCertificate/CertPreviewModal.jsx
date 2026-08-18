import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GraduationCap, X, Download, Copy } from 'lucide-react'
import { downloadCertificatePDF, renderCertificateCanvas } from '../../../utils/pdfGenerator'

export default function CertPreviewModal({
  previewCert,
  setPreviewCert,
  tokens,
  dark,
  BRAND,
  showToast,
  tmpl,
  allEvents = []
}) {
  const dialogRef = useRef(null)
  const [imgSrc, setImgSrc] = useState(null)

  useEffect(() => {
    if (previewCert && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal()
    }
  }, [previewCert])

  useEffect(() => {
    if (previewCert) {
      // Setup params matching PDF generation
      const position = previewCert.position || previewCert.certificate_type || previewCert.rank || '';
      const certType = (previewCert.certificate_type || '').toLowerCase();
      const certTitle = previewCert.certificate_title || '';
      const rankVal = Number(previewCert.rank || 0);

      const isAchievement = (certType && certType !== 'participation' && certType !== 'participant') || 
        (position && 
         !position.toLowerCase().includes('participant') && 
         !position.toLowerCase().includes('participation') && 
         !position.toLowerCase().includes('completed') && 
         !position.toLowerCase().includes('n/a'));

      const template = {
        org:         'State University',
        title:       'Certificate of Participation',
        subtitle:    'This is to certify that',
        body:        'has successfully participated in',
        footer:      'campusconnect.university.edu/verify',
        gradFrom:    '#1a1060',
        gradMid:     '#0f0a45',
        gradTo:      '#0a0838',
        accentColor: '#615FFF',
        borderStyle: 'none',
        fontFamily:  'Manrope, sans-serif',
        showLogo:        true,
        showSignatures:  true,
        ...tmpl,
      }

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

      const searchName = previewCert.eventName || previewCert.event || '';
      const matchedEv = allEvents.find(e => 
        (e.id && previewCert.event_id && String(e.id) === String(previewCert.event_id)) || 
        (e.title && searchName && e.title === searchName) || 
        (e.name && searchName && e.name === searchName)
      ) || {}

      const certData = {
        userName: previewCert.studentName || previewCert.name || previewCert.user,
        eventName: previewCert.eventName || previewCert.event || matchedEv.name || matchedEv.title,
        certCode: previewCert.verifyCode || previewCert.id,
        issueDate: previewCert.issuedDate || previewCert.date || previewCert.issueDate,
        position: position,
        certificate_number: previewCert.certificate_number || previewCert.verifyCode,
        organizerName: previewCert.organizerName || previewCert.organizer || matchedEv.organizer,
        venue: previewCert.venue || matchedEv.venue,
        eventDate: previewCert.eventDate || previewCert.date || previewCert.issueDate || matchedEv.date
      }

      const dataUrl = renderCertificateCanvas(certData, template)
      setImgSrc(dataUrl)
    } else {
      setImgSrc(null)
    }
  }, [previewCert, tmpl])

  if (!previewCert) return null

  const handleClose = () => {
    setPreviewCert(null)
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-9999 m-0 p-0 w-full h-full border-none bg-transparent"
      onClose={handleClose}
      style={{ maxWidth: '100vw', maxHeight: '100vh' }}
    >
      <button
        type="button"
        className="fixed inset-0 w-full h-full bg-black/70 backdrop-blur-sm border-none cursor-default"
        onClick={handleClose}
        aria-label="Close overlay"
      />
      <div
        className="fixed inset-0 pointer-events-none flex items-center justify-center p-5"
      >
        <div
          className="pointer-events-auto rounded-[20px] w-full max-w-[550px] overflow-hidden flex flex-col"
          style={{
            background: dark ? '#0c1829' : '#ffffff',
            border: `1px solid ${tokens.border}`,
            boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
            animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
            maxHeight: '90vh'
          }}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: `1px solid ${tokens.border}` }}>
            <h2 className="text-[16px] font-extrabold m-0" style={{ color: tokens.txtPri }}>Certificate Preview</h2>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 p-0"
              style={{ color: tokens.txtSec }}
              onMouseEnter={e => { e.currentTarget.style.background = tokens.hoverBg }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            ><X size={17} /></button>
          </div>

          {/* Certificate Card Preview */}
          <div className="p-5 flex-1 overflow-y-auto flex items-center justify-center bg-black/5" style={{ background: dark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }}>
            {imgSrc ? (
              <img 
                src={imgSrc} 
                alt="Certificate Preview" 
                className="w-full h-auto object-contain rounded shadow-lg border"
                style={{ borderColor: tokens.border, maxHeight: '60vh' }}
              />
            ) : (
              <div className="w-full aspect-[1.414] animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            )}
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 flex gap-3">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-px"
              style={{ background: BRAND, boxShadow: '0 4px 14px rgba(97,95,255,0.4)' }}
              onClick={() => {
                downloadCertificatePDF({
                  userName: previewCert.studentName || previewCert.name || previewCert.user,
                  eventName: previewCert.eventName || previewCert.event,
                  certCode: previewCert.verifyCode || previewCert.id,
                  issueDate: previewCert.issuedDate || previewCert.date || previewCert.issueDate,
                  position: position,
                  certificate_number: previewCert.certificate_number || previewCert.verifyCode,
                  venue: previewCert.venue,
                  eventDate: previewCert.eventDate || previewCert.date || previewCert.issueDate
                }, tmpl || {})
                if (showToast) showToast('PDF download started.', 'success')
              }}
            >
              <Download size={14} /> Download PDF
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold border cursor-pointer transition-all duration-200 hover:-translate-y-px bg-transparent"
              style={{ borderColor: tokens.border, color: tokens.txtPri }}
              onClick={() => {
                navigator.clipboard.writeText(`https://campusconnect.university.edu/verify/${previewCert.verifyCode}`)
                showToast('Verify link copied!', 'success')
              }}
            >
              <Copy size={14} /> Copy Verify Link
            </button>
          </div>
        </div>
      </div>
    </dialog>,
    document.body
  )
}
