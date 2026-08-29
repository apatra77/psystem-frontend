import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { colors } from '@/theme/colors'

export default function PortalModal({
  onClose,
  children,
  width = 520,
  scrollable = true,
  closeOnBackdrop = true,
  minHeight,
  maxHeight,
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ background: 'rgba(4,10,8,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        className={`max-w-[92vw] rounded-[22px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'}`}
        style={{
          width,
          minHeight,
          maxHeight: maxHeight ?? (scrollable ? '88vh' : undefined),
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
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const ref = useRef(null)
  const inputRef = useRef(null)
  const selected = options.find((opt) => opt.value === value)

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (opt) =>
        String(opt.label ?? '').toLowerCase().includes(q) ||
        String(opt.value ?? '').toLowerCase().includes(q),
    )
  }, [options, query])

  const closeDropdown = () => {
    setOpen(false)
    setQuery('')
    setHighlightIndex(0)
  }

  const openDropdown = () => {
    if (disabled || open) return
    setOpen(true)
    setQuery(selected?.label ?? '')
    setHighlightIndex(0)
    requestAnimationFrame(() => inputRef.current?.select())
  }

  const selectOption = (opt) => {
    onChange({ target: { value: opt.value } })
    closeDropdown()
  }

  useEffect(() => {
    if (!open) return undefined
    const handleClick = (event) => {
      if (!ref.current?.contains(event.target)) closeDropdown()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    setHighlightIndex(0)
  }, [query])

  const handleKeyDown = (event) => {
    if (disabled) return

    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openDropdown()
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeDropdown()
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightIndex((prev) => Math.min(prev + 1, Math.max(filteredOptions.length - 1, 0)))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightIndex((prev) => Math.max(prev - 1, 0))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const option = filteredOptions[highlightIndex]
      if (option) selectOption(option)
    }
  }

  const displayValue = open ? query : (selected?.label ?? '')

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={displayValue}
          placeholder={placeholder}
          onFocus={openDropdown}
          onChange={(event) => {
            setQuery(event.target.value)
            if (!open) setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          className="w-full rounded-[10px] px-3 py-2 pr-8 text-[13px] text-white font-[inherit] outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.16)',
            color: displayValue ? '#ffffff' : colors.textDim,
          }}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-haspopup="listbox"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => (open ? closeDropdown() : openDropdown())}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={open ? 'Close options' : 'Open options'}
          tabIndex={-1}
        >
          <ChevronDown
            size={14}
            strokeWidth={2.2}
            style={{
              color: colors.textDim,
              flexShrink: 0,
              transform: open ? 'rotate(180deg)' : undefined,
              transition: 'transform 0.15s ease',
            }}
          />
        </button>
      </div>
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
          {filteredOptions.length === 0 ? (
            <div
              className="px-3 py-2 text-[12px] font-bold"
              style={{ color: colors.textDim }}
            >
              No matches found
            </div>
          ) : (
            filteredOptions.map((opt, index) => {
              const isSelected = opt.value === value
              const isHighlighted = index === highlightIndex
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => selectOption(opt)}
                  className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] font-bold cursor-pointer transition-colors hover:bg-[rgba(64,222,170,0.08)]"
                  style={{
                    color: isSelected || isHighlighted ? colors.accent : '#cfe6dc',
                    background:
                      isSelected || isHighlighted ? 'rgba(64,222,170,0.1)' : 'transparent',
                  }}
                >
                  {opt.label}
                </button>
              )
            })
          )}
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
