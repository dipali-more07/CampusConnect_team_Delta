import React from 'react'

/**
 * PageTransition wrapper for smooth animated view switching across pages and sub-views.
 */
export default function PageTransition({ children, pageKey, className = '' }) {
  return (
    <div key={pageKey} className={`animate-page-transition relative w-full h-full ${className}`}>
      {/* Top glowing progress line effect on page change */}
      <div 
        key={`progress-${pageKey}`}
        className="animate-page-progress absolute top-0 left-0 right-0 h-[3px] z-9999 pointer-events-none rounded-r-full"
        style={{
          background: 'linear-gradient(90deg, var(--brand-color, #615FFF) 0%, #38bdf8 50%, #818cf8 100%)',
          boxShadow: '0 0 14px rgba(97, 95, 255, 0.8), 0 0 6px rgba(56, 189, 248, 0.6)'
        }}
      />
      {children}
    </div>
  )
}

