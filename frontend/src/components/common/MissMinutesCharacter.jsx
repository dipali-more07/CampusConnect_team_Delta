import React, { useState, useEffect } from 'react'

/**
 * Miss Minutes TVA Hologram Character (Loki TVA Retro Style)
 */
export default function MissMinutesCharacter({ onClick, isTalking = false, size = 110 }) {
  const [quoteIdx, setQuoteIdx] = useState(0)

  const quotes = [
    "Hey y'all! I'm Miss Minutes!",
    "Welcome to CampusConnect y'all!",
    "Remember: For All Time. Always!",
    "Need event recommendations?",
    "Ask me about hackathons & certificates!",
  ]

  // Periodic speech quote rotation without Math.random()
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % quotes.length)
    }, 9000)
    return () => clearInterval(interval)
  }, [quotes.length])

  const speechText = quotes[quoteIdx]

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-3 right-5 z-50 select-none flex flex-col items-center justify-center cursor-pointer group bg-transparent border-none p-0 outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-2xl"
      style={{ width: size, height: size + 40 }}
    >
      {/* ── TVA HOLOGRAM BASE GLOW & PROJECTOR LIGHT ── */}
      <div className="absolute bottom-0 w-32 h-9 bg-gradient-to-t from-orange-500/60 via-amber-500/25 to-transparent rounded-full blur-md opacity-85 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Hologram Light Cone Rays */}
      <div
        className="absolute bottom-4 w-28 h-40 bg-gradient-to-t from-amber-400/35 via-orange-400/15 to-transparent rounded-t-full pointer-events-none opacity-70 group-hover:opacity-90 transition-opacity duration-300"
        style={{ clipPath: 'polygon(15% 100%, 85% 100%, 100% 0%, 0% 0%)' }}
      />

      {/* ── SPEECH BUBBLE (TVA Vintage Retro Style) ── */}
      <div className="relative mb-2 px-3 py-1.5 rounded-2xl bg-[#1c0f0a]/90 text-amber-300 text-[11px] font-bold border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.35)] backdrop-blur-md flex items-center gap-1.5 animate-bounce group-hover:border-amber-400 transition-colors">
        <span>⏰</span>
        <span className="truncate max-w-[170px]">{speechText}</span>
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1c0f0a]/90 border-r border-b border-amber-500/50 rotate-45" />
      </div>

      {/* ── MISS MINUTES SVG HOLOGRAM CHARACTER MODEL ── */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl animate-pulse" />

        <svg
          width={size}
          height={size}
          viewBox="0 0 200 200"
          className="relative z-10 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] transition-transform duration-300 group-hover:scale-110"
        >
          <defs>
            <linearGradient id="clockFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff7700" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            <linearGradient id="tvaScanline" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="50%" stopColor="rgba(245,158,11,0.05)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
            </linearGradient>

            <filter id="hologramGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g opacity="0.15">
            {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((y, idx) => (
              <line key={`scanline-${y}-${idx}`} x1="0" y1={y} x2="200" y2={y} stroke="#fff" strokeWidth="1" />
            ))}
          </g>

          <path d="M 45 105 Q 25 100 20 115" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="18" cy="118" r="8" fill="#fff" stroke="#d97706" strokeWidth="2" />

          <path d="M 155 105 Q 178 90 175 75" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" fill="none" className={isTalking ? 'animate-bounce' : ''} />
          <g transform="translate(175,70)">
            <circle cx="0" cy="0" r="9" fill="#fff" stroke="#d97706" strokeWidth="2" />
            <path d="M -3 -8 L -3 -12 M 0 -9 L 0 -14 M 3 -8 L 3 -12" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
          </g>

          <path d="M 80 160 L 75 185" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="70" cy="188" rx="10" ry="5" fill="#1c0f0a" stroke="#f59e0b" strokeWidth="2" />

          <path d="M 120 160 L 125 185" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="130" cy="188" rx="10" ry="5" fill="#1c0f0a" stroke="#f59e0b" strokeWidth="2" />

          <circle cx="100" cy="100" r="62" fill="url(#clockFaceGrad)" stroke="#ffedd5" strokeWidth="4" filter="url(#hologramGlow)" />
          <circle cx="100" cy="100" r="62" fill="url(#tvaScanline)" />

          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, idx) => {
            const rad = (deg * Math.PI) / 180
            const x1 = 100 + 52 * Math.cos(rad)
            const y1 = 100 + 52 * Math.sin(rad)
            const x2 = 100 + 58 * Math.cos(rad)
            const y2 = 100 + 58 * Math.sin(rad)
            return <line key={`tick-${deg}-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth={deg % 90 === 0 ? "3.5" : "2"} opacity="0.9" />
          })}

          <ellipse cx="78" cy="90" rx="11" ry="16" fill="#fff" />
          <ellipse cx="122" cy="90" rx="11" ry="16" fill="#fff" />

          <circle cx="80" cy="92" r="5" fill="#1c0f0a" />
          <circle cx="124" cy="92" r="5" fill="#1c0f0a" />

          <circle cx="78" cy="88" r="2.5" fill="#fff" />
          <circle cx="122" cy="88" r="2.5" fill="#fff" />

          <path d="M 68 76 L 64 71 M 78 73 L 78 67 M 87 76 L 91 71" stroke="#1c0f0a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 113 76 L 109 71 M 122 73 L 122 67 M 132 76 L 136 71" stroke="#1c0f0a" strokeWidth="2.5" strokeLinecap="round" />

          <line x1="100" y1="100" x2="100" y2="65" stroke="#1c0f0a" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="100" y1="100" x2="130" y2="100" stroke="#1c0f0a" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="100" cy="100" r="4.5" fill="#fff" stroke="#1c0f0a" strokeWidth="2" />

          <path d="M 72 118 Q 100 142 128 118" fill="#1c0f0a" stroke="#1c0f0a" strokeWidth="2" />
          <path d="M 80 123 Q 100 138 120 123 Z" fill="#ef4444" />
          <path d="M 78 120 Q 100 126 122 120" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />

          <circle cx="64" cy="112" r="7" fill="#f43f5e" opacity="0.45" />
          <circle cx="136" cy="112" r="7" fill="#f43f5e" opacity="0.45" />
        </svg>
      </div>
    </button>
  )
}
