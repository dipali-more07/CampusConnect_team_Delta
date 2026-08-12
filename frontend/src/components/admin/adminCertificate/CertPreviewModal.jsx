import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { GraduationCap, X, Download, Copy } from 'lucide-react'
import { downloadCertificatePDF } from '../../../utils/pdfGenerator'

export default function CertPreviewModal({
  previewCert,
  setPreviewCert,
  tokens,
  dark,
  BRAND,
  showToast,
  tmpl
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (previewCert && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal()
    }
  }, [previewCert])

  if (!previewCert) return null

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

  let titleText = 'Certificate of Participation';
  let bodyText = 'has successfully participated in';

  if (isAchievement) {
    titleText = certTitle || 'Certificate of Achievement';
    if (certType === 'winner_1st' || rankVal === 1) {
      bodyText = 'has achieved 1st Place (Winner) in';
    } else if (certType === 'runner_up_2nd' || rankVal === 2) {
      bodyText = 'has achieved 2nd Place (Runner Up) in';
    } else if (certType === 'runner_up_3rd' || rankVal === 3) {
      bodyText = 'has achieved 3rd Place (Runner Up) in';
    } else {
      bodyText = `has achieved ${position} in`;
    }
  } else if (certTitle) {
    titleText = certTitle;
  }

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
          className="pointer-events-auto rounded-[20px] w-full max-w-[500px] overflow-hidden"
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
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 p-0"
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

                <h3 className="text-[22px] font-extrabold text-white m-0 leading-tight">{titleText}</h3>

                <div className="w-16 h-[2px] rounded-full my-1" style={{ background: BRAND }} />

                <p className="text-[12px] text-white/60 m-0">This is to certify that</p>

                <p className="text-[24px] font-extrabold text-white m-0 tracking-tight font-sans">{previewCert.studentName}</p>

                <p className="text-[12px] text-white/60 m-0">{bodyText}</p>

                <p className="text-[17px] font-extrabold m-0 font-sans" style={{ color: '#a5b4fc' }}>{previewCert.eventName}</p>

                {/* Signature row */}
                <div className="w-full flex justify-between items-end mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                  <div className="text-center">
                    <div className="w-20 h-px bg-white/30 mb-1" />
                    <p className="text-[10px] text-white/50 m-0">Event Organizer</p>
                  </div>
                  <div className="text-center font-sans">
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
                  Verify at: campusconnect.university.edu/verify/{previewCert.verifyCode}
                </p>
              </div>
            </div>
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
                  certificate_number: previewCert.certificate_number || previewCert.verifyCode
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
