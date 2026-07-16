import React, { useState, useEffect } from 'react'
import { Award, Download, ExternalLink, ShieldCheck } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import studentService from '../../services/studentService'

export default function CertificatesPage({ tokens, user }) {
  const { accentColor } = useTheme()
  const BRAND = accentColor || '#615FFF'

  const [certificatesList, setCertificatesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCert, setSelectedCert] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    studentService.fetchCertificatesData().then(res => {
      if (cancelled) return
      if (res.success) {
        setCertificatesList(res.data)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="p-6 flex flex-col gap-6">

      {/* Top Banner Card */}
      <div
        className="rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border shadow-sm"
        style={{
          background: tokens.dark ? '#0f1e30' : '#ffffff',
          borderColor: tokens.dark ? '#1a3050' : '#e2e8f0',
        }}
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2 bg-emerald-500/10 text-emerald-500">
            <Award size={14} /> My Certificates
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white m-0">
            Earned Certificates & Badges
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-[#7a98bb] mt-1 m-0">
            Download verified digital certificates issued for your event participations.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#162640] border border-slate-200 dark:border-[#1a3050] text-xs font-bold text-slate-700 dark:text-slate-200">
          <ShieldCheck size={16} className="text-emerald-500" /> 12 Verified Badges
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificatesList.map((cert) => (
          <div
            key={cert.id}
            className="group relative rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between"
            style={{
              background: tokens.dark ? '#0f1e30' : '#ffffff',
              borderColor: tokens.dark ? '#1a3050' : '#e2e8f0',
              boxShadow: tokens.shadow,
            }}
          >
            {/* Top Certificate Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${BRAND}, #4338ca)` }}
                >
                  <Award size={24} />
                </div>
                <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-[#162640] text-slate-500 dark:text-[#7a98bb] border border-slate-200 dark:border-[#1a3050]">
                  {cert.verifyCode}
                </span>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {cert.position}
              </span>

              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2 mb-1 tracking-tight">
                {cert.event}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-[#7a98bb] m-0">
                Issued on: {cert.issueDate} • Department: {user?.department || 'Computer Science'}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1a3050] flex items-center gap-3">
              <button
                onClick={() => setSelectedCert(cert)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: BRAND }}
              >
                <Download size={14} /> Download PDF
              </button>
              <button
                onClick={() => setSelectedCert(cert)}
                className="px-3.5 py-2.5 rounded-xl font-bold text-xs border border-slate-200 dark:border-[#1e2d45] text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[#162640] hover:bg-slate-100 dark:hover:bg-[#1e2d45] cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <ExternalLink size={14} /> Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Certificate Modal Preview */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c1829] border border-slate-200 dark:border-[#1a3050] rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl relative">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg" style={{ background: BRAND }}>
              <Award size={32} />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white m-0">Certificate of Achievement</h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">Verified by CampusConnect University Platform</p>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#162640] border border-slate-200 dark:border-[#1a3050] text-left text-xs space-y-2 mb-6">
              <p><strong className="text-slate-900 dark:text-white">Awarded to:</strong> {user?.name || 'Arjun Sharma'}</p>
              <p><strong className="text-slate-900 dark:text-white">Event:</strong> {selectedCert.event}</p>
              <p><strong className="text-slate-900 dark:text-white">Achievement:</strong> {selectedCert.position}</p>
              <p><strong className="text-slate-900 dark:text-white">Verification Code:</strong> {selectedCert.verifyCode}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedCert(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs border border-slate-200 dark:border-[#1a3050] text-slate-600 dark:text-slate-300 bg-transparent cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => setSelectedCert(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white border-none cursor-pointer"
                style={{ background: BRAND }}
              >
                Download Certificate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
