import { Sparkles, Award, Calendar, Zap } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function StudentWelcomeBanner({ user, tokens }) {
  const { accentColor } = useTheme()
  const BRAND = accentColor || '#615FFF'

  return (
    <div
      className="group relative rounded-3xl p-6 sm:p-8 md:p-9 overflow-hidden transition-all duration-500 shadow-xl hover:shadow-2xl hover:-translate-y-1.5"
      style={{
        background: tokens.dark
          ? 'linear-gradient(135deg, #0d1527 0%, #172242 50%, #111a36 100%)'
          : 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #f3e8ff 100%)',
        border: `1px solid ${tokens.dark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.2)'}`,
      }}
    >
      {/* 🌟 1. Animated Border Shimmer Overlay on Hover */}
      <div className="absolute inset-0 rounded-3xl p-[1.5px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-linear-to-r from-amber-400 via-indigo-500 to-emerald-400 bg-size-[200%_auto] animate-borderGlow" />

      {/* 🌌 2. Ambient Radiant Background Orbs */}
      <div
        className="absolute -right-12 -top-12 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30 group-hover:opacity-70 group-hover:scale-125 transition-all duration-700 ease-out"
        style={{ background: 'radial-gradient(circle, #3b82f6 0%, rgba(99,102,241,0) 70%)' }}
      />
      <div
        className="absolute left-1/3 -bottom-16 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 group-hover:opacity-50 transition-all duration-700 ease-out"
        style={{ background: 'radial-gradient(circle, #f97316 0%, rgba(249,115,22,0) 70%)' }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

        {/* ── Left Content Section ── */}
        <div className="max-w-xl">
          {/* Subheader Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 transition-transform duration-300 group-hover:translate-x-1"
            style={{
              background: tokens.dark ? 'rgba(97,95,255,0.2)' : 'rgba(97,95,255,0.12)',
              color: tokens.dark ? '#a5b4fc' : '#4f46e5',
              border: `1px solid ${tokens.dark ? 'rgba(165,180,252,0.2)' : 'rgba(79,70,229,0.2)'}`,
            }}
          >
            <Sparkles size={13} className="animate-spin-slow text-amber-400" />
            <span>Student Event Portal</span>
          </div>

          <p className="text-sm sm:text-base font-semibold m-0 text-slate-400 dark:text-[#a0b2d6] group-hover:text-slate-300 transition-colors">
            Welcome back,
          </p>

          <h2 className="text-3xl sm:text-4xl md:text-[44px] font-black tracking-tight m-0 my-1 leading-tight flex items-center gap-2.5">
            <span
              className="text-transparent bg-clip-text bg-linear-to-r from-[#ff9800] via-[#f97316] to-[#ff5722] drop-shadow-sm group-hover:brightness-125 transition-all duration-300"
            >
              {user?.name || 'Arjun Sharma'}
            </span>
            <span className="text-3xl sm:text-4xl inline-block group-hover:animate-waveHand origin-bottom-right transition-transform">
              👋
            </span>
          </h2>

          <p className="text-xs sm:text-sm font-medium m-0 text-slate-600 dark:text-[#94a3b8] leading-relaxed max-w-md">
            Here&apos;s what&apos;s happening with your events and achievements.
          </p>
        </div>

        {/* ── Right Animated 3D Floating Illustration Stage ── */}
        <div className="shrink-0 self-center md:self-auto relative py-2 px-1">
          
          {/* Floating Orbit Badge 1 (Trophy - Top Left) */}
          <div className="absolute -left-4 top-0 z-20 px-2.5 py-1 rounded-xl bg-amber-400/20 backdrop-blur-md border border-amber-400/40 text-amber-300 text-[11px] font-extrabold flex items-center gap-1 shadow-lg animate-float-slow group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500">
            <span>🏆</span> Top 10%
          </div>

          {/* Floating Orbit Badge 2 (Streak - Bottom Right) */}
          <div className="absolute -right-3 bottom-1 z-20 px-2.5 py-1 rounded-xl bg-indigo-500/20 backdrop-blur-md border border-indigo-400/40 text-indigo-300 text-[11px] font-extrabold flex items-center gap-1 shadow-lg animate-float-delayed group-hover:scale-110 group-hover:translate-y-1 transition-all duration-500">
            <span>⚡</span> Active Streak
          </div>

          {/* Main Vector SVG Stage */}
          <div className="relative animate-float-medium group-hover:scale-105 transition-transform duration-500">
            <svg
              width="180"
              height="135"
              viewBox="0 0 180 135"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-40 h-30 sm:w-48 sm:h-36 drop-shadow-2xl select-none"
            >
              {/* Radial Backdrop Glow */}
              <circle
                cx="90"
                cy="70"
                r="52"
                fill={tokens.dark ? '#1d2a54' : '#c7d2fe'}
                className="opacity-40 group-hover:opacity-80 group-hover:scale-115 origin-center transition-all duration-700"
              />

              {/* Desk Surface & Legs */}
              <rect x="15" y="90" width="145" height="7" rx="3.5" fill={tokens.dark ? '#0f172a' : '#334155'} className="shadow-md" />
              <rect x="25" y="97" width="4.5" height="28" fill={tokens.dark ? '#0f172a' : '#334155'} />
              <rect x="145" y="97" width="4.5" height="28" fill={tokens.dark ? '#0f172a' : '#334155'} />

              {/* Laptop Stand & Frame */}
              <rect x="62" y="87" width="32" height="3" fill="#64748b" />
              <rect x="75" y="77" width="6" height="10" fill="#475569" />
              <rect x="44" y="32" width="68" height="46" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
              
              {/* Monitor Screen Display (Deep Glow on hover) */}
              <rect
                x="48"
                y="36"
                width="60"
                height="38"
                rx="4"
                fill="#1e293b"
                className="group-hover:fill-[#0f2347] transition-colors duration-500"
              />
              
              {/* Animated Code Lines on Screen */}
              <rect x="52" y="41" width="28" height="4" rx="2" fill="#818cf8" className="group-hover:fill-[#c084fc]" />
              <rect
                x="52"
                y="48"
                width="44"
                height="3.5"
                rx="1.7"
                fill="#3b82f6"
                className="origin-left group-hover:scale-x-110 transition-transform duration-500"
              />
              <rect
                x="52"
                y="54"
                width="34"
                height="3.5"
                rx="1.7"
                fill="#38bdf8"
                className="origin-left group-hover:scale-x-120 transition-transform duration-500"
              />
              <rect x="52" y="60" width="40" height="3.5" rx="1.7" fill="#34d399" />
              <rect x="84" y="41" width="18" height="5" rx="2" fill="#f43f5e" />

              {/* Stacked Color Equalizer Blocks (Bouncing on Hover) */}
              <g className="transition-transform duration-500">
                <rect
                  x="138"
                  y="71"
                  width="13"
                  height="6"
                  rx="1.5"
                  fill="#30d158"
                  className="group-hover:-translate-y-1.5 transition-transform duration-300"
                />
                <rect
                  x="138"
                  y="78"
                  width="13"
                  height="6"
                  rx="1.5"
                  fill="#ff9f0a"
                  className="group-hover:-translate-y-1 transition-transform duration-300 delay-75"
                />
                <rect
                  x="138"
                  y="85"
                  width="13"
                  height="5"
                  rx="1.5"
                  fill="#ff453a"
                  className="group-hover:-translate-y-0.5 transition-transform duration-300 delay-150"
                />
              </g>

              {/* Student Character (Subtle Working Motion) */}
              <g className="group-hover:-translate-y-1.5 transition-transform duration-300">
                {/* Torso */}
                <path d="M 72 90 L 72 63 C 72 57, 98 57, 98 63 L 98 90 Z" fill="#7c3aed" />
                {/* Arms */}
                <path d="M 66 68 C 62 77, 66 84, 74 84" stroke="#7c3aed" strokeWidth="5.5" strokeLinecap="round" />
                <path d="M 104 68 C 108 77, 104 84, 96 84" stroke="#7c3aed" strokeWidth="5.5" strokeLinecap="round" />
                {/* Head */}
                <circle cx="85" cy="46" r="10.5" fill="#f8b896" />
                {/* Hair */}
                <path d="M 74 46 C 74 33, 96 33, 96 46 C 94 40, 76 40, 74 46 Z" fill="#0f172a" />
              </g>

              {/* Twinkling Sparkle Stars (Spinning Orbit on Hover) */}
              <path
                d="M 158 20 L 160.5 25 L 165.5 27.5 L 160.5 30 L 158 35 L 155.5 30 L 150.5 27.5 L 155.5 25 Z"
                fill="#ffd60a"
                className="origin-[158px_27.5px] animate-spin-slow group-hover:scale-135 transition-transform duration-500"
              />
              <path
                d="M 28 32 L 29.5 35 L 33.5 36.5 L 29.5 38 L 28 41 L 26.5 38 L 22.5 36.5 L 26.5 35 Z"
                fill="#ffd60a"
                className="origin-[28px_36.5px] group-hover:scale-135 group-hover:rotate-180 transition-transform duration-700"
              />

              {/* Floating Particles */}
              <circle cx="162" cy="52" r="2.5" fill="#60a5fa" className="animate-pulse" />
              <circle cx="140" cy="14" r="2" fill="#a78bfa" className="animate-pulse" />
              <circle cx="20" cy="62" r="2" fill="#34d399" className="animate-pulse" />
            </svg>
          </div>

        </div>

      </div>

      {/* Embedded CSS Custom Keyframe Animations */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @keyframes floatMedium {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes waveHand {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(16deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(16deg); }
          80% { transform: rotate(-4deg); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes borderGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float-slow {
          animation: floatSlow 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: floatSlow 4.5s ease-in-out 1.5s infinite;
        }
        .animate-float-medium {
          animation: floatMedium 3.5s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spinSlow 8s linear infinite;
        }
        .animate-waveHand {
          animation: waveHand 1.1s ease-in-out infinite;
        }
        .animate-borderGlow {
          animation: borderGlow 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
