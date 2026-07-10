import React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import Avatar from './Avatar'

export default function StudentViewModal({
  viewStudent,
  setViewStudent,
  badgeSt,
  tokens,
  dark,
  BRAND
}) {
  if (!viewStudent) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={e => { if (e.target === e.currentTarget) setViewStudent(null) }}
    >
      <div
        className="rounded-[24px] w-full max-w-[440px] overflow-hidden"
        style={{
          background: dark ? '#0c1829' : '#fff',
          border: `1px solid ${tokens.border}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          animation: 'slideUp 0.25s ease'
        }}
      >
        <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: `1px solid ${tokens.border}` }}>
          <h2 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>Student Profile</h2>
          <button
            onClick={() => setViewStudent(null)}
            className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center"
            style={{ color: tokens.txtSec }}
            onMouseEnter={e => e.currentTarget.style.background = tokens.hoverBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={17} />
          </button>
        </div>
        <div className="px-7 py-6 space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={viewStudent.name} color={viewStudent.avatarColor} size={56} />
            <div>
              <p className="text-[18px] font-extrabold m-0" style={{ color: tokens.txtPri }}>{viewStudent.name}</p>
              <p className="text-[13px] mt-0.5" style={{ color: BRAND }}>{viewStudent.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Roll No', viewStudent.rollNo],
              ['Department', viewStudent.department],
              ['Year', viewStudent.year],
              ['Phone', viewStudent.phone || '—'],
              ['Events', viewStudent.eventsAttended],
              ['Certificates', viewStudent.certificatesCount],
              ['Attendance', `${viewStudent.attendancePercent}%`],
              ['Joined', viewStudent.joinedDate],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl p-3" style={{ background: tokens.hoverBg }}>
                <p className="text-[11px] font-bold m-0 mb-0.5" style={{ color: tokens.txtSec }}>{k}</p>
                <p className="text-[13.5px] font-bold m-0" style={{ color: tokens.txtPri }}>{v}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold" style={{ color: tokens.txtSec }}>Status</span>
            <span className="px-3 py-1 rounded-full text-[12px] font-bold" style={badgeSt(viewStudent.status)}>{viewStudent.status}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
