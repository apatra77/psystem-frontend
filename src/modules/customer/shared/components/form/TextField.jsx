import { useFormContext } from 'react-hook-form'
import FieldShell from './FieldShell'
import { colors } from '@/app/themes/colors'

export default function TextField({
  name,
  label,
  type = 'text',
  placeholder,
  hint,
  required,
  icon: Icon,
  disabled,
  className,
  ...rest
}) {
  const { register, formState: { errors } } = useFormContext()
  const error = name.split('.').reduce((acc, key) => acc?.[key], errors)?.message

  return (
    <FieldShell label={label} error={error} hint={hint} required={required} htmlFor={name} className={className}>
      <div
        className="relative flex items-center rounded-[13px] transition-all"
        style={{
          background: error ? 'rgba(255,138,128,0.07)' : 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${error ? '#ff8a80' : colors.borderSubtle}`,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {Icon && <Icon size={15} className="absolute left-3.5" style={{ color: error ? '#ff8a80' : colors.textDim }} />}
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent py-3 text-[13.5px] outline-none rounded-[13px]"
          style={{ color: colors.textBright, colorScheme: 'dark', paddingLeft: Icon ? 40 : 14, paddingRight: 14 }}
          {...register(name)}
          {...rest}
        />
      </div>
    </FieldShell>
  )
}
