import React from 'react'

export default function SettingsPermissionsTab({ permissions, tokens }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>Role Permissions</h3>
      </div>

      <div className="space-y-4 max-w-[600px]">
        {Object.entries(permissions).map(([role, list]) => {
          const color = role === 'Admin' ? '#ef4444' : role === 'Organizer' ? '#FE9A00' : '#00BC7D'
          return (
            <div key={role} className="border rounded-2xl p-5 space-y-3" style={{ borderColor: tokens.border }}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <h4 className="text-[14px] font-extrabold m-0 capitalize" style={{ color: tokens.txtPri }}>{role}</h4>
              </div>

              <div className="flex flex-wrap gap-2">
                {list.map(perm => (
                  <span
                    key={perm}
                    className="px-3 py-1.5 rounded-xl text-[12px] font-medium"
                    style={{ background: tokens.hoverBg, color: tokens.txtSec }}
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
