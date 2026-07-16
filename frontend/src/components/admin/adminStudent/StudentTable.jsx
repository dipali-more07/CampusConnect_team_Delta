import React from 'react'
import { GraduationCap, Eye, Trash2, UserX, UserCheck } from 'lucide-react'
import Avatar from './Avatar'

export default function StudentTable({
  loading,
  filtered,
  students,
  badgeSt,
  handleToggleStatus,
  setViewStudent,
  openEdit,
  setDeleteTarget,
  tokens,
  BRAND,
  skBg,
  cardStyle,
  dark
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={cardStyle}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
              {['STUDENT', 'ROLL NO', 'DEPT', 'YEAR', 'EVENTS', 'ATTENDANCE', 'CERTIFICATES', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} className="px-5 py-4 text-[11px] font-bold tracking-wider" style={{ color: tokens.txtSec }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i} style={{ borderBottom: `1px solid ${tokens.border}` }}>
                  {[40, 80, 40, 30, 30, 100, 50, 60, 60].map((w, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3.5 rounded" style={{ width: w, background: skBg }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-12 text-center">
                  <GraduationCap size={40} className="block mx-auto mb-3" style={{ color: tokens.txtMuted }} />
                  <p className="text-[14px] font-medium" style={{ color: tokens.txtSec }}>No students found</p>
                </td>
              </tr>
            ) : (
              filtered.map((s, i) => {
                const badge = badgeSt(s.status)
                const attColor = s.attendancePercent >= 85 ? '#00BC7D' : s.attendancePercent >= 70 ? '#FE9A00' : '#ef4444'
                return (
                  <tr
                    key={s.id}
                    className="transition-colors duration-150"
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${tokens.border}` : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = tokens.hoverBg }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} color={s.avatarColor} />
                        <div>
                          <div className="text-[13.5px] font-bold" style={{ color: tokens.txtPri }}>{s.name}</div>
                          <div className="text-[11px] font-medium mt-0.5" style={{ color: BRAND }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: tokens.txtSec }}>{s.rollNo}</td>
                    <td className="px-5 py-3.5 text-[13px] font-bold" style={{ color: tokens.txtPri }}>{s.department}</td>
                    <td className="px-5 py-3.5 text-[13px]" style={{ color: tokens.txtSec }}>{s.year}</td>
                    <td className="px-5 py-3.5 text-[13px] font-bold" style={{ color: tokens.txtPri }}>{s.eventsAttended}</td>
                    <td className="px-5 py-3.5 min-w-[130px]">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold min-w-[36px]" style={{ color: attColor }}>{s.attendancePercent}%</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: dark ? '#1a3050' : '#e2e8f0' }}>
                          <div className="h-full rounded-full" style={{ width: `${s.attendancePercent}%`, background: attColor }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-bold" style={{ color: tokens.txtPri }}>{s.certificatesCount}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                        style={{ background: badge.bg, color: badge.text }}
                        onClick={() => handleToggleStatus(s)}
                        title="Click to toggle status"
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {[
                          { Icon: Eye, action: () => setViewStudent(s), hover: BRAND, title: 'View Info' },
                          s.status === 'Active'
                            ? { Icon: UserX, action: () => handleToggleStatus(s), hover: '#f97316', title: 'Deactivate Student' }
                            : { Icon: UserCheck, action: () => handleToggleStatus(s), hover: '#10b981', title: 'Activate Student' },
                          { Icon: Trash2, action: () => setDeleteTarget(s), hover: '#ef4444', title: 'Delete Student' },
                        ].map(({ Icon, action, hover, title }) => (
                          <button
                            key={title}
                            onClick={action}
                            title={title}
                            className="w-[28px] h-[28px] rounded-lg border bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150"
                            style={{ borderColor: tokens.border, color: tokens.txtSec }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = hover
                              e.currentTarget.style.color = hover
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = tokens.border
                              e.currentTarget.style.color = tokens.txtSec
                            }}
                          >
                            <Icon size={12.5} />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {!loading && filtered.length > 0 && (
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${tokens.border}` }}>
          <span className="text-[12px] font-medium" style={{ color: tokens.txtSec }}>Showing {filtered.length} of {students.length} students</span>
        </div>
      )}
    </div>
  )
}
