import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { colors } from '@/app/themes/colors'

export default function PortalModal({
  onClose,
  children,
  width = 520,
  accentBorder = false,
  scrollable = true,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(3,8,6,0.82)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`w-full max-w-[92vw] max-h-[90vh] rounded-[20px] ${
          scrollable ? 'overflow-y-auto' : 'overflow-hidden flex flex-col'
        }`}
        style={{
          width,
          background: 'linear-gradient(180deg, #0f221b 0%, #0a1712 100%)',
          border: accentBorder
            ? '1px solid rgba(64,222,170,0.32)'
            : `1px solid ${colors.border}`,
          boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 40px rgba(64,222,170,0.06)',
          animation: 'modalIn 0.22s cubic-bezier(0.2,0.7,0.2,1)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function ModalFieldLabel({ children }) {
  return (
    <div className="text-[11px] font-bold mb-1.5" style={{ color: colors.textSecondary }}>
      {children}
    </div>
  )
}

export function ModalInput({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-[10px] px-3 py-2.5 text-[13px] text-white font-[inherit] outline-none ${className}`}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.16)',
      }}
      {...props}
    />
  )
}

export function ModalSelect({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full rounded-[10px] px-3 py-2.5 text-[13px] text-white font-[inherit] outline-none ${className}`}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.16)',
      }}
      {...props}
    >
      {children}
    </select>
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
