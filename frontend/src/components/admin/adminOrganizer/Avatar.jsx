import React from 'react'

export default function Avatar({ name = '', color = '#3b82f6', size = 44 }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-extrabold text-white text-[14px]"
      style={{ width: size, height: size, background: color }}
    >
      {initials}
    </div>
  )
}
