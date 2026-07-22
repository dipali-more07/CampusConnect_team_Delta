import { useState, useEffect, useRef } from 'react'
import {
  Users, Award, Mail, Lock, Eye, EyeOff,
  GraduationCap, Wifi, X, KeyRound, CalendarDays,
  QrCode, Ticket, BarChart3, Sparkles, ArrowRight
} from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'
import SignUpForm from './SignUpForm'

const STATS = [
  { icon: CalendarDays, value: '247', label: 'Events' },
  { icon: Users, value: '12.4K', label: 'Students' },
  { icon: Award, value: '8.2K', label: 'Certificates' },
]

const TAGS = ['TechFest 2025', 'Cultural Fest', 'Hackathon 2025']

/* ── Interactive Constellation Canvas ── */
function ConstellationCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId

    let width = (canvas.width = canvas.parentElement.offsetWidth)
    let height = (canvas.height = canvas.parentElement.offsetHeight)

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.offsetWidth
      height = canvas.height = canvas.parentElement.offsetHeight
    }
    window.addEventListener('resize', handleResize)

    const particles = Array.from({ length: 38 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1,
    }))

    let mouse = { x: -1000, y: -1000 }
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const handleMouseLeave = () => {
      mouse.x = -1000
      mouse.y = -1000
    }

    const parent = canvas.parentElement
    parent.addEventListener('mousemove', handleMouseMove)
    parent.addEventListener('mouseleave', handleMouseLeave)

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        // Particle dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
        ctx.fill()

        // Connect particle to particle
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 110) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.22 * (1 - dist / 110)})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }

        // Connect particle to mouse cursor
        const mdx = p.x - mouse.x
        const mdy = p.y - mouse.y
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy)
        if (mdist < 150) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.strokeStyle = `rgba(251, 191, 36, ${0.65 * (1 - mdist / 150)})`
          ctx.lineWidth = 1.4
          ctx.stroke()
        }
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      parent.removeEventListener('mousemove', handleMouseMove)
      parent.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-90"
    />
  )
}

/* ── 3D Morphing Headline Flip Badge ── */
const HERO_FEATURE_ITEMS = [
  { text: 'Campus Events', icon: CalendarDays, gradient: 'from-amber-300 via-yellow-200 to-amber-400', badgeBg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.4)' },
  { text: 'QR Attendance', icon: QrCode, gradient: 'from-cyan-300 via-teal-200 to-emerald-300', badgeBg: 'rgba(45, 212, 191, 0.2)', border: 'rgba(45, 212, 191, 0.4)' },
  { text: 'Live Registrations', icon: Ticket, gradient: 'from-pink-300 via-rose-200 to-purple-300', badgeBg: 'rgba(244, 114, 182, 0.2)', border: 'rgba(244, 114, 182, 0.4)' },
  { text: 'Instant Certificates', icon: Award, gradient: 'from-emerald-300 via-teal-200 to-cyan-300', badgeBg: 'rgba(52, 211, 153, 0.2)', border: 'rgba(52, 211, 153, 0.4)' },
  { text: 'Real-time Analytics', icon: BarChart3, gradient: 'from-indigo-200 via-violet-200 to-purple-300', badgeBg: 'rgba(167, 139, 250, 0.2)', border: 'rgba(167, 139, 250, 0.4)' },
]

