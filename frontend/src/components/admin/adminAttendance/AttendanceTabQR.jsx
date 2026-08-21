import { useState, useEffect } from 'react'
import { Loader2, QrCode, Download, Share2, Printer, AlertCircle, RefreshCw } from 'lucide-react'
import CustomSelect from '../../common/CustomSelect'

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

function QrFormSection({ cardStyle, labelStyle, inputStyle, selectedEvent, setSelectedEvent, setQrGenerated, setImgFailed, handleGenerateQR, isBeforeStart, qrLoading, brandColor, eventsList, dark }) {
  return (
    <div className="rounded-2xl p-6 border" style={cardStyle}>
      <h2 className="text-[17px] font-extrabold mb-5">QR Code Generator</h2>

      <div className="mb-6">
        <CustomSelect
          id="qr-select-event"
          label="Select Event"
          value={selectedEvent}
          onChange={(e, val) => { setSelectedEvent(val); setQrGenerated(false) }}
          placeholder={eventsList.length === 0 ? 'No upcoming or ongoing events available' : 'Select an event'}
          options={(eventsList || []).map(ev => ({ value: ev.id, label: ev.name }))}
          dark={dark}
        />
      </div>

      <button
        type="button"
        onClick={() => { setImgFailed(false); handleGenerateQR() }}
        disabled={isBeforeStart || qrLoading}
        className="w-full py-3 rounded-xl text-[14px] font-bold text-white border-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        style={{ background: brandColor, boxShadow: isBeforeStart ? 'none' : '0 4px 16px rgba(97,95,255,0.35)' }}
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
  )
}

function QrExpiredView({ dark, labelStyle, setImgFailed, handleGenerateQR, isBeforeStart, qrLoading, brandColor }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-4 animate-fadeIn">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 border shadow-xs"
        style={{
          background: dark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
          color: dark ? '#fbbf24' : '#d97706',
          borderColor: dark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a'
        }}
      >
        <AlertCircle size={28} />
      </div>
      <h3 className="text-[16px] font-extrabold mb-1" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
        QR Code Expired
      </h3>
      <p className="text-[12.5px] font-medium mb-5 max-w-[290px] leading-relaxed" style={labelStyle}>
        The 15-minute validity window for this QR code has ended. Please click below to generate a new QR code.
      </p>
      <button
        type="button"
        onClick={() => { setImgFailed(false); handleGenerateQR() }}
        disabled={isBeforeStart || qrLoading}
        className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white border-none transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
        style={{ background: brandColor, boxShadow: '0 4px 14px rgba(97,95,255,0.35)' }}
      >
        {qrLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        Re-generate QR Code
      </button>
    </div>
  )
}

function QrActiveView({ dark, displayQrUrl, setImgFailed, selectedEvtName, labelStyle, countdown, fmtCountdown, brandColor, qrImageUrl, selectedEvent, inputStyle, showToast, handlePrintQR }) {
  return (
    <>
      <div className="mb-5 p-3 rounded-2xl flex items-center justify-center" style={{ background: dark ? '#060e1c' : '#f8fafc' }}>
        <img
          src={displayQrUrl}
          alt="Event QR Code"
          onError={() => setImgFailed(true)}
          className="w-[160px] h-[160px] rounded-lg object-contain"
        />
      </div>

      <p className="text-[15px] font-extrabold mb-1 text-center">{selectedEvtName}</p>

      <p className="text-[12px] font-semibold mb-5 text-center" style={labelStyle}>
        <span>15-Minute Validity Window</span>
        {countdown > 0 && (
          <span> · Expires in <span style={{ color: brandColor, fontVariantNumeric: 'tabular-nums' }}>{fmtCountdown(countdown)}</span></span>
        )}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2.5 w-full mt-2">
        {qrImageUrl ? (
          <a
            href={qrImageUrl}
            download={`qrcode_${selectedEvent}.png`}
            className="flex-1 min-w-[110px] sm:min-w-0 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold border cursor-pointer transition-all hover:opacity-80 active:scale-95 text-center"
            style={{ ...inputStyle, textDecoration: 'none' }}
          >
            <Download size={14} style={labelStyle} /> Download
          </a>
        ) : (
          <button
            type="button"
            onClick={() => showToast('QR code downloaded!', 'success')}
            className="flex-1 min-w-[110px] sm:min-w-0 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold border cursor-pointer transition-all hover:opacity-80 active:scale-95"
            style={inputStyle}
          >
            <Download size={14} style={labelStyle} /> Download
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: selectedEvtName, text: 'Attendance QR Code' }).catch(() => { /* ignore */ })
            } else {
              navigator.clipboard.writeText(window.location.href)
              showToast('Link copied to clipboard!', 'success')
            }
          }}
          className="flex-1 min-w-[110px] sm:min-w-0 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold border cursor-pointer transition-all hover:opacity-80 active:scale-95"
          style={inputStyle}
        >
          <Share2 size={14} style={labelStyle} /> Share
        </button>
        <button
          type="button"
          onClick={handlePrintQR}
          className="flex-1 min-w-[110px] sm:min-w-0 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold border cursor-pointer transition-all hover:opacity-80 active:scale-95"
          style={inputStyle}
        >
          <Printer size={14} style={labelStyle} /> Print
        </button>
      </div>
    </>
  )
}

