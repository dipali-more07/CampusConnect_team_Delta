import React from 'react'

export default function Avatar({ name = '', color = '#6366f1', size = 36 }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-bold text-white text-[13px]"
      style={{ width: size, height: size, background: color }}
    >
      {initials}
    </div>
  )
}
