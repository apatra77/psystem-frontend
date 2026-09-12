import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { colors } from '@/app/themes/colors'

/**
 * Custom dropdown styled for the MEDIQ dark theme.
 * Avoids native `<select>` menus that render with OS light styling on Windows.
 */
export default function DropdownSelect({
  value,
  onChange,
  options = [],
  className = '',
  minWidth = 180,
  align = 'left',
  fullWidth = false,
  ariaLabel = 'Select option',
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => (option.value ?? option.id) === value)
  const panelAlign = align === 'right' ? 'right-0' : 'left-0'

  return (
    <div
      className={`relative ${fullWidth ? 'w-full' : 'flex-shrink-0'} ${className}`}
      style={fullWidth ? undefined : { minWidth }}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 rounded-[11px] px-3 py-2 text-[12.5px] font-bold cursor-pointer ${
          fullWidth ? 'w-full' : 'w-full'
        }`}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${colors.borderSubtle}`,
          color: colors.textBright,
        }}
      >
        <span className="min-w-0 flex-1 truncate text-left">{selected?.label ?? 'Select…'}</span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: colors.textDim }}
          aria-hidden="true"
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            aria-label={ariaLabel}
            className={`absolute ${panelAlign} top-[calc(100%+6px)] z-50 max-h-[240px] min-w-full overflow-y-auto rounded-[12px] p-1.5 shadow-2xl`}
            style={{
              background: 'rgba(10,28,22,0.98)',
              border: `1px solid ${colors.borderStrong}`,
            }}
          >
            {options.map((option) => {
              const optionValue = option.value ?? option.id
              const isSelected = optionValue === value

              return (
                <li key={String(optionValue)} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(optionValue)
                      setOpen(false)
                    }}
                    className="w-full rounded-[8px] px-3 py-2 text-left text-[12.5px] font-semibold cursor-pointer transition hover:bg-white/5"
                    style={{ color: isSelected ? colors.accent : colors.textHighlight }}
                  >
                    {option.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
