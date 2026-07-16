import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Palette, X, GraduationCap, Save, Check } from 'lucide-react'
import certificatesService from '../../../services/certificatesService'

export default function CertDesignerModal({
  designerOpen,
  setDesignerOpen,
  tmpl,
  setTmpl,
  tokens,
  dark,
  BRAND,
  showToast
}) {
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      name: tmpl.title || 'Classic Navy Template',
      background_image: tmpl.gradFrom || '#1a1060',
      font_color: tmpl.accentColor || '#615FFF',
      title_font_size: 36,
      body_font_size: 14,
      is_active: true,
      organisation_name: tmpl.org || 'State University',
      certificate_title: tmpl.title || 'Certificate of Participation',
      background_gradient_from: tmpl.gradFrom || '#1a1060',
      background_gradient_mid: tmpl.gradMid || '#0f0a45',
      background_gradient_to: tmpl.gradTo || '#0a0838',
      accent_color: tmpl.accentColor || '#615FFF',
      border_style: tmpl.borderStyle || 'none',
      font_family: tmpl.fontFamily || 'Manrope, sans-serif',
      show_logo: tmpl.showLogo !== undefined ? tmpl.showLogo : true,
      show_signatures: tmpl.showSignatures !== undefined ? tmpl.showSignatures : true
    }
    const res = await certificatesService.saveTemplate(payload)
    setSaving(false)
    if (res.success) {
      setTmpl(p => ({ ...p, templateSaved: true }))
      showToast('Certificate template saved successfully!', 'success')
    } else {
      showToast(res.message || 'Failed to save template.', 'error')
    }
  }

  if (!designerOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-110 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="rounded-[24px] w-full flex overflow-hidden"
        style={{
          maxWidth: 980,
          maxHeight: '92vh',
          background: dark ? '#0c1829' : '#f8fafc',
          border: `1px solid ${tokens.border}`,
          boxShadow: '0 40px 100px rgba(0,0,0,0.55)',
          animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* ── Left Panel: Controls ── */}
        <div
          className="w-[300px] shrink-0 flex flex-col overflow-y-auto"
          style={{ background: dark ? '#0a1525' : '#ffffff', borderRight: `1px solid ${tokens.border}` }}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${tokens.border}` }}>
            <div className="flex items-center gap-2">
              <Palette size={16} style={{ color: '#a855f7' }} />
              <span className="text-[14px] font-extrabold" style={{ color: tokens.txtPri }}>Template Designer</span>
            </div>
            <button
              onClick={() => setDesignerOpen(false)}
              className="w-7 h-7 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center"
              style={{ color: tokens.txtSec }}
              onMouseEnter={e => e.currentTarget.style.background = tokens.hoverBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            ><X size={15} /></button>
          </div>

          <div className="flex-1 p-5 space-y-5">

            {/* Organisation Name */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: tokens.txtSec }}>Organisation Name</label>
              <input
                value={tmpl.org}
                onChange={e => setTmpl(p => ({ ...p, org: e.target.value, templateSaved: false }))}
                className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                style={{ background: tokens.inputBg, borderColor: tokens.border, color: tokens.txtPri }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Certificate Title */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: tokens.txtSec }}>Certificate Title</label>
              <input
                value={tmpl.title}
                onChange={e => setTmpl(p => ({ ...p, title: e.target.value, templateSaved: false }))}
                className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none border transition-all"
                style={{ background: tokens.inputBg, borderColor: tokens.border, color: tokens.txtPri }}
                onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}20` }}
                onBlur={e => { e.target.style.borderColor = tokens.border; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Gradient Colors */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: tokens.txtSec }}>Background Gradient</label>
              <div className="flex gap-2">
                {[['gradFrom', 'From'], ['gradMid', 'Mid'], ['gradTo', 'To']].map(([key, lbl]) => (
                  <div key={key} className="flex-1 text-center">
                    <input
                      type="color"
                      value={tmpl[key]}
                      onChange={e => setTmpl(p => ({ ...p, [key]: e.target.value, templateSaved: false }))}
                      className="w-full h-9 rounded-lg cursor-pointer border-none"
                      style={{ background: 'transparent' }}
                    />
                    <span className="text-[10px]" style={{ color: tokens.txtMuted }}>{lbl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: tokens.txtSec }}>Accent / Logo Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={tmpl.accentColor}
                  onChange={e => setTmpl(p => ({ ...p, accentColor: e.target.value, templateSaved: false }))}
                  className="w-10 h-10 rounded-xl cursor-pointer border-none shrink-0"
                />
                <div className="flex flex-wrap gap-2">
                  {['#615FFF', '#00BC7D', '#FE9A00', '#ef4444', '#0284c7', '#a855f7'].map(c => (
                    <button
                      key={c}
                      onClick={() => setTmpl(p => ({ ...p, accentColor: c, templateSaved: false }))}
                      className="w-6 h-6 rounded-full border-2 cursor-pointer transition-transform hover:scale-110"
                      style={{
                        background: c,
                        borderColor: tmpl.accentColor === c ? '#fff' : 'transparent',
                        boxShadow: tmpl.accentColor === c ? `0 0 0 2px ${c}` : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Border Style */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: tokens.txtSec }}>Border Style</label>
              <div className="flex gap-2">
                {['none', 'thin', 'thick', 'double'].map(b => (
                  <button
                    key={b}
                    onClick={() => setTmpl(p => ({ ...p, borderStyle: b, templateSaved: false }))}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold border cursor-pointer capitalize transition-all"
                    style={{
                      background: tmpl.borderStyle === b ? `${BRAND}18` : 'transparent',
                      borderColor: tmpl.borderStyle === b ? BRAND : tokens.border,
                      color: tmpl.borderStyle === b ? BRAND : tokens.txtSec,
                    }}
                  >{b}</button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: tokens.txtSec }}>Font Family</label>
              <div className="relative">
                <select
                  value={tmpl.fontFamily}
                  onChange={e => setTmpl(p => ({ ...p, fontFamily: e.target.value, templateSaved: false }))}
                  className="w-full pl-3 pr-8 py-2.5 rounded-xl text-[13px] outline-none border appearance-none cursor-pointer"
                  style={{ background: tokens.inputBg, borderColor: tokens.border, color: tokens.txtPri }}
                >
                  {[
                    ['Manrope, sans-serif', 'Manrope'],
                    ['Georgia, serif', 'Georgia'],
                    ['Times New Roman, serif', 'Times New Roman'],
                    ['Trebuchet MS, sans-serif', 'Trebuchet MS'],
                    ['Palatino, serif', 'Palatino'],
                  ].map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: tokens.txtSec }}>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1.5L5 4.5L9 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: tokens.txtSec }}>Options</label>
              {[['showLogo', 'Show Logo'], ['showSignatures', 'Show Signatures']].map(([key, lbl]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-[13px] font-medium" style={{ color: tokens.txtPri }}>{lbl}</span>
                  <button
                    onClick={() => setTmpl(p => ({ ...p, [key]: !p[key], templateSaved: false }))}
                    className="w-11 h-6 rounded-full transition-all duration-200 relative cursor-pointer border-none"
                    style={{ background: tmpl[key] ? BRAND : (dark ? '#1a3050' : '#cbd5e1') }}
                  >
                    <div
                      className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200"
                      style={{ left: tmpl[key] ? '26px' : '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="p-5" style={{ borderTop: `1px solid ${tokens.border}` }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-px disabled:opacity-75 disabled:cursor-not-allowed"
              style={{ background: tmpl.templateSaved ? '#00BC7D' : BRAND, boxShadow: `0 4px 14px ${tmpl.templateSaved ? 'rgba(0,188,125,0.4)' : 'rgba(97,95,255,0.4)'}` }}
            >
              {saving ? 'Saving...' : (tmpl.templateSaved ? <><Check size={14} /> Template Saved</> : <><Save size={14} /> Save Template</>)}
            </button>
          </div>
        </div>

        {/* ── Right Panel: Live Preview ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${tokens.border}` }}>
            <span className="text-[13px] font-bold" style={{ color: tokens.txtSec }}>Live Preview</span>
            <span className="text-[11px] px-2.5 py-1 rounded-full font-bold" style={{ background: `${BRAND}15`, color: BRAND }}>Preview Mode</span>
          </div>

          <div className="flex-1 flex items-center justify-center p-8 overflow-auto" style={{ background: dark ? '#060e1c' : '#f1f5f9' }}>
            {/* Certificate Preview */}
            <div
              className="rounded-2xl p-10 relative overflow-hidden w-full"
              style={{
                maxWidth: 560,
                minHeight: 360,
                background: `linear-gradient(135deg, ${tmpl.gradFrom} 0%, ${tmpl.gradMid} 45%, ${tmpl.gradTo} 100%)`,
                fontFamily: tmpl.fontFamily,
                outline: tmpl.borderStyle === 'none' ? 'none'
                  : tmpl.borderStyle === 'thin' ? `1px solid ${tmpl.accentColor}`
                  : tmpl.borderStyle === 'thick' ? `3px solid ${tmpl.accentColor}`
                  : `4px double ${tmpl.accentColor}`,
                outlineOffset: '6px',
              }}
            >
              {/* Blobs */}
              <div className="absolute top-[-50px] left-[-50px] w-[240px] h-[240px] rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${tmpl.accentColor} 0%, transparent 70%)` }} />
              <div className="absolute bottom-[-70px] right-[-50px] w-[260px] h-[260px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #00BC7D 0%, transparent 70%)' }} />

              <div className="relative z-10 flex flex-col items-center text-center gap-2.5">
                {tmpl.showLogo && (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-1"
                    style={{ background: tmpl.accentColor, boxShadow: `0 0 28px ${tmpl.accentColor}60` }}
                  >
                    <GraduationCap size={30} color="#fff" />
                  </div>
                )}

                <p className="text-[9px] font-bold tracking-[4px] uppercase m-0" style={{ color: 'rgba(255,255,255,0.55)' }}>{tmpl.org}</p>

                <h2 className="text-[24px] font-extrabold text-white m-0 leading-tight">{tmpl.title}</h2>

                <div className="w-14 h-[2px] rounded-full" style={{ background: tmpl.accentColor }} />

                <p className="text-[12px] m-0" style={{ color: 'rgba(255,255,255,0.6)' }}>{tmpl.subtitle}</p>

                <p className="text-[26px] font-extrabold text-white m-0 tracking-tight">Student Name</p>

                <p className="text-[12px] m-0" style={{ color: 'rgba(255,255,255,0.6)' }}>{tmpl.body}</p>

                <p className="text-[18px] font-extrabold m-0" style={{ color: `${tmpl.accentColor}cc` || '#a5b4fc' }}>Event Name</p>

                {tmpl.showSignatures && (
                  <div className="w-full flex justify-between items-end mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                    <div className="text-center">
                      <div className="w-20 h-px mb-1" style={{ background: 'rgba(255,255,255,0.25)' }} />
                      <p className="text-[9px] m-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Event Organizer</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>DD MMM YYYY</p>
                      <div className="w-20 h-px mb-1" style={{ background: 'rgba(255,255,255,0.25)' }} />
                      <p className="text-[9px] m-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Date of Issue</p>
                    </div>
                    <div className="text-center">
                      <div className="w-20 h-px mb-1" style={{ background: 'rgba(255,255,255,0.25)' }} />
                      <p className="text-[9px] m-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Principal / Dean</p>
                    </div>
                  </div>
                )}

                <p className="text-[8px] m-0 font-mono mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Verify at: {tmpl.footer}/CERT-XXX-XXXX
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
