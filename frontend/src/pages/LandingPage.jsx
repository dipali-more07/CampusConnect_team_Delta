import { useState, useEffect } from 'react'
import campusHero from '../assets/campus-hero.png'
import campusAuditorium from '../assets/campus-auditorium.png'
import dashboardLaptop from '../assets/dashboard-laptop.png'
import { ArrowUpRight, Mail, CalendarCheck, MapPin,CalendarDays, LogIn, UserPlus } from 'lucide-react'

const BRAND = '#173dd1'

/*tiny helpers */
const NavLink = ({ children }) => (
  <a
    href="#"
    className="text-sm text-slate-600 hover:text-[#173dd1] transition-colors duration-200"
  >
    {children}
  </a>
)

const Pill = ({ children }) => (
  <span className="px-4 py-1.5 rounded-full bg-teal-50 text-teal-600 text-sm font-medium border border-teal-100">
    {children}
  </span>
)

const Check = ({ children }) => (
  <li className="flex items-start gap-3 text-slate-600 text-sm">
    <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[#173dd1]/10 flex items-center justify-center text-[#173dd1] text-xs font-bold">
      ✓
    </span>
    {children}
  </li>
)

/*main component */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [isSignupOpen, setIsSignupOpen] = useState(false)
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupRole, setSignupRole] = useState('Participant')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-900 font-['Manrope',sans-serif] overflow-x-hidden">

      {/*NAVBAR*/}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
            ? 'bg-white/90 backdrop-blur-lg shadow-sm border-b border-slate-100'
            : 'bg-white/80 backdrop-blur-md'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="text-xl font-black tracking-tight">
            imagine<span className="text-[#173dd1]">.bo</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink>Home</NavLink>
            <NavLink>Events</NavLink>
            <NavLink>Dashboard</NavLink>
            <NavLink>Profile</NavLink>
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex  items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="px-4 py-2 text-sm flex flex-row gap-2 font-bold text-[#173dd1] rounded-full hover:bg-[#173dd1]/10 transition-colors duration-200"
            >
              <LogIn size={16}/> Log In
            </button>
            <button
              onClick={() => setIsSignupOpen(true)}
              className="px-5 py-2 text-sm flex flex-row gap-2 font-bold bg-[#173dd1] text-white rounded-full hover:bg-[#122fb0] transition-colors duration-200 shadow-md shadow-[#173dd1]/20"
            >
              <UserPlus size={16}/>Sign Up
            </button>
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden text-slate-600 hover:text-slate-900"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 flex flex-col gap-4">
            {['Home', 'Events', 'Dashboard', 'Profile'].map(l => (
              <a key={l} href="#" className="text-sm text-slate-600 hover:text-[#173dd1]">{l}</a>
            ))}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button onClick={() => setIsSidebarOpen(true)} className="flex-1 py-2 text-sm font-semibold text-[#173dd1] border border-[#173dd1]/30 rounded-full">Log In</button>
              <button onClick={() => setIsSignupOpen(true)} className="flex-1 py-2 text-sm font-semibold bg-[#173dd1] text-white rounded-full">Sign Up</button>
            </div>
          </div>
        )}
      </header>

      {/*HERO*/}
      <section className="relative min-h-screen flex items-end pb-24 pt-16 mt-16 overflow-hidden">
        {/* BG image */}
        <div className="absolute inset-0">
          <img
            src={campusHero}
            alt="Campus aerial view"
            className="w-full h-full object-cover object-center"
          />
          {/* dark gradient from bottom */}
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/30 to-black/10" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight mb-5 max-w-2xl">
            Campus Events,<br />Reimagined
          </h1>
          <p className="text-base md:text-lg text-white/70 max-w-md mb-10 leading-relaxed">
            Discover, register, and manage university events in one place. Built for participants, organizers, and admins.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-7 py-3.5 text-sm font-bold bg-white text-slate-900 rounded-full hover:bg-slate-100 transition-colors shadow-lg">
              Browse Events
            </button>
            <button className="px-7 py-3.5 text-sm font-bold border border-white text-white rounded-full hover:bg-white/10 transition-colors">
              Get Started
            </button>
          </div>
            <button className='px-7 py-3.5 text-sm absolute bottom right-0 font-medium border border-white text-white rounded-2xl bg-white/10 transition-colors'>
              All-in-one event platform 
            </button>
        </div>
      </section>
      {/* EVENTS SECTION*/}
      <section className="py-20 max-w-7xl mx-auto px-6">
        {/* Heading */}
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Events</h2>
          <p className="text-slate-500 text-base">
            Browse upcoming events, register, and manage your schedule.
          </p>
        </div>

        {/* Filter row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10">
          {/* Search */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#173dd1] focus:ring-2 focus:ring-[#173dd1]/20 transition"
            />
          </div>

          {/* Filter icon */}
          <button className="flex items-center gap-2 px-4 py-3 rounded-full border border-slate-200 text-slate-500 hover:border-[#173dd1] hover:text-[#173dd1] transition text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4h18M7 10h10M11 16h2" />
            </svg>
            Filters
          </button>

          {/* Category dropdown */}
          <select className="px-4 py-3 rounded-full border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:border-[#173dd1] focus:ring-2 focus:ring-[#173dd1]/20 transition">
            <option>All Categories</option>
            <option>Workshops</option>
            <option>Competitions</option>
            <option>Cultural</option>
            <option>Sports</option>
          </select>

          {/* Date dropdown */}
          <select className="px-4 py-3 rounded-full border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:border-[#173dd1] focus:ring-2 focus:ring-[#173dd1]/20 transition">
            <option>All Dates</option>
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>

        {/* Empty state */}
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <div className="text-4xl mb-4 flex items-center justify-center"><CalendarDays size={55} color='#64748B'/></div>
          <p className="text-slate-500 text-sm">No events found. Try adjusting your filters.</p>
        </div>
      </section>

      {/*FEATURE 1 — Connect with Campus*/}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image — left */}
            <div className="rounded-2xl overflow-hidden shadow-xl shadow-slate-200">
              <img
                src={campusAuditorium}
                alt="Students at a campus event"
                className="w-full h-72 lg:h-96 object-cover"
              />
            </div>

            {/* Text — right */}
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-5">
                Connect with the<br />Campus Community
              </h2>
              <p className="text-slate-500 text-base leading-relaxed mb-8">
                From hackathons to cultural fests, find events that match your interests.
                Register in seconds, receive QR passes, and track attendance seamlessly.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Workshops', 'Competitions', 'Cultural', 'Sports'].map(tag => (
                  <Pill key={tag}>{tag}</Pill>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 2 — Organizer Tools*/}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text — left */}
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-5">
                Powerful Tools<br />for Organizers
              </h2>
              <p className="text-slate-500 text-base leading-relaxed mb-8">
                Manage registrations, track payments, and verify attendance with QR scanning.
                Get real-time analytics and keep participants informed with built-in notifications.
              </p>
              <ul className="flex flex-col gap-4">
                <Check>Real-time registration tracking</Check>
                <Check>QR-based attendance</Check>
                <Check>Automated notifications</Check>
                <Check>Financial summaries</Check>
              </ul>
            </div>

            {/* Image — right */}
            <div className="rounded-2xl overflow-hidden shadow-xl shadow-slate-200">
              <img
                src={dashboardLaptop}
                alt="Analytics dashboard on laptop"
                className="w-full h-72 lg:h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/*CTA BANNER*/}
      <section className="py-20">
        <div className="w-full mx-auto bg-[#173dd1] px-10 py-16 text-center text-white">
          <h2 className="text-3xl md:text-5xl font-black mb-5 leading-tight">
            Ready to host or join?
          </h2>
          <p className="text-white/75 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Whether you are organizing the next big campus event or looking to participate,
            our platform makes it effortless.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-8 duration-300 hover:-translate-y-1 hover:scale-105 py-3.5 text-sm font-bold bg-white text-[#173dd1] rounded-full hover:bg-slate-100 transition shadow-lg shadow-black/10">
              Sign Up Free
            </button>
            <button className="px-8 transition-all duration-300 hover:-translate-y-1 hover:scale-105 py-3.5 text-sm font-bold border-2 border-white text-white rounded-full hover:bg-white/10">
              Explore Events
            </button>
          </div>
        </div>
      </section>

      {/*FOOTER*/}
      <footer className="bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-14">
          {/* Top 3-col grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* About */}
            <div>
              <p className="text-xl font-black mb-4">
                imagine<span className="text-[#173dd1]">.bo</span>
              </p>
              <p className="text-sm text-slate-500 leading-relaxed">
                The next-gen event platform for participants, organizers, and admins.
                Discover, manage, and celebrate—seamlessly.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Quick Links
              </p>
              <ul className="flex flex-col gap-2">
                {['Home', 'Events', 'Dashboard', 'Profile'].map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm font-semibold flex text-slate-600 hover:text-[#173dd1] transition-colors">
                      {l} <ArrowUpRight size={15}/>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Contact
              </p>
              <ul className="flex flex-col gap-3">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <span><Mail size={16} color='#173dd1'/></span> hello@imagine.bo
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <span><MapPin size={16} color='#173dd1'/></span> Global Events, Online &amp; On-site
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <span><CalendarCheck size={16} color='#173dd1'/></span> 24/7 Event Support
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              © 2026 imagine.bo. All rights reserved.
            </p>
            <div className="flex gap-5">
              <a href="#" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Privacy</a>
              <a href="#" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      {/* LOGIN SIDEBAR OVERLAY */}
      {/* Backdrop */}
      <div
        onClick={() => setIsSidebarOpen(false)}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900">Log In</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-xs font-semibold text-slate-500 border border-slate-200 rounded-full px-3 py-1 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4 px-4 pt-4">
          <input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-black text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#173dd1] focus:ring-2 focus:ring-[#173dd1]/20 transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-black text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#173dd1] focus:ring-2 focus:ring-[#173dd1]/20 transition"
          />
          <button
            className="w-full py-3 text-sm font-bold bg-[#173dd1] text-white rounded-lg hover:bg-[#122fb0] transition-colors shadow-md shadow-[#173dd1]/20 mt-1"
          >
            Log In
          </button>
          <p className="text-sm text-slate-500 text-center">
            No account?{' '}
            <button onClick={() => { setIsSidebarOpen(false); setIsSignupOpen(true) }} className="text-[#173dd1] font-semibold hover:underline">Sign up</button>
          </p>
        </div>
      </div>

      {/* SIGNUP SIDEBAR OVERLAY */}
      {/* Backdrop */}
      <div
        onClick={() => setIsSignupOpen(false)}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isSignupOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Signup Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isSignupOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900">Sign Up</h2>
          <button
            onClick={() => setIsSignupOpen(false)}
            className="text-xs font-semibold text-slate-500 border border-slate-200 rounded-full px-3 py-1 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4 px-4 pt-4">
          <input
            type="text"
            placeholder="Full Name"
            value={signupName}
            onChange={e => setSignupName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-black text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#173dd1] focus:ring-2 focus:ring-[#173dd1]/20 transition"
          />
          <input
            type="email"
            placeholder="Email"
            value={signupEmail}
            onChange={e => setSignupEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-black text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#173dd1] focus:ring-2 focus:ring-[#173dd1]/20 transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={signupPassword}
            onChange={e => setSignupPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-black text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#173dd1] focus:ring-2 focus:ring-[#173dd1]/20 transition"
          />
          <select
            value={signupRole}
            onChange={e => setSignupRole(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-black text-sm text-slate-700 focus:outline-none focus:border-[#173dd1] focus:ring-2 focus:ring-[#173dd1]/20 transition bg-white"
          >
            <option>Participant</option>
            <option>Organizer</option>
            <option>Admin</option>
          </select>
          <button
            className="w-full py-3 text-sm font-bold bg-[#173dd1] text-white rounded-lg hover:bg-[#122fb0] transition-colors shadow-md shadow-[#173dd1]/20 mt-1"
          >
            Create Account
          </button>
          <p className="text-sm text-slate-500 text-center">
            Already have an account?{' '}
            <button onClick={() => { setIsSignupOpen(false); setIsSidebarOpen(true) }} className="text-[#173dd1] font-semibold hover:underline">Log in</button>
          </p>
        </div>
      </div>

    </div>
  )
}
