import React from 'react'
import { Check, Loader2 } from 'lucide-react'

export default function SettingsAppearanceTab({
  appearanceForm,
  setAppearanceForm,
  saving,
  handleSaveAppearance,
  setDark,
  setAccentColor,
  setFontSize,
  tokens,
  BRAND
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[17px] font-extrabold m-0" style={{ color: tokens.txtPri }}>Appearance Settings</h3>
      </div>

      <div className="space-y-5 max-w-[500px]">
        {/* Theme Mode Toggle */}
        <div>
          <label className="text-[11.5px] font-bold block mb-2" style={{ color: tokens.txtSec }}>Theme Mode</label>
          <div className="flex gap-3">
            {['Light', 'Dark'].map(mode => {
              const active = appearanceForm.themeMode === mode
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setAppearanceForm(p => ({ ...p, themeMode: mode }))
                    setDark(mode === 'Dark')
                  }}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border cursor-pointer capitalize transition-all"
                  style={{
                    background: active ? `${BRAND}18` : 'transparent',
                    borderColor: active ? BRAND : tokens.border,
                    color: active ? BRAND : tokens.txtSec,
                    boxShadow: active ? `0 0 0 1px ${BRAND}` : 'none'
                  }}
                >
                  {mode} Mode
                </button>
              )
            })}
          </div>
        </div>

        {/* Accent Color Swatches */}
        <div>
          <label className="text-[11.5px] font-bold block mb-2" style={{ color: tokens.txtSec }}>Accent Color</label>
          <div className="flex gap-2.5">
            {['#615FFF', '#00BC7D', '#FE9A00', '#0284c7', '#e11d48', '#7c3aed'].map(c => {
              const active = appearanceForm.accentColor === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setAppearanceForm(p => ({ ...p, accentColor: c }))
                    setAccentColor(c)
                  }}
                  className="w-8 h-8 rounded-full border-2 cursor-pointer transition-all hover:scale-110 flex items-center justify-center relative"
                  style={{
                    background: c,
                    borderColor: active ? '#ffffff' : 'transparent',
                    boxShadow: active ? `0 0 0 3px ${c}` : '0 2px 5px rgba(0,0,0,0.1)'
                  }}
                >
                  {active && <Check size={14} color="#fff" strokeWidth={3} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Font Size slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[11.5px] font-bold" style={{ color: tokens.txtSec }}>Font Size</label>
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: BRAND }}>{appearanceForm.fontSize}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold" style={{ color: tokens.txtMuted }}>Sm</span>
            <input
              type="range"
              min="0"
              max="2"
              value={appearanceForm.fontSize === 'small' ? 0 : appearanceForm.fontSize === 'medium' ? 1 : 2}
              onChange={e => {
                const val = parseInt(e.target.value)
                const label = val === 0 ? 'small' : val === 1 ? 'medium' : 'large'
                setAppearanceForm(p => ({ ...p, fontSize: label }))
                setFontSize(label)
              }}
              className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: BRAND }}
            />
            <span className="text-[10px] font-bold" style={{ color: tokens.txtMuted }}>Lg</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSaveAppearance}
            disabled={saving}
            className="px-5 py-3 rounded-xl text-[13px] font-bold text-white border-none cursor-pointer flex items-center gap-2 hover:-translate-y-px transition-all"
            style={{ background: BRAND, boxShadow: `0 4px 14px ${BRAND}60` }}
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  )
}
