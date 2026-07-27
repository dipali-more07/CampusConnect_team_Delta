import React from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, LogOut } from 'lucide-react'

export default function SuspendedAccountModal({ isOpen, onLogout }) {
  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
      onClick={onLogout}
    >
      <div
        className="relative z-10 w-full max-w-md bg-white dark:bg-[#0c1829] border border-red-500/30 rounded-3xl p-7 text-center shadow-2xl overflow-hidden cursor-default"
        onClick={onLogout}
        style={{
          animation: 'modalScaleIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <AlertTriangle size={32} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-slate-900 dark:text-white m-0">
          Account Suspended
        </h3>

        {/* Message */}
        <p className="text-xs font-semibold text-slate-600 dark:text-[#7a98bb] mt-2 mb-6 leading-relaxed">
          Your account has been suspended by the administration. You are being logged out of CampusConnect. Please contact your campus administrator for assistance.
        </p>

        {/* Action Button */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
        >
          <LogOut size={16} /> Okay, Log Out
        </button>
      </div>

      <style>{`
        @keyframes modalScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  )
}
