import { colors } from '@/app/themes/colors'

/**
 * Shimmer primitives.
 *
 * Every page-specific shimmer is built from these four pieces, so the pulse,
 * the surface colour and the border stay identical across the whole app and a
 * new shimmer never has to re-invent them. `.mediq-skeleton` (see index.css)
 * owns the animation and honours prefers-reduced-motion.
 */

/*
 * `backgroundColor`, never the `background` shorthand: the shorthand resets
 * background-image, which is where `.mediq-skeleton` keeps the moving gradient.
 * Setting it inline here would silently kill the animation on every shimmer.
 */
const surface = {
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: `1px solid ${colors.borderSubtle}`,
}

/** A single solid block — the building unit for lines, thumbnails and buttons. */
export function ShimmerBar({ width = '100%', height = 14, radius = 8, className = '', style = {} }) {
  return (
    <div
      className={`mediq-skeleton ${className}`}
      style={{ width, height, borderRadius: radius, ...surface, ...style }}
    />
  )
}

export function ShimmerCircle({ size = 40, className = '', style = {} }) {
  return <ShimmerBar width={size} height={size} radius="50%" className={className} style={style} />
}

/** `lines` stacked bars with a shorter last line, the way real copy wraps. */
export function ShimmerText({ lines = 3, height = 12, gap = 8, lastWidth = '62%', className = '' }) {
  return (
    <div className={className} style={{ display: 'grid', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerBar key={i} height={height} width={i === lines - 1 ? lastWidth : '100%'} />
      ))}
    </div>
  )
}

/** Panel with the same glass treatment as GlassCard, for card-shaped regions. */
export function ShimmerCard({ children, className = '', style = {}, padding = 16 }) {
  return (
    <div
      className={`rounded-[18px] ${className}`}
      style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, padding, ...style }}
    >
      {children}
    </div>
  )
}

/**
 * Wrapper every page shimmer renders as its root. It carries the accessibility
 * contract (`role="status"` + `aria-busy`) once, so individual shimmers only
 * describe layout.
 */
export function ShimmerPage({ children, label = 'Loading', className = '', style = {} }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className} style={style}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

/** `count` copies of a render function — keeps `Array.from` noise out of shimmers. */
export const repeat = (count, render) => Array.from({ length: count }).map((_, i) => render(i))
