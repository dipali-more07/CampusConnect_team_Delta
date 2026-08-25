import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Send, Loader2, Calendar, ChevronRight, User, Trash2,
  X, Award, Zap, ExternalLink, Mic, Volume2, VolumeX,
  Sparkles, Square, RotateCcw
} from 'lucide-react'
import aiService from '../../services/aiService'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import EmoBotCharacter from './EmoBotCharacter'

/* ── Helper to find the best Indian Female Voice matching the sample audio ── */
export function getNaturalHumanVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null

  const voices = window.speechSynthesis.getVoices() || []
  if (!voices.length) return null

  const maleExclude = /david|mark|george|rishi|deepak|ravindra|male|guy|stefan|pavel|christopher|eric|brian|ryan|heami|claude/i
  const naturalRegex = /natural|neural|online/i

  // 1. Top Match: Microsoft Swara Online (Natural) - Hindi (India) (Exact match to sample audio)
  const swaraVoice = voices.find(v =>
    /swara/i.test(v.name) &&
    !maleExclude.test(v.name)
  )
  if (swaraVoice) return swaraVoice

  // 2. Top Match: Google हिन्दी (hi-IN) - Chrome High Quality Indian Female
  const googleHindi = voices.find(v =>
    /google/i.test(v.name) &&
    (/hi-IN|hi|hindi|हिन्दी/i.test(v.lang) || /hindi|हिन्दी/i.test(v.name)) &&
    !maleExclude.test(v.name)
  )
  if (googleHindi) return googleHindi

  // 3. Top Match: Microsoft Neerja Online (Natural) - Indian English
  const neerjaVoice = voices.find(v =>
    /neerja/i.test(v.name) &&
    !maleExclude.test(v.name)
  )
  if (neerjaVoice) return neerjaVoice

  // 4. Any Natural Indian Female Voice (hi-IN or en-IN with natural tag)
  const indianNatural = voices.find(v =>
    naturalRegex.test(v.name) &&
    (/en-IN|hi-IN|hi/i.test(v.lang) || /swara|neerja|heera|veena/i.test(v.name)) &&
    !maleExclude.test(v.name)
  )
  if (indianNatural) return indianNatural

  // 5. Any Indian English / Hindi Female Voice (Heera, Veena, Google Indian English)
  const anyIndianFemale = voices.find(v =>
    (/en-IN|hi-IN|hi/i.test(v.lang) || /heera|veena/i.test(v.name)) &&
    !maleExclude.test(v.name)
  )
  if (anyIndianFemale) return anyIndianFemale

  // 6. Natural Female (Jenny, Aria, Google Female)
  const naturalFemale = voices.find(v =>
    naturalRegex.test(v.name) &&
    /jenny|aria|libby|natasha|sonia/i.test(v.name) &&
    !maleExclude.test(v.name)
  )
  if (naturalFemale) return naturalFemale

  // 7. General English Female
  const generalFemale = voices.find(v =>
    !/zira/i.test(v.name) &&
    !maleExclude.test(v.name) &&
    /^en(-|_)/i.test(v.lang)
  )
  if (generalFemale) return generalFemale

  // 8. Fallback
  return voices.find(v => /^en(-|_)/i.test(v.lang)) || voices[0]
}

/* ── Sentiment Analyzer for Camy's Dynamic EMO Expressions ── */
function analyzeSentiment(text) {
  if (!text) return null
  const lower = text.toLowerCase()
  if (lower.includes('sorry') || lower.includes('error') || lower.includes('failed') || lower.includes('issue') || lower.includes('sad') || lower.includes('no events') || lower.includes('unable') || lower.includes('apologies') || lower.includes('problem') || lower.includes('⚠️')) {
    return 'sad'
  }
  if (lower.includes('congratulations') || lower.includes('awesome') || lower.includes('great') || lower.includes('hackathon') || lower.includes('certificate') || lower.includes('badge') || lower.includes('winner') || lower.includes('yay') || lower.includes('reward')) {
    return 'excited'
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('welcome') || lower.includes('recommend') || lower.includes('sure') || lower.includes('happy') || lower.includes('help')) {
    return 'happy'
  }
  return null
}

