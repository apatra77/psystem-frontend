import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { colors } from '@/theme/colors'

export default function PortalModal({
  onClose,
  children,
  width = 520,
  scrollable = true,
  closeOnBackdrop = true,
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ background: 'rgba(4,10,8,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        className={`max-w-[92vw] rounded-[22px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] max-h-[88vh] ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'}`}
        style={{
          width,
          background: '#0d211a',
          animation: 'modalIn 0.22s cubic-bezier(0.2,0.7,0.2,1)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}

export function ModalFieldLabel({ children }) {
  return (
    <div className="text-[11px] font-bold mb-1" style={{ color: colors.textSecondary }}>
      {children}
    </div>
  )
}

export function ModalInput({ className = '', disabled = false, style, ...props }) {
  return (
    <input
      disabled={disabled}
      className={`w-full rounded-[10px] px-3 py-2 text-[13px] text-white font-[inherit] outline-none disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.16)',
        ...style,
      }}
      {...props}
    />
  )
}

export function ModalSelect({
  className = '',
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find((opt) => opt.value === value)

  useEffect(() => {
    if (!open) return undefined
    const handleClick = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full rounded-[10px] px-3 py-2 text-[13px] font-[inherit] outline-none flex items-center justify-between gap-2 cursor-pointer text-left"
        style={{
          color: selected ? '#ffffff' : colors.textDim,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.16)',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown size={14} strokeWidth={2.2} style={{ color: colors.textDim, flexShrink: 0 }} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute top-[calc(100%+6px)] left-0 right-0 z-[300] rounded-[10px] p-1.5 owner-dropdown max-h-[200px] overflow-y-auto owner-scroll"
          style={{
            background: 'rgba(10,28,22,0.97)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.13)',
            boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange({ target: { value: opt.value } })
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] font-bold cursor-pointer transition-colors hover:bg-[rgba(64,222,170,0.08)]"
                style={{
                  color: isSelected ? colors.accent : '#cfe6dc',
                  background: isSelected ? 'rgba(64,222,170,0.1)' : 'transparent',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ModalTextarea({ className = '', rows = 2, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`w-full rounded-[10px] px-3 py-2 text-[13px] text-white font-[inherit] outline-none resize-none ${className}`}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.16)',
      }}
      {...props}
    />
  )
}

export function ToggleSwitch({ on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative inline-block w-[38px] h-[22px] rounded-full cursor-pointer flex-shrink-0"
      style={{ background: on ? colors.primaryBtn : 'rgba(255,255,255,0.16)' }}
      aria-pressed={on}
    >
      <span
        className="absolute top-0.5 left-0 w-[18px] h-[18px] rounded-full bg-white transition-transform duration-150"
        style={{ transform: on ? 'translateX(17px)' : 'translateX(2px)' }}
      />
    </button>
  )
}
