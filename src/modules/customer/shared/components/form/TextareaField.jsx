import { useFormContext } from 'react-hook-form'
import FieldShell from './FieldShell'
import { colors } from '@/app/themes/colors'

export default function TextareaField({ name, label, placeholder, rows = 4, hint, required, className }) {
  const { register, formState: { errors } } = useFormContext()
  const error = errors?.[name]?.message

  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={name} className={className}>
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-[13px] px-3.5 py-3 text-[13.5px] outline-none resize-y"
        style={{
          background: error ? 'rgba(255,138,128,0.07)' : 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${error ? '#ff8a80' : colors.borderSubtle}`,
          color: colors.textBright,
        }}
        {...register(name)}
      />
    </FieldShell>
  )
}
