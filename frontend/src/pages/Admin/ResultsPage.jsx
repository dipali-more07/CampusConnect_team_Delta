import { useState, useEffect } from 'react'
import { Download, Trophy, Users, User, Award, Plus, CalendarDays } from 'lucide-react'
import resultsService from '../../services/resultsService'
import eventsService from '../../services/eventsService'
import studentsService from '../../services/studentsService'
import { BRAND as DEFAULT_BRAND } from '../../data/dashboardData'
import { useToast } from '../../context/ToastContext'

// Sub-components
import ResultStats from '../../components/admin/adminResult/ResultStats'
import ResultFilters from '../../components/admin/adminResult/ResultFilters'
import ResultTable from '../../components/admin/adminResult/ResultTable'
import ResultFormModal from '../../components/admin/adminResult/ResultFormModal'

export default function ResultsPage({ tokens }) {
  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND
  const showToast = useToast()

  // Events list for dropdown
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState('')  // event_id from backend

  // Students list for enrichment
  const [students, setStudents] = useState([])

  // Results state
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('All') // 'All', 'Solo', 'Team'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  
  // Modals state
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Registrations for participant dropdown in declare modal
  const [registrations, setRegistrations] = useState([])
  const [regsLoading, setRegsLoading] = useState(false)

  // ── Load events and students list on mount ──────────────────────────
  useEffect(() => {
    const loadEventsAndStudents = async () => {
      setEventsLoading(true)
      const [evRes, stuRes] = await Promise.all([
        eventsService.fetchAll(),
        studentsService.fetchAll()
      ])
      if (evRes.success && evRes.events.length > 0) {
        setEvents(evRes.events)
        // Default: first event selected
        setSelectedEventId(evRes.events[0].id)
      } else {
        setEvents([])
      }
      if (stuRes.success) {
        setStudents(stuRes.students || [])
      }
      setEventsLoading(false)
    }
    loadEventsAndStudents()
  }, [])

  // ── Load results when selectedEventId changes ──────────────────
  useEffect(() => {
    if (!selectedEventId) return
    const loadResults = async () => {
      setLoading(true)
      setResults([])
      setRegsLoading(true)
      setRegistrations([])
      const [res, regRes] = await Promise.all([
        resultsService.fetchByEventId(selectedEventId),
        eventsService.fetchRegistrations(selectedEventId)
      ])
      if (res.success) {
        setResults(res.results)
      } else {
        showToast(res.message || 'Failed to load results.', 'error')
      }
      if (regRes.success) {
        setRegistrations(regRes.registrations || [])
      }
      setLoading(false)
      setRegsLoading(false)
    }
    loadResults()
  }, [selectedEventId])

  // Enrich results using loaded events and students
  const enrichedResults = results.map(row => {
    const ev = events.find(e => e.id === (row.event_id || row.eventId))
    const eventName = ev ? ev.name : (row.eventName || 'Unknown Event')

    const isTeam = !!(row.team_id || row.teamId)
    const type = isTeam ? 'Team' : 'Solo'

    let participantName = row.participantName || ''
    let department = row.department || 'N/A'
    let year = row.year || 'N/A'
    let rollNo = row.rollNo || row.roll_no || ''
    let members = row.members || []

    if (!isTeam) {
      const pId = row.participant_id || row.participantId
      const stu = students.find(s => s.id === pId)
      if (stu) {
        participantName = stu.name || stu.full_name || participantName
        department = stu.department || stu.course || department
        year = stu.year_of_study ? `${stu.year_of_study} Yr` : (stu.year || year)
        rollNo = stu.rollNo || stu.roll_no || rollNo
      } else {
        participantName = participantName || pId || 'Unknown Student'
      }
    } else {
      const tId = row.team_id || row.teamId
      const teamRegs = registrations.filter(r => (r.teamId || r.team_id) === tId)
      const reg = teamRegs[0]
      participantName = row.team_name || row.teamName || reg?.teamName || reg?.team_name || row.participantName || tId || 'Team Winner'
      
      if (members.length === 0) {
        const memberNames = teamRegs
          .map(r => {
            const student = students.find(s => s.id === (r.userId || r.user_id))
            return student?.name || r.studentName || r.student_name || r.full_name || ''
          })
          .filter(Boolean)
        members = memberNames.length > 0 ? memberNames : members
      }
    }

    const dateVal = row.created_at
      ? new Date(row.created_at).toISOString().split('T')[0]
      : (row.date || new Date().toISOString().split('T')[0])

    const rankVal = row.rank || 1

    return {
      ...row,
      id: row.id || row.result_id,
      eventName,
      type,
      participantName,
      department,
      year,
      rollNo,
      members,
      rank: rankVal,
      date: dateVal,
    }
  })

  // Calculate statistics from enriched results
  const totalCount = enrichedResults.length
  const soloCount = enrichedResults.filter(r => r.type === 'Solo').length
  const teamCount = enrichedResults.filter(r => r.type === 'Team').length
  const rank1Count = enrichedResults.filter(r => Number(r.rank) === 1).length

  // Filter logic (search + solo/team tab only — event is already filtered by API)
  const filteredResults = enrichedResults.filter(res => {
    const typeMatch = activeTab === 'All' || res.type === activeTab
    const searchLower = searchQuery.toLowerCase()
    const nameMatch = (res.participantName || '').toLowerCase().includes(searchLower)
    const rollMatch = (res.rollNo || '').toLowerCase().includes(searchLower)
    const deptMatch = (res.department || '').toLowerCase().includes(searchLower)
    const titleMatch = (res.resultTitle || '').toLowerCase().includes(searchLower)
    const searchMatch = searchQuery === '' || nameMatch || rollMatch || deptMatch || titleMatch
    return typeMatch && searchMatch
  })

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeTab, selectedEventId])

  // Pagination
  const totalItems = filteredResults.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedResults = filteredResults.slice(startIndex, startIndex + itemsPerPage)

  // Selected event object
  const selectedEventObj = events.find(e => e.id === selectedEventId)

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormOpen(true)
  }

  // Declare result using POST /api/v1/results/declare
  const handleDeclare = async (payload) => {
    setSubmitting(true)
    const res = await resultsService.declare(payload)
    if (res.success) {
      showToast('Result declared successfully! 🏆', 'success')
      setFormOpen(false)
      // Reload results for this event
      const updated = await resultsService.fetchByEventId(selectedEventId)
      if (updated.success) setResults(updated.results)
    } else {
      showToast(res.message || 'Failed to declare result.', 'error')
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
      link.setAttribute("download", `event_results_${selectedEventId}_${new Date().toISOString().split('T')[0]}.csv`)
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

  return (
    <div className="animate-fadeIn p-6" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>

      {/* ── BREADCRUMB & HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            <span>CampusConnect</span>
            <span>&gt;</span>
            <span style={{ color: BRAND }}>Results</span>
          </div>
          <h1 className="text-[28px] font-extrabold m-0 tracking-tight">Event Results</h1>
          <p className="text-[13px] mt-1 mb-0" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
            {selectedEventObj
              ? <>Results for <strong style={{ color: BRAND }}>{selectedEventObj.name}</strong></>
              : 'Select an event to view results'}
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
            disabled={!selectedEventId}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-150 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: BRAND, boxShadow: '0 4px 12px rgba(97,95,255,0.25)' }}
          >
            <Plus size={15} /> Add Result
          </button>
        </div>
      </div>

      {/* ── EVENT SELECTOR ── */}
      <div
        className="rounded-2xl p-4 mb-5 flex flex-wrap items-center gap-3"
        style={cardStyle}
      >
        <CalendarDays size={17} style={{ color: BRAND }} className="shrink-0" />
        <span className="text-[13px] font-bold shrink-0" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
          Select Event:
        </span>
        <select
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          disabled={eventsLoading}
          className="flex-1 min-w-[220px] max-w-[420px] px-3 py-2 rounded-xl text-[13px] font-semibold outline-none cursor-pointer"
          style={inputStyle}
        >
          {eventsLoading ? (
            <option>Loading events…</option>
          ) : events.length === 0 ? (
            <option value="">No events found</option>
          ) : (
            events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))
          )}
        </select>
        {selectedEventObj && (
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
            style={{
              background: dark ? 'rgba(97,95,255,0.15)' : 'rgba(97,95,255,0.1)',
              color: BRAND
            }}
          >
            {selectedEventObj.status}
          </span>
        )}
      </div>

      {/* ── STATS ROW ── */}
      <ResultStats statsList={statsList} cardStyle={cardStyle} />

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <ResultFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        inputStyle={inputStyle}
        dark={dark}
        BRAND={BRAND}
      />

      {/* ── RESULTS TABLE ── */}
      <ResultTable
        loading={loading}
        filteredResults={filteredResults}
        paginatedResults={paginatedResults}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        BRAND={BRAND}
        dark={dark}
        cardStyle={cardStyle}
        handleDeleteResult={handleDeleteResult}
      />

      {/* ── ADD RESULT MODAL ── */}
      <ResultFormModal
        formOpen={formOpen}
        setFormOpen={setFormOpen}
        selectedEventId={selectedEventId}
        selectedEventName={selectedEventObj?.name}
        events={events}
        registrations={registrations}
        regsLoading={regsLoading}
        handleDeclare={handleDeclare}
        submitting={submitting}
        inputStyle={inputStyle}
        dark={dark}
        BRAND={BRAND}
      />
    </div>
  )
}
