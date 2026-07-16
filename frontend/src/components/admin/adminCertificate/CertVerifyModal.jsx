import React from 'react'
import { createPortal } from 'react-dom'
import { ShieldCheck, X, Loader2, CheckCircle2 } from 'lucide-react'

export default function CertVerifyModal({
  verifyOpen,
  setVerifyOpen,
  verifyCode,
  setVerifyCode,
  verifyResult,
  setVerifyResult,
  verifying,
  handleVerify,
  tokens,
  dark,
  BRAND,
  inputStyle
}) {
  if (!verifyOpen) return null

  return createPortal(
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
                    ['Student', verifyResult.certificate.studentName || verifyResult.certificate.student_name || verifyResult.certificate.full_name || verifyResult.certificate.fullName || ''],
                    ['Roll No', verifyResult.certificate.rollNo || verifyResult.certificate.roll_no || verifyResult.certificate.username || ''],
                    ['Event', verifyResult.certificate.eventName || verifyResult.certificate.event_name || verifyResult.certificate.event?.name || ''],
                    ['Issued', verifyResult.certificate.issuedDate || verifyResult.certificate.issued_date || verifyResult.certificate.created_at || verifyResult.certificate.createdAt || ''],
                    ['Status', verifyResult.certificate.status || ''],
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
    </div>,
    document.body
  )
}
