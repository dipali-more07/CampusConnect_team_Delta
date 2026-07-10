import React from 'react'
import { RefreshCw, ScanLine, Camera, ZapOff, Play, Wifi, Loader2 } from 'lucide-react'

export default function AttendanceTabScan({
  scannerActive,
  setScannerActive,
  recentScans,
  scansLoading,
  loadRecentScans,
  dark,
  BRAND,
  cardStyle,
  inp,
  label,
  showToast,
  getInitials,
  badgeStyle
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Camera View */}
      <div className="rounded-2xl border overflow-hidden flex flex-col" style={cardStyle}>
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-[17px] font-extrabold m-0">QR Scanner</h2>
        </div>

        {/* Camera viewport */}
        <div
          className="mx-5 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-3 flex-1"
          style={{
            background: '#0d1117',
            minHeight: 260,
            border: `1px solid ${scannerActive ? BRAND : '#1e2d3d'}`,
            boxShadow: scannerActive ? `0 0 0 2px ${BRAND}40` : 'none',
            transition: 'all .3s',
          }}
        >
          {scannerActive ? (
            <>
              {/* Scanning animation */}
              <div className="relative w-32 h-32">
                <div
                  className="absolute inset-0 rounded-xl border-2 opacity-60"
                  style={{ borderColor: BRAND }}
                />
                {/* corner brackets */}
                {[['top-0 left-0', 'border-t-2 border-l-2'], ['top-0 right-0', 'border-t-2 border-r-2'], ['bottom-0 left-0', 'border-b-2 border-l-2'], ['bottom-0 right-0', 'border-b-2 border-r-2']].map(([pos, cls], i) => (
                  <div key={i} className={`absolute w-5 h-5 ${pos} ${cls} rounded-sm`} style={{ borderColor: BRAND }} />
                ))}
                {/* scanning line */}
                <div
                  className="absolute left-2 right-2 h-0.5 rounded-full"
                  style={{
                    background: BRAND,
                    animation: 'scanLine 1.8s ease-in-out infinite',
                    top: '50%',
                  }}
                />
                <ScanLine size={32} className="absolute inset-0 m-auto" style={{ color: BRAND, opacity: 0.5 }} />
              </div>
              <p className="text-[13px] font-semibold" style={{ color: BRAND }}>Scanning… Point at QR code</p>
            </>
          ) : (
            <>
              <Camera size={36} className="opacity-30" style={{ color: '#7a98bb' }} />
              <p className="text-[13px] font-semibold opacity-50" style={{ color: '#7a98bb' }}>Camera not active</p>
            </>
          )}
        </div>

        {/* Start / Stop button */}
        <div className="p-5">
          <button
            onClick={() => {
              setScannerActive(prev => {
                if (!prev) showToast('Scanner started!', 'success')
                else showToast('Scanner stopped.', 'info')
                return !prev
              })
            }}
            className="w-full py-3 rounded-xl text-[14px] font-bold text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all"
            style={{
              background: scannerActive ? '#FB2C36' : BRAND,
              boxShadow: `0 4px 16px ${scannerActive ? 'rgba(251,44,54,.35)' : 'rgba(97,95,255,.35)'}`,
            }}
          >
            {scannerActive ? <ZapOff size={16} /> : <Play size={16} />}
            {scannerActive ? 'Stop Scanner' : 'Start Scanner'}
          </button>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="rounded-2xl border flex flex-col" style={cardStyle}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-extrabold m-0">Recent Scans</h2>
          <button
            onClick={loadRecentScans}
            className="w-8 h-8 rounded-lg flex items-center justify-center border cursor-pointer transition-all hover:opacity-70"
            style={inp}
            title="Refresh"
          >
            <RefreshCw size={13} style={label} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1" style={{ maxHeight: 360 }}>
          {scansLoading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 border-t" style={{ borderColor: dark ? '#1a3050' : '#f1f5f9' }}>
                <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: dark ? '#1a3050' : '#f1f5f9', flexShrink: 0 }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded animate-pulse w-28" style={{ background: dark ? '#1a3050' : '#f1f5f9' }} />
                  <div className="h-2.5 rounded animate-pulse w-20" style={{ background: dark ? '#1a3050' : '#f1f5f9' }} />
                </div>
              </div>
            ))
          ) : recentScans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <ScanLine size={32} className="text-slate-400 opacity-40" />
              <p className="text-[13px] font-semibold" style={label}>No scans yet</p>
            </div>
          ) : recentScans.map((scan, idx) => {
            const badge = badgeStyle(scan.status)
            return (
              <div
                key={scan.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/30"
                style={{ borderTop: idx === 0 ? 'none' : `1px solid ${dark ? '#1a3050' : '#f1f5f9'}` }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-extrabold shrink-0"
                  style={{ background: scan.avatarColor }}
                >
                  {getInitials(scan.studentName)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold m-0 truncate">{scan.studentName}</p>
                  <p className="text-[12px] font-semibold m-0 truncate" style={label}>{scan.rollNo}</p>
                </div>

                {/* Status + time */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                    style={{ background: badge.bg, color: badge.text }}
                  >
                    {scan.status}
                  </span>
                  <span className="text-[11px] font-semibold" style={label}>{scan.time}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* footer count */}
        {!scansLoading && recentScans.length > 0 && (
          <div className="px-5 py-3 text-[12px] font-semibold border-t flex items-center gap-2"
            style={{ borderColor: dark ? '#1a3050' : '#f1f5f9', color: dark ? '#7a98bb' : '#94a3b8' }}>
            <Wifi size={11} style={{ color: BRAND }} />
            {recentScans.length} scans recorded this session
          </div>
        )}
      </div>

      {/* scanning line keyframe style tag */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 10% }
          50%  { top: 85% }
          100% { top: 10% }
        }
      `}</style>
    </div>
  )
}
