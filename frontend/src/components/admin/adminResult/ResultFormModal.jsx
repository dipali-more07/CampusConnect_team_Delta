import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Trophy, X, Loader2, Users, User } from 'lucide-react'
import eventsService from '../../../services/eventsService'
import studentsService from '../../../services/studentsService'

const getToggleBg = (active, dark, BRAND) => {
  if (active) return BRAND
  return dark ? '#162640' : '#f1f5f9'
}

const getToggleColor = (active, dark) => {
  if (active) return '#fff'
  return dark ? '#7a98bb' : '#475569'
}

const getParticipantLabel = (r) => {
  const name = r.studentName || r.student_name || r.full_name || r.name || ''
  const roll = r.rollNo || r.roll_no || ''
  if (name) {
    if (roll) return `${name} (${roll})`
    return name
  }
  return r.user_id || r.participant_id || r.id || ''
}

const getParticipantId = (r) =>
  r.user_id || r.participant_id || r.student_id || r.id || ''

function SoloSelection({ regsLoading, hasSoloRegistrations, soloRegistrations, participantId, setParticipantId, inputStyle, dark }) {
  if (regsLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-[13px]" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
        <Loader2 size={14} className="animate-spin" /> Loading registered participants…
      </div>
    )
  }

  if (hasSoloRegistrations) {
    return (
      <select
        id="resultParticipantSelect"
        value={participantId}
        onChange={e => setParticipantId(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none font-semibold cursor-pointer"
        style={inputStyle}
        required
      >
        <option value="">— Select registered participant —</option>
        {soloRegistrations.map(r => (
          <option key={r.id || r.user_id} value={getParticipantId(r)}>
            {getParticipantLabel(r)}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div>
      <p className="text-[11.5px] mb-2 px-1 font-sans" style={{ color: dark ? '#7a98bb' : '#94a3b8' }}>
        No solo registrations found for this event. Enter ID manually:
      </p>
      <input
        id="resultParticipantSelect"
        type="text"
        placeholder="Participant ID (UUID)"
        value={participantId}
        onChange={e => setParticipantId(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
        style={inputStyle}
        required
      />
    </div>
  )
}

function TeamSelection({ regsLoading, hasTeams, uniqueTeams, teamId, setTeamId, inputStyle, dark }) {
  if (regsLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-[13px]" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
        <Loader2 size={14} className="animate-spin" /> Loading registered teams…
      </div>
    )
  }

  if (hasTeams) {
    return (
      <select
        id="resultTeamSelect"
        value={teamId}
        onChange={e => setTeamId(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none font-semibold cursor-pointer"
        style={inputStyle}
        required
      >
        <option value="">— Select registered team —</option>
        {uniqueTeams.map(t => (
          <option key={t.teamId} value={t.teamId}>
            {t.teamName} ({t.teamId})
          </option>
        ))}
      </select>
    )
  }

  return (
    <div>
      <p className="text-[11.5px] mb-2 px-1 font-sans" style={{ color: dark ? '#7a98bb' : '#94a3b8' }}>
        No team registrations found. Enter Team ID manually:
      </p>
      <input
        id="resultTeamSelect"
        type="text"
        placeholder="Enter team_id from backend"
        value={teamId}
        onChange={e => setTeamId(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
        style={inputStyle}
        required
      />
    </div>
  )
}

export default function ResultFormModal({
  formOpen,
  setFormOpen,
  selectedEventId,
  events = [],
  handleDeclare,
  submitting,
  inputStyle,
  dark,
  BRAND,
}) {
  const [localEventId, setLocalEventId] = useState('')
  const [type, setType] = useState('Solo')
  const [participantId, setParticipantId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [rank, setRank] = useState(1)
  const [score, setScore] = useState('')

  const [registrations, setRegistrations] = useState([])
  const [regsLoading, setRegsLoading] = useState(false)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (formOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal()
    }
  }, [formOpen])

  // Reset / initialize state when modal opens
  useEffect(() => {
    if (formOpen) {
      setLocalEventId(selectedEventId || (events[0]?.id || ''))
      setType('Solo')
      setParticipantId('')
      setTeamId('')
      setRank(1)
      setScore('')
    }
  }, [formOpen, selectedEventId, events])

  // Fetch registrations whenever selected event changes inside the modal
  useEffect(() => {
    if (!formOpen || !localEventId) return

    const loadRegs = async () => {
      setRegsLoading(true)
      setRegistrations([])
      try {
        const [regRes, stuRes] = await Promise.all([
          eventsService.fetchRegistrations(localEventId),
          studentsService.fetchAll()
        ])
        if (regRes.success) {
          const studentsList = stuRes.success ? (stuRes.students || []) : []
          const enriched = (regRes.registrations || []).map(r => {
            const student = studentsList.find(s => s.id === r.userId || s.id === r.user_id)
            return {
              ...r,
              studentName: student?.name || r.studentName || r.student_name || r.full_name || '',
              rollNo: student?.rollNo || r.rollNo || r.roll_no || ''
            }
          })
          setRegistrations(enriched)
        }
      } catch (err) {
        console.error('Failed to load registrations:', err)
      }
      setRegsLoading(false)
    }

    loadRegs()
  }, [localEventId, formOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      event_id: localEventId,
      rank: Number(rank),
      score: score !== '' ? Number(score) : 0,
      team_id: type === 'Team' ? teamId.trim() : null,
      participant_id: type === 'Solo' ? participantId.trim() : null,
    }
    await handleDeclare(payload)
  }

  const soloRegistrations = registrations.filter(r => !r.teamId && !r.team_id)
  const hasSoloRegistrations = soloRegistrations.length > 0

  const teamRegistrations = registrations.filter(r => !!(r.teamId || r.team_id))
  // Group or unique by teamId
  const uniqueTeams = []
  const seenTeams = new Set()
  teamRegistrations.forEach(r => {
    const tId = r.teamId || r.team_id
    if (!seenTeams.has(tId)) {
      seenTeams.add(tId)
      uniqueTeams.push({
        teamId: tId,
        teamName: r.teamName || r.team_name || `Team ${tId}`
      })
    }
  })
  const hasTeams = uniqueTeams.length > 0

  const handleClose = () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close()
    }
    setFormOpen(false)
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-9999 m-0 p-0 w-full h-full border-none bg-transparent"
      onClose={handleClose}
      style={{ maxWidth: '100vw', maxHeight: '100vh' }}
    >
      <button
        type="button"
        className="fixed inset-0 w-full h-full bg-black/50 backdrop-blur-sm border-none cursor-default"
        onClick={handleClose}
        aria-label="Close overlay"
      />
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center p-4">
        <div
          className="pointer-events-auto relative z-10 w-full max-w-md rounded-2xl shadow-2xl p-6"
          style={{
            background: dark ? '#0c1829' : '#ffffff',
            border: `1px solid ${dark ? '#1a3050' : '#e2e8f0'}`,
            animation: 'modalIn .2s ease-out',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between pb-4 mb-5 border-b"
            style={{ borderColor: dark ? '#1a3050' : '#e2e8f0' }}
          >
            <h3 className="text-[17px] font-black m-0 flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              Declare Event Result
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="w-7 h-7 rounded-lg border-none bg-transparent hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Select Event */}
            <div>
              <label htmlFor="resultEventSelect" className="text-[11.5px] font-bold uppercase block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                Select Event
              </label>
              <select
                id="resultEventSelect"
                value={localEventId}
                onChange={e => {
                  setLocalEventId(e.target.value)
                  setParticipantId('')
                  setTeamId('')
                }}
                className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none font-semibold cursor-pointer"
                style={inputStyle}
                required
              >
                <option value="">— Select Event —</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Solo / Team toggle */}
            <div>
              <span className="text-[11.5px] font-bold uppercase block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                Participation Type
              </span>
              <div className="flex gap-2">
                {[
                  { label: 'Solo / Individual', value: 'Solo', Icon: User },
                  { label: 'Team', value: 'Team', Icon: Users },
                ].map(({ label, value, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setType(value); setParticipantId(''); setTeamId('') }}
                    className="flex-1 py-2.5 rounded-xl text-[12px] font-bold border-none cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    style={{
                      background: getToggleBg(type === value, dark, BRAND),
                      color: getToggleColor(type === value, dark),
                      boxShadow: type === value ? `0 4px 12px ${BRAND}40` : 'none',
                    }}
                  >
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Participant (Solo) */}
            {type === 'Solo' && (
              <div>
                <label htmlFor="resultParticipantSelect" className="text-[11.5px] font-bold uppercase block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                  Select Participant
                </label>
                <SoloSelection
                  regsLoading={regsLoading}
                  hasSoloRegistrations={hasSoloRegistrations}
                  soloRegistrations={soloRegistrations}
                  participantId={participantId}
                  setParticipantId={setParticipantId}
                  inputStyle={inputStyle}
                  dark={dark}
                />
              </div>
            )}

            {/* Team Select */}
            {type === 'Team' && (
              <div>
                <label htmlFor="resultTeamSelect" className="text-[11.5px] font-bold uppercase block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                  Select Team
                </label>
                <TeamSelection
                  regsLoading={regsLoading}
                  hasTeams={hasTeams}
                  uniqueTeams={uniqueTeams}
                  teamId={teamId}
                  setTeamId={setTeamId}
                  inputStyle={inputStyle}
                  dark={dark}
                />
              </div>
            )}

            {/* Rank + Score */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="rankPositionInput" className="text-[11.5px] font-bold uppercase block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                  Rank Position
                </label>
                <input
                  id="rankPositionInput"
                  type="number"
                  min="1"
                  max="999"
                  value={rank}
                  onChange={e => setRank(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label htmlFor="scoreInput" className="text-[11.5px] font-bold uppercase block mb-1.5" style={{ color: dark ? '#7a98bb' : '#64748b' }}>
                  Score (Optional)
                </label>
                <input
                  id="scoreInput"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 95"
                  value={score}
                  onChange={e => setScore(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex justify-end gap-2.5 pt-4 border-t mt-1"
              style={{ borderColor: dark ? '#1a3050' : '#e2e8f0' }}
            >
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-500 hover:bg-slate-100 border-none cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-bold text-white border-none cursor-pointer transition-all hover:-translate-y-px"
                style={{
                  background: BRAND,
                  boxShadow: `0 4px 12px ${BRAND}40`,
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Declare Result
              </button>
            </div>
          </form>

          <style>{`
            @keyframes modalIn {
              from { opacity: 0; transform: scale(0.96) translateY(8px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>
      </div>
    </dialog>,
    document.body
  )
}
