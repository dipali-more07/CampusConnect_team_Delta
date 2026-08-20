import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import EmoBotCharacter from '../components/common/EmoBotCharacter'

export default function NotFoundPage() {
  const [mood, setMood] = useState('sad')

  useEffect(() => {
    // Emo character occasionally shifts mood
    const interval = setInterval(() => {
      setMood(prev => prev === 'sad' ? 'sleepy' : 'sad')
    }, 6000)

    document.title = 'Page not found · CampusConnect'

    // Hide the global CampusBotWidget on this page
    const style = document.createElement('style')
    style.innerHTML = '#global-campus-bot { display: none !important; }'
    document.head.appendChild(style)

    return () => {
      clearInterval(interval)
      style.remove()
      document.title = 'CampusConnect'
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-950 dark:to-gray-900 relative overflow-hidden">
      
      {/* Background Decorative Blur Elements */}
      <div className="absolute top-[-5%] left-[-10%] w-[15rem] h-[15rem] sm:w-[30rem] sm:h-[30rem] bg-indigo-500/20 rounded-full blur-3xl animate-pulse mix-blend-multiply dark:mix-blend-screen duration-1000" />
      <div className="absolute bottom-[-5%] right-[-10%] w-[15rem] h-[15rem] sm:w-[30rem] sm:h-[30rem] bg-cyan-500/20 rounded-full blur-3xl animate-pulse mix-blend-multiply dark:mix-blend-screen" style={{ animationDelay: '2s', animationDuration: '4s' }} />
      
      <div className="text-center w-full max-w-lg z-10 flex flex-col items-center">
        
        {/* Animated Emo Character */}
        <div className="mb-2 sm:mb-4 transform hover:scale-110 transition-transform duration-500 cursor-pointer animate-[bounce_3s_infinite]" onClick={() => setMood('excited')}>
          <div className="scale-75 sm:scale-100">
            <EmoBotCharacter size={140} mood={mood} isWaving={mood === 'excited'} />
          </div>
        </div>

        {/* 404 Text */}
        <div className="relative">
          <div className="text-7xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 tracking-tighter drop-shadow-2xl">
            404
          </div>
        </div>

        <h1 className="mt-4 sm:mt-6 text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Oops! Page Not Found
        </h1>

        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-md mx-auto px-2">
          It seems Emo couldn't find the page you were looking for. It might have been moved or doesn't exist.
        </p>

        <div className="mt-8 sm:mt-10 flex justify-center gap-3 sm:gap-4 flex-col sm:flex-row w-full sm:w-auto px-2 sm:px-0">
          <button
            type='button'
            onClick={() => window.history.back()}
            className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300 transform hover:-translate-y-1 shadow-sm hover:shadow-md"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>

          <Link
            to="/"
            className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white font-semibold transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl shadow-indigo-500/30"
          >
            <Home size={20} className="group-hover:scale-110 transition-transform" />
            Take Me Home
          </Link>
        </div>
      </div>
    </div>
  )
}