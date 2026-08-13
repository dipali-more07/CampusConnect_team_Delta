import React from 'react'
import { createPortal } from 'react-dom'
import { FileSpreadsheet, X, Loader2 } from 'lucide-react'
import { BRAND as DEFAULT_BRAND } from '../../../data/dashboardData'

function getImportModalStyles(dark, BRAND) {
  return {
    modalBg: dark ? '#0c1829' : '#ffffff',
    modalBorder: `1px solid ${dark ? '#1a3050' : '#e8edf5'}`,
    headerTitleColor: dark ? '#e8f0fe' : '#0f172a',
    headerCloseColor: dark ? '#4a6a8a' : '#94a3b8',
    demoContainerBorderColor: dark ? '#1a3050' : '#e2e8f0',
    demoContainerBg: dark ? '#060e1c' : '#f8fafc',
    demoTitleColor: dark ? '#e8f0fe' : '#0f172a',
    demoDescColor: dark ? '#7a98bb' : '#64748b',
    orColor: dark ? '#3d5470' : '#94a3b8',
    labelColor: dark ? '#7a98bb' : '#64748b',
    inputBorder: dark ? '#1a3050' : '#e2e8f0',
  }
}

export default function ImportModal({
  open,
  onClose,
  importing,
  importText,
  setImportText,
  onImportDemo,
  onImportCustom,
  tokens
}) {
  const dialogRef = React.useRef(null)

  React.useEffect(() => {
    if (open && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal()
    }
  }, [open])

  const handleClose = () => {
    if (dialogRef.current) {
      dialogRef.current.close()
    }
    onClose()
  }

  if (!open) return null

  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND

  const styles = getImportModalStyles(dark, BRAND)

  const inputStyle = {
    border: `1px solid ${styles.inputBorder}`,
    color: dark ? '#e8f0fe' : '#0f172a',
    background: dark ? '#060e1c' : '#f8fafc',
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-100 m-0 p-0 w-full h-full border-none bg-transparent"
      onClose={handleClose}
      style={{ maxWidth: '100vw', maxHeight: '100vh' }}
    >
      <button
        type="button"
        className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-sm border-none cursor-default"
        onClick={handleClose}
        aria-label="Close overlay"
      />
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center p-5">
        <div
          className="pointer-events-auto rounded-[20px] w-full max-w-[480px] overflow-hidden"
          style={{
            background: styles.modalBg,
            border: styles.modalBorder,
            boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
            animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${dark ? '#1a3050' : '#e8edf5'}` }}>
            <h2 className="text-[17px] font-extrabold m-0 flex items-center gap-2" style={{ color: styles.headerTitleColor }}>
              <FileSpreadsheet size={18} style={{ color: BRAND }} /> Import Events
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 p-0"
              style={{ color: styles.headerCloseColor }}
              onMouseEnter={e => { e.currentTarget.style.background = dark ? '#162640' : '#f1f5f9'; e.currentTarget.style.color = dark ? '#e8f0fe' : '#475569' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = styles.headerCloseColor }}
            >
              <X size={17} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 flex flex-col gap-4">
            
            {/* Option 1: Demo Import */}
            <div className="p-4 rounded-xl border border-dashed flex flex-col gap-3" style={{ borderColor: styles.demoContainerBorderColor, background: styles.demoContainerBg }}>
              <div>
                <h4 className="text-[13.5px] font-extrabold m-0" style={{ color: styles.demoTitleColor }}>Option 1: Import Demo Events</h4>
                <p className="text-[12px] mt-1 mb-0" style={{ color: styles.demoDescColor }}>
                  Quickly load 3 pre-configured campus events to populate the dashboard table for testing.
                </p>
              </div>
              <button
                type="button"
                onClick={onImportDemo}
                disabled={importing}
                className="w-full py-2 flex items-center justify-center gap-1.5 rounded-[8px] text-[12px] font-bold text-white border-none cursor-pointer transition-all duration-200"
                style={{ background: BRAND, boxShadow: '0 2px 8px rgba(97,95,255,0.3)' }}
              >
                {importing ? <Loader2 size={13} className="animate-spin" /> : 'Load Demo Events'}
              </button>
            </div>

            <div className="text-center text-[11px] font-bold" style={{ color: styles.orColor }}>— OR —</div>

            {/* Option 2: Custom JSON */}
            <div className="flex flex-col gap-2">
              <label htmlFor="importTextarea" className="text-[12px] font-bold" style={{ color: styles.labelColor }}>
                Option 2: Paste JSON List
              </label>
              <textarea
                id="importTextarea"
                rows={6}
                placeholder={`[\n  {\n    "name": "Custom Hackathon",\n    "organizer": "Dr. Anita Nair",\n    "category": "Technical",\n    "venue": "Lab C",\n    "date": "2025-10-15",\n    "capacity": 100,\n    "status": "Upcoming"\n  }\n]`}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] text-[12px] outline-none resize-none box-border font-mono transition-all duration-200"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = styles.inputBorder; e.target.style.boxShadow = 'none' }}
              />
              <button
                type="button"
                onClick={onImportCustom}
                disabled={importing || !importText.trim()}
                className="w-full py-2.5 rounded-[8px] text-[12px] font-bold text-white border-none cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: BRAND }}
              >
                Import Paste JSON
              </button>
            </div>

          </div>
        </div>
      </div>
    </dialog>,
    document.body
  )
}
