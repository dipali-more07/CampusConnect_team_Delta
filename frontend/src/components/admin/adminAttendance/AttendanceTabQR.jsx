import React from 'react'
import { Loader2, QrCode, Download, Share2, Printer } from 'lucide-react'
import { ATTENDANCE_EVENTS } from '../../../data/attendanceData'

/* ─── tiny QR placeholder SVG ─── */
function QrPlaceholder({ size = 140, color = '#615FFF' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none">
      <rect x="4" y="4" width="56" height="56" rx="6" stroke={color} strokeWidth="6" fill="none" />
      <rect x="18" y="18" width="28" height="28" rx="3" fill={color} opacity=".25" />
      <rect x="80" y="4" width="56" height="56" rx="6" stroke={color} strokeWidth="6" fill="none" />
      <rect x="94" y="18" width="28" height="28" rx="3" fill={color} opacity=".25" />
      <rect x="4" y="80" width="56" height="56" rx="6" stroke={color} strokeWidth="6" fill="none" />
      <rect x="18" y="94" width="28" height="28" rx="3" fill={color} opacity=".25" />
      <rect x="80" y="80" width="14" height="14" rx="2" fill={color} />
      <rect x="100" y="80" width="14" height="14" rx="2" fill={color} />
      <rect x="120" y="16" width="2" height="14" rx="2" fill={color} />
      <rect x="80" y="100" width="14" height="14" rx="2" fill={color} />
      <rect x="100" y="100" width="36" height="14" rx="2" fill={color} />
      <rect x="80" y="120" width="30" height="16" rx="2" fill={color} />
      <rect x="116" y="120" width="20" height="16" rx="2" fill={color} />
    </svg>
  )
}

export default function AttendanceTabQR({
  eventsList = [],
  qrImageUrl = null,
  handleGenerateQR,
  selectedEvent,
  setSelectedEvent,
  selectedSession,
  setSelectedSession,
  qrGenerated,
  setQrGenerated,
  qrLoading,
  setQrLoading,
  countdown,
  startCountdown,
  showToast,
  selectedEvtName,
  dark,
  BRAND,
  cardStyle,
  inp,
  label,
  fmtCountdown
}) {
  const selectedEventObj = (eventsList || []).find(e => String(e.id) === String(selectedEvent))
  const rawStart = selectedEventObj?.start_datetime || selectedEventObj?.startDateTime || selectedEventObj?.date
  const startDateObj = rawStart ? new Date(rawStart) : null
  const isBeforeStart = startDateObj && !isNaN(startDateObj.getTime()) && Date.now() < startDateObj.getTime()

  // Use event's qrCodeImage if available and not before start
  const displayQrUrl = qrImageUrl || (!isBeforeStart ? selectedEventObj?.qrCodeImage : null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* left: form */}
      <div className="rounded-2xl p-6 border" style={cardStyle}>
        <h2 className="text-[17px] font-extrabold mb-5">QR Code Generator</h2>

        <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={label}>Select Event</label>
        <select
          value={selectedEvent}
          onChange={e => { setSelectedEvent(e.target.value); setQrGenerated(false) }}
          className="w-full px-3 py-2.5 rounded-xl text-[13px] mb-6 outline-none cursor-pointer"
          style={inp}
        >
          {(eventsList || []).map(ev => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </select>

        <button
          onClick={handleGenerateQR}
          disabled={isBeforeStart || qrLoading}
          className="w-full py-3 rounded-xl text-[14px] font-bold text-white border-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ background: BRAND, boxShadow: isBeforeStart ? 'none' : '0 4px 16px rgba(97,95,255,0.35)' }}
        >
          {qrLoading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
          {qrLoading ? 'Generating…' : 'Generate QR Code'}
        </button>

        {isBeforeStart && (
          <div className="mt-3 text-center text-xs font-extrabold text-amber-600 dark:text-amber-400 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            QR code will be available once the event starts.
          </div>
        )}
      </div>

      {/* right: preview */}
      <div className="rounded-2xl p-6 border flex flex-col items-center justify-center min-h-[280px] gap-0" style={cardStyle}>
        {qrGenerated || displayQrUrl ? (
          <>
            {/* QR image */}
            <div className="mb-5 p-3 rounded-2xl flex items-center justify-center" style={{ background: dark ? '#060e1c' : '#f8fafc' }}>
              {displayQrUrl ? (
                <img src={displayQrUrl} alt="Event QR Code" className="w-[160px] h-[160px] rounded-lg object-contain" />
              ) : (
                <QrPlaceholder size={160} color={dark ? '#e8f0fe' : '#0f172a'} />
              )}
            </div>

            {/* event name */}
            <p className="text-[15px] font-extrabold mb-1 text-center">{selectedEvtName}</p>

            {/* validity */}
            <p className="text-[12px] font-semibold mb-5 text-center" style={label}>
              <span>15-Minute Validity Window</span>
              {countdown > 0 && (
                <span> · Expires in <span style={{ color: BRAND, fontVariantNumeric: 'tabular-nums' }}>{fmtCountdown(countdown)}</span></span>
              )}
            </p>

            {/* action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full mt-2">
              {qrImageUrl ? (
                <a
                  href={qrImageUrl}
                  download={`qrcode_${selectedEvent}.png`}
                  className="flex-1 min-w-[110px] sm:min-w-0 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold border cursor-pointer transition-all hover:opacity-80 active:scale-95 text-center"
                  style={{ ...inp, textDecoration: 'none' }}
                >
                  <Download size={14} style={label} /> Download
                </a>
              ) : (
                <button
                  onClick={() => showToast('QR code downloaded!', 'success')}
                  className="flex-1 min-w-[110px] sm:min-w-0 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold border cursor-pointer transition-all hover:opacity-80 active:scale-95"
                  style={inp}
                >
                  <Download size={14} style={label} /> Download
                </button>
              )}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: selectedEvtName, text: 'Attendance QR Code' }).catch(() => { })
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                    showToast('Link copied to clipboard!', 'success')
                  }
                }}
                className="flex-1 min-w-[110px] sm:min-w-0 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold border cursor-pointer transition-all hover:opacity-80 active:scale-95"
                style={inp}
              >
                <Share2 size={14} style={label} /> Share
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 min-w-[110px] sm:min-w-0 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold border cursor-pointer transition-all hover:opacity-80 active:scale-95"
                style={inp}
              >
                <Printer size={14} style={label} /> Print
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-3 opacity-20"><QrPlaceholder size={100} color={dark ? '#7a98bb' : '#94a3b8'} /></div>
            <p className="text-[13px] font-semibold" style={label}>Select an event and generate a QR code</p>
          </>
        )}
      </div>
    </div>
  )
}
