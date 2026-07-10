import React from 'react'
import { createPortal } from 'react-dom'
import { X, MapPin, Phone } from 'lucide-react'
import Avatar from './Avatar'

export default function OrganizerViewModal({
  viewOrg,
  setViewOrg,
  badgeStyle,
  tokens,
  dark,
  BRAND
}) {
  if (!viewOrg) return null

  return createPortal(
    <div
      className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={e => { if (e.target === e.currentTarget) setViewOrg(null) }}
    >
      <div
        className="rounded-[24px] w-full max-w-[420px] overflow-hidden"
        style={{
          background: dark ? '#0c1829' : '#fff',
          border: `1px solid ${tokens.border}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          animation: 'slideUp 0.25s ease'
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: `1px solid ${tokens.border}` }}>
          <h2 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>
            Organizer Profile
          </h2>
          <button
            onClick={() => setViewOrg(null)}
            className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center"
            style={{ color: tokens.txtSec }}
            onMouseEnter={e => e.currentTarget.style.background = tokens.hoverBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={17} />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-7 py-6 space-y-5">
          <div className="flex items-center gap-4">
            <Avatar name={viewOrg.name} color={viewOrg.avatarColor} size={56} />
            <div>
              <h3 className="text-[18px] font-extrabold m-0" style={{ color: tokens.txtPri }}>
                {viewOrg.name}
              </h3>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block mt-1"
                style={badgeStyle(viewOrg.role)}
              >
                {viewOrg.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl p-3" style={{ background: tokens.hoverBg }}>
              <p className="text-[11px] font-bold m-0 mb-0.5" style={{ color: tokens.txtSec }}>Department</p>
              <p className="text-[13px] font-bold m-0" style={{ color: tokens.txtPri }}>{viewOrg.department}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: tokens.hoverBg }}>
              <p className="text-[11px] font-bold m-0 mb-0.5" style={{ color: tokens.txtSec }}>College ID</p>
              <p className="text-[13px] font-bold m-0" style={{ color: tokens.txtPri }}>{viewOrg.collegeId || 'N/A'}</p>
            </div>
            <div className="rounded-xl p-3 col-span-2" style={{ background: tokens.hoverBg }}>
              <p className="text-[11px] font-bold m-0 mb-0.5" style={{ color: tokens.txtSec }}>Office Address</p>
              <div className="flex items-center gap-1.5 mt-0.5" style={{ color: tokens.txtPri }}>
                <MapPin size={13} style={{ color: tokens.txtMuted }} />
                <span className="text-[13px] font-bold">{viewOrg.office || 'Not assigned'}</span>
              </div>
            </div>
            <div className="rounded-xl p-3 col-span-2" style={{ background: tokens.hoverBg }}>
              <p className="text-[11px] font-bold m-0 mb-0.5" style={{ color: tokens.txtSec }}>Contact Number</p>
              <div className="flex items-center gap-1.5 mt-0.5" style={{ color: tokens.txtPri }}>
                <Phone size={13} style={{ color: tokens.txtMuted }} />
                <span className="text-[13px] font-bold">{viewOrg.phone || 'Not assigned'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl" style={{ border: `1px dashed ${tokens.border}` }}>
            <span className="text-[12px] font-bold" style={{ color: tokens.txtSec }}>Email Address</span>
            <a href={`mailto:${viewOrg.email}`} className="text-[13px] font-bold transition-colors" style={{ color: BRAND }}>
              {viewOrg.email}
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
