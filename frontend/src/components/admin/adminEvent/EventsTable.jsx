import { 
  Calendar, Check, X, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, CheckCircle2, Sparkles, Clock
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { BRAND as DEFAULT_BRAND } from '../../../data/dashboardData'

const getPageBg = (active, dark, BRAND) => {
  if (active) return BRAND
  return dark ? '#0f1e30' : '#f1f5f9'
}

const getPageColor = (active, dark) => {
  if (active) return '#ffffff'
  return dark ? '#7a98bb' : '#475569'
}

function getEventStartAndEnd(ev) {
  let start = null
  let end = null

  const rawStart = ev.start_datetime || ev.startDateTime || ev.date || ev.event_date
  if (rawStart) {
    let dtStr = rawStart
    if (ev.time && !String(rawStart).includes('T') && !String(rawStart).includes(':')) {
      dtStr += ` ${ev.time}`
    }
    const d = new Date(dtStr)
    if (!Number.isNaN(d.getTime())) start = d
  }

  const rawEnd = ev.end_datetime || ev.endDateTime
  if (rawEnd) {
    const d = new Date(rawEnd)
    if (!Number.isNaN(d.getTime())) end = d
  } else if (start) {
    if (String(rawStart).includes('T') || String(rawStart).includes(':')) {
      end = new Date(start.getTime() + 3 * 60 * 60 * 1000)
    } else {
      end = new Date(start)
      end.setHours(23, 59, 59, 999)
    }
  }

  return { start, end }
}

const checkIsOngoing = (event, eventStart, eventEnd, now) => {
  const st = String(event.status || '').toLowerCase()
  if (st === 'ongoing' || st === 'running') return true
  if (eventStart && eventEnd) {
    return now >= eventStart && now < eventEnd
  }
  return false
}

const checkIsCompleted = (event, eventEnd, now) => {
  const st = String(event.status || '').toLowerCase()
  if (st === 'completed' || st === 'finished') return true
  if (eventEnd) {
    return now >= eventEnd
  }
  return false
}

const checkIsMyEvent = (event, user) => {
  if (!user) return false
  const currentUserId = String(user.id || user.user_id || user.student_id || '').toLowerCase()
  const currentUserEmail = String(user.email || '').toLowerCase()
  const currentUserName = String(user.name || user.full_name || user.username || '').toLowerCase()
  const currentUserRole = String(user.role || user.userType || '').toLowerCase()

  const evOrganizerId = String(event.organizer_id || event.organizerId || event.created_by || event.user_id || '').toLowerCase()
  const evOrganizer = String(event.organizer || event.organizer_name || event.organized_by || '').toLowerCase()

  if (currentUserId && evOrganizerId && currentUserId === evOrganizerId) return true
  if (currentUserName && evOrganizer && (evOrganizer.includes(currentUserName) || currentUserName.includes(evOrganizer))) return true
  if (currentUserEmail && evOrganizer?.includes(currentUserEmail)) return true
  if (currentUserRole.includes('organizer') && (evOrganizer === 'organizer' || evOrganizer === 'oragnizer')) return true
  return false
}

const getRowBorderBottom = (i, total, dark) => {
  if (i >= total - 1) return 'none'
  return `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`
}

const getRegProgressBg = (isApproved, BRAND, dark) => {
  if (isApproved) return BRAND
  return dark ? '#334155' : '#cbd5e1'
}

function EventStatusBadge({ isCompleted, isOngoing, eventStatus, badge, dark }) {
  if (isCompleted) {
    return (
      <span 
        className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 text-center border"
        style={{
          background: dark ? 'rgba(168, 85, 247, 0.15)' : '#f3e8ff',
          color: dark ? '#c084fc' : '#7e22ce',
          borderColor: dark ? 'rgba(168, 85, 247, 0.3)' : '#e9d5ff'
        }}
      >
        <CheckCircle2 size={11} />
        Completed
      </span>
    )
  }
  if (isOngoing) {
    return (
      <span 
        className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 text-center border"
        style={{
          background: dark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe',
          color: dark ? '#60a5fa' : '#1d4ed8',
          borderColor: dark ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe'
        }}
      >
        <Clock size={11} className="animate-pulse" />
        Ongoing
      </span>
    )
  }
  return (
    <span 
      className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider inline-block text-center"
      style={{ background: badge.bg, color: badge.text }}
    >
      {eventStatus}
    </span>
  )
}

function EditEventButton({ isCompleted, isOrganizerRole, isMyEvent, onOpenEdit, event, dark, BRAND }) {
  const disabled = isCompleted || (isOrganizerRole && !isMyEvent)
  let title = "Edit event"
  if (isCompleted) {
    title = "Completed events cannot be edited"
  } else if (isOrganizerRole && !isMyEvent) {
    title = "You can't edit this event"
  }

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        onClick={(e) => e.stopPropagation()}
        title={title}
        className="w-[28px] h-[28px] rounded-lg bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed flex items-center justify-center opacity-40 transition-all duration-150 p-0 border"
        style={{ borderColor: dark ? '#1a3050' : '#e2e8f0', color: dark ? '#475569' : '#94a3b8' }}
      >
        <Pencil size={12.5} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => onOpenEdit(event, e)}
      title={title}
      className="w-[28px] h-[28px] rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 p-0 border"
      style={{ borderColor: dark ? '#1a3050' : '#e2e8f0', color: dark ? '#7a98bb' : '#94a3b8' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#7a98bb' : '#94a3b8' }}
    >
      <Pencil size={12.5} />
    </button>
  )
}

function DeleteEventButton({ isOrganizerRole, isMyEvent, onOpenDelete, event, dark }) {
  const disabled = isOrganizerRole && !isMyEvent
  const title = disabled ? "You can't delete this event" : "Delete event"

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        onClick={(e) => e.stopPropagation()}
        title={title}
        className="w-[28px] h-[28px] rounded-lg bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed flex items-center justify-center opacity-40 transition-all duration-150 p-0 border"
        style={{ borderColor: dark ? '#1a3050' : '#e2e8f0', color: dark ? '#475569' : '#94a3b8' }}
      >
        <Trash2 size={12.5} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => onOpenDelete(event, e)}
      title={title}
      className="w-[28px] h-[28px] rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 p-0 border"
      style={{ borderColor: dark ? '#1a3050' : '#e2e8f0', color: dark ? '#7a98bb' : '#94a3b8' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#7a98bb' : '#94a3b8' }}
    >
      <Trash2 size={12.5} />
    </button>
  )
}

const getEffectiveRegCount = (isApproved, event) => {
  if (!isApproved) return 0
  return event.total_registrations || event.registration_count || event.registrationsCount || 0
}

const getRegPercent = (isApproved, capacity, regCount) => {
  if (!isApproved || !capacity) return 0
  return Math.min(Math.round((regCount / capacity) * 100), 100)
}

function AdminApprovalCell({ isApproved, event, onOpenApprovalConfirm }) {
  if (isApproved) {
    return (
      <span 
        className="px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 border bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-default w-fit"
        title="Approved (Decision Locked)"
      >
        <Check size={12} strokeWidth={3} />
        Approved
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={(e) => onOpenApprovalConfirm(event, 'Approved', e)}
        title="Click to Approve Event"
        className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all flex items-center gap-1 border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
      >
        <Check size={11} strokeWidth={3} />
        Approve
      </button>
      <button
        type="button"
        onClick={(e) => onOpenApprovalConfirm(event, 'Rejected', e)}
        title="Click to Reject Event"
        className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all flex items-center gap-1 border bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20"
      >
        <X size={11} strokeWidth={3} />
        Rejected
      </button>
    </div>
  )
}

function EventRow({ event, i, total, user, dark, BRAND, getStatusBadgeStyles, onOpenView, onOpenEdit, onOpenDelete, onOpenApprovalConfirm }) {
  const isApproved = (event.approvalStatus || 'Approved') === 'Approved'
  const effectiveRegCount = getEffectiveRegCount(isApproved, event)
  const regPercent = getRegPercent(isApproved, event.capacity, effectiveRegCount)
  const badge = getStatusBadgeStyles(event.status)

  const { start: eventStart, end: eventEnd } = getEventStartAndEnd(event)
  const now = new Date()

  const isOngoing = checkIsOngoing(event, eventStart, eventEnd, now)
  const isCompleted = checkIsCompleted(event, eventEnd, now)
  const isMyEvent = checkIsMyEvent(event, user)

  const currentUserRole = String(user?.role || user?.userType || '').toLowerCase()
  const isOrganizerRole = currentUserRole.includes('organizer') && !currentUserRole.includes('admin')

  return (
    <tr 
      className="transition-colors duration-150 hover:bg-slate-50/50 dark:hover:bg-[#162640]/20"
      style={{ borderBottom: getRowBorderBottom(i, total, dark) }}
    >
      {/* ID */}
      <td className="px-5 py-4 text-[13px] font-bold" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
        {event.id}
      </td>

      {/* Name + Organizer */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 flex-wrap font-sans">
          <div className="text-[13.5px] font-bold" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{event.name}</div>
          {isMyEvent && (
            <span 
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide border shadow-xs transition-all duration-200"
              style={{
                background: dark 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(59, 130, 246, 0.18))' 
                  : 'linear-gradient(135deg, #eef2ff, #eff6ff)',
                color: dark ? '#a5b4fc' : '#4338ca',
                borderColor: dark ? 'rgba(165, 180, 252, 0.35)' : '#c7d2fe',
              }}
              title="Created & managed by you"
            >
              <Sparkles size={10} className="text-indigo-500 dark:text-indigo-400" />
              <span>My Event</span>
            </span>
          )}
        </div>
        <div className="text-[11px] mt-0.5 font-medium flex items-center gap-1" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
          <span>{event.organizer}</span>
          {isMyEvent && (
            <span className="font-extrabold text-indigo-500 dark:text-indigo-400 text-[10.5px]">
              (You)
            </span>
          )}
        </div>
      </td>

      {/* Category & Type */}
      <td className="px-5 py-4">
        <div className="text-[13px] font-semibold" style={{ color: dark ? '#e8f0fe' : '#334155' }}>
          {event.category}
        </div>
        <span
          className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase"
          style={{
            background: dark ? `${BRAND}20` : `${BRAND}12`,
            color: BRAND
          }}
        >
          {event.eventType || 'Individual'}
        </span>
      </td>

      {/* Venue */}
      <td className="px-5 py-4 text-[13px]" style={{ color: dark ? '#7a98bb' : '#475569' }}>
        {event.venue}
      </td>

      {/* Date */}
      <td className="px-5 py-4 text-[13px]" style={{ color: dark ? '#7a98bb' : '#475569' }}>
        {event.date}
      </td>

      {/* Combined Registrations & Capacity */}
      <td className="px-5 py-4 min-w-[150px]">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[13px] font-extrabold" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
            {effectiveRegCount} <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">/ {event.capacity}</span>
          </span>
          <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500">
            {regPercent}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <div 
            className="h-full rounded-full transition-all duration-300"
            style={{ 
              width: `${regPercent}%`, 
              background: getRegProgressBg(isApproved, BRAND, dark)
            }}
          />
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <EventStatusBadge
          isCompleted={isCompleted}
          isOngoing={isOngoing}
          eventStatus={event.status}
          badge={badge}
          dark={dark}
        />
      </td>

      {/* Admin Approval Switch / Badge */}
      <td className="px-5 py-4">
        <AdminApprovalCell
          isApproved={isApproved}
          event={event}
          onOpenApprovalConfirm={onOpenApprovalConfirm}
        />
      </td>

      {/* Actions */}
      <td className="px-5 py-4 text-right">
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={(e) => onOpenView(event, e)}
            title="View event details"
            className="w-[28px] h-[28px] rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 p-0 border"
            style={{ borderColor: dark ? '#1a3050' : '#e2e8f0', color: dark ? '#7a98bb' : '#94a3b8' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#7a98bb' : '#94a3b8' }}
          >
            <Eye size={12.5} />
          </button>
          
          <EditEventButton
            isCompleted={isCompleted}
            isOrganizerRole={isOrganizerRole}
            isMyEvent={isMyEvent}
            onOpenEdit={onOpenEdit}
            event={event}
            dark={dark}
            BRAND={BRAND}
          />

          <DeleteEventButton
            isOrganizerRole={isOrganizerRole}
            isMyEvent={isMyEvent}
            onOpenDelete={onOpenDelete}
            event={event}
            dark={dark}
          />
        </div>
      </td>
    </tr>
  )
}

function EventRows({ loading, filteredEvents, paginatedEvents, user, dark, BRAND, getStatusBadgeStyles, onOpenView, onOpenEdit, onOpenDelete, onOpenApprovalConfirm }) {
  if (loading) {
    return [1, 2, 3, 4, 5].map(i => (
      <tr key={i}>
        <td className="px-5 py-4"><div className="w-12 h-3.5 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
        <td className="px-5 py-4">
          <div className="w-36 h-4 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse mb-1" />
          <div className="w-24 h-3 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" />
        </td>
        <td className="px-5 py-4"><div className="w-16 h-3.5 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
        <td className="px-5 py-4"><div className="w-28 h-3.5 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
        <td className="px-5 py-4"><div className="w-20 h-3.5 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
        <td className="px-5 py-4">
          <div className="w-32 h-2 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" />
        </td>
        <td className="px-5 py-4"><div className="w-16 h-5 rounded-full bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
        <td className="px-5 py-4"><div className="w-20 h-6 rounded-full bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
        <td className="px-5 py-4"><div className="w-16 h-7 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse ml-auto" /></td>
      </tr>
    ))
  }

  if (filteredEvents.length === 0) {
    return (
      <tr>
        <td colSpan="9" className="p-12 text-center">
          <Calendar size={40} className="block mx-auto mb-3" style={{ color: dark ? '#3d5470' : '#94a3b8' }} />
          <p className="text-[14px] font-medium" style={{ color: dark ? '#7a98bb' : '#64748b' }}>No events found</p>
        </td>
      </tr>
    )
  }

  return paginatedEvents.map((event, i) => (
    <EventRow
      key={event.id}
      event={event}
      i={i}
      total={paginatedEvents.length}
      user={user}
      dark={dark}
      BRAND={BRAND}
      getStatusBadgeStyles={getStatusBadgeStyles}
      onOpenView={onOpenView}
      onOpenEdit={onOpenEdit}
      onOpenDelete={onOpenDelete}
      onOpenApprovalConfirm={onOpenApprovalConfirm}
    />
  ))
}

function EventsTablePaginationPageButtons({ totalPages, currentPage, setCurrentPage, BRAND, dark }) {
  return Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
    const active = page === currentPage
    return (
      <button
        type="button"
        key={page}
        onClick={() => setCurrentPage(page)}
        className="w-8 h-8 rounded-lg text-[12.5px] font-extrabold cursor-pointer transition-all border-none"
        style={{
          background: getPageBg(active, dark, BRAND),
          color: getPageColor(active, dark),
          boxShadow: active ? '0 3px 10px rgba(97,95,255,0.3)' : 'none'
        }}
      >
        {page}
      </button>
    )
  })
}

function TablePaginationBar({
  dark,
  BRAND,
  totalItems,
  startIndex,
  endIndex,
  itemsPerPage,
  setItemsPerPage,
  currentPage,
  setCurrentPage,
  totalPages
}) {
  const textColor = dark ? '#7a98bb' : '#64748b'
  const strongColor = dark ? '#e8f0fe' : '#0f172a'

  return (
    <div 
      className="flex items-center justify-between flex-wrap gap-4 px-6 py-4"
      style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}
    >
      <div className="flex items-center gap-4">
        <span className="text-[12.5px] font-medium" style={{ color: textColor }}>
          Showing <strong style={{ color: strongColor }}>{totalItems > 0 ? startIndex + 1 : 0}</strong> to{' '}
          <strong style={{ color: strongColor }}>{endIndex}</strong> of{' '}
          <strong style={{ color: strongColor }}>{totalItems}</strong> entries
        </span>

        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500">Per page:</span>
          <select
            value={itemsPerPage}
            onChange={e => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="px-2.5 py-1 rounded-lg text-[12px] font-bold outline-none cursor-pointer border"
            style={{
              background: dark ? '#0f1e30' : '#ffffff',
              borderColor: dark ? '#1a3050' : '#cbd5e1',
              color: dark ? '#e8f0fe' : '#334155'
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border bg-transparent cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            borderColor: dark ? '#1a3050' : '#e2e8f0',
            color: dark ? '#e8f0fe' : '#475569'
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <EventsTablePaginationPageButtons
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          BRAND={BRAND}
          dark={dark}
        />

        <button
          type="button"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-lg border bg-transparent cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            borderColor: dark ? '#1a3050' : '#e2e8f0',
            color: dark ? '#e8f0fe' : '#475569'
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default function EventsTable({
  dark,
  tokens,
  loading,
  filteredEvents,
  paginatedEvents,
  totalItems,
  totalPages,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  startIndex,
  endIndex,
  getStatusBadgeStyles,
  onOpenView,
  onOpenEdit,
  onOpenDelete,
  onOpenApprovalConfirm
}) {
  const BRAND = tokens?.brand || DEFAULT_BRAND
  const { user } = useAuth() || {}

  const cardStyle = {
    background: tokens.card,
    border: `1px solid ${tokens.border}`,
    boxShadow: tokens.shadow,
  }

  const headerBorder = `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`
  const headerColor = dark ? '#7a98bb' : '#64748b'
  const headerBg = dark ? '#0c1829' : '#f8fafc'

  return (
    <div className="rounded-2xl overflow-hidden mb-8 transition-all duration-200" style={cardStyle}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr 
              className="text-[11px] font-extrabold uppercase tracking-wider"
              style={{ 
                borderBottom: headerBorder,
                color: headerColor,
                background: headerBg
              }}
            >
              <th className="px-5 py-4">Event ID</th>
              <th className="px-5 py-4">Event Name</th>
              <th className="px-5 py-4">Category &amp; Type</th>
              <th className="px-5 py-4">Venue</th>
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4">Registration &amp; Capacity</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Admin Approval</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y" style={{ divideColor: dark ? '#1a3050' : '#e2e8f0' }}>
            <EventRows
              loading={loading}
              filteredEvents={filteredEvents}
              paginatedEvents={paginatedEvents}
              user={user}
              dark={dark}
              BRAND={BRAND}
              getStatusBadgeStyles={getStatusBadgeStyles}
              onOpenView={onOpenView}
              onOpenEdit={onOpenEdit}
              onOpenDelete={onOpenDelete}
              onOpenApprovalConfirm={onOpenApprovalConfirm}
            />
          </tbody>
        </table>
      </div>

      <TablePaginationBar
        dark={dark}
        BRAND={BRAND}
        totalItems={totalItems}
        startIndex={startIndex}
        endIndex={endIndex}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />
    </div>
  )
}
