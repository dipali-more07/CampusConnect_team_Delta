import { useState, useEffect } from 'react'
import { User, Mail, Phone, GraduationCap, Lock, Eye, EyeOff } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import authService from '../services/authService'

export default function SignUpForm({ onSwitchToSignIn, onSignUpSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [college, setCollege] = useState('')
  const [collegeId, setCollegeId] = useState('')
  const [course, setCourse] = useState('')
  const [department, setDepartment] = useState('')
  const [gender, setGender] = useState('male')
  const [yearOfStudy, setYearOfStudy] = useState(1)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [errors, setErrors] = useState({})

  // Verification popup states
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)

  const showToast = useToast()

  // Countdown timer for resending OTP code
  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setInterval(() => {
      setResendCountdown(prev => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCountdown])

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

    // Password validation (relaxed rules, only checking minimum length)
    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.'
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
    setRegisterLoading(true)

    const payload = {
      name,
      email,
      mobile,
      college,
      collegeId,
      course,
      department,
      gender,
      yearOfStudy: parseInt(yearOfStudy, 10),
      password,
      role: 'student', // default role
    }

    try {
      const res = await authService.register(payload)
      if (res.success) {
        showToast(res.message || 'Verification code sent to your email!', 'success')
        setShowVerifyModal(true)
      } else {
        showToast(res.message || 'Registration failed.', 'error')
        if (res.message && res.message.toLowerCase().includes('email')) {
          setErrors({ email: res.message })
        }
      }
    } catch {
      showToast('Something went wrong during registration.', 'error')
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleVerifyEmail = async (e) => {
    e.preventDefault()

    setVerifyLoading(true)
    try {
      const res = await authService.verifyEmail(email, verificationCode)
      if (res.success) {
        showToast(res.message || 'Email verified successfully!', 'success')
        setShowVerifyModal(false)
        if (onSignUpSuccess) {
          onSignUpSuccess(email)
        }
      } else {
        showToast(res.message || 'Verification failed.', 'error')
      }
    } catch {
      showToast('Something went wrong during verification.', 'error')
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCountdown > 0 || resendLoading) return
    setResendLoading(true)
    try {
      const res = await authService.resendCode(email)
      if (res.success) {
        showToast(res.message || 'Verification code resent successfully!', 'success')
        setResendCountdown(60) // Start 60-second countdown
      } else {
        showToast(res.message || 'Failed to resend verification code.', 'error')
      }
    } catch {
      showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <>
      {/* Heading */}
      <h1 className="text-2xl font-black text-slate-900 mb-1">Create an account</h1>
      <p className="text-sm text-slate-500 mb-6">Join CampusConnect to explore and manage events</p>

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
                onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
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

        {/* Course & Department row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Course */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Course Name
            </label>
            <div className="relative">
              <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. B.Tech"
                value={course}
                onChange={e => setCourse(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder-slate-400
                focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Department
            </label>
            <div className="relative">
              <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. CSE"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder-slate-400
                focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
            </div>
          </div>
        </div>

        {/* College ID */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">
            College ID / Roll No
          </label>
          <div className="relative">
            <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. 21CS001"
              value={collegeId}
              onChange={e => setCollegeId(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder-slate-400
              focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>
        </div>

        {/* Gender & Year of Study */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Gender */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Gender
            </label>
            <div className="relative">
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white placeholder-slate-400
                focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition appearance-none cursor-pointer"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</span>
            </div>
          </div>

          {/* Year of Study */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Year of Study
            </label>
            <input
              type="number"
              placeholder="e.g. 1"
              value={yearOfStudy}
              onChange={e => setYearOfStudy(e.target.value)}
              required
              min="1"
              max="6"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder-slate-400
              focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
            />
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
          disabled={registerLoading}
          className="w-full py-3 rounded-lg text-sm font-bold text-white transition-all duration-200 relative overflow-hidden mt-2 cursor-pointer flex items-center justify-center gap-2"
          style={{
            background: registerLoading ? '#a5b4fc' : 'linear-gradient(90deg, #4f46e5, #6d28d9)',
            boxShadow: registerLoading ? 'none' : '0 4px 18px rgba(99,102,241,0.35)',
          }}
        >
          {registerLoading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Registering…
            </>
          ) : 'Register'}
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
              Please enter the verification code sent to your email to activate your account.
            </p>

            <form onSubmit={handleVerifyEmail} className="flex flex-col gap-5">
              {/* Autofilled Email Address */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/80 text-sm text-slate-500 font-semibold cursor-not-allowed"
                />
              </div>

              {/* Verification Code */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
                  Verification Code
                </label>
                <input
                  type="text"
                  placeholder="Enter code"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition font-semibold"
                />
              </div>

              {/* Resend Code Link */}
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="text-slate-500">Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCountdown > 0 || resendLoading}
                  className={`font-bold transition-colors cursor-pointer border-none bg-transparent outline-none p-0 ${
                    resendCountdown > 0 || resendLoading
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-indigo-600 hover:text-indigo-800 hover:underline'
                  }`}
                >
                  {resendLoading
                    ? 'Sending…'
                    : resendCountdown > 0
                    ? `Resend Code (${resendCountdown}s)`
                    : 'Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={verifyLoading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                style={{
                  background: verifyLoading ? '#a5b4fc' : 'linear-gradient(90deg,#4f46e5,#6d28d9)',
                  boxShadow: verifyLoading ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
                }}
              >
                {verifyLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Verifying…
                  </>
                ) : 'Verify Email'}
              </button>

              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="text-sm text-slate-500 hover:text-slate-700 text-center transition-colors border-none bg-transparent cursor-pointer font-bold"
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
