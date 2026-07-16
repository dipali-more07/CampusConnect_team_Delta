import React from 'react'
import { Award, Zap, Send, RotateCcw, Eye, Download, RefreshCw } from 'lucide-react'

export default function CertificateTable({
  loading,
  filtered,
  certs,
  selected,
  allSelected,
  toggleSelect,
  toggleAll,
  handleGenerate,
  handleSend,
  handleRevoke,
  setPreviewCert,
  load,
  badgeStyle,
  tokens,
  BRAND,
  skBg
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: tokens.card, border: `1px solid ${tokens.border}`, boxShadow: tokens.shadow }}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
              <th className="px-5 py-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 cursor-pointer accent-brand"
                />
              </th>
              {['STUDENT', 'EVENT', 'ISSUED DATE', 'VERIFY CODE', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} className="px-5 py-4 text-[11px] font-bold tracking-wider" style={{ color: tokens.txtSec }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i} style={{ borderBottom: `1px solid ${tokens.border}` }}>
                  <td className="px-5 py-4"><div className="w-4 h-4 rounded" style={{ background: skBg }} /></td>
                  <td className="px-5 py-4"><div className="w-28 h-3.5 rounded" style={{ background: skBg }} /></td>
                  <td className="px-5 py-4"><div className="w-32 h-3.5 rounded" style={{ background: skBg }} /></td>
                  <td className="px-5 py-4"><div className="w-20 h-3.5 rounded" style={{ background: skBg }} /></td>
                  <td className="px-5 py-4"><div className="w-28 h-3.5 rounded" style={{ background: skBg }} /></td>
                  <td className="px-5 py-4"><div className="w-16 h-5 rounded-full" style={{ background: skBg }} /></td>
                  <td className="px-5 py-4"><div className="w-20 h-7 rounded ml-auto" style={{ background: skBg }} /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-12 text-center">
                  <Award size={40} className="block mx-auto mb-3" style={{ color: tokens.txtMuted }} />
                  <p className="text-[14px] font-medium" style={{ color: tokens.txtSec }}>No certificates found</p>
                </td>
              </tr>
            ) : (
              filtered.map((cert, i) => {
                const badge = badgeStyle(cert.status)
                const isSelected = selected.includes(cert.id)
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
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(cert.id)}
                        className="w-4 h-4 cursor-pointer accent-brand"
                      />
                    </td>
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
                        {cert.status === 'Pending' && (
                          <button
                            onClick={() => handleGenerate(cert)}
                            title="Generate Certificate"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-all duration-150 text-white"
                            style={{ background: BRAND }}
                          ><Zap size={11} /> Generate</button>
                        )}
                        {cert.status === 'Generated' && (
                          <button
                            onClick={() => handleSend([cert.id])}
                            title="Send via Email"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-all duration-150 text-white"
                            style={{ background: '#00BC7D' }}
                          ><Send size={11} /> Send</button>
                        )}
                        {cert.status === 'Sent' && (
                          <button
                            onClick={() => handleRevoke(cert.id)}
                            title="Revoke Certificate"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-all duration-150"
                            style={{ border: `1px solid ${tokens.border}`, color: tokens.txtSec, background: 'transparent' }}
                          ><RotateCcw size={11} /> Revoke</button>
                        )}
                        <button
                          onClick={() => setPreviewCert(cert)}
                          title="Preview Certificate"
                          className="w-[28px] h-[28px] rounded-lg border bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
                          style={{ borderColor: tokens.border, color: tokens.txtSec }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.txtSec }}
                        ><Eye size={12} /></button>
                        <button
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
            )}
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
