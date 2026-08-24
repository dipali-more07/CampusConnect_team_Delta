import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../../data/dashboardData'
import CustomSelect from '../../common/CustomSelect'

const getFieldBorderColor = (hasError, isFocused, dark, BRAND) => {
  if (hasError) return '#ef4444'
  if (isFocused) return BRAND
  return dark ? '#1a3050' : '#e2e8f0'
}

const getOrganizerBgColor = (isOrganizerRole, dark, defaultBg) => {
  if (isOrganizerRole) {
    return dark ? '#0a1628' : '#f1f5f9'
  }
  return defaultBg
}

function EventFormBasicInfo({
  dark,
  BRAND,
  inputStyle,
  formState,
  setFormState,
  formErrors,
  categories
}) {
  const [nameFocused, setNameFocused] = useState(false)
  const [categoryFocused, setCategoryFocused] = useState(false)
  const [venueFocused, setVenueFocused] = useState(false)

  return (
    <>
      {/* Event Name */}
      <div>
        <label htmlFor="eventNameInput" className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
          Event Name <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>
        </label>
        <input
          id="eventNameInput"
          type="text"
          placeholder="e.g. TechFest 2025"
          value={formState.name}
          onChange={e => setFormState(p => ({ ...p, name: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
          style={{
            ...inputStyle,
            borderColor: getFieldBorderColor(!!formErrors.name, nameFocused, dark, BRAND),
            boxShadow: nameFocused ? `0 0 0 3px ${BRAND}20` : 'none'
          }}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
        />
        {formErrors.name && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.name}</span>}
      </div>

      {/* Grid: Category & Venue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <CustomSelect
            id="eventCategorySelect"
            label="Category"
            required={true}
            value={formState.category}
            onChange={(e, val) => setFormState(p => ({ ...p, category: val }))}
            options={categories.filter(c => c !== 'All').map(c => ({ value: c, label: c }))}
            dark={dark}
          />
        </div>

        <div>
          <label htmlFor="eventVenueInput" className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
            Venue <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>
          </label>
          <input
            id="eventVenueInput"
            type="text"
            placeholder="e.g. Main Auditorium"
            value={formState.venue}
            onChange={e => setFormState(p => ({ ...p, venue: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
            style={{
              ...inputStyle,
              borderColor: getFieldBorderColor(!!formErrors.venue, venueFocused, dark, BRAND),
              boxShadow: venueFocused ? `0 0 0 3px ${BRAND}20` : 'none'
            }}
            onFocus={() => setVenueFocused(true)}
            onBlur={() => setVenueFocused(false)}
          />
          {formErrors.venue && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.venue}</span>}
        </div>
      </div>
    </>
  )
}

function EventFormTypesAndOrganizer({
  dark,
  BRAND,
  inputStyle,
  formState,
  setFormState,
  formErrors,
  isOrganizerRole
}) {
  const [typeFocused, setTypeFocused] = useState(false)
  const [participationFocused, setParticipationFocused] = useState(false)
  const [organizerFocused, setOrganizerFocused] = useState(false)
  const [feesFocused, setFeesFocused] = useState(false)

  return (
    <>
      {/* Grid: Event Type & Participation Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <CustomSelect
            id="eventTypeSelect"
            label="Event Type (Online / Offline)"
            required={true}
            value={formState.eventType || 'offline'}
            onChange={(e, val) => setFormState(p => ({ ...p, eventType: val }))}
            options={[
              { value: 'offline', label: 'Offline' },
              { value: 'online', label: 'Online' },
            ]}
            dark={dark}
          />
        </div>

        <div>
          <CustomSelect
            id="eventParticipationTypeSelect"
            label="Participation Type"
            required={true}
            value={formState.participationType || 'individual'}
            onChange={(e, val) => setFormState(p => ({ ...p, participationType: val }))}
            options={[
              { value: 'individual', label: 'Individual' },
              { value: 'team', label: 'Team' },
              { value: 'both', label: 'Both' },
            ]}
            dark={dark}
          />
        </div>
      </div>

      {/* Grid: Assign Organizer & Fees */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="eventOrganizerInput" className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
            Assign Organizer {isOrganizerRole && <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 ml-1">(Locked)</span>}
          </label>
          <input
            id="eventOrganizerInput"
            type="text"
            placeholder="Organizer Name"
            value={formState.organizer}
            onChange={e => !isOrganizerRole && setFormState(p => ({ ...p, organizer: e.target.value }))}
            readOnly={isOrganizerRole}
            className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
            style={{
              ...inputStyle,
              borderColor: getFieldBorderColor(!!formErrors.organizer, organizerFocused, dark, BRAND),
              background: getOrganizerBgColor(isOrganizerRole, dark, inputStyle.background),
              cursor: isOrganizerRole ? 'not-allowed' : 'text',
              opacity: isOrganizerRole ? 0.85 : 1,
              boxShadow: organizerFocused && !isOrganizerRole ? `0 0 0 3px ${BRAND}20` : 'none'
            }}
            onFocus={() => { if (!isOrganizerRole) setOrganizerFocused(true) }}
            onBlur={() => { if (!isOrganizerRole) setOrganizerFocused(false) }}
          />
          {formErrors.organizer && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.organizer}</span>}
        </div>

        <div>
          <label htmlFor="eventFeesInput" className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
            Fees (₹)
          </label>
          <input
            id="eventFeesInput"
            type="number"
            min="0"
            placeholder="0"
            value={formState.fees === 0 ? '' : formState.fees}
            onChange={e => setFormState(p => ({ ...p, fees: e.target.value === '' ? 0 : Number.parseInt(e.target.value, 10) || 0 }))}
            className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
            style={{
              ...inputStyle,
              borderColor: getFieldBorderColor(!!formErrors.fees, feesFocused, dark, BRAND),
              boxShadow: feesFocused ? `0 0 0 3px ${BRAND}20` : 'none'
            }}
            onFocus={() => setFeesFocused(true)}
            onBlur={() => setFeesFocused(false)}
          />
          {formErrors.fees && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.fees}</span>}
        </div>
      </div>
    </>
  )
}

function EventFormSchedulingDates({
  dark,
  BRAND,
  inputStyle,
  formState,
  setFormState,
  formErrors
}) {
  const [startFocused, setStartFocused] = useState(false)
  const [endFocused, setEndFocused] = useState(false)
  const [regFocused, setRegFocused] = useState(false)
  const [deadlineFocused, setDeadlineFocused] = useState(false)

  // Get current local datetime up to minutes (YYYY-MM-DDThh:mm)
  const currentDateTimeLocal = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);


  return (
    <>
      {/* Grid: Start Date & End Date Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="eventStartDateTimeInput" className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
            Start Date &amp; Time <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>
          </label>
          <input
            id="eventStartDateTimeInput"
            type="datetime-local"
            min={currentDateTimeLocal}
            value={formState.startDateTime}
            onChange={e => setFormState(p => ({ ...p, startDateTime: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none border transition-all duration-200 cursor-pointer"
            style={{
              ...inputStyle,
              colorScheme: dark ? 'dark' : 'light',
              borderColor: getFieldBorderColor(!!formErrors.startDateTime, startFocused, dark, BRAND),
              boxShadow: startFocused ? `0 0 0 3px ${BRAND}20` : 'none',
            }}
            onFocus={() => setStartFocused(true)}
            onBlur={() => setStartFocused(false)}
          />
          {formErrors.startDateTime && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.startDateTime}</span>}
        </div>

        <div>
          <label htmlFor="eventEndDateTimeInput" className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
            End Date &amp; Time <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>
          </label>
          <input
            id="eventEndDateTimeInput"
            type="datetime-local"
            min={currentDateTimeLocal}
            value={formState.endDateTime}
            onChange={e => setFormState(p => ({ ...p, endDateTime: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none border transition-all duration-200 cursor-pointer"
            style={{
              ...inputStyle,
              colorScheme: dark ? 'dark' : 'light',
              borderColor: getFieldBorderColor(!!formErrors.endDateTime, endFocused, dark, BRAND),
              boxShadow: endFocused ? `0 0 0 3px ${BRAND}20` : 'none',
            }}
            onFocus={() => setEndFocused(true)}
            onBlur={() => setEndFocused(false)}
          />
          {formErrors.endDateTime && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.endDateTime}</span>}
        </div>
      </div>

      {/* Registration Start Time Picker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="eventRegDateTimeInput" className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
            Registration Start Date &amp; Time
          </label>
          <input
            id="eventRegDateTimeInput"
            type="datetime-local"
            min={currentDateTimeLocal}
            value={formState.regDateTime}
            onChange={e => setFormState(p => ({ ...p, regDateTime: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none border transition-all duration-200 cursor-pointer"
            style={{
              ...inputStyle,
              colorScheme: dark ? 'dark' : 'light',
              borderColor: getFieldBorderColor(!!formErrors.regDateTime, regFocused, dark, BRAND),
              boxShadow: regFocused ? `0 0 0 3px ${BRAND}20` : 'none',
            }}
            onFocus={() => setRegFocused(true)}
            onBlur={() => setRegFocused(false)}
          />
          {formErrors.regDateTime && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.regDateTime}</span>}
        </div>

        <div>
          <label htmlFor="eventRegistrationDeadlineInput" className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
            Registration Deadline (Date &amp; Time) <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>
          </label>
          <input
            id="eventRegistrationDeadlineInput"
            type="datetime-local"
            min={currentDateTimeLocal}
            value={formState.registrationDeadline}
            onChange={e => setFormState(p => ({ ...p, registrationDeadline: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none border transition-all duration-200 cursor-pointer"
            style={{
              ...inputStyle,
              colorScheme: dark ? 'dark' : 'light',
              borderColor: getFieldBorderColor(!!formErrors.registrationDeadline, deadlineFocused, dark, BRAND),
              boxShadow: deadlineFocused ? `0 0 0 3px ${BRAND}20` : 'none',
            }}
            onFocus={() => setDeadlineFocused(true)}
            onBlur={() => setDeadlineFocused(false)}
          />
          {formErrors.registrationDeadline && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.registrationDeadline}</span>}
        </div>
      </div>
    </>
  )
}

function EventFormSchedulingCapacity({
  dark,
  BRAND,
  inputStyle,
  formState,
  setFormState,
  formErrors
}) {
  const [capacityFocused, setCapacityFocused] = useState(false)
  const [descriptionFocused, setDescriptionFocused] = useState(false)

  return (
    <>
      {/* Grid: Capacity & Description */}
      <div>
        <label htmlFor="eventCapacityInput" className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
          Capacity (Max 1000) <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>
        </label>
        <input
          id="eventCapacityInput"
          type="number"
          min="1"
          max="1000"
          placeholder="e.g. 500 (Max 1000)"
          value={formState.capacity === 0 ? '' : formState.capacity}
          onChange={e => {
            const raw = e.target.value === '' ? 0 : Number.parseInt(e.target.value, 10) || 0;
            const clamped = raw > 1000 ? 1000 : raw;
            setFormState(p => ({ ...p, capacity: clamped }));
          }}
          className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none transition-all duration-200 border"
          style={{
            ...inputStyle,
            borderColor: getFieldBorderColor(!!formErrors.capacity, capacityFocused, dark, BRAND),
            boxShadow: capacityFocused ? `0 0 0 3px ${BRAND}20` : 'none'
          }}
          onFocus={() => setCapacityFocused(true)}
          onBlur={() => setCapacityFocused(false)}
        />
        {formErrors.capacity && <span className="text-[11px] text-red-500 mt-1.5 block">{formErrors.capacity}</span>}
      </div>

      {/* Event Description */}
      <div>
        <label htmlFor="eventDescriptionTextarea" className="text-[13px] font-bold block mb-1.5" style={{ color: dark ? '#cbd5e1' : '#475569' }}>
          Event Description
        </label>
        <textarea
          id="eventDescriptionTextarea"
          rows={3}
          placeholder="Describe the event..."
          value={formState.description}
          onChange={e => setFormState(p => ({ ...p, description: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl text-[13.5px] outline-none resize-none transition-all duration-200 border"
          style={{
            ...inputStyle,
            borderColor: getFieldBorderColor(false, descriptionFocused, dark, BRAND),
            boxShadow: descriptionFocused ? `0 0 0 3px ${BRAND}20` : 'none'
          }}
          onFocus={() => setDescriptionFocused(true)}
          onBlur={() => setDescriptionFocused(false)}
        />
      </div>
    </>
  )
}

function EventFormModalFooter({
  dark,
  BRAND,
  submitting,
  handleClose,
  onSaveEvent,
  isOrganizerRole,
  selectedEvent
}) {
  let submitLabel = 'Publish Event'
  if (selectedEvent) {
    submitLabel = 'Update Event'
  } else if (isOrganizerRole) {
    submitLabel = 'Submit for Approval'
  }

  return (
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
        type="button"
        onClick={() => onSaveEvent(false)}
        disabled={submitting}
        className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[13.5px] font-bold text-white border-none cursor-pointer transition-all duration-200 disabled:opacity-50"
        style={{ background: BRAND, boxShadow: '0 4px 14px rgba(97,95,255,0.4)' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(97,95,255,0.55)' }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(97,95,255,0.4)' }}
      >
        {submitting ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Submitting...
          </>
        ) : submitLabel}
      </button>
    </div>
  )
}

export default function EventFormModal({
  dark: darkProp,
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
  const [isClosing, setIsClosing] = useState(false)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (open && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal()
    }
  }, [open])

  const handleClose = () => {
    if (isClosing || submitting) return
    setIsClosing(true)
    setTimeout(() => {
      if (dialogRef.current) dialogRef.current.close()
      onClose()
      setIsClosing(false)
    }, 180)
  }

  if (!open) return null

  const isDark = darkProp !== undefined 
    ? darkProp 
    : (tokens?.dark ?? (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')))

  const BRAND = tokens?.brand || DEFAULT_BRAND
  const isOrganizerRole = window.location.pathname.includes('/organizer') || (sessionStorage.getItem('cc_role') || '').toLowerCase().includes('organizer')

  const inputStyle = {
    border: `1px solid ${isDark ? '#1a3050' : '#e2e8f0'}`,
    color: isDark ? '#e8f0fe' : '#0f172a',
    background: isDark ? '#060e1c' : '#f8fafc',
  }

  let modalTitle = 'Create New Event'
  if (selectedEvent) {
    const fallbackName = selectedEvent.name || selectedEvent.title || selectedEvent.event_name || formState.name || ''
    modalTitle = `Edit Event — ${fallbackName}`
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className={`fixed inset-0 z-9999 m-0 p-0 w-full h-full border-none bg-transparent ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
      onClose={handleClose}
      style={{ maxWidth: '100vw', maxHeight: '100vh' }}
    >
      <button
        type="button"
        className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-sm border-none cursor-default"
        onClick={handleClose}
        aria-label="Close overlay"
      />
      <div
        className="fixed inset-0 pointer-events-none flex items-center justify-center p-5"
      >
        <div
          className={`pointer-events-auto rounded-[24px] w-full max-w-[650px] overflow-hidden transition-all duration-300 ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
          style={{
            background: isDark ? '#0c1829' : '#ffffff',
            border: `1px solid ${isDark ? '#1a3050' : '#e8edf5'}`,
            boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          }}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: `1px solid ${isDark ? '#1a3050' : '#e8edf5'}` }}>
            <h2 className="text-[19px] font-extrabold m-0" style={{ color: isDark ? '#e8f0fe' : '#0f172a' }}>
              {modalTitle}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 p-0"
              style={{ color: isDark ? '#4a6a8a' : '#94a3b8' }}
              onMouseEnter={e => { e.currentTarget.style.background = isDark ? '#162640' : '#f1f5f9'; e.currentTarget.style.color = isDark ? '#e8f0fe' : '#475569' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isDark ? '#4a6a8a' : '#94a3b8' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-8 py-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
            <EventFormBasicInfo
              dark={isDark}
              BRAND={BRAND}
              inputStyle={inputStyle}
              formState={formState}
              setFormState={setFormState}
              formErrors={formErrors}
              categories={categories}
            />

            <EventFormTypesAndOrganizer
              dark={isDark}
              BRAND={BRAND}
              inputStyle={inputStyle}
              formState={formState}
              setFormState={setFormState}
              formErrors={formErrors}
              isOrganizerRole={isOrganizerRole}
            />

            <EventFormSchedulingDates
              dark={isDark}
              BRAND={BRAND}
              inputStyle={inputStyle}
              formState={formState}
              setFormState={setFormState}
              formErrors={formErrors}
            />

            <EventFormSchedulingCapacity
              dark={isDark}
              BRAND={BRAND}
              inputStyle={inputStyle}
              formState={formState}
              setFormState={setFormState}
              formErrors={formErrors}
            />
          </div>

          {/* Modal Footer */}
          <EventFormModalFooter
            dark={isDark}
            BRAND={BRAND}
            submitting={submitting}
            handleClose={handleClose}
            onSaveEvent={onSaveEvent}
            isOrganizerRole={isOrganizerRole}
            selectedEvent={selectedEvent}
          />

        </div>
      </div>
    </dialog>,
    document.body
  )
}
