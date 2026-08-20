import { useState, useEffect } from 'react'
import { ChevronDown, MessageCircleQuestion, HelpCircle, Bot, GraduationCap, CalendarDays, ArrowLeft, Home } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const faqCategories = [
  {
    id: 'general',
    title: 'General',
    icon: <HelpCircle className="w-5 h-5 text-indigo-500" />,
    faqs: [
      {
        question: 'What is CampusConnect?',
        answer:
          'CampusConnect is a centralized platform where students can discover campus events, hackathons, and technical workshops. It also provides powerful tools for organizers to seamlessly create, manage, and host these events.',
      },
      {
        question: 'Who is Camy (Emo Bot) and how can it help me?',
        answer:
          'Camy is our AI campus buddy! It helps you by recommending personalized events, guiding you to your certificates, and even assisting organizers in drafting catchy event descriptions. You can interact with Camy using both text and voice!',
      },
      {
        question: 'How do I reset my password?',
        answer:
          'If you forget your password, simply click on "Forgot Password" on the login page. Alternatively, if you are logged in, you can update it anytime from the Change Password option in your Profile settings.',
      },
      {
        question: 'Are there any fees associated with using CampusConnect?',
        answer:
          'No, CampusConnect is completely free to use for students. However, some specific events or workshops hosted by organizers might require a registration fee, which will be clearly mentioned on the event details page.',
      },
    ]
  },
  {
    id: 'student',
    title: 'For Students',
    icon: <GraduationCap className="w-5 h-5 text-cyan-500" />,
    faqs: [
      {
        question: 'How do I register for an event or hackathon?',
        answer:
          'Head over to the "Events" section on your dashboard, click on any event you are interested in, and hit the "Register" button. All your registered events will be easily accessible in your "My Registrations" tab.',
      },
      {
        question: 'Can I cancel my event registration?',
        answer:
          'Yes, you can easily cancel your registration from the "My Registrations" section, provided the organizer of that specific event has allowed cancellations before the deadline.',
      },
      {
        question: 'How can I view or download my certificates and badges?',
        answer:
          'Absolutely! Once you participate in an event and your attendance is marked by the organizer, digital certificates and achievement badges will automatically appear in the "My Certificates" section of your profile. You can download or share them directly from there.',
      },
      {
        question: 'Will I receive notifications for upcoming events?',
        answer:
          'Yes! CampusConnect provides timely reminders and notifications about events you have registered for, as well as personalized recommendations based on your course and interests.',
      },
    ]
  },
  {
    id: 'organizer',
    title: 'For Organizers',
    icon: <CalendarDays className="w-5 h-5 text-emerald-500" />,
    faqs: [
      {
        question: 'How do I create a new event?',
        answer:
          'Log in to your Organizer dashboard, click on "Create Event", and fill out the event details. You can make your events public or restrict them to invite-only. If you need help with descriptions, just ask Camy!',
      },
      {
        question: 'How do I mark attendance for participants?',
        answer:
          'During or after the event, you can use the "Manage Attendees" panel on your organizer dashboard to quickly mark the attendance of all registered students. This triggers the automatic generation of their certificates.',
      },
      {
        question: 'How are certificates distributed to participants?',
        answer:
          'You don\'t have to worry about manual distribution! Once you mark a student\'s attendance as "Present", the system automatically generates and issues their digital certificate, which they can instantly download from their profile.',
      },
    ]
  }
]

function FAQ() {
  const navigate = useNavigate()
  // Store open state as a string combining category index and faq index, e.g., '0-1'
  const [openId, setOpenId] = useState('0-0')

  const toggleFAQ = (id) => {
    setOpenId(openId === id ? null : id)
  }

  useEffect(() => {
    document.title = "FAQ's · CampusConnect"

    return () => {
      document.title = 'CampusConnect'
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      
      {/* App Header/Navigation */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type='button'
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#6366f1] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                CampusConnect
              </span>
            </Link>
          </div>
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </Link>
        </div>
      </div>

      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-4">
            <MessageCircleQuestion className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
            Sabhi answers jo aapko CampusConnect use karne me madad karenge. Agar koi aur doubt ho, to Camy AI bot se puch sakte hain!
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-10">
          {faqCategories.map((category, catIndex) => (
            <div key={category.id} className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
              
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  {category.icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {category.title}
                </h2>
              </div>

              <div className="space-y-4">
                {category.faqs.map((faq, faqIndex) => {
                  const id = `${catIndex}-${faqIndex}`
                  const isOpen = openId === id

                  return (
                    <div
                      key={faqIndex}
                      className={`rounded-2xl transition-all duration-300 ${
                        isOpen ? 'bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <button
                        type='button'
                        onClick={() => toggleFAQ(id)}
                        className="flex w-full items-center justify-between p-5 text-left focus:outline-none"
                      >
                        <span className={`font-semibold text-lg transition-colors duration-200 ${isOpen ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'}`}>
                          {faq.question}
                        </span>
                        
                        <div className={`shrink-0 ml-4 p-1.5 rounded-full transition-colors duration-300 ${isOpen ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>
                          <ChevronDown
                            size={20}
                            className={`transition-transform duration-300 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>

                      <div 
                        className={`grid transition-all duration-300 ease-in-out ${
                          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="px-5 pb-6 pt-1 text-gray-600 dark:text-gray-400 leading-relaxed text-base">
                            {faq.answer}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>
          ))}
        </div>

        {/* Footer help section */}
        <div className="mt-12 sm:mt-16 text-center px-2 sm:px-0">
          <p className="text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 py-5 px-6 sm:py-6 sm:px-8 rounded-3xl inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 shadow-sm border border-gray-100 dark:border-gray-800 text-sm sm:text-base">
            <Bot className="w-8 h-8 text-cyan-500 animate-pulse shrink-0" />
            <span>Still have questions? Click on the <strong>Camy bot</strong> at the bottom right to ask anything!</span>
          </p>
        </div>

      </div>
    </div>
  )
}

export default FAQ