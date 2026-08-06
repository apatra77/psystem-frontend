import { Star } from 'lucide-react'
import { colors } from '@/app/themes/colors'

/** Read-only display, or interactive when `onChange` is passed (review forms). */
export default function Rating({ value = 0, count, size = 13, onChange, className = '' }) {
  const interactive = typeof onChange === 'function'

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value)
        const Icon = (
          <Star
            size={size}
            fill={filled ? colors.gold : 'none'}
            style={{ color: filled ? colors.gold : colors.textDim }}
          />
        )
        return interactive ? (
          <button key={star} type="button" onClick={() => onChange(star)} aria-label={`${star} star`}>{Icon}</button>
        ) : (
          <span key={star}>{Icon}</span>
        )
      })}
      {count != null && <span className="text-[11.5px] ml-1.5" style={{ color: colors.textDim }}>({count})</span>}
    </span>
  )
}
