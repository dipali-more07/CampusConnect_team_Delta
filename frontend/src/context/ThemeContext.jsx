import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return '97, 95, 255'
  let c = hex.replace('#', '')
  if (c.length === 3) c = c.split('').map(x => x + x).join('')
  const num = parseInt(c, 16)
  if (isNaN(num)) return '97, 95, 255'
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('cc_theme')
    return saved ? saved === 'dark' : false
  })

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('cc_accent') || '#615FFF'
  })

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('cc_font_size') || 'medium'
  })

  useEffect(() => {
    localStorage.setItem('cc_theme', dark ? 'dark' : 'light')
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [dark])

  useEffect(() => {
    localStorage.setItem('cc_accent', accentColor)
    document.documentElement.style.setProperty('--brand-color', accentColor)
    document.documentElement.style.setProperty('--brand-color-rgb', hexToRgb(accentColor))
  }, [accentColor])

  useEffect(() => {
    localStorage.setItem('cc_font_size', fontSize)
    const fontMap = {
      small: '92.5%',
      medium: '100%',
      large: '107.5%'
    }
    document.documentElement.style.fontSize = fontMap[fontSize] || '100%'
  }, [fontSize])

  const toggleDark = () => setDark(prev => !prev)

  const applyAppearance = ({ themeMode, accentColor: color, fontSize: size }) => {
    if (themeMode) setDark(themeMode === 'Dark')
    if (color) setAccentColor(color)
    if (size) setFontSize(size)
  }

  return (
    <ThemeContext.Provider value={{
      dark,
      setDark,
      toggleDark,
      accentColor,
      setAccentColor,
      fontSize,
      setFontSize,
      applyAppearance
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}