/* ── Lightweight Markdown Renderer ── */
function MarkdownRenderer({ content, onNavigate }) {
  if (!content) return null
  const lines = content.split('\n')

  const renderLinks = (text) => {
    const parts = []
    let lastIdx = 0
    // Simple non-backtracking markdown link regex
    const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let m
    while ((m = mdLinkRegex.exec(text)) !== null) {
      if (m.index > lastIdx) parts.push(renderBold(text.substring(lastIdx, m.index)))
      const label = m[1]
      const url = m[2]
      if (url.startsWith('/events/')) {
        parts.push(
          <button type="button" key={`link-${m.index}-${url}`} onClick={() => onNavigate(url)} className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 cursor-pointer bg-cyan-500/10 px-1.5 py-0.5 rounded text-xs transition-colors">
            <span>{label}</span><ExternalLink size={10} />
          </button>
        )
      } else {
        parts.push(
          <a key={`ext-${m.index}-${url}`} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-400 hover:underline font-medium">
            {label}<ExternalLink size={10} />
          </a>
        )
      }
      lastIdx = mdLinkRegex.lastIndex
    }
    if (lastIdx < text.length) parts.push(renderBold(text.substring(lastIdx)))
    return parts.length > 0 ? parts : renderBold(text)
  }

  const renderBold = (str) => str.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={`bold-${i}-${p.slice(2, 8)}`} className="font-bold text-current">{p.slice(2, -2)}</strong> : p
  )

  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed break-words">
      {lines.map((line, idx) => {
        const t = line.trim()
        const lineKey = `line-${idx}-${t.slice(0, 10)}`
        if (t.startsWith('- ') || t.startsWith('* ')) {
          return <div key={lineKey} className="flex items-start gap-2 pl-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 mt-[7px] shrink-0" /><div className="flex-1">{renderLinks(t.slice(2))}</div></div>
        }
        if (/^\d+\.\s/.test(t)) {
          const nm = t.match(/^(\d+)\.\s(.*)/)
          return <div key={lineKey} className="flex items-start gap-2 pl-1"><span className="font-bold text-cyan-400 shrink-0 text-xs mt-0.5">{nm[1]}.</span><div className="flex-1">{renderLinks(nm[2])}</div></div>
        }
        if (!t) return <div key={lineKey} className="h-1" />
        return <p key={lineKey} className="m-0">{renderLinks(line)}</p>
      })}
    </div>
  )
}

/* ── Sound Wave Visualizer ── */
function SoundWaveIndicator() {
  return (
    <div className="flex items-center gap-[3.5px] h-5 px-1">
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <div
          key={`wave-bar-${i}`}
          className="w-[3px] rounded-full bg-gradient-to-t from-cyan-400 via-teal-300 to-emerald-300 shadow-[0_0_8px_#22d3ee]"
          style={{
            animation: `soundWave 0.55s ease-in-out infinite ${i * 0.08}s`,
            height: '100%',
          }}
        />
      ))}
    </div>
  )
}

