import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCheck, Send, Loader2 } from 'lucide-react'
import studentsService from '../../../services/studentsService'
import organizersService from '../../../services/organizersService'

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
  const [usersList, setUsersList] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [recipientType, setRecipientType] = useState('select') // 'select' or 'custom'
  const [customUserId, setCustomUserId] = useState('')

  useEffect(() => {
    if (!sendOpen) return
    
    setLoadingUsers(true)
    setRecipientType('select')
    setCustomUserId('')
    
    Promise.all([
      studentsService.fetchAll(),
      organizersService.fetchAll()
    ]).then(([stuRes, orgRes]) => {
      const list = []
      if (stuRes.success && Array.isArray(stuRes.students)) {
        list.push(...stuRes.students.map(s => ({
          id: s.id,
          name: s.name,
          detail: s.rollNo || s.email,
          role: 'Student'
        })))
      }
      if (orgRes.success && Array.isArray(orgRes.organizers)) {
        list.push(...orgRes.organizers.map(o => ({
          id: o.id,
          name: o.name,
          detail: o.email,
          role: 'Organizer'
        })))
      }
      setUsersList(list)
      // Default to broadcasting to everyone
      setSendForm(p => ({ ...p, user_id: 'all' }))
    }).catch(err => {
          }).finally(() => {
      setLoadingUsers(false)
    })
  }, [sendOpen])

  const handleRecipientChange = (e) => {
    const val = e.target.value
    if (val === 'custom') {
      setRecipientType('custom')
      setSendForm(p => ({ ...p, user_id: customUserId }))
    } else {
      setRecipientType('select')
      setSendForm(p => ({ ...p, user_id: val }))
    }
  }

  const handleCustomUserIdChange = (e) => {
    const val = e.target.value
    setCustomUserId(val)
    setSendForm(p => ({ ...p, user_id: val }))
  }

  if (!sendOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
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
            <label className="text-[12px] font-bold block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
              Notification Type
            </label>
            <select
              value={sendForm.notification_type}
              onChange={e => setSendForm(p => ({ ...p, notification_type: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none cursor-pointer transition-all duration-200"
              style={inputStyle}
            >
              <option value="system">System Alert</option>
              <option value="event">Event Update</option>
              <option value="registration">Registration Alert</option>
              <option value="attendance">Attendance Update</option>
              <option value="certificate">Certificate Update</option>
              <option value="warning">Warning Alert</option>
              <option value="cancelled">Event Cancelled</option>
              <option value="trending">Trending Update</option>
            </select>
          </div>

          {/* Recipients */}
          <div>
            <label className="text-[12px] font-bold block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
              Recipient User
            </label>
            {loadingUsers ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#7a98bb] py-2">
                <Loader2 size={14} className="animate-spin text-indigo-500" />
                <span>Loading users list...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={recipientType === 'custom' ? 'custom' : sendForm.user_id}
                  onChange={handleRecipientChange}
                  className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none cursor-pointer transition-all duration-200"
                  style={inputStyle}
                >
                  <option value="all">📢 Broadcast to Everyone (All Users)</option>
                  <optgroup label="Students">
                    {usersList.filter(u => u.role === 'Student').map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.detail})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Organizers">
                    {usersList.filter(u => u.role === 'Organizer').map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.detail})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Custom">
                    <option value="custom">Enter Custom User ID (UUID)...</option>
                  </optgroup>
                </select>

                {recipientType === 'custom' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold block mb-1" style={{ color: dark ? '#5f7b9e' : '#94a3b8' }}>
                      Custom User ID (UUID)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                      value={customUserId}
                      onChange={handleCustomUserIdChange}
                      className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none box-border transition-all duration-200"
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                      onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-[12px] font-bold block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
              Title
            </label>
            <input
              placeholder="e.g. TechFest 2025 — Important Update"
              value={sendForm.title}
              onChange={e => setSendForm(p => ({ ...p, title: e.target.value }))}
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
        </div>

        {/* Footer — Send Now */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#e8edf5'}` }}>
          <button
            onClick={() => handleSend()}
            disabled={sending || sent}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-300 disabled:cursor-default disabled:opacity-70"
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
