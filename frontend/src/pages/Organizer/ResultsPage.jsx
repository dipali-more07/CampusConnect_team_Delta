import { useState, useEffect } from 'react'
import { Download, Trophy, Users, User, Award, Plus } from 'lucide-react'
import resultsService from '../../services/resultsService'
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
            style={{ background: BRAND, boxShadow: `0 4px 12px ${BRAND}40` }}
          >
            <Plus size={15} /> Add Result
          </button>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <ResultStats statsList={statsList} cardStyle={cardStyle} />

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <ResultFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedEvent={selectedEvent}
        setSelectedEvent={setSelectedEvent}
        uniqueEvents={uniqueEvents}
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
        handleOpenEditModal={handleOpenEditModal}
        handleDeleteResult={handleDeleteResult}
      />

      {/* ── ADD/EDIT RESULT MODAL ── */}
      <ResultFormModal
        formOpen={formOpen}
        setFormOpen={setFormOpen}
        editingResult={editingResult}
        eventId={eventId}
        setEventId={setEventId}
        setEventName={setEventName}
        type={type}
        setType={setType}
        rank={rank}
        setRank={setRank}
        participantName={participantName}
        setParticipantName={setParticipantName}
        membersInput={membersInput}
        setMembersInput={setMembersInput}
        rollNo={rollNo}
        setRollNo={setRollNo}
        department={department}
        setDepartment={setDepartment}
        year={year}
        setYear={setYear}
        score={score}
        setScore={setScore}
        resultTitle={resultTitle}
        setResultTitle={setResultTitle}
        date={date}
        setDate={setDate}
        handleFormSubmit={handleFormSubmit}
        submitting={submitting}
        inputStyle={inputStyle}
        dark={dark}
        BRAND={BRAND}
      />
    </div>
  )
}
