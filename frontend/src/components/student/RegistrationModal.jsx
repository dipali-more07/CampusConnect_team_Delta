import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Users, User, CheckCircle2, Loader2,
  Plus, Trash2, IndianRupee, Ticket, AlertCircle, Mail,
  Clock, CreditCard
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import studentService from '../../services/studentService'

const STEPS = { FORM: 'form', PAYMENT_PROMPT: 'payment_prompt', SUCCESS: 'success' }

export default function RegistrationModal({ event, onClose, onSuccess }) {
  const { dark, accentColor } = useTheme()
  const BRAND = accentColor || '#615FFF'

  // participation_type: "individual" | "team" | "both"
  const rawMode = (event.mode || 'Solo').toLowerCase()
  const defaultType = rawMode === 'team' ? 'team' : 'individual'
  const [regType, setRegType] = useState(defaultType)

  const [step, setStep] = useState(STEPS.FORM)
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [createdRegId, setCreatedRegId] = useState(null)
  const [error, setError] = useState('')

  // Team fields
  const [teamName, setTeamName] = useState('')
  const [memberEmails, setMemberEmails] = useState([''])

  /* ── Styles ── */
  const card = dark ? '#0c1829' : '#ffffff'
  const border = dark ? '#1a3050' : '#e2e8f0'
  const txt = dark ? '#e8f0fe' : '#0f172a'
  const txtSec = dark ? '#7a98bb' : '#64748b'
  const inputBg = dark ? '#060e1c' : '#f8fafc'
  const inputStyle = {
    background: inputBg, border: `1px solid ${border}`, color: txt,
    borderRadius: 10, padding: '9px 12px', fontSize: 13, width: '100%',
    outline: 'none', fontFamily: 'Manrope, sans-serif', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: 11, fontWeight: 700, color: txtSec, display: 'block', marginBottom: 4 }

  /* ── Team member email helpers ── */
  const addEmailField = () => setMemberEmails(prev => [...prev, ''])
  const removeEmailField = (i) => setMemberEmails(prev => prev.filter((_, idx) => idx !== i))
  const updateEmail = (i, val) => setMemberEmails(prev => prev.map((e, idx) => idx === i ? val : e))

  /* ── Validation ── */
  function validateTeam() {
    if (!teamName.trim()) return 'Team name is required.'
    const validEmails = memberEmails.filter(e => e.trim())
    if (validEmails.length === 0) return 'Add at least one teammate email.'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    for (const em of validEmails) {
      if (!emailRegex.test(em.trim())) return `"${em.trim()}" is not a valid email address.`
    }
    return null
  }

  /* ── Helper to load Razorpay Script dynamically ── */
  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  /* ── Submit Registration ── */
  async function submitRegistration() {
    setError('')
    if (regType === 'team') {
      const err = validateTeam()
      if (err) { setError(err); return }
    }

    setLoading(true)
    const payload = {
      registration_type: regType,
      ...(regType === 'team' ? {
        team_name: teamName.trim(),
        team_members: memberEmails.map(e => e.trim()).filter(Boolean),
      } : {}),
    }

    const res = await studentService.registerEvent(event.id, payload)

    setLoading(false)
    if (!res.success) {
      setError(res.message || 'Registration failed. Please try again.')
      return
    }

    const regId = res.data?.id || res.data?.registration_id || `REG_${Date.now()}`
    setCreatedRegId(regId)

    // If event has fees > 0, store pending payment and open Payment Window
    if (event.fees > 0) {
      try {
        const storedPending = JSON.parse(sessionStorage.getItem('cc_student_pending_payments') || '[]')
        const newPayment = {
          id: regId,
          transaction_id: `TXN_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          event_id: event.id,
          event_name: event.title,
          amount: event.fees,
          payment_method: 'Pending',
          payment_status: 'Pending',
          created_at: new Date().toISOString()
        }
        const updatedPending = [newPayment, ...storedPending.filter(p => p.event_id !== event.id)]
        sessionStorage.setItem('cc_student_pending_payments', JSON.stringify(updatedPending))
      } catch (err) {}

      // Transition to Payment Prompt Window
      setStep(STEPS.PAYMENT_PROMPT)
    } else {
      setStep(STEPS.SUCCESS)
      setTimeout(() => { onSuccess(event.id) }, 2000)
    }
  }

  /* ── Handle Pay Later ── */
  function handlePayLater() {
    setStep(STEPS.SUCCESS)
    setTimeout(() => { onSuccess(event.id) }, 1500)
  }

  /* ── Handle Pay Now ── */
  async function handlePayNow() {
    setError('')
    setPaymentLoading(true)

    const regId = createdRegId || event.id

    const paymentRes = await studentService.initiatePayment(regId)
    if (!paymentRes.success) {
      setPaymentLoading(false)
      setError(paymentRes.message || 'Failed to initiate payment.')
      return
    }

    const { payment_id, transaction_id, amount } = paymentRes.data || {}
    const isMockPayment = !transaction_id || transaction_id.startsWith('order_mock')

    if (isMockPayment) {
      const confirmRes = await studentService.confirmPayment(payment_id || regId, {
        razorpay_payment_id: `pay_mock_${Math.random().toString(36).substr(2, 9)}`,
        razorpay_order_id: transaction_id || `order_mock_${Math.random().toString(36).substr(2, 9)}`,
        razorpay_signature: `sig_mock_${Math.random().toString(36).substr(2, 9)}`
      })
      setPaymentLoading(false)
      if (confirmRes.success) {
        try {
          const stored = JSON.parse(sessionStorage.getItem('cc_student_pending_payments') || '[]')
          const updated = stored.map(item => (item.id === regId || item.event_id === event.id) ? { ...item, payment_status: 'Success', status: 'Success', payment_method: 'UPI' } : item)
          sessionStorage.setItem('cc_student_pending_payments', JSON.stringify(updated))
        } catch (e) {}

        setStep(STEPS.SUCCESS)
        setTimeout(() => { onSuccess(event.id) }, 1500)
      } else {
        setError(confirmRes.message || 'Payment verification failed.')
      }
    } else {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        setPaymentLoading(false)
        setError('Razorpay SDK failed to load.')
        return
      }

      let userEmail = '', userPhone = '', userName = ''
      try {
        const profileRes = await studentService.fetchProfile()
        if (profileRes.success) {
          userEmail = profileRes.data?.email || ''
          userPhone = profileRes.data?.phone || ''
          userName = profileRes.data?.full_name || ''
        }
      } catch (e) {}

      try {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: Math.round((amount || event.fees) * 100),
          currency: 'INR',
          name: 'CampusConnect',
          description: `Payment for ${event.title}`,
          order_id: transaction_id,
          handler: async function (response) {
            setPaymentLoading(true)
            const confirmRes = await studentService.confirmPayment(payment_id, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            })
            setPaymentLoading(false)
            if (confirmRes.success) {
              try {
                const stored = JSON.parse(sessionStorage.getItem('cc_student_pending_payments') || '[]')
                const updated = stored.map(item => (item.id === regId || item.event_id === event.id) ? { ...item, payment_status: 'Success', status: 'Success', payment_method: 'UPI' } : item)
                sessionStorage.setItem('cc_student_pending_payments', JSON.stringify(updated))
              } catch (e) {}

              setStep(STEPS.SUCCESS)
              setTimeout(() => { onSuccess(event.id) }, 1500)
            } else {
              setError(confirmRes.message || 'Payment verification failed.')
            }
          },
          modal: {
            ondismiss: async function () {
              setPaymentLoading(false)
              setError('Payment cancelled by user. Payment status remains Pending.')
            }
          },
          prefill: { name: userName, email: userEmail, contact: userPhone },
          theme: { color: BRAND }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
        setPaymentLoading(false)
      } catch (err) {
        setPaymentLoading(false)
        setError('Failed to open Razorpay Checkout: ' + err.message)
      }
    }
  }

  const minMembers = (event.minTeamSize || 2) - 1  // excluding leader
  const maxMembers = (event.maxTeamSize || 5) - 1

  const modal = (
    <div className="fixed inset-0 z-999 flex items-center justify-center px-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col"
        style={{ background: card, border: `1px solid ${border}`, animation: 'regModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* Gradient top bar */}
        <div className="h-1 w-full shrink-0 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${BRAND}, #a855f7)` }} />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: `${BRAND}18`, color: BRAND }}>
                {event.category}
              </span>
              {event.fees > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 flex items-center gap-1">
                  <IndianRupee size={9} /> {event.fees}
                </span>
              )}
            </div>
            <h2 className="text-[17px] font-black m-0" style={{ color: txt }}>{event.title}</h2>
            <p className="text-[12px] mt-0.5 m-0" style={{ color: txtSec }}>{event.date} · {event.venue}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg border-none cursor-pointer transition-all hover:bg-red-500/10"
            style={{ background: 'transparent', color: txtSec }}>
            <X size={18} />
          </button>
        </div>

        {/* ── STEP: PAYMENT PROMPT (Window after registration) ── */}
        {step === STEPS.PAYMENT_PROMPT && (
          <div className="px-6 py-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xs">
              <CheckCircle2 size={30} />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2">
                <Clock size={12} /> Payment Status: Pending
              </span>
              <h3 className="text-lg font-black m-0" style={{ color: txt }}>
                Registered Successfully!
              </h3>
              <p className="text-xs mt-1.5 m-0" style={{ color: txtSec }}>
                You are registered for <strong>{event.title}</strong>. Fee for this event is <strong>₹{event.fees}</strong>.
              </p>
            </div>

            <div className="w-full p-4 rounded-2xl border flex items-center justify-between"
              style={{ background: inputBg, borderColor: border }}>
              <div className="text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: txtSec }}>Total Registration Fee</span>
                <span className="text-xl font-black" style={{ color: txt }}>₹{event.fees}</span>
              </div>
              <span className="text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                Pending Payment
              </span>
            </div>

            {error && (
              <div className="w-full flex items-start gap-2 text-[12px] font-semibold text-red-400 px-3 py-2.5 rounded-xl text-left"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={14} className="shrink-0 mt-0.5" /> <span>{error}</span>
              </div>
            )}

            <div className="w-full flex gap-3 pt-2">
              <button
                onClick={handlePayLater}
                disabled={paymentLoading}
                className="flex-1 py-3 rounded-xl text-xs font-bold border cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                style={{ background: 'transparent', color: txtSec, borderColor: border }}
              >
                Pay Later
              </button>
              <button
                onClick={handlePayNow}
                disabled={paymentLoading}
                className="flex-1 py-3 rounded-xl text-xs font-bold text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-md"
                style={{ background: BRAND, opacity: paymentLoading ? 0.7 : 1 }}
              >
                {paymentLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <CreditCard size={14} /> Pay Now (₹{event.fees})
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: SUCCESS ── */}
        {step === STEPS.SUCCESS && (
          <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <CheckCircle2 size={32} color="#22c55e" />
            </div>
            <h3 className="text-[20px] font-black m-0" style={{ color: txt }}>Registered!</h3>
            <p className="text-[13px] text-center m-0" style={{ color: txtSec }}>
              You are now registered for <strong>{event.title}</strong>.
              {regType === 'team' && <><br />Team <strong>{teamName}</strong> has been enrolled.</>}
            </p>
            {event.fees > 0 && (
              <div className="text-[12px] font-bold text-amber-500 bg-amber-500/10 px-3.5 py-1.5 rounded-xl text-center border border-amber-500/20">
                Payment of ₹{event.fees} can be completed later from your Payments page.
              </div>
            )}
            <div className="text-[11px] mt-2 font-semibold" style={{ color: txtSec }}>Closing automatically…</div>
          </div>
        )}

        {/* ── STEP: FORM ── */}
        {step === STEPS.FORM && (
          <div className="px-6 py-5 flex flex-col gap-4">
            {event.description && (
              <p className="text-[12px] leading-relaxed m-0 p-3 rounded-xl" style={{ background: `${BRAND}0d`, color: txtSec }}>
                {event.description}
              </p>
            )}

            {/* ── Type picker for Both events ── */}
            {event.mode === 'Both' && (
              <div>
                <label style={labelStyle}>Participation Type</label>
                <div className="flex gap-2">
                  {[{ val: 'individual', label: 'Individual', Icon: User }, { val: 'team', label: 'Team', Icon: Users }].map(({ val, label, Icon }) => (
                    <button key={val} onClick={() => setRegType(val)}
                      className="flex-1 py-2.5 rounded-xl text-[12px] font-bold border cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                      style={{
                        background: regType === val ? BRAND : 'transparent',
                        color: regType === val ? '#fff' : txtSec,
                        borderColor: regType === val ? BRAND : border,
                      }}>
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Individual: simple confirm view ── */}
            {regType === 'individual' && (
              <div className="flex flex-col items-center gap-3 py-4 px-4 rounded-2xl"
                style={{ background: `${BRAND}0a`, border: `1px solid ${BRAND}25` }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: `${BRAND}20` }}>
                  <User size={22} style={{ color: BRAND }} />
                </div>
                <div className="text-center">
                  <div className="text-[14px] font-black" style={{ color: txt }}>Individual Registration</div>
                  <div className="text-[12px] mt-1" style={{ color: txtSec }}>
                    You will be registered using your logged-in account.
                  </div>
                </div>
                {event.fees > 0 && (
                  <div className="flex items-center gap-1.5 text-[13px] font-black px-4 py-2 rounded-xl"
                    style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                    <IndianRupee size={14} /> Registration Fee: ₹{event.fees}
                  </div>
                )}
              </div>
            )}

            {/* ── Team Form ── */}
            {regType === 'team' && (
              <div className="flex flex-col gap-4">
                {/* Team Name */}
                <div>
                  <label style={labelStyle}>Team Name *</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. Delta Coders"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                  />
                </div>

                {/* Info banner */}
                <div className="text-[11px] font-semibold px-3 py-2.5 rounded-xl flex items-center gap-2"
                  style={{ background: `${BRAND}12`, color: BRAND, border: `1px solid ${BRAND}25` }}>
                  <Users size={13} />
                  <span>
                    Add {minMembers}–{maxMembers} teammate email(s). Your own email will be added as Team Leader automatically.
                  </span>
                </div>

                {/* Email inputs */}
                <div className="flex flex-col gap-2">
                  <label style={labelStyle}>Teammate Emails *</label>
                  {memberEmails.map((email, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: txtSec }} />
                        <input
                          type="email"
                          style={{ ...inputStyle, paddingLeft: 34 }}
                          placeholder={`teammate${i + 1}@college.edu`}
                          value={email}
                          onChange={e => updateEmail(i, e.target.value)}
                        />
                      </div>
                      {memberEmails.length > 1 && (
                        <button
                          onClick={() => removeEmailField(i)}
                          className="p-2 rounded-lg border-none cursor-pointer text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                          style={{ background: 'transparent' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}

                  {memberEmails.length < maxMembers && (
                    <button
                      onClick={addEmailField}
                      className="flex items-center gap-1.5 text-[12px] font-bold py-2 px-4 rounded-xl border border-dashed cursor-pointer transition-all hover:opacity-80 mt-1"
                      style={{ background: 'transparent', borderColor: BRAND, color: BRAND }}
                    >
                      <Plus size={13} /> Add Another Teammate
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Error Box */}
            {error && (
              <div className="flex items-start gap-2 text-[12px] font-semibold text-red-400 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={14} className="shrink-0 mt-0.5" /> <span>{error}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border cursor-pointer transition-all hover:opacity-80"
                style={{ background: 'transparent', color: txtSec, borderColor: border }}>
                Cancel
              </button>
              <button
                onClick={submitRegistration}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border-none cursor-pointer text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                style={{ background: BRAND, opacity: loading ? 0.7 : 1 }}
              >
                {loading
                  ? <Loader2 size={14} className="animate-spin" />
                  : regType === 'team'
                    ? <><Users size={14} /> Register Team</>
                    : <><Ticket size={14} /> Register Now</>
                }
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes regModalIn {
            from { opacity: 0; transform: scale(0.92) translateY(16px); }
            to   { opacity: 1; transform: scale(1)    translateY(0); }
          }
        `}</style>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
