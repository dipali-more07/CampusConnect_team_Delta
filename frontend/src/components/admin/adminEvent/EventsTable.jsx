import { 
  Calendar, Check, X, Eye, Pencil, Trash2, ChevronLeft, ChevronRight 
} from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../../data/dashboardData'

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

  const cardStyle = {
    background: tokens.card,
    border: `1px solid ${tokens.border}`,
    boxShadow: tokens.shadow,
  }

  return (
    <div className="rounded-2xl overflow-hidden mb-8 transition-all duration-200" style={cardStyle}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr 
              className="text-[11px] font-extrabold uppercase tracking-wider"
              style={{ 
                borderBottom: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`,
                color: dark ? '#7a98bb' : '#64748b',
                background: dark ? '#0c1829' : '#f8fafc'
              }}
            >
              <th className="px-5 py-4">Event ID</th>
              <th className="px-5 py-4">Event Name</th>
              <th className="px-5 py-4">Category & Type</th>
              <th className="px-5 py-4">Venue</th>
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4">Registration & Capacity</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Admin Approval</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y" style={{ divideColor: dark ? '#1a3050' : '#e2e8f0' }}>
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
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
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-12 text-center">
                  <Calendar size={40} className="block mx-auto mb-3" style={{ color: dark ? '#3d5470' : '#94a3b8' }} />
                  <p className="text-[14px] font-medium" style={{ color: dark ? '#7a98bb' : '#64748b' }}>No events found</p>
                </td>
              </tr>
            ) : (
              paginatedEvents.map((event, i) => {
                const isApproved = (event.approvalStatus || 'Approved') === 'Approved'
                const effectiveRegCount = isApproved ? (event.registrationsCount || 0) : 0
                const regPercent = isApproved && event.capacity ? Math.min(Math.round((effectiveRegCount / event.capacity) * 100), 100) : 0
                const badge = getStatusBadgeStyles(event.status)
                
                return (
                  <tr 
                    key={event.id}
                    className="transition-colors duration-150 hover:bg-slate-50/50 dark:hover:bg-[#162640]/20"
                    style={{ borderBottom: i < paginatedEvents.length - 1 ? `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` : 'none' }}
                  >
                    {/* ID */}
                    <td className="px-5 py-4 text-[13px] font-bold" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                      {event.id}
                    </td>

                    {/* Name + Organizer */}
                    <td className="px-5 py-4">
                      <div className="text-[13.5px] font-bold" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{event.name}</div>
                      <div className="text-[11px] mt-0.5 font-medium" style={{ color: dark ? '#7a98bb' : '#64748b' }}>{event.organizer}</div>
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
                            background: isApproved ? BRAND : (dark ? '#334155' : '#cbd5e1') 
                          }}
                        />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span 
                        className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider inline-block text-center"
                        style={{ background: badge.bg, color: badge.text }}
                      >
                        {event.status}
                      </span>
                    </td>

                    {/* Admin Approval Switch / Badge */}
                    <td className="px-5 py-4">
                      {isApproved ? (
                        <span 
                          className="px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 border bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-default w-fit"
                          title="Approved (Decision Locked)"
                        >
                          <Check size={12} strokeWidth={3} />
                          Approved
                        </span>
                      ) : (
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
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={(e) => onOpenView(event, e)}
                          title="View event details"
                          className="w-[28px] h-[28px] rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
                          style={{ border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`, color: dark ? '#7a98bb' : '#94a3b8' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#7a98bb' : '#94a3b8' }}
                        >
                          <Eye size={12.5} />
                        </button>
                        
                        <button
                          onClick={(e) => onOpenEdit(event, e)}
                          title="Edit event"
                          className="w-[28px] h-[28px] rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
                          style={{ border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`, color: dark ? '#7a98bb' : '#94a3b8' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#7a98bb' : '#94a3b8' }}
                        >
                          <Pencil size={12.5} />
                        </button>

                        <button
                          onClick={(e) => onOpenDelete(event, e)}
                          title="Delete event"
                          className="w-[28px] h-[28px] rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
                          style={{ border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`, color: dark ? '#7a98bb' : '#94a3b8' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.currentTarget.style.color = dark ? '#7a98bb' : '#94a3b8' }}
                        >
                          <Trash2 size={12.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Table Pagination Bar ── */}
      <div 
        className="flex items-center justify-between flex-wrap gap-4 px-6 py-4"
        style={{ borderTop: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}
      >
        {/* Showing status & Items per page */}
        <div className="flex items-center gap-4">
          <span className="text-[12.5px] font-medium" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
            Showing <strong style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{totalItems > 0 ? startIndex + 1 : 0}</strong> to{' '}
            <strong style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{endIndex}</strong> of{' '}
            <strong style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>{totalItems}</strong> entries
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

        {/* Pagination Page Controls */}
        <div className="flex items-center gap-1.5">
          <button
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

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
            const active = page === currentPage
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 rounded-lg text-[12.5px] font-extrabold cursor-pointer transition-all border-none"
                style={{
                  background: active ? BRAND : (dark ? '#0f1e30' : '#f1f5f9'),
                  color: active ? '#ffffff' : (dark ? '#7a98bb' : '#475569'),
                  boxShadow: active ? '0 3px 10px rgba(97,95,255,0.3)' : 'none'
                }}
              >
                {page}
              </button>
            )
          })}

          <button
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
    </div>
  )
}
