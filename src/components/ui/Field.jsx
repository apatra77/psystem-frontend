import { useState } from 'react'
import { AlertCircle, Check } from 'lucide-react'
import { colors } from '../../theme/colors'

export default function Field({
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  children,
}) {
  const [focused, setFocused] = useState(false)
  const valid = value.length > 0 && !error

  return (
    <div>
      <label
        className="block text-xs font-bold uppercase tracking-wider mb-1.5"
        style={{ color: colors.textDim }}
      >
        {label}
      </label>
      <div
        className="relative flex items-center rounded-2xl border-2 transition-all duration-200"
        style={
          error
            ? {
                borderColor: '#ff8a80',
                background: 'rgba(255,138,128,0.08)',
              }
            : focused
              ? {
                  borderColor: colors.accent,
                  background: 'rgba(255,255,255,0.06)',
                  boxShadow: '0 0 0 4px rgba(64,222,170,0.12)',
                }
              : {
                  borderColor: 'rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                }
        }
      >
        <Icon
          size={15}
          className="absolute left-3.5 flex-shrink-0 transition-colors"
          style={{
            color: error ? '#ff8a80' : focused ? colors.accent : colors.textDim,
          }}
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent pl-10 pr-10 py-3 text-sm outline-none"
          style={{ color: colors.textBright }}
        />
        {children}
        {!children && valid && (
          <Check size={14} className="absolute right-3.5 text-[#40deaa]" strokeWidth={2.5} />
        )}
        {error && !children && (
          <AlertCircle size={14} className="absolute right-3.5 text-[#ff8a80]" />
        )}
      </div>
      {error && (
        <p className="mt-1.5 ml-0.5 text-xs text-[#ff8a80] flex items-center gap-1">
          <AlertCircle size={10} />
          {error}
        </p>
      )}
    </div>
  )
}
