import { colors } from '@/app/themes/colors'

export default function PortalModal({ onClose, children, width = 520 }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ background: 'rgba(4,10,8,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-w-[92vw] max-h-[88vh] overflow-y-auto rounded-[22px] shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
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
