import { useFormContext } from 'react-hook-form'
import { Zap } from 'lucide-react'
import FieldShell from './FieldShell'
import { colors } from '@/app/themes/colors'

/** options: [{ value, label, hint, icon?, badge? }] — selectable cards for payment/address pickers. */
export default function RadioCardGroup({ name, label, options = [], required, className, columns = 1 }) {
  const { register, watch, formState: { errors } } = useFormContext()
  const error = errors?.[name]?.message
  const current = watch(name)

  return (
    <FieldShell label={label} error={error} required={required} className={className}>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {options.map((o) => {
          const active = String(current) === String(o.value)
          const Icon = o.icon

          return (
            <label
              key={o.value}
              className="flex cursor-pointer items-start gap-3 rounded-[14px] px-4 py-3.5 transition-all"
              style={{
                background: active ? 'rgba(64,222,170,.10)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${active ? 'rgba(64,222,170,.42)' : colors.borderSubtle}`,
              }}
            >
              <input type="radio" value={o.value} className="mt-3 shrink-0 accent-[#40deaa]" {...register(name)} />
              {Icon ? (
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <Icon size={20} strokeWidth={1.8} style={{ color: colors.accent }} />
                </span>
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold" style={{ color: colors.textBright }}>{o.label}</span>
                {o.hint && (
                  <span className="mt-0.5 block text-[11.5px] leading-snug" style={{ color: colors.textMuted }}>
                    {o.hint}
                  </span>
                )}
                {o.badge && (
                  <span
                    className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                    style={{
                      color: colors.accent,
                      background: 'rgba(64,222,170,0.12)',
                      border: '1px solid rgba(64,222,170,0.28)',
                    }}
                  >
                    <Zap size={10} strokeWidth={2.2} />
                    {o.badge}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </FieldShell>
  )
}
