import React, { useState, useEffect } from 'react'
import { X, Check, QrCode, Camera, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import studentService from '../../services/studentService'

export default function QRScannerModal({ isOpen, onClose, onAttendanceConfirmed, user }) {
  const { dark, accentColor } = useTheme()
  const BRAND = accentColor || '#615FFF'
  const showToast = useToast()

  // Steps: 1 = Camera, 2 = Scanning, 3 = Verify, 4 = Done
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    // Step 1: Camera initialization -> Auto progress to Step 2
    setStep(1)
    const t1 = setTimeout(() => {
      setStep(2)
    }, 900)

    // Step 2: Scanning -> Auto progress to Step 3
    const t2 = setTimeout(() => {
      setStep(3)
    }, 2400)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirmAttendance = async () => {
    setSubmitting(true)
    const res = await studentService.scanAttendanceQR('EVT001-NATIONAL-HACKATHON')
    setSubmitting(false)

    if (res.success) {
      setStep(4) // Move to step 4 Done
      showToast('Attendance recorded successfully!', 'success')
      setTimeout(() => {
        if (onAttendanceConfirmed) onAttendanceConfirmed(res.data)
        onClose()
      }, 1500)
    } else {
      showToast(res.message || 'Verification failed.', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        className="relative z-10 w-full max-w-lg rounded-3xl transition-colors duration-300 shadow-2xl overflow-hidden p-6 sm:p-7"
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

        {/* ── Stepper Bar (4 Steps) ── */}
        <div className="flex items-center justify-between py-6 px-1 sm:px-3 border-b border-slate-100 dark:border-[#162740]">
          {/* Step 1: Camera */}
          <div className="flex items-center gap-2">
            {step > 1 ? (
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                <Check size={14} strokeWidth={3} />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-extrabold shadow-sm">
                1
              </div>
            )}
            <span className={`text-xs font-extrabold ${step >= 1 ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
              Camera
            </span>
          </div>

          {/* Step 2: Scanning */}
          <div className="flex items-center gap-2">
            {step > 2 ? (
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                <Check size={14} strokeWidth={3} />
              </div>
            ) : (
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${step === 2 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-[#16253c] text-slate-400'}`}>
                2
              </div>
            )}
            <span className={`text-xs font-extrabold ${step >= 2 ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-[#527096]'}`}>
              Scanning
            </span>
          </div>

          {/* Step 3: Verify */}
          <div className="flex items-center gap-2">
            {step > 3 ? (
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                <Check size={14} strokeWidth={3} />
              </div>
            ) : (
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${step === 3 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-[#16253c] text-slate-400'}`}>
                3
              </div>
            )}
            <span className={`text-xs font-extrabold ${step >= 3 ? 'text-slate-800 dark:text-indigo-400' : 'text-slate-400 dark:text-[#527096]'}`}>
              Verify
            </span>
          </div>

          {/* Step 4: Done */}
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${step === 4 ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-[#111c2e] text-slate-400 dark:text-[#3e5677]'}`}>
              4
            </div>
            <span className={`text-xs font-extrabold ${step === 4 ? 'text-emerald-500' : 'text-slate-400 dark:text-[#415b7e]'}`}>
              Done
            </span>
          </div>
        </div>

        {/* ── STEP 1 VIEW: CAMERA INITIALIZING ── */}
        {step === 1 && (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-md animate-pulse">
              <Camera size={32} />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white m-0">
                Connecting Camera...
              </h4>
              <p className="text-xs text-slate-500 dark:text-[#6a87ad] mt-1 m-0">
                Initializing video device stream and permissions.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 mt-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Step 1 of 4</span>
            </div>
          </div>
        )}

        {/* ── STEP 2 VIEW: LIVE QR SCANNING ── */}
        {step === 2 && (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-4">
            {/* Animated Laser Scanner Frame */}
            <div className="relative w-44 h-44 rounded-2xl bg-slate-950 p-4 border-2 border-indigo-500/40 flex items-center justify-center overflow-hidden shadow-inner">
              <QrCode size={130} className="text-indigo-400 opacity-90" />
              <div className="absolute inset-x-0 h-1 bg-indigo-400 shadow-[0_0_15px_#6366f1] animate-scanLaser" />
            </div>

            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white m-0">
                Scanning Event QR Code...
              </h4>
              <p className="text-xs text-slate-500 dark:text-[#6a87ad] mt-1 m-0">
                Point camera at event check-in banner.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 3 VIEW: VERIFY EVENT DETAILS (Exact match to Figma design) ── */}
        {step === 3 && (
          <div className="mt-6 flex flex-col gap-5">
            {/* Green Success Banner */}
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/10 dark:bg-[#06241b] border border-emerald-500/30 text-emerald-600 dark:text-[#10b981]">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check size={13} className="text-emerald-500 stroke-[3]" />
              </div>
              <span className="text-xs font-bold">
                QR Code scanned successfully!
              </span>
            </div>

            {/* Scanned Event Details Card */}
            <div className="rounded-2xl p-4 sm:p-5 bg-slate-50 dark:bg-[#0e1726] border border-slate-200 dark:border-[#1a2a42] flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-[#6a87ad]">Event ID</span>
                <span className="font-extrabold text-slate-900 dark:text-white">EVT001</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-[#6a87ad]">Event Name</span>
                <span className="font-extrabold text-slate-900 dark:text-white">National Hackathon 2024</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-[#6a87ad]">Student</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{user?.name || 'Arjun Sharma'}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-[#6a87ad]">College</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{user?.college || 'IIT Delhi'}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-[#6a87ad]">Venue</span>
                <span className="font-extrabold text-slate-900 dark:text-white">Tech Hub, Block A</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-[#6a87ad]">Date</span>
                <span className="font-extrabold text-slate-900 dark:text-white">2024-11-15</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-[#6a87ad]">Time</span>
                <span className="font-extrabold text-slate-900 dark:text-white">09:15 AM</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-[#6a87ad]">Status</span>
                <span className="font-extrabold text-slate-900 dark:text-white">Registered</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3.5 rounded-2xl text-xs font-extrabold bg-slate-100 dark:bg-[#131f33] border border-slate-200 dark:border-[#1f314d] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#192b47] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAttendance}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-2xl text-xs font-extrabold text-white border-none cursor-pointer shadow-lg hover:opacity-95 transition-opacity"
                style={{ background: BRAND }}
              >
                {submitting ? 'Confirming...' : 'Confirm Attendance'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4 VIEW: DONE STATE ── */}
        {step === 4 && (
          <div className="py-10 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white m-0">
              Attendance Recorded!
            </h4>
            <p className="text-xs font-semibold text-slate-500 dark:text-[#6a87ad]">
              Your check-in for National Hackathon 2024 has been verified.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanLaser {
          0%   { top: 10%; }
          50%  { top: 85%; }
          100% { top: 10%; }
        }
        .animate-scanLaser {
          animation: scanLaser 2.2s ease-in-out infinite;
        }
        @keyframes modalScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
