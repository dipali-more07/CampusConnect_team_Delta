import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  Loader2
} from 'lucide-react'
import paymentsService from '../../services/paymentsService'
import eventsService from '../../services/eventsService'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'

export default function PaymentsPage({ tokens }) {
  const { dark } = tokens
  const BRAND = tokens?.brand || '#615FFF'
  const showToast = useToast()
  const { user } = useAuth()
  
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [eventFilter, setEventFilter] = useState('All')   // 'All' | { id, name }

  // Events list for the dropdown
  const [eventsList, setEventsList] = useState([])

  // Theme-aware styles
  const cardStyle = {
    background: tokens.card,
    borderColor: tokens.border,
    boxShadow: tokens.shadow
  }
  const inputStyle = {
    background: tokens.inputBg,
    borderColor: tokens.border,
    color: tokens.txtPri
  }
  const textPri = { color: tokens.txtPri }
  const textSec = { color: tokens.txtSec }

  const filterEventsByOrganizer = useCallback((events) => {
    if (!events) return []
    if (user?.role !== 'organizer') return events
    return events.filter(ev => {
      const orgName = (ev.organizer || '').toLowerCase()
      const uName = (user.name || '').toLowerCase()
      const uFullName = (user.full_name || '').toLowerCase()
      const uEmail = (user.email || '').toLowerCase()
      const uUsername = (user.username || '').toLowerCase()
      const orgId = String(ev.organizer_id || ev.created_by || ev.organizer?.id || '')
      const uId = String(user.id || user.organizer_id || '')
      
      const matchesName = uName && (orgName.includes(uName) || orgName === uName)
      const matchesFullName = uFullName && (orgName.includes(uFullName) || orgName === uFullName)
      const matchesEmail = uEmail && (orgName.includes(uEmail.split('@')[0]) || orgName === uEmail)
      const matchesUsername = uUsername && (orgName.includes(uUsername) || orgName === uUsername)
      const matchesId = uId && orgId && orgId === uId
      
      // Special check for Jayesh Nikumbh / Oragnizer username mismatch
      const isJayeshUser = uEmail.includes('nikumbh') || uEmail.includes('jayesh') || uName.includes('jayesh')
      const matchesJayesh = isJayeshUser && (orgName === 'jayesh' || orgName === 'oragnizer' || orgName.includes('nikumbh') || orgName.includes('jayesh'))

      return matchesName || matchesFullName || matchesEmail || matchesUsername || matchesId || matchesJayesh
    })
  }, [user])

  // ── Load events list for dropdown ─────────────────────────────
  useEffect(() => {
    eventsService.fetchAll().then(res => {
      if (res.success) {
        const filtered = filterEventsByOrganizer(res.events)
        // Sort by created_at descending (latest first)
        const sorted = [...filtered].sort((a, b) => {
          const dateA = new Date(a.created_at || a.start_datetime || 0)
          const dateB = new Date(b.created_at || b.start_datetime || 0)
          return dateB - dateA
        })
        const mappedList = sorted.map(e => ({ id: e.id, name: e.name }))
        setEventsList(mappedList)
        
        // Default selection: Latest managed event if the user is an organizer
        if (user?.role === 'organizer' && mappedList.length > 0) {
          setEventFilter(mappedList[0])
        }
      }
    })
  }, [filterEventsByOrganizer, user])

  // ── Load payments whenever event filter changes ────────────────
  const loadPayments = useCallback(async (selectedEvent) => {
    setLoading(true)
    let res

    if (selectedEvent && selectedEvent !== 'All') {
      // Specific event → GET /payments/event/{event_id}
      res = await paymentsService.fetchByEvent(selectedEvent.id, {}, selectedEvent.name || '')
    } else {
      // All events: fetch events first, then fetch per-event payments
      try {
        const evRes = await eventsService.fetchAll()
        const rawEvList = evRes.success ? evRes.events : []
        const evList = filterEventsByOrganizer(rawEvList)

        if (evList.length === 0) {
          res = { success: true, payments: [] }
        } else {
          const allResults = await Promise.allSettled(
            evList.map(ev => paymentsService.fetchByEvent(ev.id, {}, ev.name || ''))
          )
          const combined = []
          const seen = new Set()
          allResults.forEach(r => {
            if (r.status === 'fulfilled' && r.value.success) {
              r.value.payments.forEach(p => {
                const key = p.id || p.transactionId
                if (!seen.has(key)) {
                  seen.add(key)
                  combined.push(p)
                }
              })
            }
          })
          res = { success: true, payments: combined }
        }
      } catch (err) {
        res = { success: false, payments: [], message: 'Failed to load payments.' }
      }
    }

    if (res.success) {
      setPayments(res.payments)
    } else {
      showToast(res.message || 'Failed to load payment records.', 'error')
      setPayments([])
    }
    setLoading(false)
  }, [showToast, filterEventsByOrganizer])

  useEffect(() => {
    if (user) {
      loadPayments(eventFilter)
    }
  }, [eventFilter, loadPayments, user])



  // Calculate statistics from payments list
  const successPayments = payments.filter(p => p.status === 'Success')
  const totalRevenue = successPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalCount = successPayments.length
  const pendingCount = payments.filter(p => p.status === 'Pending').length
  const failedCount = payments.filter(p => p.status === 'Failed').length
  
  // Calculate revenue grouped by event
  const revenueByEvent = payments.reduce((acc, p) => {
    if (p.status !== 'Success') return acc
    if (!acc[p.eventName]) {
      acc[p.eventName] = {
        amount: 0,
        count: 0,
        eventId: p.eventId
      }
    }
    acc[p.eventName].amount += p.amount
    acc[p.eventName].count += 1
    return acc
  }, {})

  // Convert to array and sort by revenue descending
  const sortedEventRevenues = Object.keys(revenueByEvent).map(name => ({
    name,
    amount: revenueByEvent[name].amount,
    count: revenueByEvent[name].count,
    eventId: revenueByEvent[name].eventId
  })).sort((a, b) => b.amount - a.amount)

  // Filter payments — event filtering is handled by API, only search+status here
  const filteredPayments = payments.filter(p => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      (p.studentName || '').toLowerCase().includes(searchLower) ||
      (p.rollNo || '').toLowerCase().includes(searchLower) ||
      (p.eventName || '').toLowerCase().includes(searchLower) ||
      (p.transactionId || '').toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val)
  }

  // Export payments to CSV
  const handleExport = () => {
    if (filteredPayments.length === 0) {
      showToast('No payment records to export.', 'warning')
      return
    }
    
    const csvContent = 
      'Transaction ID,Student Name,Roll No,Email,Event,Amount,Method,Status,Date\n' +
      filteredPayments.map(p => 
        `"${p.transactionId}","${p.studentName}","${p.rollNo}","${p.email}","${p.eventName}",${p.amount},"${p.method}","${p.status}","${p.date}"`
      ).join('\n')
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `payments_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Payment report exported successfully.', 'success')
  }

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 size={12} /> Success
          </span>
        )
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertCircle size={12} /> Pending
          </span>
        )
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
            <XCircle size={12} /> Failed
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* ── HEADER ROW ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold m-0 tracking-tight" style={textPri}>Payments & Revenue</h1>
          <p className="text-[13px] mt-1" style={textSec}>Track participant fees, transaction status, and event-wise earnings</p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-bold border cursor-pointer transition-all bg-transparent"
          style={{ borderColor: tokens.border, color: tokens.txtSec }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = BRAND
            e.currentTarget.style.color = BRAND
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = tokens.border
            e.currentTarget.style.color = tokens.txtSec
          }}
        >
          <Download size={14} /> Export Report
        </button>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : (
        <>
          {/* ── METRICS GRID ── */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${user?.role === 'organizer' ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4`}>
            
            {/* Total Revenue */}
            <div className="p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden" style={cardStyle}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00BC7D]/5 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider uppercase" style={textSec}>Total Revenue</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                  <TrendingUp size={16} />
                </div>
              </div>
              <h2 className="text-[26px] font-black mt-3 mb-1" style={textPri}>
                {formatCurrency(totalRevenue)}
              </h2>
              <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                <ArrowUpRight size={12} /> Real-time earnings
              </p>
            </div>

            {/* Total Payments Count */}
            <div className="p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden" style={cardStyle}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#615FFF]/5 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider uppercase" style={textSec}>Paid Bookings</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/10 text-indigo-500">
                  <CreditCard size={16} />
                </div>
              </div>
              <h2 className="text-[26px] font-black mt-3 mb-1" style={textPri}>
                {totalCount}
              </h2>
              <p className="text-[11px] font-semibold" style={textSec}>
                Successful transactions
              </p>
            </div>

            {user?.role !== 'organizer' && (
              <>
                {/* Pending Payments */}
                <div className="p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden" style={cardStyle}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider uppercase" style={textSec}>Pending Payments</span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-500">
                      <AlertCircle size={16} />
                    </div>
                  </div>
                  <h2 className="text-[26px] font-black mt-3 mb-1" style={textPri}>
                    {pendingCount}
                  </h2>
                  <p className="text-[11px] text-amber-500 font-semibold">
                    Requires validation
                  </p>
                </div>

                {/* Failed Count */}
                <div className="p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden" style={cardStyle}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider uppercase" style={textSec}>Failed Payments</span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-500">
                      <XCircle size={16} />
                    </div>
                  </div>
                  <h2 className="text-[26px] font-black mt-3 mb-1" style={textPri}>
                    {failedCount}
                  </h2>
                  <p className="text-[11px] text-red-500 font-semibold">
                    Dropped checkouts
                  </p>
                </div>
              </>
            )}

          </div>

          {/* ── LOWER CONTENT GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Event-wise Breakdown */}
            {user?.role !== 'organizer' && (
              <div className="lg:col-span-1 p-5 rounded-2xl border flex flex-col h-fit" style={cardStyle}>
                <div className="mb-4">
                  <h3 className="text-[16px] font-extrabold m-0" style={textPri}>Event Earnings</h3>
                  <p className="text-[11.5px] mt-0.5" style={textSec}>Revenue breakdown per event registration</p>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {sortedEventRevenues.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No paid events found.
                    </div>
                  ) : (
                    sortedEventRevenues.map((event, idx) => {
                      const percentage = totalRevenue > 0 ? (event.amount / totalRevenue) * 100 : 0
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="truncate max-w-[170px]" style={textPri} title={event.name}>
                              {event.name}
                            </span>
                            <span className="shrink-0" style={{ color: BRAND }}>
                              {formatCurrency(event.amount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px]" style={textSec}>
                            <span>{event.count} registrations</span>
                            <span>{percentage.toFixed(1)}% of total</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500" 
                              style={{ 
                                width: `${percentage}%`,
                                background: BRAND
                              }} 
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* Transactions History List */}
            <div className={`${user?.role === 'organizer' ? 'lg:col-span-3' : 'lg:col-span-2'} p-5 rounded-2xl border flex flex-col`} style={cardStyle}>
              <div className="mb-4">
                <h3 className="text-[16px] font-extrabold m-0" style={textPri}>Transaction Records</h3>
                <p className="text-[11.5px] mt-0.5" style={textSec}>Details of recent registration transactions</p>
              </div>

              {/* Filters Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search name, roll no, transaction ID..."
                    className="w-full pl-9 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 transition-all"
                    style={{
                      ...inputStyle,
                      focusBorderColor: BRAND,
                      focusRingColor: BRAND
                    }}
                  />
                </div>

                {/* Status Filter */}
                <div className="relative shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Filter size={12} />
                  </span>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="pl-8 pr-8 py-2 border rounded-xl text-xs bg-white dark:bg-[#0c1829] focus:outline-none appearance-none cursor-pointer"
                    style={inputStyle}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Success">Success</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[9px]">▼</span>
                </div>

                {/* Event Filter — uses real events from API */}
                {(user?.role !== 'organizer' || eventsList.length > 1) && (
                  <div className="relative shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Filter size={12} />
                    </span>
                    <select
                      value={eventFilter === 'All' ? 'All' : eventFilter.id}
                      onChange={e => {
                        const val = e.target.value
                        if (val === 'All') {
                          setEventFilter('All')
                        } else {
                          const found = eventsList.find(ev => ev.id === val)
                          setEventFilter(found || 'All')
                        }
                      }}
                      className="pl-8 pr-8 py-2 border rounded-xl text-xs bg-white dark:bg-[#0c1829] max-w-[180px] truncate focus:outline-none appearance-none cursor-pointer"
                      style={inputStyle}
                    >
                      <option value="All">All Events</option>
                      {eventsList.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[9px]">▼</span>
                  </div>
                )}

              </div>

              {/* Transactions Table */}
              <div className="flex-1 overflow-x-auto min-h-[300px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase font-bold tracking-wider text-slate-400 dark:text-[#4d6a8f]">
                      <th className="py-2.5 font-semibold">Student / TXN</th>
                      <th className="py-2.5 font-semibold">Event</th>
                      <th className="py-2.5 font-semibold">Amount</th>
                      <th className="py-2.5 font-semibold">Status</th>
                      <th className="py-2.5 font-semibold">Date & Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#16263e]">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                          No transactions match the criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#122137]/30 transition-colors">
                          <td className="py-3">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold" style={textPri}>{p.studentName}</span>
                              <span className="text-[10px] mt-0.5" style={textSec}>{p.rollNo} • {p.transactionId}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="text-xs font-semibold block max-w-[180px] truncate" style={textPri} title={p.eventName}>
                              {p.eventName}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="text-xs font-bold" style={textPri}>
                              {formatCurrency(p.amount)}
                            </span>
                          </td>
                          <td className="py-3">
                            {renderStatusBadge(p.status)}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-col">
                              <span className="text-xs" style={textPri}>{p.date}</span>
                              <span className="text-[10px] mt-0.5" style={textSec}>{p.method}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  )
}
