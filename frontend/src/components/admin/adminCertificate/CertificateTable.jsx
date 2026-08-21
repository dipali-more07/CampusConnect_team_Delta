import { Award, Zap, Send, RotateCcw, Eye, Download, RefreshCw, Check, Loader2 } from 'lucide-react'
import { downloadCertificatePDF } from '../../../utils/pdfGenerator'

export default function CertificateTable({
  loading,
  filtered,
  certs,
  selected,
  handleGenerate,
  handleSend,
  handleRevoke,
  setPreviewCert,
  generatingId,
  sendLoading,
  load,
  badgeStyle,
  tokens,
  BRAND,
  skBg
}) {
  const renderTableBody = () => {
    if (loading) {
      return [1, 2, 3, 4, 5].map(i => (
        <tr key={i} style={{ borderBottom: `1px solid ${tokens.border}` }}>
          <td className="px-5 py-4"><div className="w-28 h-3.5 rounded" style={{ background: skBg }} /></td>
          <td className="px-5 py-4"><div className="w-32 h-3.5 rounded" style={{ background: skBg }} /></td>
          <td className="px-5 py-4"><div className="w-20 h-3.5 rounded" style={{ background: skBg }} /></td>
          <td className="px-5 py-4"><div className="w-28 h-3.5 rounded" style={{ background: skBg }} /></td>
          <td className="px-5 py-4"><div className="w-16 h-5 rounded-full" style={{ background: skBg }} /></td>
          <td className="px-5 py-4"><div className="w-20 h-7 rounded ml-auto" style={{ background: skBg }} /></td>
        </tr>
      ))
    }

    if (filtered.length === 0) {
      return (
        <tr>
          <td colSpan="6" className="p-12 text-center">
            <Award size={40} className="block mx-auto mb-3" style={{ color: tokens.txtMuted }} />
            <p className="text-[14px] font-medium" style={{ color: tokens.txtSec }}>No certificates found</p>
          </td>
        </tr>
      )
    }

    return filtered.map((cert, i) => {
      const badge = badgeStyle(cert.status)
      const isSelected = selected?.includes(cert.id)
      const isGenerating = generatingId === cert.id || (generatingId === 'bulk' && selected?.includes(cert.id))
      const isPending = cert.status === 'Pending'

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
              <button
                type="button"
                onClick={() => handleGenerate(cert)}
                disabled={!isPending || isGenerating}
                title={isPending ? "Generate Certificate" : "Certificate already generated"}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border-none transition-all duration-150 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: BRAND }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={11} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Zap size={11} /> Generate
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPreviewCert(cert)}
                title="Preview Certificate"
                className="w-[28px] h-[28px] rounded-lg border bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
                style={{ borderColor: tokens.border, color: tokens.txtSec }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.txtSec }}
              ><Eye size={12} /></button>
              <button
                type="button"
                onClick={() => downloadCertificatePDF({
                  userName: cert.studentName,
                  eventName: cert.eventName,
                  certCode: cert.verifyCode || cert.id,
                  issueDate: cert.issuedDate,
                  position: cert.position || cert.certificate_type || cert.rank,
                  certificate_number: cert.certificate_number || cert.verifyCode
                })}
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
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: tokens.card, border: `1px solid ${tokens.border}`, boxShadow: tokens.shadow }}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
              {['STUDENT', 'EVENT', 'ISSUED DATE', 'VERIFY CODE', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} className="px-5 py-4 text-[11px] font-bold tracking-wider" style={{ color: tokens.txtSec }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderTableBody()}
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
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 text-[12px] font-semibold bg-transparent border-none cursor-pointer transition-all duration-150"
            style={{ color: tokens.txtSec }}
            onMouseEnter={e => e.currentTarget.style.color = BRAND}
            onMouseLeave={e => e.currentTarget.style.color = tokens.txtSec}
          ><RefreshCw size={12} /> Refresh</button>
        </div>
      )}
    </div>
  )
}
