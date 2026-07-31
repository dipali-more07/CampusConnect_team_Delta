import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Image, Loader2, Crop } from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../../data/dashboardData'
import ImageCropperModal from '../../common/ImageCropperModal'

export default function EventFormModal({
  dark,
  tokens,
  open,
  onClose,
  selectedEvent,
  formState,
  setFormState,
  formErrors,
  submitting,
  categories,
  eventTypes,
  onSaveEvent
}) {
  const [cropperOpen, setCropperOpen] = useState(false)
  const [rawBannerSrc, setRawBannerSrc] = useState(null)
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    if (isClosing || submitting) return
    setIsClosing(true)
    setTimeout(onClose, 180)
  }

  if (!open) return null

  const BRAND = tokens?.brand || DEFAULT_BRAND
  const isOrganizerRole = window.location.pathname.includes('/organizer') || (sessionStorage.getItem('cc_role') || '').toLowerCase().includes('organizer')

  const inputStyle = {
    border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`,
    color: dark ? '#e8f0fe' : '#0f172a',
    background: dark ? '#060e1c' : '#f8fafc',
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className={`rounded-[24px] w-full max-w-[650px] overflow-hidden transition-all duration-300 ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
        style={{
          background: dark ? '#0c1829' : '#ffffff',
          border: `1px solid ${dark ? '#1a3050' : '#e8edf5'}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: `1px solid ${dark ? '#1a3050' : '#e8edf5'}` }}>
          <h2 className="text-[19px] font-extrabold m-0" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
            {selectedEvent ? `Edit Event — ${selectedEvent.name || selectedEvent.title || selectedEvent.event_name || formState.name || ''}` : 'Create New Event'}
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
            style={{ color: dark ? '#4a6a8a' : '#94a3b8' }}
            onMouseEnter={e => { e.currentTarget.style.background = dark ? '#162640' : '#f1f5f9'; e.currentTarget.style.color = dark ? '#e8f0fe' : '#475569' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dark ? '#4a6a8a' : '#94a3b8' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-8 py-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
          
          {/* Event Name */}
          <div>
            <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
              Event Name
            </label>
            <input
              type="text"
              placeholder="e.g. TechFest 2025"
              value={formState.name}
              onChange={e => setFormState(p => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
              style={{
                ...inputStyle,
                borderColor: formErrors.name ? '#ef4444' : dark ? '#1a3050' : '#e2e8f0'
              }}
              onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
              onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
            />
            {formErrors.name && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.name}</span>}
          </div>

          {/* Grid: Category & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
                Category
              </label>
              <div className="relative">
                <select
                  value={formState.category}
                  onChange={e => setFormState(p => ({ ...p, category: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3 rounded-xl text-[13.5px] outline-none cursor-pointer border appearance-none transition-all duration-200"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                  onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                >
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1.5L5 4.5L9 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
                Venue
              </label>
              <input
                type="text"
                placeholder="e.g. Main Auditorium"
                value={formState.venue}
                onChange={e => setFormState(p => ({ ...p, venue: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
                style={{
                  ...inputStyle,
                  borderColor: formErrors.venue ? '#ef4444' : dark ? '#1a3050' : '#e2e8f0'
                }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
              {formErrors.venue && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.venue}</span>}
            </div>
          </div>

          {/* Grid: Event Type & Participation Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
                Event Type (Online / Offline)
              </label>
              <div className="relative">
                <select
                  value={formState.eventType || 'offline'}
                  onChange={e => setFormState(p => ({ ...p, eventType: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3 rounded-xl text-[13.5px] outline-none cursor-pointer border appearance-none transition-all duration-200 font-semibold"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                  onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1.5L5 4.5L9 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
                Participation Type
              </label>
              <div className="relative">
                <select
                  value={formState.participationType || 'individual'}
                  onChange={e => setFormState(p => ({ ...p, participationType: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3 rounded-xl text-[13.5px] outline-none cursor-pointer border appearance-none transition-all duration-200 font-semibold"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                  onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                >
                  <option value="individual">Individual</option>
                  <option value="team">Team</option>
                  <option value="both">Both</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1.5L5 4.5L9 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Grid: Assign Organizer & Fees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
                Assign Organizer {isOrganizerRole && <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 ml-1">(Locked)</span>}
              </label>
              <input
                type="text"
                placeholder="Organizer Name"
                value={formState.organizer}
                onChange={e => !isOrganizerRole && setFormState(p => ({ ...p, organizer: e.target.value }))}
                readOnly={isOrganizerRole}
                className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
                style={{
                  ...inputStyle,
                  borderColor: formErrors.organizer ? '#ef4444' : dark ? '#1a3050' : '#e2e8f0',
                  background: isOrganizerRole ? (dark ? '#0a1628' : '#f1f5f9') : inputStyle.background,
                  cursor: isOrganizerRole ? 'not-allowed' : 'text',
                  opacity: isOrganizerRole ? 0.85 : 1
                }}
                onFocus={e => {
                  if (!isOrganizerRole) {
                    e.target.style.borderColor = BRAND
                    e.target.style.boxShadow = `0 0 0 3px ${BRAND}20`
                  }
                }}
                onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
              {formErrors.organizer && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.organizer}</span>}
            </div>

            <div>
              <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
                Fees (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formState.fees}
                onChange={e => setFormState(p => ({ ...p, fees: parseInt(e.target.value, 10) || 0 }))}
                className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
                style={{
                  ...inputStyle,
                  borderColor: formErrors.fees ? '#ef4444' : dark ? '#1a3050' : '#e2e8f0'
                }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
              {formErrors.fees && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.fees}</span>}
            </div>
          </div>

          {/* Grid: Start Date & End Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={formState.startDateTime}
                onChange={e => setFormState(p => ({ ...p, startDateTime: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
                style={{
                  ...inputStyle,
                  borderColor: formErrors.startDateTime ? '#ef4444' : dark ? '#1a3050' : '#e2e8f0',
                  colorScheme: dark ? 'dark' : 'light'
                }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
              {formErrors.startDateTime && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.startDateTime}</span>}
            </div>

            <div>
              <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={formState.endDateTime}
                onChange={e => setFormState(p => ({ ...p, endDateTime: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
                style={{
                  ...inputStyle,
                  borderColor: formErrors.endDateTime ? '#ef4444' : dark ? '#1a3050' : '#e2e8f0',
                  colorScheme: dark ? 'dark' : 'light'
                }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
              {formErrors.endDateTime && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.endDateTime}</span>}
            </div>
          </div>

          {/* Grid: Registration Start Time & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
                Registration Start Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={formState.regDateTime}
                onChange={e => setFormState(p => ({ ...p, regDateTime: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
                style={{
                  ...inputStyle,
                  borderColor: formErrors.regDateTime ? '#ef4444' : dark ? '#1a3050' : '#e2e8f0',
                  colorScheme: dark ? 'dark' : 'light'
                }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
              {formErrors.regDateTime && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.regDateTime}</span>}
            </div>

            <div>
              <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
                Capacity
              </label>
              <input
                type="number"
                min="1"
                placeholder="500"
                value={formState.capacity}
                onChange={e => setFormState(p => ({ ...p, capacity: parseInt(e.target.value, 10) || 0 }))}
                className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
                style={{
                  ...inputStyle,
                  borderColor: formErrors.capacity ? '#ef4444' : dark ? '#1a3050' : '#e2e8f0'
                }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
              {formErrors.capacity && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.capacity}</span>}
            </div>
          </div>

          {/* Registration Deadline (full width) */}
          <div>
            <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
              Registration Deadline (Date &amp; Time)
            </label>
            <input
              type="datetime-local"
              value={formState.registrationDeadline}
              onChange={e => setFormState(p => ({ ...p, registrationDeadline: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
              style={{
                ...inputStyle,
                borderColor: formErrors.registrationDeadline ? '#ef4444' : dark ? '#1a3050' : '#e2e8f0',
                colorScheme: dark ? 'dark' : 'light'
              }}
              onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
              onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
            />
            {formErrors.registrationDeadline && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.registrationDeadline}</span>}
          </div>

          {/* Event Description */}
          <div>
            <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
              Event Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe the event..."
              value={formState.description}
              onChange={e => setFormState(p => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none resize-none transition-all duration-200 border"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
              onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex gap-4 px-8 py-5" style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#e8edf5'}` }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-[13.5px] font-bold bg-transparent transition-all duration-150 border cursor-pointer"
            style={{ 
              borderColor: dark ? '#1a3050' : '#cbd5e1', 
              color: dark ? '#cbd5e1' : '#475569',
              background: dark ? '#162640' : '#f8fafc' 
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#cbd5e1'; e.currentTarget.style.color = dark ? '#cbd5e1' : '#475569' }}
          >
            Cancel
          </button>

          <button
            onClick={() => onSaveEvent(false)}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[13.5px] font-bold text-white border-none cursor-pointer transition-all duration-200 disabled:opacity-50"
            style={{ background: BRAND, boxShadow: '0 4px 14px rgba(97,95,255,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(97,95,255,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(97,95,255,0.4)' }}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving...
              </>
            ) : 'Publish Event'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}
