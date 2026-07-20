import React, { useState, useEffect, useRef } from 'react'
import { X, Check, QrCode, Camera, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import studentService from '../../services/studentService'
import { Html5Qrcode } from 'html5-qrcode'

export default function QRScannerModal({ isOpen, onClose, onAttendanceConfirmed, user }) {
  const { dark, accentColor } = useTheme()
  const BRAND = accentColor || '#615FFF'
  const showToast = useToast()

  // Steps: 1 = Initializing, 2 = Scanning, 3 = Verifying (loading), 4 = Success
  const [step, setStep] = useState(1)
  const [scannedEventName, setScannedEventName] = useState('')
  const [scanError, setScanError] = useState('')

  // Store fetched data in refs so scanner effect doesn't re-run when they arrive
  const registrationsRef = useRef([])
  const eventsListRef = useRef([])

  // Pre-load data to match event names and registration IDs when QR is scanned
  useEffect(() => {
    if (!isOpen) return

    setStep(1)
    setScanError('')
    setScannedEventName('')
    registrationsRef.current = []
    eventsListRef.current = []

    Promise.all([
      studentService.fetchMyRegistrations(),
      studentService.fetchEventsData()
    ]).then(([regRes, evRes]) => {
      if (regRes.success) registrationsRef.current = regRes.data || []
      if (evRes.success) eventsListRef.current = evRes.data || []
    }).catch(err => {
          })

    const t1 = setTimeout(() => {
      setStep(2)
    }, 900)

    return () => {
      clearTimeout(t1)
    }
  }, [isOpen])

  // Camera QR Scanner effect
  useEffect(() => {
    if (step !== 2 || !isOpen) return

    let html5QrCode = null
    const timer = setTimeout(() => {
      try {
        html5QrCode = new Html5Qrcode("qr-reader")

        const qrCodeSuccessCallback = async (decodedText) => {
          // 1. Instantly stop scanner
          try {
            if (html5QrCode && html5QrCode.isScanning) {
              await html5QrCode.stop()
              html5QrCode.clear()
            }
          } catch (stopErr) {
                      }

          // 2. Transition to Step 3: Verifying (loading)
          setStep(3)
          setScanError('')

          // Parse decodedText — backend encodes QR as deep link URL:
          //   campusconnect://checkin?event_id=<uuid>
          // Also supports JSON: {"event_id": "...", "registration_id": "..."}
          // Or plain event_id string fallback
          let scannedEventId = decodedText.trim()
          let scannedRegId = ''

          const rawText = decodedText.trim()

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
          // Find matching event name from ref (no re-render dependency)
          const matchingEvent = eventsListRef.current.find(e => String(e.id || e.event_id) === String(scannedEventId))
          const eventName = matchingEvent?.title || matchingEvent?.name || `Event (${scannedEventId})`
          setScannedEventName(eventName)

          // If no registration_id from QR, try matching from cached registrations ref
          if (!scannedRegId) {
            const matchingReg = registrationsRef.current.find(r =>
              String(r.event_id) === String(scannedEventId) || String(r.eventId) === String(scannedEventId)
            )
            scannedRegId = matchingReg?.id || matchingReg?.registration_id || ''
          }

          // 3. Make API check-in call — POST /api/v1/attendance/check-in
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
          () => { } // silent scan fails
        ).catch(err => {
          setScanError('Could not access camera. Please check camera permissions.')
        })

      } catch (err) {
      }
    }, 150)

    return () => {
      clearTimeout(timer)
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear()
        }).catch(err => {
        })
      }
    }
  }, [step, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl transition-colors duration-300 shadow-2xl overflow-hidden p-6 sm:p-7"
        style={{
          background: dark ? '#0a1220' : '#ffffff',
          border: `1px solid ${dark ? '#1a2942' : '#e2e8f0'}`,
          color: dark ? '#f8fafc' : '#0f172a',
          animation: 'modalScaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-[#162740]">
          <h3 className="text-lg font-bold m-0 text-slate-900 dark:text-white">
            QR Attendance Scanner
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#15243c] border-none bg-transparent cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper (3 Steps: 1. Init, 2. Scan, 3. Done) */}
        <div className="flex items-center justify-between py-5 px-3 border-b border-slate-100 dark:border-[#162740]">
          {/* Step 1: Camera Init */}
          <div className="flex items-center gap-2">
            {step > 1 ? (
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                <Check size={12} strokeWidth={3} />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </div>
            )}
            <span className={`text-xs font-bold ${step >= 1 ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
              Camera
            </span>
          </div>

          {/* Step 2: Scanning */}
          <div className="flex items-center gap-2">
            {step > 2 ? (
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                <Check size={12} strokeWidth={3} />
              </div>
            ) : (
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-[#16253c] text-slate-400'}`}>
                2
              </div>
            )}
            <span className={`text-xs font-bold ${step >= 2 ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-[#527096]'}`}>
              Scanning
            </span>
          </div>

          {/* Step 3: Done */}
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 4 ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-[#111c2e] text-slate-400'}`}>
              3
            </div>
            <span className={`text-xs font-bold ${step === 4 ? 'text-emerald-500' : 'text-slate-400'}`}>
              Done
            </span>
          </div>
        </div>

        {/* STEP 1: INITIALIZING CAMERA */}
        {step === 1 && (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-md animate-pulse">
              <Camera size={28} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                Starting Camera...
              </h4>
              <p className="text-xs text-slate-500 dark:text-[#6a87ad] mt-1 m-0">
                Initializing video device stream and permissions.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 mt-2">
              <Loader2 size={14} className="animate-spin" />
              <span>Please wait</span>
            </div>
          </div>
        )}

        {/* STEP 2: SCANNING VIEW */}
        {step === 2 && (
          <div className="py-6 text-center flex flex-col items-center justify-center gap-4">
            {scanError && (
              <div className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 dark:bg-red-950/20 border border-red-500/20 text-red-600 dark:text-red-400 text-xs text-left mb-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            {/* Live Camera Scanner Box */}
            <div className="relative w-full max-w-[280px] rounded-2xl bg-black border-2 border-indigo-500/30 overflow-hidden shadow-inner">
              <div id="qr-reader" className="w-full" />
              <div className="absolute inset-x-0 h-0.5 bg-indigo-400 shadow-[0_0_10px_#6366f1] animate-scanLaser pointer-events-none" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                Scan Organizer Event QR
              </h4>
              <p className="text-xs text-slate-500 dark:text-[#6a87ad] mt-1 m-0">
                Align the QR code inside the box to record your attendance.
              </p>
            </div>

            <div className="w-full mt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#131f33] border border-slate-200 dark:border-[#1f314d] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#192b47] cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: VERIFYING / SUBMITTING API CALL */}
        {step === 3 && (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-4 animate-pulse">
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
    </div>
  )
}
