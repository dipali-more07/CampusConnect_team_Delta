import React from 'react'
import { createPortal } from 'react-dom'
import { X, Clock, CheckCheck, Send, Calendar } from 'lucide-react'

export default function NotificationFormModal({
  sendOpen,
  setSendOpen,
  sendForm,
  setSendForm,
  sending,
  sent,
  scheduling,
  handleSend,
  resetForm,
  toggleNotifType,
  NOTIF_TYPES,
  tokens,
  dark,
  BRAND,
  inputStyle
}) {
  if (!sendOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={e => { if (e.target === e.currentTarget) { setSendOpen(false); resetForm() } }}
    >
      <div
        className="rounded-[20px] w-full max-w-[500px] overflow-hidden"
        style={{
          background: dark ? '#0c1829' : '#ffffff',
          border: `1px solid ${dark ? '#1a3050' : '#e8edf5'}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          animation: 'slideUp 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${dark ? '#1a3050' : '#e8edf5'}` }}>
          <h2 className="text-[17px] font-extrabold m-0" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
            Send Notification
          </h2>
          <button
            onClick={() => { setSendOpen(false); resetForm() }}
            className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
            style={{ color: dark ? '#4a6a8a' : '#94a3b8' }}
            onMouseEnter={e => { e.currentTarget.style.background = dark ? '#162640' : '#f1f5f9'; e.currentTarget.style.color = dark ? '#e8f0fe' : '#475569' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dark ? '#4a6a8a' : '#94a3b8' }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">

          {/* Notification Type */}
          <div>
            <label className="text-[12px] font-bold block mb-3" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
              Notification Type
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {NOTIF_TYPES.map(({ key, label, Icon }) => {
                const selected = sendForm.notifTypes.includes(key)
                return (
                  <button
                    key={key}
                    onClick={() => toggleNotifType(key)}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-150 border"
                    style={{
                      background: selected ? `${BRAND}12` : (dark ? '#060e1c' : '#f8fafc'),
                      borderColor: selected ? `${BRAND}60` : (dark ? '#1a3050' : '#e2e8f0'),
                      color: selected ? BRAND : (dark ? '#7a98bb' : '#64748b'),
                      boxShadow: selected ? `0 0 0 3px ${BRAND}14` : 'none',
                    }}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label className="text-[12px] font-bold block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
              Recipients
            </label>
            <select
              value={sendForm.sendTo}
              onChange={e => setSendForm(p => ({ ...p, sendTo: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none cursor-pointer transition-all duration-200"
              style={inputStyle}
            >
              <option value="all">All Students</option>
              <option value="registered">Registered Students</option>
              <option value="organizers">Organizers Only</option>
              <option value="admins">Admins Only</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-[12px] font-bold block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
              Subject
            </label>
            <input
              placeholder="e.g. TechFest 2025 — Important Update"
              value={sendForm.subject}
              onChange={e => setSendForm(p => ({ ...p, subject: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none box-border transition-all duration-200"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
              onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-[12px] font-bold block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
              Message
            </label>
            <textarea
              rows={4}
              placeholder="Type your message here..."
              value={sendForm.message}
              onChange={e => setSendForm(p => ({ ...p, message: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none resize-none box-border font-inherit transition-all duration-200"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
              onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="text-[12px] font-bold block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
              Schedule
              <span className="ml-1.5 font-medium normal-case" style={{ color: dark ? '#3d5470' : '#94a3b8' }}>(optional)</span>
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: dark ? '#3d5470' : '#94a3b8' }} />
              <input
                type="datetime-local"
                value={sendForm.schedule}
                onChange={e => setSendForm(p => ({ ...p, schedule: e.target.value }))}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-[10px] text-[13px] outline-none box-border transition-all duration-200"
                style={{
                  ...inputStyle,
                  color: sendForm.schedule ? (dark ? '#e8f0fe' : '#0f172a') : (dark ? '#3d5470' : '#94a3b8'),
                  colorScheme: dark ? 'dark' : 'light',
                }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Footer — Schedule + Send Now */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#e8edf5'}` }}>
          <button
            onClick={() => handleSend(true)}
            disabled={sending || sent || scheduling || !sendForm.schedule}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`, background: 'transparent', color: dark ? '#7a98bb' : '#64748b' }}
            onMouseEnter={e => { if (sendForm.schedule && !sending && !sent) { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#7a98bb' : '#64748b' }}
          >
            <Clock size={14} />
            {scheduling ? 'Scheduling...' : 'Schedule'}
          </button>

          <button
            onClick={() => handleSend(false)}
            disabled={sending || sent || scheduling}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-300 disabled:cursor-default disabled:opacity-70"
            style={{
              background: sent ? '#00BC7D' : BRAND,
              boxShadow: `0 4px 14px ${sent ? 'rgba(0,188,125,0.4)' : 'rgba(97,95,255,0.4)'}`,
            }}
            onMouseEnter={e => { if (!sending && !sent) e.currentTarget.style.boxShadow = `0 6px 20px rgba(97,95,255,0.55)` }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 4px 14px ${sent ? 'rgba(0,188,125,0.4)' : 'rgba(97,95,255,0.4)'}` }}
          >
            {sent ? <><CheckCheck size={15} /> Sent!</>
              : sending ? 'Sending...'
              : <><Send size={14} /> Send Now</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
