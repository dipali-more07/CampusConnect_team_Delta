import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck, ArrowRight } from 'lucide-react'
import authService from '../services/authService'
import { useToast } from '../context/ToastContext'

/* ── Animated constellation background ── */
function AnimatedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => {
      if (!canvas.parentElement) return
      canvas.width = canvas.parentElement.offsetWidth
      canvas.height = canvas.parentElement.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const pts = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 2 + 1,
    }))

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pts.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.55)'
        ctx.fill()
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j]
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 110) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(255,255,255,${0.18 * (1 - d / 110)})`
            ctx.lineWidth = 0.7
            ctx.stroke()
          }
        }
      })
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

/* ── Password strength checker ── */
function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e']
  const labels = ['Weak', 'Fair', 'Good', 'Strong']

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1 h-1.5">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="flex-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colors[score - 1] : '#e2e8f0' }}
          />
        ))}
      </div>
      {score > 0 && (
        <p className="text-xs font-semibold" style={{ color: colors[score - 1] }}>
          {labels[score - 1]}
        </p>
      )}
      <ul className="space-y-1 pt-1">
        {checks.map(c => (
          <li key={c.label} className="flex items-center gap-1.5 text-xs">
            {c.ok
              ? <CheckCircle2 size={12} className="text-green-500 shrink-0" />
              : <XCircle size={12} className="text-slate-300 shrink-0" />}
            <span className={c.ok ? 'text-slate-600' : 'text-slate-400'}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Main Page ── */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [countdown, setCountdown] = useState(5)

  /* Auto-redirect after success */
  useEffect(() => {
    if (!done) return
    if (countdown <= 0) {
      navigate('/login')
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [done, countdown, navigate])

  const invalidToken = !token

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error')
      return
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters.', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await authService.resetPassword(token, newPassword, confirmPassword)
      if (res.success) {
        setDone(true)
        showToast(res.message || 'Password reset successfully!', 'success')
      } else {
        showToast(res.message || 'Reset failed. Please try again.', 'error')
      }
    } catch {
      showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* ── LEFT: Branding panel ── */}
        <div
          className="hidden lg:flex flex-col justify-between w-[48%] relative overflow-hidden p-12"
          style={{ background: 'linear-gradient(145deg, #4f46e5 0%, #7c3aed 55%, #9d174d 100%)' }}
        >
          <AnimatedBackground />

          {/* decorative orbs */}
          <div
            className="absolute top-[-80px] right-[-80px] w-[340px] h-[340px] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, #fff 0%, transparent 70%)',
              animation: 'rp-orbFloat1 9s ease-in-out infinite',
            }}
          />
          <div
            className="absolute bottom-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full opacity-15"
            style={{
              background: 'radial-gradient(circle, #fff 0%, transparent 70%)',
              animation: 'rp-orbFloat2 11s ease-in-out infinite',
            }}
          />

          {/* content */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ShieldCheck size={22} className="text-white" />
              </div>
              <span className="text-white font-black text-xl tracking-tight">CampusConnect</span>
            </div>

            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Secure your<br />account again
            </h2>
            <p className="text-white/70 text-base leading-relaxed max-w-xs">
              Choose a strong new password to protect your CampusConnect account and all your event data.
            </p>

            <div className="mt-12 space-y-4">
              {[
                'Use 8+ characters with mixed case',
                'Include numbers & special symbols',
                'Never reuse old passwords',
              ].map(tip => (
                <div key={tip} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                  <p className="text-white/80 text-sm font-medium">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-white/40 text-xs">
            © {new Date().getFullYear()} CampusConnect · Secure Password Reset
          </p>
        </div>

        {/* ── RIGHT: Form panel ── */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 px-6 py-12">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              <ShieldCheck size={18} className="text-white" />
            </div>
            <span className="font-black text-slate-900 text-lg">CampusConnect</span>
          </div>

          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] border border-slate-100 p-8 md:p-10"
            style={{ animation: 'rp-cardIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}
          >

            {/* ── INVALID TOKEN ── */}
            {invalidToken && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                  <XCircle size={32} className="text-red-500" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Invalid Link</h1>
                <p className="text-sm text-slate-500 leading-relaxed mb-8">
                  This password reset link is invalid or has expired.<br />
                  Please request a new reset link from the login page.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.28)',
                  }}
                >
                  Back to Login
                </button>
              </div>
            )}

            {/* ── SUCCESS ── */}
            {!invalidToken && done && (
              <div className="text-center py-6">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    boxShadow: '0 8px 30px rgba(99,102,241,0.35)',
                    animation: 'rp-successPop 0.45s cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  <CheckCircle2 size={38} className="text-white" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Password Reset!</h1>
                <p className="text-sm text-slate-500 leading-relaxed mb-2">
                  Your password has been updated successfully.
                </p>
                <p className="text-xs text-slate-400 mb-8">
                  Redirecting to login in{' '}
                  <span className="font-bold text-indigo-600">{countdown}s</span>…
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-white cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.28)',
                  }}
                >
                  Go to Login Now
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* ── FORM ── */}
            {!invalidToken && !done && (
              <>
                <div className="mb-8">
                  <div
                    className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)' }}
                  >
                    <Lock size={22} className="text-indigo-600" />
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1.5">
                    Reset Password
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">
                    Enter your new password below to regain access.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                  {/* New Password field */}
                  <div>
                    <label
                      htmlFor="rp-new-password"
                      className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block"
                    >
                      New Password
                    </label>
                    <div className="relative group">
                      <Lock
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                      />
                      <input
                        id="rp-new-password"
                        type={showNew ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/15 transition-all duration-200 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(v => !v)}
                        tabIndex={-1}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showNew ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                    <PasswordStrength password={newPassword} />
                  </div>

                  {/* Confirm Password field */}
                  <div>
                    <label
                      htmlFor="rp-confirm-password"
                      className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block"
                    >
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <Lock
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                      />
                      <input
                        id="rp-confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        style={{
                          borderColor:
                            confirmPassword && newPassword !== confirmPassword
                              ? '#ef4444'
                              : confirmPassword && newPassword === confirmPassword
                              ? '#22c55e'
                              : undefined,
                        }}
                        className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/15 transition-all duration-200 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        tabIndex={-1}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>

                    {/* Match indicator */}
                    {confirmPassword && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {newPassword === confirmPassword ? (
                          <>
                            <CheckCircle2 size={12} className="text-green-500" />
                            <span className="text-xs text-green-600 font-semibold">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={12} className="text-red-400" />
                            <span className="text-xs text-red-500 font-semibold">Passwords do not match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    id="rp-submit-btn"
                    disabled={loading}
                    className="group relative w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-300 cursor-pointer hover:shadow-[0_10px_25px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 active:translate-y-0 mt-2"
                    style={{
                      background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
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
                          Resetting Password…
                        </>
                      ) : (
                        <>
                          Reset Password
                          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                        </>
                      )}
                    </span>
                  </button>

                  {/* Back link */}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-sm text-slate-500 hover:text-slate-700 text-center transition-colors border-none bg-transparent cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>

                </form>
              </>
            )}

          </div>
        </div>
      </div>

      {/* ── Animations ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        @keyframes rp-cardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes rp-successPop {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes rp-orbFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(25px,35px) scale(1.12); }
        }
        @keyframes rp-orbFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-30px,-25px) scale(1.15); }
        }
      `}</style>
    </>
  )
}