function Morphing3DHeadline() {
  const [index, setIndex] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % HERO_FEATURE_ITEMS.length)
        setAnimating(false)
      }, 280)
    }, 2600)
    return () => clearInterval(interval)
  }, [])

  const item = HERO_FEATURE_ITEMS[index]
  const Icon = item.icon

  return (
    <span
      className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-2xl border backdrop-blur-md transition-all duration-300 my-1 shadow-lg select-none"
      style={{
        background: item.badgeBg,
        borderColor: item.border,
        transform: animating ? 'perspective(500px) rotateX(90deg) scale(0.92)' : 'perspective(500px) rotateX(0deg) scale(1)',
        opacity: animating ? 0 : 1,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease, background 0.4s ease',
      }}
    >
      <Icon size={22} className="text-white shrink-0" />
      <span className={`bg-linear-to-r ${item.gradient} bg-clip-text text-transparent font-extrabold tracking-wide text-2xl`}>
        {item.text}
      </span>
    </span>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)

  // Sign Up state
  const [isSignUp, setIsSignUp] = useState(() => !!localStorage.getItem('pendingVerificationEmail'))
  const [logoHover, setLogoHover] = useState(false)

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  // Global auth & toast
  const { login } = useAuth()
  const showToast = useToast()

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      const res = await authService.forgotPassword(forgotEmail)
      if (res.success) {
        showToast(res.message || `Password reset link sent to ${forgotEmail}`, 'success')
        setForgotOpen(false)
        setForgotEmail('')
      } else {
        showToast(res.message || 'Failed to send password reset link.', 'error')
      }
    } catch {
      showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await authService.login(email, password)
            if (result.success && result.user) {
        login(result.user, result.token, result.refreshToken)
        const userName = result.user?.name || result.user?.fullName || result.user?.email || 'User'
        showToast(`Logged in successfully! User: ${userName}, Role: ${result.user.role}`, 'success')
      } else {
                showToast(result.message || 'Login failed. Please try again.', 'error')
      }
    } catch (err) {
            showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen flex font-['Inter',sans-serif] bg-white">

        {/* ── LEFT PANEL ── */}
        <div
          className="hidden lg:flex flex-col justify-between w-[680px] shrink-0 p-10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 45%, #7c3aed 100%)',
          }}
        >
          {/* Constellation Particle Canvas background */}
          <ConstellationCanvas />

          {/* Decorative floating animated blobs */}
          <div
            className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-30 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #a78bfa 0%, rgba(167,139,250,0) 70%)',
              animation: 'orbFloat1 14s ease-in-out infinite alternate',
            }}
          />
          <div
            className="absolute bottom-10 -right-20 w-80 h-80 rounded-full opacity-25 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #818cf8 0%, rgba(129,140,248,0) 70%)',
              animation: 'orbFloat2 18s ease-in-out infinite alternate',
            }}
          />
          <div
            className="absolute top-1/2 left-1/3 -translate-y-1/2 w-64 h-64 rounded-full opacity-15 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #c084fc 0%, rgba(192,132,252,0) 70%)',
              animation: 'orbFloat1 10s ease-in-out infinite alternate-reverse',
            }}
          />

          {/* Top Header Row in Left Panel */}
          <div className="relative z-10 flex items-center justify-between">
            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer select-none"
              onMouseEnter={() => setLogoHover(true)}
              onMouseLeave={() => setLogoHover(false)}
            >
              <div
                className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center transition-all duration-300"
                style={{
                  transform: logoHover ? 'scale(1.18) rotate(-8deg)' : 'scale(1) rotate(0deg)',
                  boxShadow: logoHover ? '0 0 0 6px rgba(255,255,255,0.25), 0 8px 25px rgba(255,255,255,0.35)' : 'none',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
                }}
              >
                <GraduationCap
                  size={18}
                  className="text-white"
                  style={{
                    transform: logoHover ? 'rotate(8deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                />
              </div>
              <div>
                <p
                  className="text-white font-black text-base leading-tight transition-all duration-300"
                  style={{
                    textShadow: logoHover ? '0 0 12px rgba(255,255,255,0.8)' : 'none',
                    letterSpacing: logoHover ? '0.5px' : 'normal',
                  }}
                >
                  CampusConnect
                </p>
                <p className="text-white/60 text-[11px] font-medium">University Platform</p>
              </div>
            </div>

            {/* Live Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-[11.5px] font-semibold text-white/90 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live System Online</span>
            </div>
          </div>

          {/* Stats grid & 3D Morphing Headline */}
          <div className="relative z-10 flex flex-col gap-6 my-auto py-4">
            <div className="grid grid-cols-3 gap-3">
              {STATS.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="group rounded-2xl p-4 flex flex-col items-center gap-1 text-center cursor-pointer transition-all duration-300 border border-white/10 hover:border-white/30 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.25)] select-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="p-2 rounded-xl bg-white/10 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300 mb-1">
                    <Icon size={20} className="text-white/80 group-hover:text-white group-hover:rotate-6 transition-transform duration-300" />
                  </div>
                  <p className="text-white font-black text-xl leading-none group-hover:scale-105 transition-transform duration-300">{value}</p>
                  <p className="text-white/60 group-hover:text-white/80 text-[11px] font-medium transition-colors duration-300">{label}</p>
                </div>
              ))}
            </div>

            {/* 3D Morphing Headline */}
            <div className="min-h-[130px]">
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-300" />
                Next-Gen Event Management
              </p>
              <h2 className="text-white font-black text-3xl leading-tight mb-2">
                Manage <br />
                <Morphing3DHeadline /> <br />
                Like Never Before
              </h2>
              <p className="text-white/65 text-sm leading-relaxed max-w-md">
                A complete event management platform for registrations, QR attendance,
                analytics, and certificate generation — all in one place.
              </p>
            </div>
          </div>

          {/* Bottom tags + wifi */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <span
                  key={tag}
                  className="text-[11px] font-semibold text-white/80 px-3 py-1 rounded-full cursor-pointer transition-all duration-200 border border-white/10 hover:border-white/30 hover:bg-white/25 hover:scale-105 hover:text-white hover:shadow-md select-none"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all duration-300 group">
              <Wifi size={16} className="text-white/60 group-hover:text-white group-hover:scale-110 transition-all duration-300 animate-pulse" />
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL (ULTRA-CLEAN ELEGANT WHITE FORM CARD) ── */}
        <div className="flex-1 flex items-center justify-center bg-[#fafafc] px-6 py-12 relative overflow-hidden">

          {/* Background subtle light ambient glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/60 rounded-full blur-3xl pointer-events-none opacity-70" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-50/50 rounded-full blur-3xl pointer-events-none opacity-60" />

          {/* Form Card Container */}
          <div className="w-full max-w-[430px] relative z-10 bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300 hover:shadow-[0_25px_70px_-15px_rgba(99,102,241,0.1)]">
            
            {/* Top Gradient Decorative Accent Bar */}
            <div className="h-1.5 w-full bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500" />

            <div className="p-8 sm:p-10">
              <div
                key={isSignUp ? 'signup-view' : 'signin-view'}
                style={{ animation: 'formSwapIn 0.38s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                {isSignUp ? (
                  <SignUpForm
                    onSwitchToSignIn={() => setIsSignUp(false)}
                    onSignUpSuccess={(newEmail) => {
                      setEmail(newEmail)
                      setPassword('')
                      setIsSignUp(false)
                    }}
                  />
                ) : (
                  <>
                    {/* Header */}
                    <div className="mb-8">
                      <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1.5">Welcome back</h1>
                      <p className="text-sm text-slate-500 font-medium">Sign in with your email to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                      {/* Email */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
                          Email Address
                        </label>
                        <div className="relative group">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                          <input
                            type="email"
                            placeholder="name@university.edu"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/15 transition-all duration-200 font-medium"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
                          Password
                        </label>
                        <div className="relative group">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                          <input
                            type={showPass ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/15 transition-all duration-200 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Remember + Forgot */}
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={remember}
                            onChange={e => setRemember(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 accent-indigo-600 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-slate-600 select-none">Remember me</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setForgotOpen(true)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline bg-transparent border-none p-0 cursor-pointer transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-300 cursor-pointer hover:shadow-[0_10px_25px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 active:translate-y-0 mt-2"
                        style={{
                          background: loading
                            ? '#a5b4fc'
                            : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                          boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.28)',
                        }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {loading ? (
                            <>
                              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                              Signing in…
                            </>
                          ) : (
                            <>
                              Sign In
                              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                            </>
                          )}
                        </span>
                      </button>

                      {/* Switch to Sign Up link */}
                      <p className="text-xs text-slate-500 font-medium text-center mt-3">
                        Don&apos;t have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setIsSignUp(true)}
                          className="text-indigo-600 font-bold bg-transparent border-none hover:underline cursor-pointer p-0 align-baseline"
                        >
                          Create an account
                        </button>
                      </p>

                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── FORGOT PASSWORD MODAL ── */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setForgotOpen(false)}
          />
          <div
            className="relative z-10 bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-md p-8"
            style={{ animation: 'modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <KeyRound size={20} />
              </div>
              <button
                onClick={() => setForgotOpen(false)}
                className="w-8 h-8 rounded-lg border-none bg-transparent hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1">Reset your password</h3>
            <p className="text-sm text-slate-500 mb-6">
              Enter your registered email address and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/15 transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 cursor-pointer"
                style={{
                  background: forgotLoading ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  boxShadow: forgotLoading ? 'none' : '0 4px 18px rgba(99,102,241,0.32)',
                }}
              >
                {forgotLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Sending…
                  </span>
                ) : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="text-sm text-slate-500 hover:text-slate-700 text-center transition-colors border-none bg-transparent cursor-pointer"
              >
                Back to Sign In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Keyframe animation styles */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }

        @keyframes orbFloat1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(25px, 35px) scale(1.12); }
          100% { transform: translate(-20px, -15px) scale(0.95); }
        }

        @keyframes orbFloat2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(-30px, -25px) scale(1.15); }
          100% { transform: translate(15px, 20px) scale(0.9); }
        }

        @keyframes formSwapIn {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }
      `}</style>

    </>
  )
}
