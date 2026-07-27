import React, { useState, useEffect } from 'react'
import { Trophy, Award, CheckCircle2, Star, Loader2 } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import certificatesService from '../../services/certificatesService'

/* ── Gamified Badge Tiers (From API Spec) ───────────────────────── */
const BADGE_TIERS = [
  { min: 0,    max: 99,       level: 'Level 1', badge: '🥉 Beginner Explorer',  color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  { min: 100,  max: 249,      level: 'Level 2', badge: '🥈 Bronze Achiever',    color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
  { min: 250,  max: 499,      level: 'Level 3', badge: '🥇 Silver Performer',   color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe' },
  { min: 500,  max: 999,      level: 'Level 4', badge: '⭐ Gold Champion',      color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  { min: 1000, max: Infinity, level: 'Level 5', badge: '👑 Platinum Legend', color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe' },
]

function getTier(score) {
  return BADGE_TIERS.find(t => score >= t.min && score <= t.max) || BADGE_TIERS[0]
}

export default function StudentPerformanceCard({ tokens }) {
  const { dark } = useTheme()
  const [perfData, setPerfData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    certificatesService.fetchMyPerformance()
      .then((res) => {
        if (active && res?.success && res?.data) {
          setPerfData(res.data)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const score = perfData?.performance_score ?? 40
  const tier = getTier(score)
  const nextTier = BADGE_TIERS.find(t => t.min > score)
  const nextTarget = nextTier ? nextTier.min : 1000
  const prevTarget = tier.min
  const progressPct = Math.min(100, Math.max(5, Math.round(((score - prevTarget) / Math.max(1, nextTarget - prevTarget)) * 100)))

  const totalCerts = perfData?.total_certificates ?? 11
  const totalAttended = perfData?.total_attended_events ?? 2
  const breakdown = perfData?.certificate_breakdown || { participation: 0, merit_or_winner: 0, excellence: 0 }

  const cardBg = dark ? '#0f1e30' : '#ffffff'
  const cardBorder = dark ? '#1a3050' : '#e2e8f0'
  const pillBg = dark ? '#060e1c' : '#f8fafc'

  if (loading) {
    return (
      <div
        className="rounded-3xl p-6 border flex items-center justify-center h-80"
        style={{ background: cardBg, borderColor: cardBorder }}
      >
        <Loader2 size={24} className="animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div
      className="rounded-3xl p-6 border transition-all duration-300 flex flex-col gap-5"
      style={{
        background: cardBg,
        borderColor: cardBorder,
        boxShadow: tokens?.shadow || '0 4px 20px rgba(0,0,0,0.04)',
        fontFamily: 'Manrope, sans-serif'
      }}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between">
        <div>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
            style={{
              background: dark ? '#2a1a08' : '#fdf6ee',
              color: '#c26d20',
            }}
          >
            <Trophy size={14} /> Performance Profile
          </div>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-400 mt-1.5 ml-1 m-0">
            {perfData?.performance_level || tier.level}
          </p>
        </div>

        <div className="text-4xl font-black tracking-tight" style={{ color: '#c26d20' }}>
          {score}
        </div>
      </div>

      {/* Center Badge Banner */}
      <div
        className="w-full rounded-2xl py-3 px-4 flex items-center justify-center gap-2 text-center text-sm font-extrabold shadow-xs border"
        style={{
          background: dark ? '#2a1a08' : '#fdf6ee',
          borderColor: dark ? '#4a2c0f' : '#fde68a',
          color: '#c26d20',
        }}
      >
        <span>{perfData?.badge || tier.badge}</span>
      </div>

      {/* Progress Bar & Range */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span>{score} pts</span>
          <span>Next: {nextTarget} pts</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #b07d62 0%, #615FFF 100%)',
            }}
          />
        </div>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-3 gap-3">
        {/* Certificates */}
        <div
          className="rounded-2xl border p-3.5 text-center flex flex-col items-center justify-center gap-1"
          style={{ background: pillBg, borderColor: cardBorder }}
        >
          <Award size={20} className="text-purple-500" />
          <span className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
            {totalCerts}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            Certificates
          </span>
        </div>

        {/* Events Attended */}
        <div
          className="rounded-2xl border p-3.5 text-center flex flex-col items-center justify-center gap-1"
          style={{ background: pillBg, borderColor: cardBorder }}
        >
          <CheckCircle2 size={20} className="text-emerald-500" />
          <span className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
            {totalAttended}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            Events Attended
          </span>
        </div>

        {/* Score */}
        <div
          className="rounded-2xl border p-3.5 text-center flex flex-col items-center justify-center gap-1"
          style={{ background: pillBg, borderColor: cardBorder }}
        >
          <Star size={20} className="text-amber-500" />
          <span className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
            {score}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            Score
          </span>
        </div>
      </div>

      {/* Certificate Breakdown List */}
      <div className="flex flex-col gap-2 mt-1">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 m-0">
          Certificate Breakdown
        </h4>

        {/* Participation */}
        <div
          className="rounded-2xl border px-4 py-2.5 flex items-center justify-between text-xs"
          style={{ background: pillBg, borderColor: cardBorder }}
        >
          <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Participation</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-emerald-600 text-sm">
              {breakdown.participation ?? 0}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              +50 pts/cert
            </span>
          </div>
        </div>

        {/* Merit / Winner */}
        <div
          className="rounded-2xl border px-4 py-2.5 flex items-center justify-between text-xs"
          style={{ background: pillBg, borderColor: cardBorder }}
        >
          <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Merit / Winner</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-amber-600 text-sm">
              {breakdown.merit_or_winner ?? 0}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              +100 pts/cert
            </span>
          </div>
        </div>

        {/* Excellence Award */}
        <div
          className="rounded-2xl border px-4 py-2.5 flex items-center justify-between text-xs"
          style={{ background: pillBg, borderColor: cardBorder }}
        >
          <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>Excellence Award</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-indigo-600 text-sm">
              {breakdown.excellence ?? 0}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              +150 pts/cert
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