/* ── Typewriter Text Component ── */
function TypewriterText({ text, speed = 20, onComplete, onNavigate, forceStop }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)
  const displayedRef = useRef('')
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (forceStop && !done) {
      setDone(true)
      onCompleteRef.current?.(displayedRef.current)
    }
  }, [forceStop, done])

  useEffect(() => {
    if (done) return

    const interval = setInterval(() => {
      indexRef.current += 1
      if (indexRef.current >= text.length) {
        setDisplayed(text)
        displayedRef.current = text
        setDone(true)
        clearInterval(interval)
        onCompleteRef.current?.(text)
      } else {
        const nextStr = text.slice(0, indexRef.current)
        setDisplayed(nextStr)
        displayedRef.current = nextStr
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed, done])

  if (done) {
    return <MarkdownRenderer content={displayed} onNavigate={onNavigate} />
  }

  return (
    <div className="space-y-1 text-[13px] leading-relaxed break-words">
      <span>{displayed}</span>
      <span className="inline-block w-[2px] h-[14px] bg-cyan-400 ml-0.5 animate-pulse align-middle" />
    </div>
  )
}

/* ── Header Sub-Component ── */
function WidgetHeader({
  dark,
  loading,
  isSpeaking,
  isListening,
  isCelebrating,
  currentMood,
  currentBadge,
  voiceEnabled,
  setVoiceEnabled,
  stopSpeaking,
  handleClearChat,
  hasCustomPos,
  onResetPos,
  onClose
}) {
  return (
    <div className={`relative flex flex-col shrink-0 ${dark
      ? 'bg-gradient-to-r from-[#0c1829] via-[#0e1f3a] to-[#0c1829] border-b border-cyan-900/30'
      : 'bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200'
      }`}>
      {/* Mobile Top Indicator Bar */}
      <div className="w-8 h-1 rounded-full bg-slate-300 dark:bg-slate-700/80 mx-auto mt-1.5 mb-0.5 sm:hidden" />

      <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2.5 sm:gap-3 z-10">
          <div className="shrink-0">
            <EmoBotCharacter
              size={38}
              isTyping={loading}
              isSpeaking={isSpeaking}
              isListening={isListening}
              isCelebrating={isCelebrating}
              mood={currentMood}
              onClick={() => { }}
            />
          </div>
          <div>
            <h3 className={`font-extrabold text-[14px] sm:text-[15px] tracking-tight m-0 flex items-center gap-1.5 ${dark ? 'text-slate-100' : 'text-slate-800'}`}>
              Camy AI
              {isListening && <span className="text-[9px] sm:text-[10px] font-semibold text-red-400 animate-pulse ml-1">🎙️ Recording</span>}
              {isSpeaking && !isListening && <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-400 ml-1">Speaking...</span>}
              {isCelebrating && <span className="text-[9px] sm:text-[10px] font-semibold text-amber-400 animate-bounce ml-1">🎉 Celebrating!</span>}
              {!isSpeaking && !isListening && !isCelebrating && <Sparkles className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />}
            </h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold mt-0.5 ${dark ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/50' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
              }`}>
              <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {currentBadge}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 z-10">
          {isSpeaking ? (
            <button type="button" onClick={stopSpeaking} title="Stop Voice (Pause Audio)" className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-red-500/20 hover:text-red-400 border border-emerald-400/40 text-[11px] sm:text-xs font-bold transition-all cursor-pointer animate-pulse">
              <Square className="w-3 h-3 fill-emerald-300" />
              <span>Stop</span>
            </button>
          ) : (
            <button type="button" onClick={() => setVoiceEnabled(!voiceEnabled)} title={voiceEnabled ? 'Mute AI Voice' : 'Enable AI Voice'} className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${voiceEnabled ? (dark ? 'text-cyan-400 bg-cyan-950/50' : 'text-cyan-600 bg-cyan-50') : (dark ? 'text-slate-400 hover:text-cyan-300 hover:bg-white/5' : 'text-slate-400 hover:text-cyan-600 hover:bg-slate-100')}`}>
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          )}
          {hasCustomPos && (
            <button
              type="button"
              onClick={onResetPos}
              title="Reset Bot Position to Default Corner"
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${dark
                  ? 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'
                  : 'text-slate-400 hover:text-cyan-600 hover:bg-slate-100'
                }`}
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
          <button type="button" onClick={handleClearChat} title="Clear Chat" className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${dark ? 'text-slate-400 hover:text-red-400 hover:bg-white/5' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'}`}>
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button type="button" onClick={onClose} title="Close" className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${dark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}>
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN CAMPUSBOT WIDGET (CAMY AI) — REAL-TIME USER ACTION REACTIONS
   ═══════════════════════════════════════════════════════════════ */
export default function CampusBotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([{
    role: 'assistant',
    reply: '👋 **Namaste! I\'m Camy** — your EMO AI campus buddy!\n\nI can help you with:\n- 🎓 Event recommendations for your course\n- 📜 Certificates & achievements\n- ✍️ Draft event descriptions (Organizers)\n- 🛡️ Platform insights (Admins)\n\nAsk me anything in voice or text!',
    timestamp: new Date(),
    typed: true,
  }])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickChips, setQuickChips] = useState([])
  const [userBadge, setUserBadge] = useState(null)
  const [currentMood, setCurrentMood] = useState(null)
  const [isWaving, setIsWaving] = useState(false)

  const showToast = useToast()
  const [isCelebrating, setIsCelebrating] = useState(false)

  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  // ── Drag & Drop for Floating Bot Avatar ──
  const [botPos, setBotPos] = useState(() => {
    try {
      const saved = localStorage.getItem('cc_bot_avatar_pos')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed
        }
      }
    } catch { }
    return null
  })

  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, width: 0, height: 0 })
  const hasDraggedRef = useRef(false)
  const avatarElemRef = useRef(null)

  const handleAvatarPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return

    const elem = avatarElemRef.current
    if (!elem) return

    const rect = elem.getBoundingClientRect()
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
      width: rect.width,
      height: rect.height
    }
    isDraggingRef.current = true
    hasDraggedRef.current = false

    const handlePointerMove = (moveEvent) => {
      if (!isDraggingRef.current) return
      const dx = moveEvent.clientX - dragStartRef.current.startX
      const dy = moveEvent.clientY - dragStartRef.current.startY

      if (!hasDraggedRef.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        hasDraggedRef.current = true
      }

      if (hasDraggedRef.current) {
        let newX = dragStartRef.current.origX + dx
        let newY = dragStartRef.current.origY + dy

        const maxW = window.innerWidth
        const maxH = window.innerHeight
        const w = dragStartRef.current.width || 64
        const h = dragStartRef.current.height || 64

        newX = Math.max(8, Math.min(newX, maxW - w - 8))
        newY = Math.max(8, Math.min(newY, maxH - h - 8))

        setBotPos({ x: newX, y: newY })
      }
    }

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        if (hasDraggedRef.current) {
          setBotPos(curr => {
            if (curr) {
              try { localStorage.setItem('cc_bot_avatar_pos', JSON.stringify(curr)) } catch { }
            }
            return curr
          })
        }
      }
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  const resetBotPosition = (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    setBotPos(null)
    try {
      localStorage.removeItem('cc_bot_avatar_pos')
    } catch { }
  }

  const getWidgetPosition = (pos) => {
    if (!pos || typeof window === 'undefined') return null

    const isMobile = window.innerWidth < 640
    const widgetW = isMobile ? Math.min(window.innerWidth - 24, 400) : 400
    const widgetH = isMobile ? Math.min(window.innerHeight * 0.76, 520) : Math.min(window.innerHeight * 0.82, 580)
    const botSize = isMobile ? 56 : 64
    const pad = 10

    let left = pos.x
    let top = pos.y

    // Horizontal: If on right half of screen, align right edge of widget to bot
    if (pos.x + botSize / 2 > window.innerWidth / 2) {
      left = pos.x + botSize - widgetW
    } else {
      left = pos.x
    }

    // Vertical: If in lower half of screen, open above bot
    if (pos.y + botSize / 2 > window.innerHeight / 2) {
      top = pos.y - widgetH - pad
      if (top < 8) {
        top = Math.max(8, pos.y + botSize + pad)
      }
    } else {
      // If in upper half of screen, open below bot
      top = pos.y + botSize + pad
      if (top + widgetH > window.innerHeight - 8) {
        top = Math.max(8, pos.y - widgetH - pad)
      }
    }

    // Clamp within viewport
    left = Math.max(8, Math.min(left, window.innerWidth - widgetW - 8))
    top = Math.max(8, Math.min(top, window.innerHeight - widgetH - 8))

    return { left, top }
  }

  const [globalForceStop, setGlobalForceStop] = useState(false)

  const stopBotTyping = () => {
    setGlobalForceStop(true)
    setTimeout(() => setGlobalForceStop(false), 100)
    if (audioRef.current || (typeof window !== 'undefined' && window.speechSynthesis)) {
      if (audioRef.current) {
        try { audioRef.current.pause(); audioRef.current.currentTime = 0 } catch { }
        audioRef.current = null
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const wasVoiceUsedRef = useRef(false)
  const isRecordingActiveRef = useRef(false)
  const recognitionRef = useRef(null)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { dark } = useTheme()

  let defaultBadge = '🛡️ Campus Admin'
  if (user?.role === 'student') defaultBadge = '🎓 Bronze Achiever'
  else if (user?.role === 'organizer') defaultBadge = '⚡ Event Organizer'
  const currentBadge = userBadge || user?.badge || defaultBadge

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
    }
  }, [])

  const audioRef = useRef(null)

  const stopSpeaking = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } catch { }
      audioRef.current = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }

  const speakWithSynthesis = useCallback((clean) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(clean)
    const naturalVoice = getNaturalHumanVoice()

    if (naturalVoice) {
      utterance.voice = naturalVoice
      utterance.lang = naturalVoice.lang
    } else {
      utterance.lang = 'hi-IN'
    }

    /*
     * 🎙️ INDIAN NATURAL FEMALE VOICE ACOUSTIC PROFILE:
     * - pitch = 1.14 (Youthful, sweet, natural Indian female voice pitch matching sample)
     * - rate = 1.02 (Clear, fluent, expressive conversational speed)
     * - volume = 1.0
     */
    utterance.rate = 1.02
    utterance.pitch = 1.14
    utterance.volume = 1.0

    utterance.onstart = () => {
      setIsSpeaking(true)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }, [])

  const speakReply = useCallback((text) => {
    if (!voiceEnabled) return

    stopSpeaking()

    // Clean text for natural human flow (removes markdown symbols, URLs, bullet points)
    const clean = text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
      .replace(/\*\*/g, '')
      .replace(/[*_#`]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\n+/g, '. ')
      .replace(/:\s*/g, '. ')
      .replace(/;\s*/g, '. ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!clean) return

    // Priority 1: High-Definition Sweet Neural Indian Female Voice (Matches the user's sample audio 100%)
    try {
      const isHindi = /[\u0900-\u097F]/.test(clean) || /namaste|aap|karein|hai|kaise|kya|bhai|dost|events/i.test(clean)
      const langCode = isHindi ? 'hi' : 'hi'

      const shortClean = clean.length > 200 ? clean.slice(0, 196) + '.' : clean
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(shortClean)}`

      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.playbackRate = 1.05

      audio.onplay = () => {
        setIsSpeaking(true)
      }

      audio.onended = () => {
        setIsSpeaking(false)
        audioRef.current = null
      }

      audio.onerror = () => {
        speakWithSynthesis(clean)
      }

      audio.play().catch(() => {
        speakWithSynthesis(clean)
      })
    } catch {
      speakWithSynthesis(clean)
    }
  }, [voiceEnabled, speakWithSynthesis])



  const triggerCelebration = useCallback(() => {  
    setIsCelebrating(true)
    setIsWaving(true)
    setCurrentMood('excited')

    setTimeout(() => {
      setIsCelebrating(false)
      setIsWaving(false)
      setCurrentMood(null)
    }, 5500)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
    }

    window.camyCelebrate = () => triggerCelebration()

    const handleCustomCelebrate = () => triggerCelebration()
    const handleCustomError = () => {
      setCurrentMood('sad')
      setTimeout(() => setCurrentMood(null), 4000)
    }

    const handleFocusIn = (e) => {
      const tag = (e.target.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        setCurrentMood('curious')
      }
    }

    const handleFocusOut = (e) => {
      const tag = (e.target.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        setCurrentMood(null)
      }
    }

    window.addEventListener('camy-celebrate', handleCustomCelebrate)
    window.addEventListener('camy-error', handleCustomError)
    window.addEventListener('focusin', handleFocusIn)
    window.addEventListener('focusout', handleFocusOut)

    return () => {
      delete window.camyCelebrate
      window.removeEventListener('camy-celebrate', handleCustomCelebrate)
      window.removeEventListener('camy-error', handleCustomError)
      window.removeEventListener('focusin', handleFocusIn)
      window.removeEventListener('focusout', handleFocusOut)
    }
  }, [triggerCelebration])

  useEffect(() => {
    let targetMood = 'happy'
    let initialGreeting = ''

    if (!user) {
      initialGreeting = "👋 **Namaste! I'm Camy** — your EMO AI campus buddy!\n\nI can help you with:\n- 🎓 Event recommendations\n- 📜 Certificates\n- ⚡ Organizing events\n\nLog in or ask me anything in voice/text!"
    } else if (user.role === 'student') {
      targetMood = 'excited'
      initialGreeting = `🎓 **Welcome back, ${user.name || 'Student'}!**\n\nI'm Camy! I've loaded your course preferences:\n- 🏆 Recommended hackathons & technical workshops\n- 📜 Your certificate downloads & badge progress\n\nAsk me anything or pick a quick chip!`
    } else if (user.role === 'organizer' || user.role === 'admin') {
      targetMood = 'scan'
      initialGreeting = user.role === 'organizer'
        ? `⚡ **Hello ${user.name || 'Organizer'}!**\n\nReady to power up your campus events?\n- ✍️ Draft viral event titles & descriptions\n- 📊 Tips to boost student participation\n- 📜 Automatic certificate generation guidance`
        : `🛡️ **Welcome Admin ${user.name || ''}!**\n\nSystem overview ready:\n- 📊 Track overall registrations & platform metrics\n- ⚡ Broadcast emergency campus announcements\n- 🔒 Security & role management guidelines`
    } else {
      initialGreeting = `👋 **Welcome back, ${user.name || 'Friend'}!**\n\nI'm Camy! Ask me anything about upcoming campus events!`
    }

    setIsWaving(true)
    setCurrentMood(targetMood)

    setMessages([{
      role: 'assistant',
      reply: initialGreeting,
      timestamp: new Date(),
      typed: true,
      mood: targetMood,
    }])

    const timer = setTimeout(() => {
      setIsWaving(false)
    }, 6000)

    return () => clearTimeout(timer)
  }, [user?.role, user?.name])

  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, messages, loading])

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) {
      const recognition = new SR()
      recognition.lang = 'en-IN'
      recognition.continuous = false
      recognition.interimResults = true

      recognition.onresult = (e) => {
        let currentTranscript = ''
        for (const result of e.results) {
          currentTranscript += result[0].transcript
        }
        setInputText(currentTranscript)
        wasVoiceUsedRef.current = true
      }

      recognition.onerror = (e) => {
        if (e.error === 'no-speech' && isRecordingActiveRef.current) {
          return
        }
        if (e.error !== 'aborted') {
          if (e.error === 'not-allowed') {
            showToast('Microphone access denied. Please allow it in your browser settings.', 'error')
          } else if (e.error === 'network') {
            showToast('Speech recognition unavailable. Please check your connection or use text input.', 'error')
          }
          isRecordingActiveRef.current = false
          setIsListening(false)
        }
      }

      recognition.onend = () => {
        if (isRecordingActiveRef.current) {
          try {
            recognition.start()
          } catch {
            isRecordingActiveRef.current = false
            setIsListening(false)
          }
        } else {
          setIsListening(false)
        }
      }

      recognitionRef.current = recognition
    }
  }, [])

  const startRecording = () => {
    if (!recognitionRef.current) return
    stopSpeaking()
    wasVoiceUsedRef.current = true
    isRecordingActiveRef.current = true
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch {
      setIsListening(false)
      isRecordingActiveRef.current = false
    }
  }

  const stopRecording = () => {
    isRecordingActiveRef.current = false
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { }
    }
    setIsListening(false)
  }

  const cancelRecording = () => {
    stopRecording()
    wasVoiceUsedRef.current = false
    setInputText('')
  }

  const toggleMic = () => {
    if (isListening) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  useEffect(() => {
    let alive = true
    aiService.getQuickActions().then((res) => {
      if (alive && res.success && res.chips?.length > 0) {
        setQuickChips(res.chips)
      } else if (alive) {
        let defaults = [
          { id: 'q1', label: '🎓 Recommend Events', prompt: 'Suggest top upcoming hackathons matching my course.' },
          { id: 'q2', label: '📜 My Certificates', prompt: 'How to view and download my certificates?' },
          { id: 'q3', label: '🏆 My Badges', prompt: 'How do I earn higher achievement badges?' }
        ]
        if (user?.role === 'organizer') {
          defaults = [
            { id: 'q1', label: '✍️ Draft Description', prompt: 'Draft a catchy event description for an AI workshop.' },
            { id: 'q2', label: '📊 Event Insights', prompt: 'Tips to increase event registrations and engagement.' },
            { id: 'q3', label: '📜 Certificates', prompt: 'How to generate certificates for participants?' }
          ]
        } else if (user?.role === 'admin') {
          defaults = [
            { id: 'q1', label: '🛡️ Platform Overview', prompt: 'Summarize platform metrics and active events.' },
            { id: 'q2', label: '⚡ Quick Broadcast', prompt: 'Draft an announcement for technical events.' }
          ]
        }
        setQuickChips(defaults)
      }
    })
    return () => { alive = false }
  }, [user?.role])

  const handleSendMessage = async (customPrompt = null, isVoice = null) => {
    const text = customPrompt || inputText.trim()
    if (!text || loading) return

    const isVoiceInput = isVoice !== null ? isVoice : wasVoiceUsedRef.current

    stopRecording()
    stopSpeaking()
    setIsWaving(false)
    setIsCelebrating(false)

    wasVoiceUsedRef.current = false

    setMessages(prev => [...prev, { role: 'user', reply: text, timestamp: new Date(), typed: true }])
    if (!customPrompt) setInputText('')
    setLoading(true)

    const history = messages
      .filter(m => m?.reply && typeof m.reply === 'string')
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.reply.trim() }))

    let res = await aiService.sendMessage(text, history)
    if (!res.success) res = await aiService.sendMessage(text, [])

    setLoading(false)

    if (res.success && res.data) {
      const replyMood = analyzeSentiment(res.data.reply) || 'happy'
      setCurrentMood(replyMood)

      const botMsg = {
        role: 'assistant',
        reply: res.data.reply,
        action_chips: res.data.action_chips || [],
        recommended_events: res.data.recommended_events || [],
        timestamp: new Date(),
        typed: false,
        mood: replyMood,
      }
      setMessages(prev => [...prev, botMsg])

      if (isVoiceInput) {
        speakReply(res.data.speech_text || res.data.reply)
      }

      if (res.data.user_context?.badge) setUserBadge(res.data.user_context.badge)
      if (res.data.action_chips?.length > 0) setQuickChips(res.data.action_chips)
    } else {
      setCurrentMood('sad')
      setMessages(prev => [...prev, {
        role: 'assistant',
        reply: `⚠️ ${res.message || 'Connection issue. Please try again.'}`,
        timestamp: new Date(),
        typed: true,
        mood: 'sad',
      }])
    }
  }

  const handleClearChat = () => {
    stopSpeaking()
    stopRecording()
    wasVoiceUsedRef.current = false
    setIsWaving(false)
    setIsCelebrating(false)
    setCurrentMood(null)
    setMessages([{
      role: 'assistant',
      reply: '🔄 **Chat reset!** What else can I help with?',
      timestamp: new Date(),
      typed: true,
      mood: 'happy',
    }])
  }

  const markTyped = (index, truncatedText = null) => {
    setMessages(prev => prev.map((m, i) => i === index ? { ...m, typed: true, reply: truncatedText || m.reply } : m))
  }

  const isBotTyping = messages.some(m => m.role === 'assistant' && !m.typed)

  let inputStyle = dark ? 'bg-[#111d35] text-slate-100 border-cyan-900/40 focus:border-cyan-500 placeholder-slate-500' : 'bg-slate-100 text-slate-900 border-slate-200 focus:border-cyan-500 placeholder-slate-400'
  if (isListening) {
    inputStyle = 'bg-red-500/10 border-red-400/50 text-red-300 placeholder-red-400/70 animate-pulse'
  }

  let micButtonStyle = dark ? 'bg-[#111d35] text-cyan-400 border-cyan-800/40 hover:bg-cyan-900/40' : 'bg-slate-100 text-cyan-600 border-slate-200 hover:bg-cyan-50'
  if (isListening) {
    micButtonStyle = 'bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/35 backdrop-blur-[6px] z-40 transition-all duration-300 pointer-events-auto"
          onClick={() => { stopSpeaking(); stopRecording(); setIsOpen(false) }}
        />
      )}
      {!isOpen && (
        <div
          ref={avatarElemRef}
          onPointerDown={handleAvatarPointerDown}
          onDoubleClick={resetBotPosition}
          onClick={(e) => {
            if (hasDraggedRef.current) {
              e.stopPropagation()
              return
            }
            setIsWaving(false)
            setIsOpen(true)
          }}
          style={
            botPos
              ? {
                position: 'fixed',
                left: `${botPos.x}px`,
                top: `${botPos.y}px`,
                bottom: 'auto',
                right: 'auto',
                touchAction: 'none',
                zIndex: 9999
              }
              : {
                touchAction: 'none',
                zIndex: 9999
              }
          }
          className={`cursor-grab active:cursor-grabbing select-none hover:scale-105 active:scale-95 transition-transform group/bot-drag ${botPos ? '' : 'fixed bottom-3 right-3 sm:bottom-5 sm:right-5'}`}
          title={botPos ? 'Drag to move / Double-click to reset position' : 'Drag & drop Camy anywhere / Click to open'}
        >
          <EmoBotCharacter
            isTyping={loading}
            isSpeaking={isSpeaking}
            isListening={isListening}
            isWaving={isWaving}
            isCelebrating={isCelebrating}
            mood={currentMood}
            size={window.innerWidth < 640 ? 56 : 64}
          />

          {/* Quick reset badge when moved - visible ONLY on hover */}
          {botPos && (
            <button
              type="button"
              onClick={resetBotPosition}
              onPointerDown={(e) => e.stopPropagation()}
              title="Reset bot to default corner position"
              className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-slate-900/95 text-cyan-300 hover:bg-cyan-600 hover:text-white border border-cyan-400/60 shadow-xl flex items-center gap-1 cursor-pointer transition-all duration-200 opacity-0 group-hover/bot-drag:opacity-100 scale-75 group-hover/bot-drag:scale-100 pointer-events-none group-hover/bot-drag:pointer-events-auto z-50 text-[10.5px] font-bold select-none whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      )}

      {isOpen && (() => {
        const winPos = getWidgetPosition(botPos)
        return (
          <div
            id="global-campus-bot"
            style={
              winPos
                ? {
                  position: 'fixed',
                  left: `${winPos.left}px`,
                  top: `${winPos.top}px`,
                  bottom: 'auto',
                  right: 'auto',
                  zIndex: 9999
                }
                : {
                  zIndex: 9999
                }
            }
            className={`${winPos ? '' : 'fixed bottom-3 right-3 sm:bottom-5 sm:right-5'} font-[Inter,Manrope,sans-serif] max-w-[calc(100vw-24px)]`}
          >
            <div
              className={`flex flex-col w-[calc(100vw-24px)] sm:w-[400px] h-[520px] max-h-[76vh] sm:h-[580px] sm:max-h-[82vh] rounded-[22px] sm:rounded-[26px] shadow-2xl border overflow-hidden backdrop-blur-xl transition-all duration-300 ${dark
                ? 'bg-[#0a0f1e]/95 text-slate-100 border-cyan-900/40 shadow-[0_8px_40px_rgba(8,145,178,0.15)]'
                : 'bg-white/98 text-slate-900 border-slate-200 shadow-[0_8px_40px_rgba(0,0,0,0.12)]'
                }`}
              style={{ animation: 'cbPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <WidgetHeader
                dark={dark}
                loading={loading}
                isSpeaking={isSpeaking}
                isListening={isListening}
                isCelebrating={isCelebrating}
                currentMood={currentMood}
                currentBadge={currentBadge}
                voiceEnabled={voiceEnabled}
                setVoiceEnabled={setVoiceEnabled}
                stopSpeaking={stopSpeaking}
                handleClearChat={handleClearChat}
                hasCustomPos={botPos !== null}
                onResetPos={resetBotPosition}
                onClose={() => { stopSpeaking(); stopRecording(); setIsOpen(false) }}
              />

              <div className="flex-1 overflow-y-auto p-4 space-y-4 cb-scrollbar">
                {messages.map((msg, i) => {
                  const isBot = msg.role === 'assistant'
                  const isLastBotMsg = isBot && i === messages.length - 1
                  const msgMood = isBot ? (msg.mood || analyzeSentiment(msg.reply) || 'happy') : null
                  const msgKey = `msg-${i}-${msg.timestamp ? new Date(msg.timestamp).getTime() : i}`

                  let bubbleClass = 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-sm shadow-md'
                  if (isBot) {
                    bubbleClass = dark ? 'bg-[#111d35] border border-cyan-900/30 rounded-bl-sm' : 'bg-slate-50 border border-slate-200 rounded-bl-sm'
                  }

                  return (
                    <div key={msgKey} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                      <div className={`flex items-end gap-2 max-w-[88%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                        {isBot ? (
                          <div className="shrink-0 mb-1">
                            <EmoBotCharacter
                              size={32}
                              isSpeaking={isSpeaking && isLastBotMsg}
                              isTyping={loading && isLastBotMsg}
                              isListening={isListening && isLastBotMsg}
                              mood={msgMood}
                              onClick={() => { }}
                            />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className={`px-3.5 py-3 rounded-2xl relative group/msg ${bubbleClass}`}>
                          {isBot && msg.typed && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isSpeaking) {
                                  stopSpeaking()
                                } else {
                                  speakReply(msg.speech_text || msg.reply)
                                }
                              }}
                              title={isSpeaking ? "Stop Voice" : "Listen to Response"}
                              className="absolute -top-2.5 -right-2.5 p-1.5 rounded-full bg-slate-900/90 border border-cyan-400/50 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-900/80 hover:border-cyan-300/70 hover:scale-110 opacity-70 group-hover/msg:opacity-100 transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-sm"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                          )}

                          {isBot && !msg.typed ? (
                            <TypewriterText
                              text={msg.reply}
                              speed={18}
                              onComplete={(truncatedText) => markTyped(i, truncatedText)}
                              onNavigate={(p) => navigate(p)}
                              forceStop={globalForceStop}
                            />
                          ) : (
                            <MarkdownRenderer content={msg.reply} onNavigate={(p) => navigate(p)} />
                          )}
                        </div>
                      </div>

                      {isBot && msg.typed && msg.recommended_events?.length > 0 && (
                        <div className="mt-2.5 ml-9 space-y-1.5 w-[85%]">
                          <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 m-0 ${dark ? 'text-cyan-500' : 'text-cyan-600'}`}>
                            <Calendar className="w-3 h-3" /> Recommended Events
                          </p>
                          {msg.recommended_events.map((ev, j) => {
                            const evId = ev.event_id || ev.id || ev._id || j
                            return (
                              <button
                                type="button"
                                key={`rec-ev-${evId}-${j}`}
                                onClick={() => navigate(`/events/${evId}`)}
                                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${dark ? 'bg-cyan-950/30 hover:bg-cyan-900/40 border-cyan-800/30' : 'bg-cyan-50/70 hover:bg-cyan-100 border-cyan-200/70'
                                  }`}
                              >
                                <div>
                                  <h4 className={`font-bold text-[12px] group-hover:underline m-0 ${dark ? 'text-cyan-300' : 'text-cyan-700'}`}>{ev.title || ev.name}</h4>
                                  <p className="text-[10px] opacity-70 m-0 mt-0.5">{ev.category || 'Event'} • {ev.location || 'Campus'}</p>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                              </button>
                            )
                          })}
                        </div>
                      )}

                      <span className={`text-[9px] mt-1 px-1.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  )
                })}

                {loading && (
                  <div className="flex items-center gap-2 pl-1">
                    <div className="shrink-0">
                      <EmoBotCharacter size={28} isTyping={true} onClick={() => { }} />
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-[12px] font-medium ${dark ? 'bg-[#111d35] border border-cyan-900/30 text-cyan-300' : 'bg-slate-50 border border-slate-200 text-cyan-700'
                      }`}>
                      <span>Camy is thinking</span>
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:300ms]" />
                      </span>
                    </div>
                  </div>
                )}

                {isSpeaking && !loading && (
                  <div className="flex items-center gap-2 pl-1 animate-fadeIn">
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      title="Click to Stop Voice Output"
                      className="w-8 h-8 rounded-xl bg-slate-950 border border-cyan-400/80 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.6)] animate-pulse shrink-0 hover:bg-red-950 hover:border-red-400 hover:text-red-300 cursor-pointer transition-colors"
                    >
                      <Square className="w-3.5 h-3.5 fill-cyan-300 hover:fill-red-300" />
                    </button>

                    <button
                      type="button"
                      onClick={stopSpeaking}
                      title="Click to Stop Voice"
                      className="relative group cursor-pointer text-left border-none bg-transparent p-0"
                    >
                      <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 opacity-80 blur-md animate-pulse" />
                      <div className="relative flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-950/95 border border-cyan-400/70 shadow-[0_0_18px_rgba(34,211,238,0.5)]">
                        <span className="text-[11.5px] font-extrabold tracking-wide text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]">
                          Speaking... (Click to stop)
                        </span>
                        <SoundWaveIndicator />
                      </div>
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {quickChips?.length > 0 && (
                <div className={`px-2.5 sm:px-3 py-1.5 shrink-0 border-t ${dark ? 'bg-[#0c1424] border-cyan-900/20' : 'bg-slate-50/80 border-slate-200'}`}>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {quickChips.map((chip, idx) => (
                      <button type="button" key={chip.id || `chip-${idx}`} onClick={() => handleSendMessage(chip.prompt || chip.label, false)} disabled={loading} className={`shrink-0 flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10.5px] sm:text-[11px] font-semibold border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 disabled:opacity-40 ${dark ? 'bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-200 border-cyan-800/50' : 'bg-white hover:bg-cyan-50 text-cyan-700 border-cyan-200'
                        }`}>
                        <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400 shrink-0" />
                        <span>{chip.label || chip.prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={`p-2.5 sm:p-3 shrink-0 border-t flex flex-col items-center relative ${dark ? 'bg-[#080d1a] border-cyan-900/30' : 'bg-white border-slate-200'}`}>
                {isBotTyping && (
                  <button
                    type="button"
                    onClick={stopBotTyping}
                    className={`absolute -top-11 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-lg transition-all border ${dark ? 'bg-[#111d35] text-red-400 border-red-900/30 hover:bg-red-950/30' : 'bg-white text-red-500 border-slate-200 hover:bg-slate-50'}`}
                  >
                    <Square className="w-3 h-3 fill-current" /> Stop generating
                  </button>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage(null, wasVoiceUsedRef.current)
                  }}
                  className="flex items-center gap-1.5 sm:gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value)
                      if (!isListening) wasVoiceUsedRef.current = false
                    }}
                    placeholder={isListening ? '🎙️ Recording voice...' : 'Ask Camy anything...'}
                    disabled={loading}
                    className={`flex-1 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-[12.5px] sm:text-[13px] outline-none border transition-all ${inputStyle}`}
                  />

                  {(isListening || (inputText.trim() && isListening)) && (
                    <button
                      type="button"
                      onClick={cancelRecording}
                      title="Cancel & Discard Recording"
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-red-600/80 text-slate-300 hover:text-white flex items-center justify-center shrink-0 transition-all cursor-pointer border border-slate-700"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}

                  {recognitionRef.current && (
                    <button
                      type="button"
                      onClick={toggleMic}
                      title={isListening ? 'Pause / Stop Recording' : 'Start Voice Recording'}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer border ${micButtonStyle}`}
                    >
                      {isListening ? <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" /> : <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={!inputText.trim() || loading}
                    title="Send Message to Camy"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white flex items-center justify-center shrink-0 hover:from-cyan-500 hover:to-teal-500 active:scale-95 disabled:opacity-30 transition-all cursor-pointer shadow-md"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )
      })()}

      <style>{`
        @keyframes cbPop {
          from { opacity: 0; transform: scale(0.95) translateY(14px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes soundWave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .cb-scrollbar::-webkit-scrollbar { width: 4px; }
        .cb-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .cb-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.15); border-radius: 10px; }
        .cb-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34,211,238,0.3); }

        .emo-wave-1 { animation: emoWave 0.5s ease-in-out infinite; transform-origin: center center; }
        .emo-wave-2 { animation: emoWave 0.4s ease-in-out infinite 0.1s; transform-origin: center center; }
        .emo-wave-3 { animation: emoWave 0.35s ease-in-out infinite 0.05s; transform-origin: center center; }
        .emo-wave-4 { animation: emoWave 0.45s ease-in-out infinite 0.15s; transform-origin: center center; }
        .emo-wave-5 { animation: emoWave 0.55s ease-in-out infinite 0.08s; transform-origin: center center; }
        @keyframes emoWave {
          0%, 100% { transform: scaleY(0.4); opacity: 0.6; }
          50% { transform: scaleY(1.2); opacity: 1; }
        }
      `}</style>
    </>
  )
}