export default function AttendanceTabQR({
  eventsList = [],
  qrImageUrl = null,
  handleGenerateQR,
  selectedEvent,
  setSelectedEvent,
  qrGenerated,
  setQrGenerated,
  qrLoading,
  countdown,
  showToast,
  selectedEvtName,
  dark,
  BRAND,
  cardStyle,
  inp,
  label,
  fmtCountdown,
  qrExpired = false
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    queueMicrotask(() => {
      setImgFailed(false)
      setNow(Date.now())
    })
  }, [selectedEvent, qrImageUrl, qrGenerated])

  const selectedEventObj = (eventsList || []).find(e => String(e.id) === String(selectedEvent))
  const rawStart = selectedEventObj?.start_datetime || selectedEventObj?.startDateTime || selectedEventObj?.date
  const startDateObj = rawStart ? new Date(rawStart) : null
  const isBeforeStart = Boolean(startDateObj && !Number.isNaN(startDateObj.getTime()) && now < startDateObj.getTime())

  // Only display dynamic QR URL when generated and not before start
  const displayQrUrl = (qrGenerated && qrImageUrl) ? qrImageUrl : null

  const handlePrintQR = () => {
    if (!displayQrUrl) {
      showToast('No active QR code to print.', 'error')
      return
    }

    const printWindow = window.open('', '_blank', 'width=600,height=750')
    if (!printWindow) {
      showToast('Pop-up blocked. Please allow pop-ups to print QR code.', 'error')
      return
    }

    printWindow.document.open()
    printWindow.document.body.innerHTML = `
      <div style="font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; padding: 20px; text-align: center;">
        <div style="border: 2px solid #e2e8f0; border-radius: 24px; padding: 40px 32px; max-width: 400px; width: 100%;">
          <div style="font-size: 12px; font-weight: 800; color: #615FFF; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px;">CampusConnect • Attendance Pass</div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; display: inline-flex; margin-bottom: 24px;">
            <img src="${displayQrUrl}" style="width: 220px; height: 220px; object-fit: contain;" alt="Event QR Code" />
          </div>
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">${selectedEvtName || 'Campus Event'}</h2>
          <p style="font-size: 13px; color: #64748b; font-weight: 600; margin: 0 0 20px 0;">Scan using CampusConnect App to mark attendance</p>
          <div style="font-size: 12px; font-weight: 700; color: #475569; background: #f1f5f9; padding: 10px 18px; border-radius: 12px; display: inline-block;">⏱ 15-Minute Validity Window</div>
        </div>
      </div>
    `
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 300)
  }

  const renderPreviewContent = () => {
    if (qrExpired || imgFailed) {
      return (
        <QrExpiredView
          dark={dark}
          labelStyle={label}
          setImgFailed={setImgFailed}
          handleGenerateQR={handleGenerateQR}
          isBeforeStart={isBeforeStart}
          qrLoading={qrLoading}
          brandColor={BRAND}
        />
      )
    }

    if (qrGenerated && displayQrUrl) {
      return (
        <QrActiveView
          dark={dark}
          displayQrUrl={displayQrUrl}
          setImgFailed={setImgFailed}
          selectedEvtName={selectedEvtName}
          labelStyle={label}
          countdown={countdown}
          fmtCountdown={fmtCountdown}
          brandColor={BRAND}
          qrImageUrl={qrImageUrl}
          selectedEvent={selectedEvent}
          inputStyle={inp}
          showToast={showToast}
          handlePrintQR={handlePrintQR}
        />
      )
    }

    return (
      <>
        <div className="mb-3 opacity-20"><QrPlaceholder size={100} color={dark ? '#7a98bb' : '#94a3b8'} /></div>
        <p className="text-[13px] font-semibold" style={label}>Select an event and generate a QR code</p>
      </>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* left: form */}
      <QrFormSection
        cardStyle={cardStyle}
        labelStyle={label}
        inputStyle={inp}
        selectedEvent={selectedEvent}
        setSelectedEvent={setSelectedEvent}
        setQrGenerated={setQrGenerated}
        setImgFailed={setImgFailed}
        handleGenerateQR={handleGenerateQR}
        isBeforeStart={isBeforeStart}
        qrLoading={qrLoading}
        brandColor={BRAND}
        eventsList={eventsList}
        dark={dark}
      />

      {/* right: preview */}
      <div className="rounded-2xl p-6 border flex flex-col items-center justify-center min-h-[280px] gap-0" style={cardStyle}>
        {renderPreviewContent()}
      </div>
    </div>
  )
}
