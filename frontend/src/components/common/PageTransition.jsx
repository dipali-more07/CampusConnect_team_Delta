import React from 'react'

/**
 * PageTransition wrapper for smooth animated view switching across pages and sub-views.
 */
export default function PageTransition({ children, pageKey, className = '' }) {
  return (
    <div key={pageKey} className={`animate-page-transition relative w-full h-full ${className}`}>
      {children}
    </div>
  )
}

