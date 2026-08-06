import { colors } from '@/theme/colors'

export default function GlassCard({ children, className = '', style = {} }) {
  return (
    <div
      className={`rounded-[18px] ${className}`}
      style={{
        background: colors.cardBg,
        border: '1px solid rgba(255,255,255,0.11)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
