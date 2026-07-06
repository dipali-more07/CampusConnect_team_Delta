 import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

/**
 * Wrap your app with <ToastProvider> once in App.jsx.
 * Then call useToast() in any component to get showToast().
 *
 * showToast(message, type?, duration?)
 *   type    : 'success' | 'error' | 'info' | 'warning'   (default: 'success')
 *   duration: milliseconds before auto-dismiss              (default: 4000)
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

/** Hook — use in any component */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx.showToast
}

/* ─── Internal UI ─────────────────────────────────────────── */

const ICONS = {
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  ),
}

const STYLES = {
  success: { icon: 'text-emerald-500', bg: 'bg-emerald-50',  border: 'border-emerald-100' },
  error:   { icon: 'text-red-500',     bg: 'bg-red-50',      border: 'border-red-100'     },
  warning: { icon: 'text-amber-500',   bg: 'bg-amber-50',    border: 'border-amber-100'   },
  info:    { icon: 'text-blue-500',    bg: 'bg-blue-50',     border: 'border-blue-100'    },
}

const TITLES = {
  success: 'Success',
  error:   'Error',
  warning: 'Warning',
  info:    'Info',
}

function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null
  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(48px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(({ id, message, type }) => {
          const s = STYLES[type] || STYLES.success
          return (
            <div
              key={id}
              className="pointer-events-auto flex items-start gap-3 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 min-w-[280px] max-w-[360px]"
              style={{ animation: 'toastSlideIn .3s ease' }}
            >
              {/* Icon bubble */}
              <div className={`w-8 h-8 rounded-full ${s.bg} border ${s.border} flex items-center justify-center shrink-0 mt-0.5`}>
                <span className={s.icon}>{ICONS[type] || ICONS.success}</span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">{TITLES[type] || 'Notification'}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug break-words">{message}</p>
              </div>

              {/* Close */}
              <button
                onClick={() => dismiss(id)}
                className="text-slate-300 hover:text-slate-500 transition-colors mt-0.5 shrink-0"
              >
                <svg viewBox="0 0 14 14" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M1.293 1.293a1 1 0 011.414 0L7 5.586l4.293-4.293a1 1 0 111.414 1.414L8.414 7l4.293 4.293a1 1 0 01-1.414 1.414L7 8.414l-4.293 4.293a1 1 0 01-1.414-1.414L5.586 7 1.293 2.707a1 1 0 010-1.414z" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}
