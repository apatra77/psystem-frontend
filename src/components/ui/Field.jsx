import { useState } from 'react'
import { AlertCircle, Check } from 'lucide-react'

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
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div
        className={`relative flex items-center rounded-2xl border-2 transition-all duration-200 ${
          error
            ? 'border-red-400 bg-red-50/40'
            : focused
              ? 'border-blue-500 bg-white ring-4 ring-blue-50'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
        }`}
      >
        <Icon
          size={15}
          className={`absolute left-3.5 flex-shrink-0 transition-colors ${
            error ? 'text-red-400' : focused ? 'text-blue-500' : 'text-slate-400'
          }`}
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent pl-10 pr-10 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
        />
        {children}
        {!children && valid && (
          <Check size={14} className="absolute right-3.5 text-green-500" strokeWidth={2.5} />
        )}
        {error && !children && (
          <AlertCircle size={14} className="absolute right-3.5 text-red-400" />
        )}
      </div>
      {error && (
        <p className="mt-1.5 ml-0.5 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={10} />
          {error}
        </p>
      )}
    </div>
  )
}
