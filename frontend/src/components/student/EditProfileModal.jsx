import React, { useState, useEffect, useRef } from 'react'
import { X, Camera, User, Building2, BookOpen, Mail, Phone, Calendar, Star, Info } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import studentService from '../../services/studentService'
import ImageCropperModal from '../common/ImageCropperModal'

export default function EditProfileModal({ isOpen, onClose, user, onProfileUpdated }) {
  const { dark, accentColor, tokens } = useTheme()
  const BRAND = accentColor || '#615FFF'
  const showToast = useToast()
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    name: '',
    college: '',
    course: '',
    email: '',
    mobile: '',
    gender: 'male',
    department: '',
    yearOfStudy: 1,
    bio: '',
    avatarUrl: null
  })
  const [submitting, setSubmitting] = useState(false)

  // Image Cropper States
  const [rawImageSrc, setRawImageSrc] = useState(null)
  const [cropperOpen, setCropperOpen] = useState(false)

  // Sync form state when the modal is opened
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || user.full_name || '',
        college: user.college || user.college_id || '',
        course: user.course || '',
        email: user.email || '',
        mobile: user.mobile || user.phone || '',
        gender: user.gender || 'male',
        department: user.department || '',
        yearOfStudy: user.year_of_study || user.yearOfStudy || 1,
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || user.profile_image || (typeof user.avatar === 'string' && (user.avatar.startsWith('data:') || user.avatar.startsWith('http')) ? user.avatar : null)
      })
    }
  }, [isOpen, user])

  if (!isOpen) return null

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file.', 'error')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setRawImageSrc(reader.result)
        setCropperOpen(true)
      }
      reader.readAsDataURL(file)
      // Reset input value to allow selecting same file again
      e.target.value = ''
    }
  }

  const handleCropComplete = (croppedDataUrl) => {
    setFormData(prev => ({
      ...prev,
      avatarUrl: croppedDataUrl,
      avatar: croppedDataUrl,
      profile_image: croppedDataUrl
    }))
    showToast('Photo cropped! Click Save Changes to apply.', 'success')
  }

  const handleChange = (e) => {
    let { name, value } = e.target
    if (name === 'mobile') {
      value = value.replace(/\D/g, '').slice(0, 10)
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const res = await studentService.updateStudentProfile(formData)
    setSubmitting(false)

    if (res.success) {
      showToast('Profile updated successfully!', 'success')
      if (onProfileUpdated) onProfileUpdated(res.data)
      onClose()
    } else {
      showToast(res.message || 'Failed to update profile.', 'error')
    }
  }

  const avatarImg = formData.avatarUrl || user?.avatarUrl || user?.profile_image || (typeof user?.avatar === 'string' && (user.avatar.startsWith('data:') || user.avatar.startsWith('http')) ? user.avatar : null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={rawImageSrc}
        onCropComplete={handleCropComplete}
        BRAND={BRAND}
      />

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        className="relative z-10 w-full max-w-xl rounded-3xl transition-colors duration-300 shadow-2xl overflow-hidden p-6 sm:p-7 flex flex-col max-h-[90vh]"
        style={{
          background: dark ? '#0c1626' : '#ffffff',
          border: `1px solid ${dark ? '#1b2a42' : '#e2e8f0'}`,
          color: dark ? '#f8fafc' : '#0f172a',
          animation: 'modalScaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1b2a42] shrink-0">
          <h3 className="text-lg font-extrabold m-0 text-slate-900 dark:text-white">Edit Profile</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a2d48] border-none bg-transparent cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col overflow-hidden">
          {/* Scrollable Container */}
          <div className="overflow-y-auto pr-1.5 flex flex-col gap-5 max-h-[60vh] custom-scrollbar">
            {/* Avatar & Change Photo Section */}
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-md shrink-0 overflow-hidden relative group"
                style={{ background: BRAND }}
              >
                {avatarImg ? (
                  <img src={avatarImg} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.avatar || (formData.name ? formData.name.substring(0, 2).toUpperCase() : 'AS')
                )}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <Camera size={16} color="#fff" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#14233a] border border-slate-200 dark:border-[#213554] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1c304f] cursor-pointer transition-colors flex items-center gap-2"
              >
                <Camera size={15} />
                <span>Change Photo</span>
              </button>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111f36] border border-slate-200 dark:border-[#1d304d] text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* College ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">College / College ID</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111f36] border border-slate-200 dark:border-[#1d304d] text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Course */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Course</label>
                <div className="relative">
                  <BookOpen size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111f36] border border-slate-200 dark:border-[#1d304d] text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Email (Read-Only) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>Email</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#15253e] text-slate-400">Locked</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100/60 dark:bg-[#111f36]/40 border border-slate-200/60 dark:border-[#1d304d]/40 text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Mobile */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mobile</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111f36] border border-slate-200 dark:border-[#1d304d] text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Gender</label>
                <div className="relative">
                  <Star size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111f36] border border-slate-200 dark:border-[#1d304d] text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors appearance-none"
                    style={{ backgroundPosition: 'calc(100% - 14px) 50%' }}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Department */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111f36] border border-slate-200 dark:border-[#1d304d] text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Year of Study */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Year of Study</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    name="yearOfStudy"
                    value={formData.yearOfStudy}
                    onChange={handleChange}
                    required
                    min="1"
                    max="6"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111f36] border border-slate-200 dark:border-[#1d304d] text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Bio (Full Width) */}
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bio</label>
                <div className="relative">
                  <Info size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="2.5"
                    placeholder="Tell us about yourself..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111f36] border border-slate-200 dark:border-[#1d304d] text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors resize-none custom-scrollbar"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1b2a42] mt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#14233a] border border-slate-200 dark:border-[#213554] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1a2d48] cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white border-none cursor-pointer shadow-lg hover:opacity-90 transition-opacity"
              style={{ background: BRAND }}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${dark ? '#1b2a42' : '#cbd5e1'};
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
