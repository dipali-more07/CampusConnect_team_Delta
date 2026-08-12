import React, { useEffect, useState, useRef } from 'react'
import { GraduationCap } from 'lucide-react'

/* ─── Particle field canvas ─── */
function ParticleField() {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    let raf
    const rnd = () => window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296
    cv.width  = window.innerWidth
    cv.height = window.innerHeight
    const onResize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight }
    window.addEventListener('resize', onResize)

    const pts = Array.from({ length: 55 }, () => ({
      x: rnd() * cv.width,  y: rnd() * cv.height,
      vx: (rnd() - 0.5) * 0.35, vy: (rnd() - 0.5) * 0.35,
      r: rnd() * 1.5 + 0.4,
      hue: 220 + rnd() * 90,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height)
      pts.forEach((p, i) => {
        p.x = (p.x + p.vx + cv.width)  % cv.width
        p.y = (p.y + p.vy + cv.height) % cv.height
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue},90%,82%,0.55)`
        ctx.fill()
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j]
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 110) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `hsla(260,75%,72%,${0.13 * (1 - d / 110)})`
            ctx.lineWidth = 0.6; ctx.stroke()
          }
        }
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />
}

/* ─── SVG arc progress ─── */
function ArcProgress({ pct }) {
  const r = 56, sw = 3.5, nr = r - sw
  const circ = 2 * Math.PI * nr
  const dash  = (pct / 100) * circ
  return (
    <svg width={r * 2} height={r * 2} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-90deg)' }}>
      <circle cx={r} cy={r} r={nr} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
      <circle cx={r} cy={r} r={nr} fill="none" stroke="url(#ag)" strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.2s ease-out', filter: 'drop-shadow(0 0 7px rgba(139,92,246,0.95))' }} />
      <defs>
        <linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#06b6d4" />
          <stop offset="45%"  stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ─── Spinning orbital ring ─── */
function Orbital({ size, color, dur, rev, dash = '5 9' }) {
  return (
    <svg width={size} height={size} style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)',
      animation: `${rev ? 'sl-spinRev' : 'sl-spin'} ${dur}s linear infinite`,
    }}>
      <circle cx={size/2} cy={size/2} r={size/2-2}
        fill="none" stroke={color} strokeWidth={1.5}
        strokeDasharray={dash} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
    </svg>
  )
}

/* ─── Letter reveal ─── */
function RevealText({ text, delay = 0 }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const t0 = setTimeout(() => {
      let i = 0
      const iv = setInterval(() => { i++; setN(i); if (i >= text.length) clearInterval(iv) }, 42)
      return () => clearInterval(iv)
    }, delay)
    return () => clearTimeout(t0)
  }, [text, delay])
  return (
    <span>
      {text.split('').map((ch, i) => (
        <span key={i} style={{
          display: 'inline-block',
          opacity: i < n ? 1 : 0,
          transform: i < n ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.28s ease, transform 0.28s ease',
        }}>
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  )
}

const STEPS = [
  'Authenticating session...',
  'Loading your workspace...',
  'Syncing events & data...',
  'Preparing dashboard...',
]

const SHOW_MS = 900   // visible time
const EXIT_MS = 350   // exit animation duration

export default function SplashLoader({ onDone }) {
  const [exiting,  setExiting]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [step,     setStep]     = useState(0)
  const doneRef = useRef(false)

  useEffect(() => {
    let p = 0
    const iv = setInterval(() => {
      p = Math.min(100, p + 2.8)
      setProgress(p)
      if (p >= 100) clearInterval(iv)
    }, 20)

    const sv = setInterval(() => setStep(s => (s + 1) % STEPS.length), 300)

    // Start exit animation after SHOW_MS
    const exitT = setTimeout(() => setExiting(true), SHOW_MS)

    // Call onDone after exit animation fully completes
    const doneT = setTimeout(() => {
      if (!doneRef.current) { doneRef.current = true; onDone?.() }
    }, SHOW_MS + EXIT_MS)

    return () => {
      clearInterval(iv); clearInterval(sv)
      clearTimeout(exitT); clearTimeout(doneT)
    }
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center select-none overflow-hidden"
      style={{
        /* ── CRITICAL: background appears INSTANTLY (opacity:1 from the start)
           Only the exit applies a fade-out via keyframe.
           This prevents the dashboard from flashing through on entry. ── */
        background: 'radial-gradient(ellipse 85% 70% at 50% 0%, #180a3d 0%, #090612 55%, #000008 100%)',
        opacity: 1,
        animation: exiting ? `sl-overlayExit ${EXIT_MS}ms cubic-bezier(0.4,0,1,1) forwards` : 'none',
        pointerEvents: exiting ? 'none' : 'all',
      }}
    >
      {/* Particles */}
      <ParticleField />

      {/* Aurora blobs */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 55% 40% at 18% 25%, rgba(99,60,220,0.22) 0%, transparent 68%),
          radial-gradient(ellipse 42% 34% at 82% 72%, rgba(6,182,212,0.13) 0%, transparent 68%),
          radial-gradient(ellipse 48% 28% at 62% 18%, rgba(236,72,153,0.09) 0%, transparent 68%)`,
        animation: 'sl-aurora 8s ease-in-out infinite alternate',
      }} />

      {/* ── Main content card — this one gets the fancy entrance ── */}
      <div
        className="relative z-10 flex flex-col items-center gap-9 px-10 py-12 text-center"
        style={{
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 36,
          boxShadow: '0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)',
          minWidth: 340,
          /* Card slides up + fades in on mount, slides down + fades on exit */
          animation: exiting
            ? `sl-cardExit  ${EXIT_MS}ms cubic-bezier(0.4,0,1,1) forwards`
            : `sl-cardEnter 580ms cubic-bezier(0.16,1,0.3,1) both`,
        }}
      >

        {/* Logo zone */}
        <div className="relative" style={{ width: 112, height: 112 }}>
          <ArcProgress pct={progress} />
          <Orbital size={134} color="rgba(139,92,246,0.32)" dur={7}  dash="4 10" />
          <Orbital size={118} color="rgba(6,182,212,0.22)"  dur={5}  dash="2 14" rev />

          {/* Glow bloom */}
          <div style={{
            position: 'absolute', inset: -18, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(109,40,217,0.48) 0%, transparent 70%)',
            animation: 'sl-glow 2.5s ease-in-out infinite',
          }} />

          {/* Icon box */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 70, height: 70, borderRadius: 20,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #0ea5e9 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.14), 0 18px 50px rgba(79,70,229,0.55), 0 0 65px rgba(124,58,237,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'sl-float 3s ease-in-out infinite',
          }}>
            <GraduationCap size={34} color="#fff" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))' }} />
          </div>
        </div>

        {/* Brand name */}
        <div className="flex flex-col items-center gap-2">
          <h1 style={{
            fontFamily: "'Inter','Segoe UI',sans-serif",
            fontSize: 33, fontWeight: 900, letterSpacing: '-0.7px', lineHeight: 1,
            background: 'linear-gradient(90deg,#c7d2fe 0%,#a78bfa 35%,#67e8f9 68%,#f0abfc 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.45))',
          }}>
            <RevealText text="CampusConnect" delay={200} />
          </h1>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase',
            background: 'linear-gradient(90deg,rgba(99,102,241,0.8) 0%,rgba(6,182,212,0.8) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'sl-fadeUp 0.55s ease 0.8s both',
          }}>
            University Platform
          </p>
        </div>

        {/* Status block */}
        <div className="flex flex-col items-center gap-3" style={{ minWidth: 260 }}>
          <p key={step} style={{
            fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em',
            color: 'rgba(167,139,250,0.68)',
            animation: 'sl-fadeUp 0.32s ease',
          }}>
            {STEPS[step]}
          </p>

          {/* Progress bar */}
          <div style={{ width: 220, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`, borderRadius: 99,
              background: 'linear-gradient(90deg,#6366f1 0%,#8b5cf6 38%,#06b6d4 72%,#ec4899 100%)',
              boxShadow: '0 0 12px rgba(139,92,246,0.85)',
              transition: 'width 0.2s ease-out',
            }} />
          </div>

          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.22)', fontVariantNumeric: 'tabular-nums',
          }}>
            {Math.round(progress)}%
          </p>
        </div>

        {/* Bounce dots */}
        <div className="flex items-center gap-2.5">
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 4, height: 4, borderRadius: '50%',
              background: `hsl(${245 + i * 30},85%,72%)`,
              boxShadow: `0 0 7px hsl(${245 + i * 30},85%,72%)`,
              animation: `sl-bounce 1.4s ease-in-out ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <p style={{
        position: 'absolute', bottom: 26, fontSize: 10, fontWeight: 500,
        letterSpacing: '0.1em', color: 'rgba(255,255,255,0.13)',
      }}>
        © {new Date().getFullYear()} CampusConnect · Secure Session
      </p>

      <style>{`
        /* Overlay: INSTANT on entry (no keyframe), smooth fade on exit */
        @keyframes sl-overlayExit {
          from { opacity: 1; }
          to   { opacity: 0; }
        }

        /* Card: slides up + fades in on entry */
        @keyframes sl-cardEnter {
          from { opacity: 0; transform: translateY(28px) scale(0.94); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0px)  scale(1);    filter: blur(0px); }
        }
        /* Card: slides down + fades on exit */
        @keyframes sl-cardExit {
          from { opacity: 1; transform: translateY(0px)   scale(1);    filter: blur(0px);  }
          to   { opacity: 0; transform: translateY(-18px) scale(1.04); filter: blur(5px);  }
        }

        @keyframes sl-spin    { to { transform: translate(-50%,-50%) rotate(360deg);  } }
        @keyframes sl-spinRev { to { transform: translate(-50%,-50%) rotate(-360deg); } }
        @keyframes sl-glow    { 0%,100% { opacity:.5; transform:scale(1);    } 50% { opacity:1; transform:scale(1.18); } }
        @keyframes sl-float   { 0%,100% { transform:translate(-50%,-50%) translateY(0px);  } 50% { transform:translate(-50%,-50%) translateY(-5px); } }
        @keyframes sl-aurora  { from { opacity:.7; } to { opacity:1; } }
        @keyframes sl-fadeUp  { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); } }
        @keyframes sl-bounce  { 0%,80%,100% { transform:scale(0.55); opacity:.28; } 40% { transform:scale(1.35); opacity:1; } }
      `}</style>
    </div>
  )
}
