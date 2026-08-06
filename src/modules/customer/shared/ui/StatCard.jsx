import GlassCard from './GlassCard'
import { colors } from '@/app/themes/colors'

export default function StatCard({ label, value, trend, tone = 'mint', icon: Icon }) {
  const accent = { mint: colors.accent, blue: colors.blue, gold: colors.gold, purple: colors.purpleLight }[tone]
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: colors.textDim }}>
          {label}
        </p>
        {Icon && <Icon size={16} style={{ color: accent }} />}
      </div>
      <p className="text-[26px] font-extrabold mt-2 tracking-tight" style={{ color: colors.textBright }}>
        {value}
      </p>
      {trend && (
        <p className="text-[12px] font-bold mt-1" style={{ color: String(trend).startsWith('-') ? '#ff8a80' : colors.accent }}>
          {trend}
        </p>
      )}
    </GlassCard>
  )
}
