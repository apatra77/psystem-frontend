import { useFormContext } from 'react-hook-form'
import FieldShell from './FieldShell'
import { colors } from '@/app/themes/colors'

/** options: [{ value, label }] */
export default function SelectField({ name, label, options = [], placeholder = 'Select…', hint, required, className }) {
  const { register, formState: { errors } } = useFormContext()
  const error = errors?.[name]?.message

  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={name} className={className}>
      <select
        id={name}
        className="w-full rounded-[13px] px-3.5 py-3 text-[13.5px] outline-none appearance-none"
        style={{
          background: error ? 'rgba(255,138,128,0.07)' : 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${error ? '#ff8a80' : colors.borderSubtle}`,
          color: colors.textBright,
          colorScheme: 'dark',
        }}
        {...register(name)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
