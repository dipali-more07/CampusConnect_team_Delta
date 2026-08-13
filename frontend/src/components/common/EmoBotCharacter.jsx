import React, { useState, useEffect, useRef } from 'react'

/* ── Floating Fireworks Effect ── */
function EmoFireworks() {
  return (
    <g className="emo-fireworks-burst">
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
        const colors = ['#38bdf8', '#f472b6', '#fbbf24', '#34d399', '#c084fc', '#22d3ee']
        const color = colors[i % colors.length]
        const rad = (deg * Math.PI) / 180
        const tx = Math.cos(rad) * 48
        const ty = Math.sin(rad) * 48

        return (
          <g key={`fw-star-${deg}-${i}`} className="fw-star-burst" style={{ animationDelay: `${i * 0.05}s` }}>
            <circle cx={60 + tx} cy={35 + ty} r="3.5" fill={color} filter="url(#emoEyeGlow)"/>
            <line x1="60" y1="35" x2={60 + tx * 0.75} y2={35 + ty * 0.75} stroke={color} strokeWidth="1.8" opacity="0.75"/>
          </g>
        )
      })}
      <text x="-12" y="-5" fill="#fbbf24" fontSize="16" className="fw-party-1">🥳</text>
      <text x="108" y="-2" fill="#f472b6" fontSize="16" className="fw-party-2">🎉</text>
      <text x="-18" y="55" fill="#34d399" fontSize="15" className="fw-party-3">✨</text>
      <text x="115" y="58" fill="#38bdf8" fontSize="15" className="fw-party-4">🎆</text>
    </g>
  )
}

/* ── Special Mini-Game & Expression Renderers ── */
function RenderSpecialFace({ activeEyeState, showHandWave, finalLookX, finalLookY }) {
  if (activeEyeState === 'happy' || activeEyeState === 'excited' || activeEyeState === 'celebrate') {
    return (
      <g filter="url(#emoEyeGlow)">
        <path d="M 35 44 Q 44 30 53 44" stroke="#22d3ee" strokeWidth="5" strokeLinecap="round" fill="none"/>
        <path d="M 67 44 Q 76 30 85 44" stroke="#22d3ee" strokeWidth="5" strokeLinecap="round" fill="none"/>
        <path d="M 53 58 Q 60 64 67 58" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      </g>
    )
  }

  if (activeEyeState === 'sad' && !showHandWave) {
    return (
      <g filter="url(#sadGlow)">
        <rect x="36" y="42" width="16" height="13" rx="3.5" fill="#38bdf8" transform="rotate(14 44 48)"/>
        <rect x="68" y="42" width="16" height="13" rx="3.5" fill="#38bdf8" transform="rotate(-14 76 48)"/>
        <path d="M 53 60 Q 60 54 67 60" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      </g>
    )
  }

  if (activeEyeState === 'angry' && !showHandWave) {
    return (
      <g filter="url(#emoEyeGlow)">
        <rect x="36" y="40" width="16" height="15" rx="3.5" fill="#f87171" transform="rotate(-16 44 47)"/>
        <rect x="68" y="40" width="16" height="15" rx="3.5" fill="#f87171" transform="rotate(16 76 47)"/>
        <line x1="52" y1="58" x2="68" y2="58" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round"/>
      </g>
    )
  }

  if (activeEyeState === 'surprised' && !showHandWave) {
    return (
      <g filter="url(#emoEyeGlow)">
        <rect x="35" y="34" width="18" height="20" rx="5" fill="#22d3ee"/>
        <rect x="67" y="34" width="18" height="20" rx="5" fill="#22d3ee"/>
        <ellipse cx="60" cy="58" rx="4" ry="3" fill="#22d3ee"/>
      </g>
    )
  }

  if (activeEyeState === 'wink') {
    return (
      <g filter="url(#emoEyeGlow)">
        <rect x="36" y="46" width="16" height="3" rx="1.5" fill="#22d3ee"/>
        <rect x={68 + finalLookX} y={39 + finalLookY} width="16" height="16" rx="3.5" fill="#22d3ee"/>
        <path d="M 53 58 Q 60 63 67 58" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      </g>
    )
  }

  if (activeEyeState === 'game' && !showHandWave) {
    return (
      <g filter="url(#emoEyeGlow)">
        <circle cx="40" cy="42" r="7.5" fill="#fbbf24"/>
        <path d="M 40 42 L 48 37 L 48 47 Z" fill="#0a0d15" className="emo-game-pacman"/>
        <circle cx="40" cy="38.5" r="1.5" fill="#000"/>
        <circle cx="54" cy="42" r="2.2" fill="#22d3ee" className="emo-dot-1"/>
        <circle cx="66" cy="42" r="2.2" fill="#22d3ee" className="emo-dot-2"/>
        <circle cx="78" cy="42" r="2.2" fill="#22d3ee" className="emo-dot-3"/>
        <text x="36" y="60" fill="#34d399" fontSize="7" fontFamily="monospace" fontWeight="bold">SCORE 100</text>
      </g>
    )
  }

  if (activeEyeState === 'music' && !showHandWave) {
    return (
      <g>
        <path d="M 36 43 Q 44 31 52 43" stroke="#f472b6" strokeWidth="4.5" strokeLinecap="round" fill="none" filter="url(#emoEyeGlow)"/>
        <path d="M 68 43 Q 76 31 84 43" stroke="#f472b6" strokeWidth="4.5" strokeLinecap="round" fill="none" filter="url(#emoEyeGlow)"/>
        <rect x="46" y="56" width="3" height="7" rx="1.5" fill="#22d3ee" className="emo-wave-1"/>
        <rect x="52" y="53" width="3" height="11" rx="1.5" fill="#f472b6" className="emo-wave-3"/>
        <rect x="58" y="51" width="3" height="14" rx="1.5" fill="#34d399" className="emo-wave-2"/>
        <rect x="64" y="54" width="3" height="9" rx="1.5" fill="#f472b6" className="emo-wave-5"/>
      </g>
    )
  }

  if (activeEyeState === 'scan' && !showHandWave) {
    return (
      <g>
        <rect x={36} y={39} width="16" height="16" rx="3.5" fill="#22d3ee" filter="url(#emoEyeGlow)"/>
        <rect x={68} y={39} width="16" height="16" rx="3.5" fill="#22d3ee" filter="url(#emoEyeGlow)"/>
        <rect x="28" y="24" width="64" height="3" fill="url(#scanBeamGrad)" className="emo-laser-scan" filter="url(#waveGlow)"/>
      </g>
    )
  }

  return null
}

