import { useFormContext } from 'react-hook-form'
import { AlertCircle } from 'lucide-react'
import { colors } from '@/app/themes/colors'

export default function CheckboxField({ name, label, hint, className = '' }) {
  const { register, formState: { errors } } = useFormContext()
  const error = errors?.[name]?.message

  return (
    <div className={className}>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[#40deaa]" {...register(name)} />
        <span className="text-[13px]" style={{ color: colors.text }}>
          {label}
          {hint && <span className="block text-[11.5px] mt-0.5" style={{ color: colors.textDim }}>{hint}</span>}
        </span>
      </label>
      {error && (
        <p className="mt-1.5 text-[11.5px] flex items-center gap-1" style={{ color: '#ff8a80' }} role="alert">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  )
}
