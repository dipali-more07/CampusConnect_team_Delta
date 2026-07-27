import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, QrCode, Camera, CheckCircle2, Loader2, AlertCircle, Calendar, Sparkles } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import studentService from '../../services/studentService'
import { Html5Qrcode } from 'html5-qrcode'

export default function QRScannerModal({ isOpen, onClose, onAttendanceConfirmed, user }) {
  const { dark, accentColor } = useTheme()
  const BRAND = accentColor || '#615FFF'
  const showToast = useToast()

  // Steps: 1 = Event Selection & Init, 2 = Camera Scanning, 3 = Verifying API, 4 = Success
  const [step, setStep] = useState(1)
  const [eventsList, setEventsList] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [scannedEventName, setScannedEventName] = useState('')
  const [scanError, setScanError] = useState('')
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false)

  // Store fetched data in refs so scanner effect doesn't re-run unexpectedly
  const registrationsRef = useRef([])
  const eventsListRef = useRef([])

  // Load registered events on modal open
  useEffect(() => {
    if (!isOpen) return

    setStep(1)
    setScanError('')
    setScannedEventName('')
    setSelectedEventId('')
    setLoadingEvents(true)
    registrationsRef.current = []
    eventsListRef.current = []

    Promise.all([
      studentService.fetchEventsData(),
      studentService.fetchMyRegistrations()
    ]).then(([evRes, regRes]) => {
      let allEvs = []
      let myRegs = []

      if (evRes.success && Array.isArray(evRes.data)) {
        allEvs = evRes.data
        eventsListRef.current = evRes.data
      }

      if (regRes.success && Array.isArray(regRes.data)) {
        myRegs = regRes.data
        registrationsRef.current = regRes.data
      }

      // Filter events that student registered for, or default to all events
      const registeredIds = new Set(myRegs.map(r => String(r.event_id || r.eventId || r.event?.id)))
      const userEvList = allEvs.filter(e => registeredIds.has(String(e.id || e.event_id)) || e.registered)

      setEventsList(userEvList.length > 0 ? userEvList : allEvs)
      if (userEvList.length > 0) {
        setSelectedEventId(String(userEvList[0].id || userEvList[0].event_id))
      }
    }).catch(_err => {})
    .finally(() => {
      setLoadingEvents(false)
    })
  }, [isOpen])

  // Camera QR Scanner effect
  useEffect(() => {
    if (step !== 2 || !isOpen) return

    let html5QrCode = null
    const timer = setTimeout(() => {
      try {
        html5QrCode = new Html5Qrcode("qr-reader")

        const qrCodeSuccessCallback = async (decodedText) => {
          try {
            if (html5QrCode && html5QrCode.isScanning) {
              await html5QrCode.stop()
              html5QrCode.clear()
            }
          } catch (_stopErr) {}

          setStep(3)
          setScanError('')

          let scannedEventId = selectedEventId || decodedText.trim()
          let scannedRegId = ''

          const rawText = decodedText.trim()

          if (!selectedEventId) {
            if (rawText.startsWith('campusconnect://') || rawText.includes('event_id=')) {
              try {
                const normalized = rawText.replace(/^campusconnect:\/\//, 'https://campusconnect.app/')
                const url = new URL(normalized)
                scannedEventId = url.searchParams.get('event_id') || rawText
                scannedRegId = url.searchParams.get('registration_id') || ''
              } catch (_urlErr) {
                const match = rawText.match(/event_id=([^&\s'"]+)/)
                if (match) scannedEventId = match[1]
                const regMatch = rawText.match(/registration_id=([^&\s'"]+)/)
                if (regMatch) scannedRegId = regMatch[1]
              }
            } else {
              try {
                const parsed = JSON.parse(rawText)
                scannedEventId = parsed.event_id || parsed.eventId || rawText
                scannedRegId = parsed.registration_id || parsed.registrationId || ''
              } catch (_e) {
                scannedEventId = rawText
              }
            }
          }

          const matchingEvent = eventsListRef.current.find(e => String(e.id || e.event_id) === String(scannedEventId))
          const eventName = matchingEvent?.title || matchingEvent?.name || `Event (${scannedEventId})`
          setScannedEventName(eventName)

          if (!scannedRegId) {
            const matchingReg = registrationsRef.current.find(r =>
              String(r.event_id || r.eventId || r.event?.id) === String(scannedEventId)
            )
            scannedRegId = matchingReg?.id || matchingReg?.registration_id || ''
          }

          const res = await studentService.selfCheckIn(scannedRegId, scannedEventId)

          if (res.success) {
            setStep(4)
            showToast('Attendance recorded successfully!', 'success')
            setTimeout(() => {
              if (onAttendanceConfirmed) onAttendanceConfirmed(res.data)
              onClose()
            }, 2000)
          } else {
            setScanError(res.message || 'Check-in failed. Please verify you are registered.')
            setStep(2)
          }
        }

        html5QrCode.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: { width: 220, height: 220 } },
          qrCodeSuccessCallback,
          () => { }
        ).catch(_err => {
          setScanError('Could not access camera. Please check camera permissions.')
        })

      } catch (_err) {}
    }, 150)

    return () => {
      clearTimeout(timer)
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear()
        }).catch(() => {})
      }
    }
  }, [step, isOpen, selectedEventId])

  // Direct manual checkin helper
  const handleDirectCheckIn = async () => {
    if (!selectedEventId) {
      showToast('Please select an event from the dropdown list.', 'error')
      return
    }

    setSubmittingCheckIn(true)
    setScanError('')

    const matchingEvent = eventsListRef.current.find(e => String(e.id || e.event_id) === String(selectedEventId))
    const eventName = matchingEvent?.title || matchingEvent?.name || 'Selected Event'
    setScannedEventName(eventName)

    const matchingReg = registrationsRef.current.find(r =>
      String(r.event_id || r.eventId || r.event?.id) === String(selectedEventId)
    )
    const scannedRegId = matchingReg?.id || matchingReg?.registration_id || ''

    try {
      const res = await studentService.selfCheckIn(scannedRegId, selectedEventId)
      if (res.success) {
        setStep(4)
        showToast('Attendance recorded successfully!', 'success')
        setTimeout(() => {
          if (onAttendanceConfirmed) onAttendanceConfirmed(res.data)
          onClose()
        }, 1800)
      } else {
        setScanError(res.message || 'Check-in failed for selected event.')
      }
    } catch (_err) {
      setScanError('Check-in error. Please try again.')
    } finally {
      setSubmittingCheckIn(false)
    }
  }

  if (!isOpen) return null

  const selectedEventObj = eventsList.find(e => String(e.id || e.event_id) === String(selectedEventId))

  return createPortal(
    <div
      className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modal Dialog */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl transition-colors duration-300 shadow-2xl overflow-hidden p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
        style={{
          background: dark ? '#0a1220' : '#ffffff',
          border: `1px solid ${dark ? '#1a2942' : '#e2e8f0'}`,
          color: dark ? '#f8fafc' : '#0f172a',
          animation: 'modalScaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#162740]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md" style={{ background: BRAND }}>
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold m-0 text-slate-900 dark:text-white">
                QR Attendance Scanner
              </h3>
              <p className="text-[11px] font-medium m-0 text-slate-500 dark:text-slate-400">
                Select event &amp; scan QR for check-in
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#15243c] border-none bg-transparent cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper (3 Steps: 1. Select & Init, 2. Scan, 3. Done) */}
        <div className="flex items-center justify-between py-4 px-2 border-b border-slate-100 dark:border-[#162740]">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
              {step > 1 ? <Check size={12} strokeWidth={3} /> : '1'}
            </div>
            <span className={`text-xs font-bold ${step >= 1 ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
              Select Event
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-[#16253c] text-slate-400'}`}>
              {step > 2 ? <Check size={12} strokeWidth={3} /> : '2'}
            </div>
            <span className={`text-xs font-bold ${step >= 2 ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
              Scan QR
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 4 ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-[#111c2e] text-slate-400'}`}>
              3
            </div>
            <span className={`text-xs font-bold ${step === 4 ? 'text-emerald-500' : 'text-slate-400'}`}>
              Done
            </span>
          </div>
        </div>

        {/* STEP 1: EVENT SELECTION */}
        {step === 1 && (
          <div className="py-5 flex flex-col gap-4">
            {scanError && (
              <div className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            {/* Select Event Field */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-700 dark:text-slate-300">
                📌 Choose Event for Attendance Scan:
              </label>

              {loadingEvents ? (
                <div className="flex items-center gap-2 py-3 px-4 rounded-xl border border-slate-200 dark:border-[#1a2942] text-xs font-medium text-slate-400">
                  <Loader2 size={14} className="animate-spin text-indigo-500" />
                  Loading your registered events...
                </div>
              ) : (
                <select
                  value={selectedEventId}
                  onChange={e => setSelectedEventId(e.target.value)}
                  className="w-full py-3 px-3.5 rounded-2xl text-xs font-bold border transition-colors outline-none cursor-pointer"
                  style={{
                    background: dark ? '#132035' : '#f8fafc',
                    borderColor: dark ? '#1e3250' : '#cbd5e1',
                    color: dark ? '#ffffff' : '#0f172a'
                  }}
                >
                  <option value="">✨ Auto-Detect Event from QR Code</option>
                  {eventsList.map(ev => (
                    <option key={ev.id || ev.event_id} value={ev.id || ev.event_id}>
                      {ev.title || ev.name || 'Campus Event'} {ev.date ? `(${ev.date})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selected Event Details Preview Card */}
            {selectedEventObj && (
              <div className="p-3.5 rounded-2xl border flex items-center gap-3 bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/20">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ background: BRAND }}>
                  <Calendar size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate m-0 text-slate-900 dark:text-white">
                    {selectedEventObj.title || selectedEventObj.name}
                  </p>
                  <p className="text-[11px] font-medium m-0 text-slate-500 dark:text-slate-400 truncate">
                    {selectedEventObj.venue || 'Campus Venue'} · {selectedEventObj.date || 'Today'}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Registered
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-2xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99]"
                style={{ background: BRAND }}
              >
                <Camera size={16} /> Open Camera QR Scanner
              </button>

              {selectedEventId && (
                <button
                  type="button"
                  onClick={handleDirectCheckIn}
                  disabled={submittingCheckIn}
                  className="w-full py-2.5 rounded-2xl font-bold text-xs border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 cursor-pointer flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {submittingCheckIn ? (
                    <><Loader2 size={14} className="animate-spin" /> Recording Check-In...</>
                  ) : (
                    <><Sparkles size={14} /> Quick Self Check-In for Selected Event</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: SCANNING VIEW */}
        {step === 2 && (
          <div className="py-4 text-center flex flex-col items-center justify-center gap-3">
            {/* Selected event notification badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Sparkles size={12} />
              {selectedEventObj ? `Scanning for: ${selectedEventObj.title}` : 'Auto-Detecting Event QR'}
            </div>

            {scanError && (
              <div className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs text-left mb-1">
                <AlertCircle size={14} className="shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            {/* Live Camera Scanner Box */}
            <div className="relative w-full max-w-[260px] rounded-2xl bg-black border-2 border-indigo-500/30 overflow-hidden shadow-inner">
              <div id="qr-reader" className="w-full" />
              <div className="absolute inset-x-0 h-0.5 bg-indigo-400 shadow-[0_0_10px_#6366f1] animate-scanLaser pointer-events-none" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                Point Camera at Event QR Code
              </h4>
              <p className="text-xs text-slate-500 dark:text-[#6a87ad] mt-1 m-0">
                Align the QR code inside the frame to mark attendance.
              </p>
            </div>

            <div className="w-full flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#1f314d] text-slate-700 dark:text-slate-200 bg-transparent hover:bg-slate-100 dark:hover:bg-[#132035] cursor-pointer"
              >
                Change Event
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#131f33] border border-slate-200 dark:border-[#1f314d] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#192b47] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: VERIFYING / SUBMITTING API CALL */}
        {step === 3 && (
          <div className="py-10 text-center flex flex-col items-center justify-center gap-4 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                Verifying Attendance...
              </h4>
              <p className="text-xs text-indigo-500 font-semibold mt-1.5 m-0">
                Checking in to: {scannedEventName}
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS VIEW */}
        {step === 4 && (
          <div className="py-10 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white m-0">
              Attendance Recorded!
            </h4>
            <p className="text-xs font-semibold text-slate-500 dark:text-[#6a87ad] max-w-[280px] mx-auto leading-relaxed">
              Your check-in for <strong className="text-indigo-500">{scannedEventName}</strong> has been successfully verified.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanLaser {
          0%   { top: 5%; }
          50%  { top: 95%; }
          100% { top: 5%; }
        }
        .animate-scanLaser {
          animation: scanLaser 2.2s ease-in-out infinite;
        }
        @keyframes modalScaleIn {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  )
}
