import React, { useState } from 'react'
import { User, Mail, Phone, GraduationCap, Lock, Eye, EyeOff } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import authService from '../services/authService'

export default function SignUpForm({ onSwitchToSignIn, onSignUpSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [college, setCollege] = useState('')
  const [course, setCourse] = useState('B.Tech')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [errors, setErrors] = useState({})

  // Verification popup states
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [sentCode, setSentCode] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)

  const showToast = useToast()

  const handleSignUpSubmit = async (e) => {
    e.preventDefault()

    // Clear previous errors
    const newErrors = {}

    // Email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address (e.g. test@gmail.com).'
    }

    // Mobile validation
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required.'
    } else if (!/^\+?[0-9]{10,15}$/.test(mobile.replace(/[\s-]/g, ''))) {
      newErrors.mobile = 'Please enter a valid mobile number.'
    }

    // Password validation
    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.'
    } else if (!/^[a-zA-Z0-9]+$/.test(password)) {
      newErrors.password = 'Password must contain only letters and numbers (no spaces or special chars).'
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    // Generate mock 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    setSentCode(code)

    // Alert the user with the mock verification code
    showToast(`Verification code sent to ${email}! (Mock Code: ${code})`, 'success')
    setShowVerifyModal(true)
  }

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault()

    if (verificationCode !== sentCode) {
      showToast('Incorrect verification code. Please try again.', 'error')
      return
    }

    setVerifyLoading(true)
    try {
      const payload = {
        name,
        email,
        mobile,
        college,
        course,
        password,
        role: 'student', // default role
      }

      const res = await authService.register(payload)
      if (res.success) {
        showToast(res.message || 'Registration successful!', 'success')
        setShowVerifyModal(false)
        if (onSignUpSuccess) {
          onSignUpSuccess(email)
        }
      } else {
        showToast(res.message || 'Registration failed.', 'error')
        if (res.message && res.message.toLowerCase().includes('email')) {
          setErrors({ email: res.message })
          setShowVerifyModal(false)
        }
      }
    } catch (err) {
      showToast('Something went wrong during registration.', 'error')
    } finally {
      setVerifyLoading(false)
    }
  }

  return (
    <>
      {/* Heading */}
      <h1 className="text-2xl font-black text-slate-900 mb-1">Create an account</h1>
      <p className="text-sm text-slate-500 mb-6">Join EventHub to explore and manage events</p>

      <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-4">
        {/* Full Name */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">
            Full Name
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder-slate-400
              focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">
            Email Address
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              placeholder="yourname@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm text-slate-700 placeholder-slate-400
              focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition ${errors.email ? 'border-red-500 bg-red-50/50' : 'border-slate-200'
                }`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.email}</p>
          )}
        </div>

        {/* Mobile & College row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Mobile */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Mobile Number
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="9876543210"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                required
                className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm text-slate-700 placeholder-slate-400
                focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition ${errors.mobile ? 'border-red-500 bg-red-50/50' : 'border-slate-200'
                  }`}
              />
            </div>
            {errors.mobile && (
              <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.mobile}</p>
            )}
          </div>

          {/* College */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              College Name
            </label>
            <div className="relative">
              <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="IIT Bombay"
                value={college}
                onChange={e => setCollege(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder-slate-400
                focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
            </div>
          </div>
        </div>

        {/* Course Dropdown */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">
            Select Course
          </label>
          <div className="relative">
            <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={course}
              onChange={e => setCourse(e.target.value)}
              required
              className="w-full pl-10 pr-8 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white
              focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer appearance-none"
            >
              <option value="B.Tech">B.Tech</option>
              <option value="M.Tech">M.Tech</option>
              <option value="BCA">BCA</option>
              <option value="MCA">MCA</option>
              <option value="MBA">MBA</option>
              <option value="B.Sc">B.Sc</option>
              <option value="M.Sc">M.Sc</option>
              <option value="BBA">BBA</option>
              <option value="B.Com">B.Com</option>
            </select>
            {/* Custom arrow */}
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-[10px]">▼</div>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">
            Password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className={`w-full pl-10 pr-10 py-2 rounded-lg border text-sm text-slate-700 placeholder-slate-400
              focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition ${errors.password ? 'border-red-500 bg-red-50/50' : 'border-slate-200'
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">
            Confirm Password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showConfirmPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className={`w-full pl-10 pr-10 py-2 rounded-lg border text-sm text-slate-700 placeholder-slate-400
              focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition ${errors.confirmPassword ? 'border-red-500 bg-red-50/50' : 'border-slate-200'
                }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 rounded-lg text-sm font-bold text-white transition-all duration-200 relative overflow-hidden mt-2 cursor-pointer"
          style={{
            background: 'linear-gradient(90deg, #4f46e5, #6d28d9)',
            boxShadow: '0 4px 18px rgba(99,102,241,0.35)',
          }}
        >
          Register
        </button>

        {/* Switch link */}
        <p className="text-sm text-slate-500 text-center mt-2">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-indigo-600 font-semibold bg-transparent border-none hover:underline cursor-pointer p-0 align-baseline animate-fadeIn"
          >
            Sign In
          </button>
        </p>
      </form>

      {/* ── EMAIL VERIFICATION MODAL ── */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-xs"
            onClick={() => setShowVerifyModal(false)}
          />

          {/* Modal Container */}
          <div
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8"
            style={{
              animation: 'modalIn .25s ease-out',
              border: '1px solid #e2e8f0'
            }}
          >
            <h2 className="text-xl font-black text-slate-900 mb-2">Verify your email</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              We have sent a verification code to <strong>{email}</strong>. Please enter the code below to verify your email.
            </p>

            <form onSubmit={handleVerifyAndRegister} className="flex flex-col gap-4">
              <input
                type="text"
                maxLength="6"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                required
                autoFocus
                className="w-full text-center tracking-widest text-lg font-bold py-2.5 rounded-lg border border-slate-200 text-slate-700 placeholder-slate-400 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
              />

              <button
                type="submit"
                disabled={verifyLoading}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all duration-200 cursor-pointer"
                style={{
                  background: verifyLoading ? '#a5b4fc' : 'linear-gradient(90deg,#4f46e5,#6d28d9)',
                  boxShadow: verifyLoading ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
                }}
              >
                {verifyLoading ? 'Verifying & Registering…' : 'Verify & Register'}
              </button>

              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="text-sm text-slate-500 hover:text-slate-700 text-center transition-colors border-none bg-transparent cursor-pointer"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Keyframe styles */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </>
  )
}
