import { AlertCircle } from 'lucide-react'
import { colors } from '@/app/themes/colors'

export default function FieldShell({ label, error, hint, required, htmlFor, className = '', children }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: colors.textDim }}>
          {label}
          {required && <span style={{ color: '#ff8a80' }}> *</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="mt-1.5 text-[11.5px]" style={{ color: colors.textDim }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-1.5 text-[11.5px] flex items-center gap-1" style={{ color: '#ff8a80' }} role="alert">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  )
}
