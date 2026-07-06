import React, { useState } from 'react'
import { X, Lock, Shield, Eye, EyeOff } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import studentService from '../../services/studentService'

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { dark, accentColor } = useTheme()
  const BRAND = accentColor || '#615FFF'
  const showToast = useToast()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error')
      return
    }

    setSubmitting(true)
    const res = await studentService.changeStudentPassword({ newPassword, confirmPassword })
    setSubmitting(false)

    if (res.success) {
      showToast('Password changed successfully!', 'success')
      setNewPassword('')
      setConfirmPassword('')
      onClose()
    } else {
      showToast(res.message || 'Failed to change password.', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl transition-colors duration-300 shadow-2xl overflow-hidden p-6 sm:p-7"
        style={{
          background: dark ? '#0c1626' : '#ffffff',
          border: `1px solid ${dark ? '#1b2a42' : '#e2e8f0'}`,
          color: dark ? '#f8fafc' : '#0f172a',
          animation: 'modalScaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-[#1b2a42]">
          <h3 className="text-lg font-extrabold m-0 text-slate-900 dark:text-white">Change Password</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a2d48] border-none bg-transparent cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111f36] border border-slate-200 dark:border-[#1d304d] text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-transparent border-none cursor-pointer"
              >
                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111f36] border border-slate-200 dark:border-[#1d304d] text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-transparent border-none cursor-pointer"
              >
                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1b2a42] mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#14233a] border border-slate-200 dark:border-[#213554] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1a2d48] cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white border-none cursor-pointer shadow-lg hover:opacity-90 transition-opacity"
              style={{ background: BRAND }}
            >
              {submitting ? 'Updating...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
