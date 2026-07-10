import React from 'react'
import { createPortal } from 'react-dom'
import { Trophy, X, Loader2 } from 'lucide-react'

export default function ResultFormModal({
  formOpen,
  setFormOpen,
  editingResult,
  eventId,
  setEventId,
  setEventName,
  type,
  setType,
  rank,
  setRank,
  participantName,
  setParticipantName,
  membersInput,
  setMembersInput,
  rollNo,
  setRollNo,
  department,
  setDepartment,
  year,
  setYear,
  score,
  setScore,
  resultTitle,
  setResultTitle,
  date,
  setDate,
  handleFormSubmit,
  submitting,
  inputStyle,
  dark,
  BRAND
}) {
  if (!formOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
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
                    className="flex-1 py-2 rounded-lg text-[12px] font-bold border-none cursor-pointer transition"
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

        {/* CSS Animation Keyframes */}
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.96) translateY(8px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    </div>,
    document.body
  )
}
