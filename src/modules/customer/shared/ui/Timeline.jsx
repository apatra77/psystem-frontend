import { Check } from 'lucide-react'
import { colors } from '@/app/themes/colors'

/** steps: [{ key, label, hint }] — order tracking, delivery timeline, audit trails. */
export default function Timeline({ steps = [], currentIndex = 0, className = '' }) {
  return (
    <ol className={`space-y-4 ${className}`}>
      {steps.map((step, index) => {
        const done = currentIndex >= index
        return (
          <li key={step.key ?? step.label} className="flex items-start gap-3">
            <span className="flex flex-col items-center">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: done ? colors.primaryBtn : 'rgba(255,255,255,0.06)',
                  color: done ? colors.accentText : colors.textDim,
                  border: `1px solid ${done ? 'transparent' : colors.borderSubtle}`,
                }}
              >
                {done ? <Check size={13} strokeWidth={3} /> : index + 1}
              </span>
              {index < steps.length - 1 && (
                <span className="w-px flex-1 min-h-[18px] mt-1" style={{ background: done ? colors.accentDark : colors.borderSubtle }} />
              )}
            </span>
            <span className="pb-1">
              <span className="block text-[13px] font-bold" style={{ color: done ? colors.textBright : colors.textDim }}>{step.label}</span>
              {step.hint && <span className="block text-[11.5px] mt-0.5" style={{ color: colors.textDim }}>{step.hint}</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
