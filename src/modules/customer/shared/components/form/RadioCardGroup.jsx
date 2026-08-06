import { useFormContext } from 'react-hook-form'
import FieldShell from './FieldShell'
import { colors } from '@/app/themes/colors'

/** options: [{ value, label, hint }] — renders selectable cards, used for payment/address pickers. */
export default function RadioCardGroup({ name, label, options = [], required, className, columns = 1 }) {
  const { register, watch, formState: { errors } } = useFormContext()
  const error = errors?.[name]?.message
  const current = watch(name)

  return (
    <FieldShell label={label} error={error} required={required} className={className}>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
        {options.map((o) => {
          const active = String(current) === String(o.value)
          return (
            <label
              key={o.value}
              className="flex items-start gap-3 px-4 py-3 rounded-[13px] cursor-pointer transition-all"
              style={{
                background: active ? 'rgba(64,222,170,.10)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${active ? 'rgba(64,222,170,.42)' : colors.borderSubtle}`,
              }}
            >
              <input type="radio" value={o.value} className="mt-1 accent-[#40deaa]" {...register(name)} />
              <span>
                <span className="block text-[13px] font-bold" style={{ color: colors.textBright }}>{o.label}</span>
                {o.hint && <span className="block text-[11.5px] mt-0.5" style={{ color: colors.textMuted }}>{o.hint}</span>}
              </span>
            </label>
          )
        })}
      </div>
    </FieldShell>
  )
}
