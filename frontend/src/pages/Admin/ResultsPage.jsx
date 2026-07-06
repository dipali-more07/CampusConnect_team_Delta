import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Search, Download, X, FileText,
  Loader2, Trophy, Users, User, Award, Plus, Edit3, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react'
import resultsService from '../../services/resultsService'
import { BRAND as DEFAULT_BRAND } from '../../data/dashboardData'
import { useToast } from '../../context/ToastContext'

export default function ResultsPage({ tokens }) {
  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND
  const showToast = useToast()

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('All') // 'All', 'Solo', 'Team'
  const [selectedEvent, setSelectedEvent] = useState('All')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  
  // Modals state
  const [formOpen, setFormOpen] = useState(false)
  const [editingResult, setEditingResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Form inputs
  const [eventId, setEventId] = useState('EVT081')
  const [eventName, setEventName] = useState('TechFest 2025')
  const [type, setType] = useState('Solo')
  const [participantName, setParticipantName] = useState('')
  const [membersInput, setMembersInput] = useState('') // comma separated names
  const [rollNo, setRollNo] = useState('')
  const [department, setDepartment] = useState('CSE')
  const [year, setYear] = useState('3rd')
  const [rank, setRank] = useState(1)
  const [resultTitle, setResultTitle] = useState('')
  const [score, setScore] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const loadResults = async () => {
    setLoading(true)
    const res = await resultsService.fetchAll()
    if (res.success) {
      setResults(res.results)
    } else {
      showToast(res.message || 'Failed to load results.', 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadResults()
  }, [])

  // Calculate statistics
  const totalCount = results.length
  const soloCount = results.filter(r => r.type === 'Solo').length
  const teamCount = results.filter(r => r.type === 'Team').length
  const rank1Count = results.filter(r => Number(r.rank) === 1).length

  // Get unique events list for filter dropdown
  const uniqueEvents = ['All', ...new Set(results.map(r => r.eventName).filter(Boolean))]

  // Filter logic
  const filteredResults = results.filter(res => {
    // Type tab match (All / Solo / Team)
    const typeMatch = activeTab === 'All' || res.type === activeTab

    // Event match
    const eventMatch = selectedEvent === 'All' || res.eventName === selectedEvent

    // Search query match
    const searchLower = searchQuery.toLowerCase()
    const nameMatch = (res.participantName || '').toLowerCase().includes(searchLower)
    const rollMatch = (res.rollNo || '').toLowerCase().includes(searchLower)
    const deptMatch = (res.department || '').toLowerCase().includes(searchLower)
    const evNameMatch = (res.eventName || '').toLowerCase().includes(searchLower)
    const titleMatch = (res.resultTitle || '').toLowerCase().includes(searchLower)
    const searchMatch = searchQuery === '' || nameMatch || rollMatch || deptMatch || evNameMatch || titleMatch

    return typeMatch && eventMatch && searchMatch
  })

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeTab, selectedEvent])

  // Pagination Calculations
  const totalItems = filteredResults.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedResults = filteredResults.slice(startIndex, startIndex + itemsPerPage)

  // Open Form for Adding New Result
  const handleOpenAddModal = () => {
    setEditingResult(null)
    setEventId('EVT081')
    setEventName('TechFest 2025')
    setType('Solo')
    setParticipantName('')
    setMembersInput('')
    setRollNo('')
    setDepartment('CSE')
    setYear('3rd')
    setRank(1)
    setResultTitle('')
    setScore('')
    setDate(new Date().toISOString().split('T')[0])
    setFormOpen(true)
  }

  // Open Form for Editing Existing Result
  const handleOpenEditModal = (resItem) => {
    setEditingResult(resItem)
    setEventId(resItem.eventId || 'EVT081')
    setEventName(resItem.eventName || 'TechFest 2025')
    setType(resItem.type || 'Solo')
    setParticipantName(resItem.participantName || '')
    setMembersInput(resItem.members ? resItem.members.join(', ') : '')
    setRollNo(resItem.rollNo || '')
    setDepartment(resItem.department || 'CSE')
    setYear(resItem.year || '3rd')
    setRank(resItem.rank || 1)
    setResultTitle(resItem.resultTitle || '')
    setScore(resItem.score || '')
    setDate(resItem.date || new Date().toISOString().split('T')[0])
    setFormOpen(true)
  }

  // Form submission handler
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const membersArray = type === 'Team' 
      ? membersInput.split(',').map(m => m.trim()).filter(Boolean)
      : []

    const payload = {
      eventId,
      eventName,
      type,
      participantName,
      members: membersArray,
      rollNo,
      department,
      year,
      rank: Number(rank),
      resultTitle: resultTitle || `${rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : rank + 'th'} Rank`,
      score,
      date
    }

    if (editingResult) {
      // Edit mode
      const res = await resultsService.update(editingResult.id, payload)
      if (res.success) {
        showToast('Result updated successfully.', 'success')
        setResults(prev => prev.map(r => r.id === editingResult.id ? res.result : r))
        setFormOpen(false)
      } else {
        showToast(res.message || 'Failed to update result.', 'error')
      }
    } else {
      // Create mode
      const res = await resultsService.create(payload)
      if (res.success) {
        showToast('New result published successfully.', 'success')
        setResults(prev => [res.result, ...prev])
        setFormOpen(false)
      } else {
        showToast(res.message || 'Failed to publish result.', 'error')
      }
    }
    setSubmitting(false)
  }

  // Delete result handler
  const handleDeleteResult = async (id) => {
    if (!window.confirm('Are you sure you want to delete this result?')) return
    const res = await resultsService.delete(id)
    if (res.success) {
      showToast('Result deleted successfully.', 'success')
      setResults(prev => prev.filter(r => r.id !== id))
    } else {
      showToast(res.message || 'Failed to delete result.', 'error')
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Event', 'Category Type', 'Participant/Team Name', 'Members', 'Roll No', 'Department', 'Year', 'Rank', 'Result Title', 'Score', 'Date']
      const rows = filteredResults.map(r => [
        r.id,
        r.eventName,
        r.type,
        r.participantName,
        r.members ? r.members.join('; ') : '',
        r.rollNo,
        r.department,
        r.year,
        r.rank,
        r.resultTitle,
        r.score,
        r.date
      ])

      const csvContent = [headers, ...rows]
        .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `event_results_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showToast('Results exported successfully.', 'success')
    } catch (err) {
      showToast('Failed to export results.', 'error')
    }
  }

  const cardStyle = {
    background: tokens.card,
    border: `1px solid ${tokens.border}`,
    boxShadow: tokens.shadow,
  }

  const inputStyle = {
    border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`,
    color: dark ? '#e8f0fe' : '#0f172a',
    background: dark ? '#060e1c' : '#ffffff',
  }

  const statsList = [
    { title: 'Total Results', value: totalCount, Icon: Trophy, background: '#615FFF' }, 
    { title: 'Solo Winners', value: soloCount, Icon: User, background: '#00BC7D' }, 
    { title: 'Team Winners', value: teamCount, Icon: Users, background: '#FE9A00' }, 
    { title: '1st Rank Holders', value: rank1Count, Icon: Award, background: '#FB2C36' }
  ]

  const tableHeaders = ['Participant / Team', 'Department', 'Year', 'Event', 'Rank', 'Date', 'Actions']

  const renderRankBadge = (rankNum) => {
    const num = Number(rankNum)
    if (num === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs">
          <Trophy size={13} className="text-amber-500 fill-amber-500" />
          1st Rank
        </span>
      )
    }
    if (num === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-extrabold bg-slate-400/15 text-slate-600 dark:text-slate-300 border border-slate-400/30 shadow-xs">
          <Award size={13} className="text-slate-400 fill-slate-400" />
          2nd Rank
        </span>
      )
    }
    if (num === 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-extrabold bg-orange-600/15 text-orange-600 dark:text-orange-400 border border-orange-600/30 shadow-xs">
          <Award size={13} className="text-orange-500 fill-orange-500" />
          3rd Rank
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
        <Award size={12} />
        Rank {num}
      </span>
    )
  }

  return (
    <div className="animate-fadeIn p-6" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>

      {/* ── BREADCRUMB & HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            <span>EventHub</span>
            <span>&gt;</span>
            <span style={{ color: BRAND }}>Results</span>
          </div>
          <h1 className="text-[28px] font-extrabold m-0 tracking-tight">Event Results</h1>
          <p className="text-[13px] mt-1 mb-0" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
            Manage and view winners across multiple solo and team events
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={filteredResults.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1e2d45] bg-white dark:bg-[#1a2236] cursor-pointer transition-all duration-150 hover:bg-slate-50 dark:hover:bg-[#1e2d45] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} className="text-slate-400" /> Export CSV
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-150 hover:-translate-y-px"
            style={{ background: BRAND, boxShadow: '0 4px 12px rgba(97,95,255,0.25)' }}
          >
            <Plus size={15} /> Add Result
          </button>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {statsList.map(({ title, value, Icon, background }) => (
          <div key={title} className="rounded-2xl p-4 flex items-center gap-4 border transition-transform duration-200 hover:scale-[1.02]" style={cardStyle}>
            <div style={{ background }} className="w-[46px] h-[46px] rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
              <Icon size={22} />
            </div>
            <div>
              <div className="text-[26px] font-black leading-none">{value}</div>
              <div className="text-[12px] font-bold text-slate-400 dark:text-[#7a98bb] mt-1.5 uppercase tracking-wide">{title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        
        {/* Search & Event Dropdown */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15} style={{ color: dark ? '#4a6a8a' : '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search results, rolls..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none transition-all duration-200"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
              onBlur={e => { e.target.style.borderColor = dark ? '#1a3050' : '#e2e8f0'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* Event Filter */}
          <div className="w-full sm:w-[200px]">
            <select
              value={selectedEvent}
              onChange={e => setSelectedEvent(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none font-semibold cursor-pointer"
              style={inputStyle}
            >
              <option value="All">All Events</option>
              {uniqueEvents.filter(e => e !== 'All').map(evName => (
                <option key={evName} value={evName}>{evName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Tabs (Solo / Team) */}
        <div
          className="flex items-center rounded-xl p-1 border h-[42px] box-border"
          style={{
            borderColor: dark ? '#1a3050' : '#e2e8f0',
            background: dark ? '#0f1e30' : '#ffffff',
          }}
        >
          {['All', 'Solo', 'Team'].map(tab => {
            const active = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 h-[32px] rounded-xl text-[12px] border-none cursor-pointer flex items-center justify-center transition-all duration-200 font-bold"
                style={{
                  background: active ? BRAND : 'transparent',
                  color: active ? '#ffffff' : (dark ? '#7a98bb' : '#5c6f84'),
                  boxShadow: active ? '0 3px 10px rgba(97,95,255,0.3)' : 'none',
                }}
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── RESULTS TABLE ── */}
      <div className="rounded-2xl overflow-hidden border" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr style={{ background: dark ? '#060e1c' : '#f8fafc', borderBottom: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}` }}>
                {tableHeaders.map((header) => (
                  <th key={header} className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ divideColor: dark ? '#1a3050' : '#e2e8f0' }}>
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i}>
                    <td className="p-4"><div className="w-36 h-4 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
                    <td className="p-4"><div className="w-16 h-4 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
                    <td className="p-4"><div className="w-12 h-4 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
                    <td className="p-4"><div className="w-28 h-4 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
                    <td className="p-4"><div className="w-24 h-6 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
                    <td className="p-4"><div className="w-20 h-4 rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
                    <td className="p-4"><div className="w-20 h-6 ml-auto rounded bg-slate-200/50 dark:bg-slate-800 animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center">
                    <FileText size={40} className="block mx-auto mb-3 text-slate-400" />
                    <span className="text-[13px] font-semibold text-slate-500">No results found for current filters</span>
                  </td>
                </tr>
              ) : (
                paginatedResults.map((row) => {
                  return (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-slate-50/30 dark:hover:bg-slate-850/10"
                    >
                      {/* Participant / Team */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13.5px] font-bold text-slate-900 dark:text-slate-100">{row.participantName}</span>
                          {row.type === 'Team' && row.members && row.members.length > 0 && (
                            <span className="text-[11px] text-slate-400 dark:text-[#7a98bb] font-semibold">
                              Members: {row.members.join(', ')}
                            </span>
                          )}
                          <span className="inline-block mt-0.5 w-max px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 dark:text-indigo-400">
                            {row.type}
                          </span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="p-4 text-[13.5px] font-semibold text-slate-700 dark:text-slate-300">{row.department}</td>

                      {/* Year */}
                      <td className="p-4 text-[13.5px] font-medium text-slate-600 dark:text-slate-400">{row.year}</td>

                      {/* Event */}
                      <td className="p-4 text-[13.5px] font-bold" style={{ color: BRAND }}>{row.eventName}</td>

                      {/* Rank with Icon */}
                      <td className="p-4">
                        {renderRankBadge(row.rank)}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-[13px] font-medium text-slate-500 dark:text-slate-400">{row.date}</td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(row)}
                            className="w-7.5 h-7.5 rounded-lg border border-slate-200 dark:border-[#1e2d45] bg-transparent flex items-center justify-center cursor-pointer transition-all hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-400 hover:text-indigo-500"
                            title="Edit Result"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteResult(row.id)}
                            className="w-7.5 h-7.5 rounded-lg border border-slate-200 dark:border-[#1e2d45] bg-transparent flex items-center justify-center cursor-pointer transition-all hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500"
                            title="Delete Result"
                          >
                            <Trash2 size={14} />
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

      {/* ── ADD/EDIT RESULT MODAL ── */}
      {formOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setFormOpen(false)}
          />

          {/* Modal Container */}
          <div
            className="relative z-10 w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]"
            style={{
              background: dark ? '#0c1829' : '#ffffff',
              border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`,
              animation: 'modalIn .2s ease-out'
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b" style={{ borderColor: dark ? '#1a3050' : '#e2e8f0' }}>
              <h3 className="text-[17px] font-black m-0 flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                {editingResult ? 'Edit Event Result' : 'Publish New Event Result'}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="w-7 h-7 rounded-lg border-none bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                
                {/* Event Dropdown/Select */}
                <div className="col-span-2">
                  <label className="text-[11.5px] font-bold text-slate-400 dark:text-[#7a98bb] uppercase block mb-1.5">Event</label>
                  <select
                    value={eventId}
                    onChange={e => {
                      setEventId(e.target.value)
                      const evList = {
                        'EVT081': 'TechFest 2025',
                        'EVT082': 'Annual Cultural Fest',
                        'EVT083': 'National Hackathon',
                        'EVT084': 'Industry Connect Summit',
                        'EVT085': 'Sports Meet 2025',
                        'EVT086': 'Research Symposium'
                      }
                      setEventName(evList[e.target.value] || 'TechFest 2025')
                    }}
                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none font-semibold cursor-pointer"
                    style={inputStyle}
                    required
                  >
                    <option value="EVT081">TechFest 2025</option>
                    <option value="EVT082">Annual Cultural Fest</option>
                    <option value="EVT083">National Hackathon</option>
                    <option value="EVT084">Industry Connect Summit</option>
                    <option value="EVT085">Sports Meet 2025</option>
                    <option value="EVT086">Research Symposium</option>
                  </select>
                </div>

                {/* Type Selection */}
                <div>
                  <label className="text-[11.5px] font-bold text-slate-400 dark:text-[#7a98bb] uppercase block mb-1.5">Category Type</label>
                  <div className="flex gap-2">
                    {['Solo', 'Team'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`flex-1 py-2 rounded-lg text-[12px] font-bold border-none cursor-pointer transition`}
                        style={{
                          background: type === t ? BRAND : (dark ? '#162640' : '#f1f5f9'),
                          color: type === t ? '#fff' : (dark ? '#7a98bb' : '#475569')
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rank Selection */}
                <div>
                  <label className="text-[11.5px] font-bold text-slate-400 dark:text-[#7a98bb] uppercase block mb-1.5">Rank Position</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={rank}
                    onChange={e => setRank(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-[13px] outline-none"
                    style={inputStyle}
                    required
                  />
                </div>

                {/* Participant / Team Name */}
                <div className="col-span-2">
                  <label className="text-[11.5px] font-bold text-slate-400 dark:text-[#7a98bb] uppercase block mb-1.5">
                    {type === 'Team' ? 'Team Name' : 'Participant Name'}
                  </label>
                  <input
                    type="text"
                    placeholder={type === 'Team' ? 'e.g. Code Crafters' : 'e.g. Arjun Patel'}
                    value={participantName}
                    onChange={e => setParticipantName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                    style={inputStyle}
                    required
                  />
                </div>

                {/* Members list if Team */}
                {type === 'Team' && (
                  <div className="col-span-2">
                    <label className="text-[11.5px] font-bold text-slate-400 dark:text-[#7a98bb] uppercase block mb-1.5">
                      Team Members (Comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Arjun Patel, Sneha Krishnan, Amit Shah"
                      value={membersInput}
                      onChange={e => setMembersInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                      style={inputStyle}
                    />
                  </div>
                )}

                {/* Roll No */}
                <div>
                  <label className="text-[11.5px] font-bold text-slate-400 dark:text-[#7a98bb] uppercase block mb-1.5">
                    {type === 'Team' ? 'Lead Roll No' : 'Roll Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 21CS001"
                    value={rollNo}
                    onChange={e => setRollNo(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-[13px] outline-none"
                    style={inputStyle}
                    required
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="text-[11.5px] font-bold text-slate-400 dark:text-[#7a98bb] uppercase block mb-1.5">Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none font-semibold cursor-pointer"
                    style={inputStyle}
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                    <option value="EEE">EEE</option>
                    <option value="Civil">Civil</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="text-[11.5px] font-bold text-slate-400 dark:text-[#7a98bb] uppercase block mb-1.5">Year</label>
                  <select
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none font-semibold cursor-pointer"
                    style={inputStyle}
                  >
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>

                {/* Score */}
                <div>
                  <label className="text-[11.5px] font-bold text-slate-400 dark:text-[#7a98bb] uppercase block mb-1.5">Score / Points (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 96/100 or 9.5/10"
                    value={score}
                    onChange={e => setScore(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-[13px] outline-none"
                    style={inputStyle}
                  />
                </div>

                {/* Result Title */}
                <div className="col-span-2">
                  <label className="text-[11.5px] font-bold text-slate-400 dark:text-[#7a98bb] uppercase block mb-1.5">Award / Result Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Winner (1st Rank) or Best Research Paper"
                    value={resultTitle}
                    onChange={e => setResultTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                    style={inputStyle}
                  />
                </div>

                {/* Date */}
                <div className="col-span-2">
                  <label className="text-[11.5px] font-bold text-slate-400 dark:text-[#7a98bb] uppercase block mb-1.5">Announcement Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                    style={inputStyle}
                    required
                  />
                </div>

              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t mt-2" style={{ borderColor: dark ? '#1a3050' : '#e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold text-white border-none cursor-pointer transition"
                  style={{ background: BRAND }}
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {editingResult ? 'Update Result' : 'Publish Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
