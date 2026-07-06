import { createPortal } from 'react-dom'
import { X, Image, Loader2 } from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../../data/dashboardData'

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
  if (!open) return null

  const BRAND = tokens?.brand || DEFAULT_BRAND

  const inputStyle = {
    border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`,
    color: dark ? '#e8f0fe' : '#0f172a',
    background: dark ? '#060e1c' : '#f8fafc',
  }

  return createPortal(
    <div
      className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-[24px] w-full max-w-[650px] overflow-hidden transition-all duration-300"
        style={{
          background: dark ? '#0c1829' : '#ffffff',
          border: `1px solid ${dark ? '#1a3050' : '#e8edf5'}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <style>{`
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: `1px solid ${dark ? '#1a3050' : '#e8edf5'}` }}>
          <h2 className="text-[19px] font-extrabold m-0" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
            {selectedEvent ? `Edit Event — ${selectedEvent.id}` : 'Create New Event'}
          </h2>
          <button
            onClick={onClose}
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

          {/* Grid: Participation Type & Assign Organizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
                Participation Type (Individual / Team / Group)
              </label>
              <div className="relative">
                <select
                  value={formState.eventType || 'Individual'}
                  onChange={e => setFormState(p => ({ ...p, eventType: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3 rounded-xl text-[13.5px] outline-none cursor-pointer border appearance-none transition-all duration-200 font-semibold"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                  onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                >
                  {eventTypes.map(t => (
                    <option key={t} value={t}>{t} Event</option>
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
                Assign Organizer
              </label>
              <input
                type="text"
                placeholder="Dr. Priya Sharma"
                value={formState.organizer}
                onChange={e => setFormState(p => ({ ...p, organizer: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
                style={{
                  ...inputStyle,
                  borderColor: formErrors.organizer ? '#ef4444' : dark ? '#1a3050' : '#e2e8f0'
                }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
              {formErrors.organizer && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.organizer}</span>}
            </div>
          </div>

          {/* Grid: Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
                Date
              </label>
              <input
                type="date"
                value={formState.date}
                onChange={e => setFormState(p => ({ ...p, date: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
                style={{
                  ...inputStyle,
                  borderColor: formErrors.date ? '#ef4444' : dark ? '#1a3050' : '#e2e8f0',
                  colorScheme: dark ? 'dark' : 'light'
                }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
              {formErrors.date && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.date}</span>}
            </div>

            <div>
              <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
                Time
              </label>
              <input
                type="time"
                value={formState.time}
                onChange={e => setFormState(p => ({ ...p, time: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
                style={{
                  ...inputStyle,
                  colorScheme: dark ? 'dark' : 'light'
                }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          {/* Grid: Capacity & Registration Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

            <div>
              <label className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
                Registration Deadline
              </label>
              <input
                type="date"
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

          {/* Enable QR Attendance Switch */}
          <div 
            className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200"
            style={{
              background: dark ? '#091526' : '#f0f4f8',
              border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`,
            }}
          >
            <button
              type="button"
              onClick={() => setFormState(p => ({ ...p, qrAttendance: p.qrAttendance === 'Enabled' ? 'Disabled' : 'Enabled' }))}
              className="w-11 h-6 rounded-full relative transition-colors duration-200 cursor-pointer outline-none border-none shrink-0"
              style={{
                backgroundColor: formState.qrAttendance === 'Enabled' ? BRAND : (dark ? '#162640' : '#cbd5e1'),
              }}
            >
              <div 
                className="w-4.5 h-4.5 rounded-full bg-white absolute top-0.75 transition-transform duration-200 shadow"
                style={{
                  transform: formState.qrAttendance === 'Enabled' ? 'translateX(22px)' : 'translateX(4px)',
                }}
              />
            </button>

            <div className="flex flex-col gap-0.5 text-left">
              <span className="text-[13px] font-bold" style={{ color: dark ? '#e8f0fe' : '#1e293b' }}>
                Enable QR Attendance
              </span>
              <span className="text-[11.5px] leading-tight font-medium" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                Generate QR code for contactless attendance marking
              </span>
            </div>
          </div>

          {/* Image Drag and Drop Upload */}
          <div>
            <input 
              type="file"
              accept="image/*"
              id="banner-file-input"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    setFormState(p => ({ ...p, banner: reader.result }))
                  }
                  reader.readAsDataURL(file)
                }
              }}
            />
            <label
              htmlFor="banner-file-input"
              className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition-all duration-200 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-[#162640]/20"
              style={{
                borderColor: dark ? '#1a3050' : '#d8e3f0',
                background: dark ? '#091526' : '#ffffff',
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    setFormState(p => ({ ...p, banner: reader.result }))
                  }
                  reader.readAsDataURL(file)
                }
              }}
            >
              {formState.banner ? (
                <div className="relative w-full flex flex-col items-center">
                  <img 
                    src={formState.banner} 
                    alt="Banner preview" 
                    className="max-h-[140px] rounded-lg object-cover mb-2 w-full"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setFormState(p => ({ ...p, banner: null }))
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 border-none cursor-pointer flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                  <span className="text-[12px] font-bold text-slate-500">Click or drag to replace image</span>
                </div>
              ) : (
                <>
                  <Image size={32} className="mb-2" style={{ color: dark ? '#7a98bb' : '#94a3b8' }} />
                  <div className="text-[13px] font-semibold text-center" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
                    Drop event banner here or <span className="text-blue-500 font-bold hover:underline">browse</span>
                  </div>
                  <div className="text-[11px] mt-1" style={{ color: dark ? '#7a98bb' : '#94a3b8' }}>
                    PNG, JPG up to 5MB
                  </div>
                </>
              )}
            </label>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex gap-4 px-8 py-5" style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#e8edf5'}` }}>
          <button
            onClick={() => onSaveEvent(true)}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-[13.5px] font-bold bg-transparent transition-all duration-150 border cursor-pointer"
            style={{ 
              borderColor: dark ? '#1a3050' : '#e2e8f0', 
              color: dark ? '#cbd5e1' : '#475569',
              background: dark ? '#162640' : '#f8fafc' 
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#cbd5e1' : '#475569' }}
          >
            Save Draft
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
