import { useState, useEffect } from 'react'
import { Trophy, Award, Search, CalendarDays, User, Users, Star, Medal, Sparkles } from 'lucide-react'
import resultsService from '../../services/resultsService'
import eventsService from '../../services/eventsService'
import studentsService from '../../services/studentsService'

export default function ResultsPage({ tokens, user }) {
  const { dark } = tokens
  const BRAND = tokens?.brand || '#615FFF'

  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [students, setStudents] = useState([])

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Tabs: 'All' (Leaderboard), 'My' (My Placements only)
  const [viewTab, setViewTab] = useState('All') 

  // Load events and students list on mount
  useEffect(() => {
    const loadEventsAndStudents = async () => {
      setEventsLoading(true)
      const [evRes, stuRes] = await Promise.all([
        eventsService.fetchAll(),
        studentsService.fetchAll()
      ])
      if (evRes.success && evRes.events.length > 0) {
        setEvents(evRes.events)
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

  // Load results when event changes
  useEffect(() => {
    if (!selectedEventId) return
    const loadResults = async () => {
      setLoading(true)
      const res = await resultsService.fetchByEventId(selectedEventId)
      if (res.success) {
        setResults(res.results || [])
      } else {
        setResults([])
      }
      setLoading(false)
    }
    loadResults()
  }, [selectedEventId])

  // Enrich results data for the student view
  const enrichedResults = results.map(row => {
    const ev = events.find(e => e.id === (row.event_id || row.eventId))
    const eventName = ev ? ev.name : (row.eventName || 'Unknown Event')

    const isTeam = !!(row.team_id || row.teamId)
    const type = isTeam ? 'Team' : 'Solo'

    let participantName = row.participantName || ''
    let department = row.department || 'N/A'
    let year = row.year || 'N/A'
    let rollNo = row.rollNo || row.roll_no || ''

    const pId = row.participant_id || row.participantId
    const isCurrentUser = !isTeam && pId === (user?.id || user?.userId || user?.user_id)

    if (!isTeam) {
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
      participantName = row.teamName || row.participantName || row.team_id || row.teamId || 'Team Winner'
    }

    const dateVal = row.created_at
      ? new Date(row.created_at).toISOString().split('T')[0]
      : (row.date || new Date().toISOString().split('T')[0])

    return {
      ...row,
      id: row.id || row.result_id,
      eventName,
      type,
      participantName,
      department,
      year,
      rollNo,
      isCurrentUser,
      date: dateVal,
      rank: row.rank || 1,
    }
  })

  // Filtered list based on Search query & selected view tab
  const filteredResults = enrichedResults.filter(res => {
    if (viewTab === 'My' && !res.isCurrentUser) return false

    const searchLower = searchQuery.toLowerCase()
    const nameMatch = (res.participantName || '').toLowerCase().includes(searchLower)
    const rollMatch = (res.rollNo || '').toLowerCase().includes(searchLower)
    const deptMatch = (res.department || '').toLowerCase().includes(searchLower)
    return searchQuery === '' || nameMatch || rollMatch || deptMatch
  })

  const selectedEventObj = events.find(e => e.id === selectedEventId)

  // Rank rendering helper
  const renderRankBadge = (rankNum) => {
    const num = Number(rankNum)
    if (num === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs">
          <Trophy size={14} className="text-amber-500 fill-amber-500" />
          1st Standings
        </span>
      )
    }
    if (num === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-extrabold bg-slate-400/15 text-slate-600 dark:text-slate-300 border border-slate-400/30 shadow-xs">
          <Medal size={14} className="text-slate-400 fill-slate-400" />
          2nd Standings
        </span>
      )
    }
    if (num === 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-extrabold bg-orange-600/15 text-orange-600 dark:text-orange-400 border border-orange-600/30 shadow-xs">
          <Medal size={14} className="text-orange-500 fill-orange-500" />
          3rd Standings
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
        <Award size={13} />
        Rank {num}
      </span>
    )
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

  return (
    <div className="animate-fadeIn p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full" style={{ color: dark ? '#e8f0fe' : '#0f172a' }}>
      
      {/* ── BREADCRUMB & HEADER ── */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          <span>CampusConnect</span>
          <span>&gt;</span>
          <span style={{ color: BRAND }}>Results</span>
        </div>
        <h1 className="text-[28px] font-extrabold m-0 tracking-tight">Leaderboard & Results</h1>
        <p className="text-[13px] mt-1 mb-0" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
          {selectedEventObj
            ? <>Showing results for <strong style={{ color: BRAND }}>{selectedEventObj.name}</strong></>
            : 'Select an event to view standouts and ranks'}
        </p>
      </div>

      {/* ── EVENT SELECTOR ── */}
      <div
        className="rounded-2xl p-5 mb-6 flex flex-wrap items-center gap-4"
        style={cardStyle}
      >
        <CalendarDays size={18} style={{ color: BRAND }} className="shrink-0" />
        <span className="text-[13.5px] font-bold shrink-0" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
          Select Event to View Standings:
        </span>
        <select
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          disabled={eventsLoading}
          className="flex-1 min-w-[240px] max-w-[480px] px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold outline-none cursor-pointer"
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
      </div>

      {/* ── FILTERS & TABS ROW ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        
        {/* Toggle between All Leaderboard / My Achievements */}
        <div className="flex items-center gap-1 rounded-2xl p-1 border w-fit" style={{ ...cardStyle, padding: '4px' }}>
          <button
            onClick={() => setViewTab('All')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-bold border-none cursor-pointer transition-all"
            style={{
              background: viewTab === 'All' ? BRAND : 'transparent',
              color: viewTab === 'All' ? '#fff' : (dark ? '#7a98bb' : '#5c6f84'),
            }}
          >
            <Users size={14} /> Full Standings
          </button>
          <button
            onClick={() => setViewTab('My')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-bold border-none cursor-pointer transition-all"
            style={{
              background: viewTab === 'My' ? BRAND : 'transparent',
              color: viewTab === 'My' ? '#fff' : (dark ? '#7a98bb' : '#5c6f84'),
            }}
          >
            <Star size={14} /> My Placement
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by participant name or department..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      {/* ── RESULTS RENDER ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20" style={cardStyle}>
          <Loader2 className="animate-spin mb-3 text-slate-400" size={32} />
          <span className="text-[13px] font-medium text-slate-400">Loading standings...</span>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border" style={cardStyle}>
          <Trophy size={48} className="block mx-auto mb-4 text-slate-300 dark:text-slate-700" />
          <h3 className="text-[16px] font-extrabold m-0 mb-1">No Standings Declared Yet</h3>
          <p className="text-[13px] m-0" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
            {viewTab === 'My' 
              ? "You haven't been placed in this event's leaderboards yet."
              : "Results for this event have not been announced yet by the organizer."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredResults.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl p-5 border flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all"
              style={{
                ...cardStyle,
                background: row.isCurrentUser 
                  ? (dark ? 'rgba(97,95,255,0.08)' : 'rgba(97,95,255,0.03)')
                  : tokens.card,
                borderColor: row.isCurrentUser ? BRAND : tokens.border,
                boxShadow: row.isCurrentUser ? `0 0 16px ${BRAND}20` : tokens.shadow
              }}
            >
              {/* Participant info */}
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[18px] text-white shrink-0 shadow-sm"
                  style={{
                    background: row.rank === 1 
                      ? '#EAB308' 
                      : row.rank === 2 
                        ? '#94A3B8' 
                        : row.rank === 3 
                          ? '#EA580C' 
                          : BRAND
                  }}
                >
                  #{row.rank}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-black text-slate-800 dark:text-slate-100">
                      {row.participantName}
                    </span>
                    {row.isCurrentUser && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500 text-white shadow-xs">
                        <Sparkles size={9} /> You
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[12.5px]" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                    <span className="font-bold">{row.department}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span>{row.year}</span>
                    {row.rollNo && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span>Roll: <strong className="text-slate-700 dark:text-slate-300">{row.rollNo}</strong></span>
                      </>
                    )}
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="capitalize font-semibold text-indigo-500 dark:text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-500/10 text-[10.5px]">
                      {row.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rank Position Badge */}
              <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-between border-t md:border-t-0 pt-3.5 md:pt-0"
                style={{ borderColor: dark ? '#162640' : '#f1f5f9' }}>
                <div className="flex flex-col items-end">
                  <div className="mb-1">{renderRankBadge(row.rank)}</div>
                  {row.score !== 0 && (
                    <span className="text-[12.5px] font-semibold text-slate-400 dark:text-slate-500">
                      Score: <strong style={{ color: BRAND }}>{row.score}</strong>
                    </span>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Decorative css keyframe */}
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// Simple loader helper
function Loader2({ className, size }) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
