import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Award, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import eventsService from '../../../services/eventsService'

export default function CertBulkGenerateModal({
  open,
  onClose,
  onConfirm,
  certs,
  tokens,
  dark,
  BRAND,
  inputStyle
}) {
  const [selectedEventId, setSelectedEventId] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [eventsList, setEventsList] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedEventId('ALL')
    setLoadingEvents(true)
    eventsService.fetchAll()
      .then(res => {
        if (res.success && Array.isArray(res.events)) {
          setEventsList(res.events)
        }
      })
      .catch(err => {
        console.error('[CertBulkGenerateModal] Error fetching events:', err)
      })
      .finally(() => {
        setLoadingEvents(false)
      })
  }, [open])

  if (!open) return null

  // Count pending certificates for the selected event
  const pendingCount = certs.filter(c => {
    if (c.status !== 'Pending') return false
    if (selectedEventId === 'ALL') return true
    return c.eventId === selectedEventId
  }).length

  const handleSubmit = async () => {
    setLoading(true)
    await onConfirm(selectedEventId)
    setLoading(false)
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div
        className="rounded-[24px] w-full max-w-[450px] overflow-hidden"
        style={{
          background: dark ? '#0c1829' : '#ffffff',
          border: `1px solid ${dark ? '#1a3050' : '#e8edf5'}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          animation: 'slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5" style={{ borderBottom: `1px solid ${dark ? '#1a3050' : '#e8edf5'}` }}>
          <div className="flex items-center gap-2">
            <Award size={18} style={{ color: BRAND }} />
            <h2 className="text-[16px] font-extrabold m-0" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
              Bulk Generate Certificates
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
            style={{ color: dark ? '#4a6a8a' : '#94a3b8' }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = dark ? '#162640' : '#f1f5f9'; e.currentTarget.style.color = dark ? '#e8f0fe' : '#475569' } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dark ? '#4a6a8a' : '#94a3b8' }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-[12.5px] leading-relaxed m-0" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
            Select an event to generate participation certificates for all students who have pending certificates.
          </p>

          <div>
            <label className="text-[11.5px] font-bold block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
              Select Event
            </label>
            {loadingEvents ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#7a98bb] py-2">
                <Loader2 size={14} className="animate-spin text-indigo-500" />
                <span>Loading events list...</span>
              </div>
            ) : (
              <select
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none cursor-pointer transition-all duration-200"
                style={inputStyle}
              >
                <option value="ALL">All Events</option>
                {eventsList.map(evt => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Info Card */}
          <div
            className="p-3.5 rounded-xl flex items-start gap-2.5 text-[12.5px] font-semibold"
            style={{
              background: pendingCount > 0 ? (dark ? 'rgba(97,95,255,0.08)' : '#f5f3ff') : (dark ? 'rgba(0,188,125,0.08)' : '#f0fdf4'),
              border: `1px solid ${pendingCount > 0 ? (dark ? 'rgba(97,95,255,0.15)' : '#ddd6fe') : (dark ? 'rgba(0,188,125,0.15)' : '#bbf7d0')}`,
              color: pendingCount > 0 ? BRAND : '#00BC7D'
            }}
          >
            {pendingCount > 0 ? (
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
            )}
            <div>
              {pendingCount > 0 ? (
                <span>Found {pendingCount} pending certificate(s) to generate.</span>
              ) : (
                <span>No pending certificates found for this selection.</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#e8edf5'}` }}>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-[10px] text-[13px] font-bold border cursor-pointer bg-transparent transition-all duration-200"
            style={{ borderColor: dark ? '#1a3050' : '#e2e8f0', color: dark ? '#7a98bb' : '#64748b' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || pendingCount === 0}
            className="flex-1 py-2.5 rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: BRAND, boxShadow: `0 4px 14px ${BRAND}40` }}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Award size={14} />
            )}
            Generate
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
