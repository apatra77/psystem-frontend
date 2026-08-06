import { colors } from '@/app/themes/colors'

/**
 * Base skeleton block. `.mediq-skeleton` (index.css) owns the pulse — keep the
 * inline colour on `backgroundColor`, since the `background` shorthand would
 * clear the gradient that animation rides on.
 */
export default function Skeleton({ width = '100%', height = 16, radius = 8, className = '' }) {
  return (
    <div
      className={`mediq-skeleton ${className}`}
      style={{ width, height, borderRadius: radius, backgroundColor: 'rgba(255,255,255,0.06)', border: `1px solid ${colors.borderSubtle}` }}
    />
  )
}
