import React from 'react'
import { Shield, Mail, Calendar, Pencil, Trash2 } from 'lucide-react'
import Avatar from './Avatar'

export default function OrganizerGrid({
  loading,
  filtered,
  badgeStyle,
  setViewOrg,
  openEdit,
  setDeleteTarget,
  tokens,
  BRAND,
  skBg,
  cardStyle,
  dark
}) {
  if (loading) {
    return (
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl p-5 border space-y-4" style={cardStyle}>
            <div className="flex justify-between items-start">
              <div className="w-11 h-11 rounded-full shrink-0" style={{ background: skBg }} />
              <div className="w-16 h-5 rounded-md" style={{ background: skBg }} />
            </div>
            <div className="space-y-2">
              <div className="w-32 h-4 rounded-md" style={{ background: skBg }} />
              <div className="w-24 h-3 rounded-md" style={{ background: skBg }} />
            </div>
            <div className="space-y-1.5 pt-2">
              <div className="w-40 h-3 rounded-md" style={{ background: skBg }} />
              <div className="w-28 h-3 rounded-md" style={{ background: skBg }} />
            </div>
            <div className="w-full h-9 rounded-xl" style={{ background: skBg }} />
          </div>
        ))}
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl border" style={cardStyle}>
        <Shield size={40} className="block mx-auto mb-3" style={{ color: tokens.txtMuted }} />
        <p className="text-[14px] font-medium" style={{ color: tokens.txtSec }}>No organizers found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
      {filtered.map(org => {
        const badge = badgeStyle(org.role)
        return (
          <div
            key={org.id}
            className="rounded-2xl p-5 border flex flex-col justify-between transition-all duration-300 relative group"
            style={cardStyle}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = dark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 30px rgba(0,0,0,0.08)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = tokens.shadow
            }}
          >
            <div>
              {/* Top: Avatar and Role */}
              <div className="flex justify-between items-start">
                <Avatar name={org.name} color={org.avatarColor} />
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold"
                  style={{ background: badge.bg, color: badge.text }}
                >
                  {org.role}
                </span>
              </div>

              {/* Identity */}
              <div className="mt-3">
                <h3 className="text-[15.5px] font-extrabold m-0" style={{ color: tokens.txtPri }}>
                  {org.name}
                </h3>
                <p className="text-[12px] font-semibold mt-0.5" style={{ color: tokens.txtSec }}>
                  {org.department}
                </p>
              </div>

              {/* Info details */}
              <div className="mt-4 space-y-2 text-[12px]" style={{ color: tokens.txtSec }}>
                <div className="flex items-center gap-2">
                  <Mail size={13} style={{ color: tokens.txtMuted }} />
                  <span className="truncate">{org.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={13} style={{ color: tokens.txtMuted }} />
                  <span>{org.eventsManaged} events managed</span>
                </div>
              </div>
            </div>

            {/* Bottom Row Actions */}
            <div className="mt-5 pt-4 border-t flex gap-2" style={{ borderColor: tokens.border }}>
              <button
                onClick={() => setViewOrg(org)}
                className="flex-1 py-2 rounded-xl text-[12px] font-bold border cursor-pointer bg-transparent transition-all duration-150"
                style={{ borderColor: tokens.border, color: tokens.txtPri }}
                onMouseEnter={e => { e.currentTarget.style.background = tokens.hoverBg }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                View Profile
              </button>
              <button
                onClick={() => openEdit(org)}
                title="Edit Profile"
                className="w-9 h-9 rounded-xl border bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 shrink-0"
                style={{ borderColor: tokens.border, color: tokens.txtSec }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.txtSec }}
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => setDeleteTarget(org)}
                title="Delete Account"
                className="w-9 h-9 rounded-xl border bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 shrink-0"
                style={{ borderColor: tokens.border, color: tokens.txtSec }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.txtSec }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