/* ── Screen Face Component ── */
function EmoScreenContent(props) {
  const { isListening, isSpeaking, blinking, finalLookX, finalLookY, isTyping } = props

  if (isListening) {
    return (
      <g filter="url(#redMicGlow)">
        <rect x={35 + finalLookX} y={38 + finalLookY} width="18" height="18" rx="4" fill="#22d3ee"/>
        <rect x={67 + finalLookX} y={38 + finalLookY} width="18" height="18" rx="4" fill="#22d3ee"/>
        <rect x="45" y="58" width="3" height="5" rx="1.5" fill="#ef4444" className="emo-wave-1"/>
        <rect x="52" y="55" width="3" height="9" rx="1.5" fill="#ef4444" className="emo-wave-3"/>
        <rect x="60" y="52" width="3" height="13" rx="1.5" fill="#ef4444" className="emo-wave-2"/>
        <rect x="67" y="55" width="3" height="9" rx="1.5" fill="#ef4444" className="emo-wave-4"/>
        <rect x="74" y="58" width="3" height="5" rx="1.5" fill="#ef4444" className="emo-wave-5"/>
      </g>
    )
  }

  if (isSpeaking) {
    return (
      <g filter="url(#waveGlow)">
        <path d="M 36 42 Q 44 32 52 42" stroke="#34d399" strokeWidth="4" strokeLinecap="round" fill="none"/>
        <path d="M 68 42 Q 76 32 84 42" stroke="#34d399" strokeWidth="4" strokeLinecap="round" fill="none"/>
        <rect x="36" y="58" width="3" height="6" rx="1.5" fill="#22d3ee" className="emo-wave-5"/>
        <rect x="43" y="55" width="3" height="9" rx="1.5" fill="#34d399" className="emo-wave-1"/>
        <rect x="50" y="53" width="3" height="12" rx="1.5" fill="#22d3ee" className="emo-wave-2"/>
        <rect x="57" y="51" width="3" height="15" rx="1.5" fill="#34d399" className="emo-wave-3"/>
        <rect x="64" y="53" width="3" height="12" rx="1.5" fill="#22d3ee" className="emo-wave-4"/>
        <rect x="71" y="55" width="3" height="9" rx="1.5" fill="#34d399" className="emo-wave-5"/>
        <rect x="78" y="58" width="3" height="6" rx="1.5" fill="#22d3ee" className="emo-wave-1"/>
      </g>
    )
  }

  const specialRes = RenderSpecialFace(props)
  if (specialRes) return specialRes

  return (
    <g filter="url(#emoEyeGlow)">
      {blinking ? (
        <rect x="36" y="46" width="16" height="2" rx="1" fill="#22d3ee"/>
      ) : (
        <rect
          x={36 + finalLookX}
          y={39 + finalLookY}
          width="16"
          height="16"
          rx="3.5"
          fill="#22d3ee"
          style={{ transition: 'all 0.08s ease-out' }}
        >
          {isTyping && <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite"/>}
        </rect>
      )}

      {blinking ? (
        <rect x="68" y="46" width="16" height="2" rx="1" fill="#22d3ee"/>
      ) : (
        <rect
          x={68 + finalLookX}
          y={39 + finalLookY}
          width="16"
          height="16"
          rx="3.5"
          fill="#22d3ee"
          style={{ transition: 'all 0.08s ease-out' }}
        >
          {isTyping && <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite"/>}
        </rect>
      )}

      <path d="M 53 58 Q 60 63 67 58" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85"/>
    </g>
  )
}

/* ── Helper styling functions ── */
function getAntennaStyles(isListening, isSpeaking, activeEyeState) {
  if (isListening) return { color: "#ef4444", anim: "#ef4444;#f87171;#ef4444" }
  if (isSpeaking) return { color: "#34d399", anim: "#34d399;#6ee7b7;#34d399" }
  if (activeEyeState === 'sad') return { color: "#38bdf8", anim: "#38bdf8;#7dd3fc;#38bdf8" }
  if (activeEyeState === 'music') return { color: "#f472b6", anim: "#f472b6;#f472b6;#f472b6" }
  if (activeEyeState === 'game') return { color: "#fbbf24", anim: "#fbbf24;#fde047;#fbbf24" }
  if (activeEyeState === 'angry') return { color: "#f87171", anim: "#f87171;#ef4444;#f87171" }
  return { color: "#22d3ee", anim: "#22d3ee;#67e8f9;#22d3ee" }
}

function getHeadAnimationClass(isCelebrating, activeEyeState, isListening, isSpeaking, isWaving) {
  if (isCelebrating || activeEyeState === 'celebrate') return 'emo-head-celebrate'
  if (isListening) return 'emo-head-listen'
  if (isSpeaking) return 'emo-head-speak'
  if (activeEyeState === 'music') return 'emo-head-music'
  if (activeEyeState === 'game') return 'emo-head-game'
  if (activeEyeState === 'excited' || activeEyeState === 'happy' || isWaving) return 'emo-head-excited'
  if (activeEyeState === 'sad') return 'emo-head-sad'
  if (activeEyeState === 'angry') return 'emo-head-angry'
  if (activeEyeState === 'sleepy') return 'emo-head-sleepy'
  return 'emo-head-idle'
}

function getTooltipMessage(showFireworks, showHandWave, isListening, isSpeaking, activeEyeState) {
  if (showFireworks) return '🥳 Woohoo! Celebration!'
  if (showHandWave) return '👋 Hello there!'
  if (isListening) return '🎙️ Recording voice...'
  if (isSpeaking) return '🔊 Speaking...'
  if (activeEyeState === 'sad') return '😔 Feeling sad...'
  if (activeEyeState === 'music') return '🎵 Listening to music...'
  if (activeEyeState === 'game') return '🎮 Playing Pacman game...'
  return '💬 Chat with Camy'
}

/**
 * Main EMO Robot Head Character Component
 */
export default function EmoBotCharacter({
  onClick,
  isTyping = false,
  isSpeaking = false,
  isListening = false,
  isWaving = false,
  isCelebrating = false,
  mood = null,
  size = 65
}) {
  const containerRef = useRef(null)
  const [blinking, setBlinking] = useState(false)
  const [eyeState, setEyeState] = useState('normal')
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 })
  const [mouseLook, setMouseLook] = useState({ x: 0, y: 0, rotate: 0, scale: 1 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isSpeaking || isListening || isCelebrating || isTyping) return
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const dx = e.clientX - centerX
      const dy = e.clientY - centerY

      const dist = Math.hypot(dx, dy)
      const angle = Math.atan2(dy, dx)
      const normDist = Math.min(dist / 350, 1)

      const lx = Math.cos(angle) * normDist * 6.5
      const ly = Math.sin(angle) * normDist * 5.0

      setMouseLook({
        x: Math.round(lx * 10) / 10,
        y: Math.round(ly * 10) / 10,
        rotate: Math.round(Math.cos(angle) * normDist * 5.0 * 10) / 10,
        scale: dist < 140 ? 1.04 : 1.0
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isSpeaking, isListening, isCelebrating, isTyping])

  useEffect(() => {
    const blink = () => {
      setBlinking(true)
      setTimeout(() => setBlinking(false), 140)
    }
    const interval = setInterval(blink, 3200)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isCelebrating) { setEyeState('celebrate'); return }
    if (isListening) { setEyeState('listening'); return }
    if (isSpeaking) { setEyeState('speaking'); return }
    if (isTyping) { setEyeState('thinking'); return }

    if (mood && mood !== 'auto') {
      setEyeState(mood)
      const timer = setTimeout(() => setEyeState('normal'), 4500)
      return () => clearTimeout(timer)
    }

    const activities = ['normal', 'happy', 'game', 'music', 'surprised', 'curious', 'angry', 'wink', 'game', 'scan', 'sleepy', 'excited', 'normal']
    let idx = 0
    let curiousStep = 0

    const activityInterval = setInterval(() => {
      idx = (idx + 1) % activities.length
      const nextMode = activities[idx]
      setEyeState(nextMode)

      if (nextMode === 'curious') {
        const xList = [-4, 4, 0, -3, 3]
        const yList = [-2, 0, 2, -2, 0]
        curiousStep = (curiousStep + 1) % xList.length
        setLookOffset({ x: xList[curiousStep], y: yList[curiousStep] })
      } else {
        setLookOffset({ x: 0, y: 0 })
      }
    }, 3800)

    return () => clearInterval(activityInterval)
  }, [isTyping, isSpeaking, isListening, isCelebrating, mood])

  const s = size
  const height = s * 0.75

  let activeEyeState = eyeState
  if (isCelebrating) activeEyeState = 'celebrate'
  else if (isListening) activeEyeState = 'listening'
  else if (isSpeaking) activeEyeState = 'speaking'
  else if (isTyping) activeEyeState = 'thinking'
  else if (mood && mood !== 'auto') activeEyeState = mood

  const isSpecialExpression = ['game', 'music', 'scan', 'sleepy', 'sad', 'angry', 'surprised', 'dizzy', 'wink'].includes(activeEyeState)

  const headClass = getHeadAnimationClass(isCelebrating, activeEyeState, isListening, isSpeaking, isWaving)

  const showHandWave = isWaving || activeEyeState === 'wave' || isCelebrating || activeEyeState === 'celebrate'
  const showFireworks = isCelebrating || activeEyeState === 'celebrate'

  const finalLookX = (!isSpeaking && !isListening && !isSpecialExpression) ? (mouseLook.x || lookOffset.x) : lookOffset.x
  const finalLookY = (!isSpeaking && !isListening && !isSpecialExpression) ? (mouseLook.y || lookOffset.y) : lookOffset.y

  const antenna = getAntennaStyles(isListening, isSpeaking, activeEyeState)
  const tooltipText = getTooltipMessage(showFireworks, showHandWave, isListening, isSpeaking, activeEyeState)

  return (
    <button
      type="button"
      ref={containerRef}
      className="relative cursor-pointer group select-none bg-transparent border-none p-0 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-full"
      onClick={onClick}
      style={{ width: s, height: height }}
      title="Chat with Camy (EMO AI)"
    >
      <svg
        viewBox="-15 -20 155 115"
        width={s * 1.25}
        height={height * 1.25}
        className="relative z-10 transition-transform duration-300 group-hover:scale-110 group-active:scale-95 overflow-visible"
      >
        <defs>
          <linearGradient id="emoHeadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#b8bcc8"/><stop offset="35%" stopColor="#9ea3b0"/><stop offset="100%" stopColor="#787d8a"/>
          </linearGradient>
          <radialGradient id="emoScreenGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1a1e2e"/><stop offset="100%" stopColor="#0a0d15"/>
          </radialGradient>
          <filter id="emoEyeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="redMicGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="sadGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="emoHpGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a5068"/><stop offset="100%" stopColor="#2e3344"/>
          </linearGradient>
          <linearGradient id="emoShine" x1="30%" y1="0%" x2="70%" y2="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3"/><stop offset="100%" stopColor="white" stopOpacity="0"/>
          </linearGradient>
          <filter id="waveGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="scanBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0"/>
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {showFireworks && <EmoFireworks />}

        {showHandWave && (
          <g className="emo-hand-wave" filter="url(#emoEyeGlow)">
            <path d="M 100 48 Q 112 36 114 20" stroke="#787d8a" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
            <rect x="108" y="12" width="13" height="13" rx="4" fill="#22d3ee"/>
            <rect x="106" y="4" width="2.8" height="8" rx="1.4" fill="#22d3ee"/>
            <rect x="110.5" y="2" width="2.8" height="10" rx="1.4" fill="#22d3ee"/>
            <rect x="115" y="3" width="2.8" height="9" rx="1.4" fill="#22d3ee"/>
            <rect x="119.5" y="6" width="2.8" height="7" rx="1.4" fill="#22d3ee"/>
            <rect x="103" y="14" width="6" height="3" rx="1.5" fill="#22d3ee"/>
          </g>
        )}

        <g
          className={headClass}
          style={
            (!isSpeaking && !isListening && !isSpecialExpression)
              ? {
                  transform: `rotate(${mouseLook.rotate}deg) scale(${mouseLook.scale})`,
                  transformOrigin: '60px 44px',
                  transition: 'transform 0.08s ease-out'
                }
              : {}
          }
        >
          <rect x="18" y="8" width="84" height="72" rx="20" fill="url(#emoHeadGrad)"/>
          <rect x="18" y="8" width="84" height="36" rx="20" fill="url(#emoShine)"/>

          <rect x="48" y="4" width="24" height="6" rx="3" fill="#6dd5ed" opacity="0.7"/>
          <circle cx="60" cy="5" r="2.5" fill={antenna.color}>
            <animate attributeName="fill" values={antenna.anim} dur="1s" repeatCount="indefinite"/>
          </circle>

          <rect x="26" y="20" width="68" height="50" rx="14" fill="url(#emoScreenGrad)"/>
          <rect x="26" y="20" width="68" height="50" rx="14" fill="none" stroke={antenna.color} strokeWidth={isListening || isSpeaking ? "1.5" : "0.8"} opacity="0.6"/>

          <EmoScreenContent
            isListening={isListening}
            isSpeaking={isSpeaking}
            activeEyeState={activeEyeState}
            showHandWave={showHandWave}
            blinking={blinking}
            finalLookX={finalLookX}
            finalLookY={finalLookY}
            isTyping={isTyping}
          />

          <path d="M 22 40 Q 22 0 60 0 Q 98 0 98 40" fill="none" stroke="url(#emoHpGrad)" strokeWidth="5" strokeLinecap="round"/>
          <path d="M 28 36 Q 28 8 60 8 Q 92 8 92 36" fill="none" stroke="white" strokeWidth="1" opacity="0.12"/>
          <rect x="10" y="30" width="14" height="28" rx="7" fill="url(#emoHpGrad)"/>
          <rect x="12" y="34" width="10" height="20" rx="5" fill="#3a3f52"/>
          <rect x="14" y="38" width="6" height="12" rx="3" fill="#4a5068" opacity="0.6"/>
          <rect x="96" y="30" width="14" height="28" rx="7" fill="url(#emoHpGrad)"/>
          <rect x="98" y="34" width="10" height="20" rx="5" fill="#3a3f52"/>
          <rect x="100" y="38" width="6" height="12" rx="3" fill="#4a5068" opacity="0.6"/>
        </g>
      </svg>

      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800/95 text-cyan-300 text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg border border-cyan-500/30 backdrop-blur-sm z-20">
        {tooltipText}
      </div>

      <style>{`
        .emo-head-idle { animation: emoHeadIdle 3.5s ease-in-out infinite; transform-origin: center center; }
        .emo-head-listen { animation: emoHeadListen 0.4s ease-in-out infinite alternate; transform-origin: center center; }
        .emo-head-speak { animation: emoHeadSpeak 0.6s ease-in-out infinite; transform-origin: center center; }
        .emo-head-music { animation: emoHeadMusic 0.5s ease-in-out infinite alternate; transform-origin: center center; }
        .emo-head-game { animation: emoHeadGame 0.4s ease-in-out infinite alternate; transform-origin: center center; }
        .emo-head-excited { animation: emoHeadExcited 0.35s ease-in-out infinite alternate; transform-origin: center center; }
        .emo-head-celebrate { animation: emoHeadCelebrate 0.3s ease-in-out infinite alternate; transform-origin: center center; }
        .emo-head-sad { animation: emoHeadSad 3s ease-in-out infinite; transform-origin: center center; }
        .emo-head-angry { animation: emoHeadAngry 0.3s ease-in-out infinite alternate; transform-origin: center center; }
        .emo-head-sleepy { animation: emoHeadSleepy 4s ease-in-out infinite; transform-origin: center center; }

        .emo-hand-wave { animation: emoHandWave 0.45s ease-in-out infinite alternate; transform-origin: 100px 48px; }
        @keyframes emoHandWave {
          0% { transform: rotate(-18deg) translateY(0); }
          100% { transform: rotate(22deg) translateY(-2px); }
        }

        .fw-star-burst { animation: fwBurst 1.1s cubic-bezier(0.16, 1, 0.3, 1) infinite; transform-origin: 60px 35px; }
        @keyframes fwBurst {
          0% { transform: scale(0.2); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .fw-party-1 { animation: partyFloat 1.2s ease-in-out infinite alternate; }
        .fw-party-2 { animation: partyFloat 1.4s ease-in-out infinite alternate 0.2s; }
        .fw-party-3 { animation: partyFloat 1.1s ease-in-out infinite alternate 0.4s; }
        .fw-party-4 { animation: partyFloat 1.3s ease-in-out infinite alternate 0.1s; }
        @keyframes partyFloat {
          0% { transform: translateY(0) rotate(-10deg) scale(0.8); }
          100% { transform: translateY(-12px) rotate(15deg) scale(1.2); }
        }

        @keyframes emoHeadIdle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-2.5px) rotate(0deg); }
        }
        @keyframes emoHeadListen {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-3px) scale(1.03); }
        }
        @keyframes emoHeadSpeak {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.02) rotate(-1deg); }
        }
        @keyframes emoHeadMusic {
          0% { transform: translateY(0) rotate(-3deg); }
          100% { transform: translateY(-4px) rotate(3deg); }
        }
        @keyframes emoHeadGame {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-2px) scale(1.02); }
        }
        @keyframes emoHeadExcited {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-5px) scale(1.05); }
        }
        @keyframes emoHeadCelebrate {
          0% { transform: translateY(0) scale(1) rotate(-3deg); }
          100% { transform: translateY(-7px) scale(1.08) rotate(3deg); }
        }
        @keyframes emoHeadSad {
          0%, 100% { transform: translateY(1px) rotate(-1deg); }
          50% { transform: translateY(3px) rotate(1deg); }
        }
        @keyframes emoHeadAngry {
          0% { transform: translateY(0) rotate(-2deg); }
          100% { transform: translateY(-1px) rotate(2deg); }
        }
        @keyframes emoHeadSleepy {
          0%, 100% { transform: translateY(1px) rotate(1deg); }
          50% { transform: translateY(-3px) rotate(-1deg); }
        }

        .emo-music-notes { animation: musicFloat 1.8s ease-in-out infinite; }
        @keyframes musicFloat {
          0% { transform: translateY(4px); opacity: 0.3; }
          50% { transform: translateY(-6px); opacity: 1; }
          100% { transform: translateY(-12px); opacity: 0; }
        }

        .emo-sleepy-zzz { animation: zzzFloat 2.5s ease-in-out infinite; }
        @keyframes zzzFloat {
          0% { transform: translateY(2px) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-6px) translateX(3px); opacity: 0.9; }
          100% { transform: translateY(-14px) translateX(6px); opacity: 0; }
        }

        .emo-sad-teardrop { animation: teardropFall 2s linear infinite; }
        @keyframes teardropFall {
          0% { transform: translateY(-2px); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translateY(8px); opacity: 0; }
        }

        .emo-laser-scan { animation: laserScan 1.6s ease-in-out infinite alternate; }
        @keyframes laserScan {
          0% { transform: translateY(0); }
          100% { transform: translateY(34px); }
        }

        .emo-game-pacman { animation: pacmanChomp 0.35s ease-in-out infinite alternate; transform-origin: 40px 42px; }
        @keyframes pacmanChomp {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(35deg); }
        }

        .emo-dot-1 { animation: dotFade 0.7s infinite alternate; }
        .emo-dot-2 { animation: dotFade 0.7s infinite alternate 0.2s; }
        .emo-dot-3 { animation: dotFade 0.7s infinite alternate 0.4s; }
        @keyframes dotFade {
          0% { opacity: 0.3; }
          100% { opacity: 1; }
        }

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
    </button>
  )
}
