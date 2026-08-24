import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function CustomSelect({
  value,
  onChange,
  options: optionsProp,
  children,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  style = {},
  name = '',
  id = '',
  icon: LeadingIcon = null,
  label = null,
  required = false,
  dark: darkOverride = undefined,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Retrieve theme context safely
  let darkContext = false
  let accentColorContext = '#615FFF'
  try {
    const theme = useTheme()
    if (theme) {
      darkContext = theme.dark ?? false
      accentColorContext = theme.accentColor || '#615FFF'
    }
  } catch (e) {
    // Fallback if rendered outside ThemeProvider
    darkContext = document.documentElement.classList.contains('dark')
  }

  const isDark = darkOverride !== undefined ? darkOverride : darkContext
  const accent = accentColorContext || '#615FFF'

  // Extract options array either from options prop or by parsing <option> children
  let normalizedOptions = []

  if (Array.isArray(optionsProp)) {
    normalizedOptions = optionsProp.map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value ?? opt.id ?? '',
          label: opt.label ?? opt.name ?? opt.text ?? String(opt.value ?? ''),
          disabled: !!opt.disabled,
        }
      }
      return { value: String(opt), label: String(opt), disabled: false }
    })
  } else if (children) {
    React.Children.forEach(children, child => {
      if (React.isValidElement(child)) {
        const childVal = child.props.value !== undefined ? child.props.value : child.props.children
        const childLabel = child.props.children !== undefined ? child.props.children : child.props.value
        normalizedOptions.push({
          value: childVal !== undefined && childVal !== null ? String(childVal) : '',
          label: typeof childLabel === 'string' || typeof childLabel === 'number' ? String(childLabel) : childVal,
          disabled: !!child.props.disabled,
        })
      }
    })
  }

  // Find currently selected option
  const selectedOption = normalizedOptions.find(opt => String(opt.value) === String(value))

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (option) => {
    if (option.disabled || disabled) return
    setIsOpen(false)

    if (onChange) {
      // Create a synthetic event object for standard form compatibility
      const event = {
        target: {
          name,
          id,
          value: option.value,
        },
      }
      // Call handler with event (and also pass raw value as 2nd arg)
      onChange(event, option.value)
    }
  }

  // Colors based on theme
  const bgTrigger = isDark ? '#0f172a' : '#ffffff'
  const borderTrigger = isOpen
    ? accent
    : (isDark ? '#1e2d45' : '#cbd5e1')
  const bgMenu = isDark ? '#11192c' : '#ffffff'
  const borderMenu = isDark ? '#1e2d45' : '#e2e8f0'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'
  const shadowMenu = isDark ? '0 16px 40px rgba(0, 0, 0, 0.7)' : '0 12px 30px rgba(0, 0, 0, 0.12)'

  return (
    <div className={`relative inline-block w-full ${className}`} ref={dropdownRef}>
      {label && (
        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          {label}
          {required && <span className="text-red-500 font-bold ml-1" title="Required field">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 text-left border cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          background: bgTrigger,
          color: textColor,
          borderColor: borderTrigger,
          boxShadow: isOpen ? `0 0 0 3px ${accent}25` : 'none',
          ...style,
        }}
      >
        <div className="flex items-center gap-2 truncate min-w-0 pr-2">
          {LeadingIcon && <LeadingIcon size={16} style={{ color: accent }} className="shrink-0" />}
          <span className="truncate">
            {selectedOption ? selectedOption.label : (value !== '' && value !== undefined ? String(value) : placeholder)}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 ml-1 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-400' : (isDark ? 'text-slate-400' : 'text-slate-500')
          }`}
        />
      </button>

      {/* Floating Options Menu */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1.5 w-full rounded-xl border overflow-hidden z-50 p-1.5 max-h-60 overflow-y-auto"
          style={{
            background: bgMenu,
            borderColor: borderMenu,
            boxShadow: shadowMenu,
          }}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 text-center">No options available</div>
          ) : (
            normalizedOptions.map((opt, index) => {
              const isSelected = String(opt.value) === String(value)
              return (
                <button
                  key={`${opt.value}-${index}`}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-[13px] font-semibold text-left transition-all duration-150 border-none cursor-pointer my-0.5 ${
                    opt.disabled ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                  style={{
                    background: isSelected ? accent : 'transparent',
                    color: isSelected ? '#ffffff' : textColor,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !opt.disabled) {
                      e.currentTarget.style.background = isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !opt.disabled) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={15} className="shrink-0 ml-2 text-white" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
