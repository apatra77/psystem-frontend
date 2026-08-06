import GlassCard from '../components/GlassCard'
import { useOwnerPortal } from '../context/OwnerPortalContext'
import {
  BEST_SELLERS,
  KPI_DATA,
  PEAK_HOURS,
  REV_LABELS,
  REV_VALUES,
} from '../data/initialState'
import { buildRevenueChart } from '../utils/helpers'
import { colors } from '@/theme/colors'

const REPEAT_PCT = 68
const CIRCUMFERENCE = 2 * Math.PI * 52
const REPEAT_LEN = (REPEAT_PCT / 100) * CIRCUMFERENCE
const NEW_LEN = ((100 - REPEAT_PCT) / 100) * CIRCUMFERENCE

export default function DashboardView() {
  const { activeOutletName, incomingPreview, incomingCount, stockAlertsPreview, goToPage } = useOwnerPortal()
  const chart = buildRevenueChart(REV_VALUES)
  const revenueLabelsShown = [0, 3, 6, 9, 13].map((i) => REV_LABELS[i])

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-4 gap-4">
        {KPI_DATA.map((k) => (
          <GlassCard key={k.label} className="px-[22px] py-5">
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: colors.textDim }}>
              {k.label}
            </div>
            <div className="text-[27px] font-extrabold text-white tracking-tight mt-2.5 tabular-nums">{k.value}</div>
            <div className="flex items-center gap-1 mt-2 text-xs font-bold" style={{ color: colors.accent }}>
              <span>▲</span>
              <span>{k.trend}</span>
              <span className="font-semibold" style={{ color: '#5f7d73' }}>
                vs yesterday
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <GlassCard className="p-6">
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="text-[15px] font-extrabold text-white">Revenue trend</div>
            <div className="text-[11.5px] font-semibold" style={{ color: colors.textDim }}>
              Last 14 days · {activeOutletName}
            </div>
          </div>
          <svg viewBox="0 0 680 200" preserveAspectRatio="none" className="w-full h-[200px] mt-2.5 block overflow-visible">
            <path d={chart.revenueAreaPath} fill="rgba(64,222,170,0.16)" />
            <polyline
              points={chart.revenueLinePoints}
              fill="none"
              stroke={colors.accent}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx={chart.revenueLastX}
              cy={chart.revenueLastY}
              r="4.5"
              fill={colors.bg}
              stroke={colors.accent}
              strokeWidth="2.5"
            />
          </svg>
          <div className="flex justify-between mt-1">
            {revenueLabelsShown.map((l) => (
              <span key={l} className="text-[10.5px] font-semibold" style={{ color: '#5f7d73' }}>
                {l}
              </span>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex flex-col">
          <div className="text-[15px] font-extrabold text-white mb-2.5">Repeat vs new</div>
          <div className="flex items-center justify-center flex-1">
            <svg viewBox="0 0 130 130" width="132" height="132">
              <g transform="rotate(-90 65 65)">
                <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
                <circle
                  cx="65"
                  cy="65"
                  r="52"
                  fill="none"
                  stroke={colors.blue}
                  strokeWidth="14"
                  strokeDasharray={`${NEW_LEN} ${CIRCUMFERENCE}`}
                />
                <circle
                  cx="65"
                  cy="65"
                  r="52"
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="14"
                  strokeDasharray={`${REPEAT_LEN} ${CIRCUMFERENCE}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              </g>
              <text x="65" y="61" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800" fontFamily="Manrope,sans-serif">
                {REPEAT_PCT}%
              </text>
              <text x="65" y="79" textAnchor="middle" fill={colors.textDim} fontSize="10.5" fontWeight="700" fontFamily="Manrope,sans-serif">
                REPEAT
              </text>
            </svg>
          </div>
          <div className="flex gap-3.5 justify-center mt-1.5">
            <span className="flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: '#cfe6dc' }}>
              <span className="w-2 h-2 rounded-sm inline-block" style={{ background: colors.accent }} />
              Repeat {REPEAT_PCT}%
            </span>
            <span className="flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: '#cfe6dc' }}>
              <span className="w-2 h-2 rounded-sm inline-block" style={{ background: colors.blue }} />
              New {100 - REPEAT_PCT}%
            </span>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <div className="text-[15px] font-extrabold text-white mb-4">Best-selling items</div>
          <div className="flex flex-col gap-3.5">
            {BEST_SELLERS.map((b) => (
              <div key={b.rank} className="flex items-center gap-3">
                <span className="text-xs font-extrabold w-3.5" style={{ color: '#5f7d73' }}>
                  {b.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2 text-[12.5px] font-bold text-white">
                    <span className="truncate">{b.name}</span>
                    <span className="tabular-nums flex-shrink-0" style={{ color: '#9ff0d4' }}>
                      {b.revenueFmt}
                    </span>
                  </div>
                  <div className="h-1.5 rounded bg-white/7 mt-1.5 overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${b.pct}%`,
                        background: colors.primaryBtn,
                      }}
                    />
                  </div>
                  <div className="text-[10.5px] font-semibold mt-1" style={{ color: colors.textDim }}>
                    {b.units} units sold
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex justify-between items-baseline mb-4">
            <div className="text-[15px] font-extrabold text-white">Peak ordering hours</div>
            <div className="text-[11px] font-semibold" style={{ color: colors.textDim }}>
              Peak · 7–8 PM
            </div>
          </div>
          <div className="flex items-end gap-[5px] h-[120px]">
            {PEAK_HOURS.map((h) => (
              <div key={h.label} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${h.pct}%`,
                    background: h.pct === 100 ? colors.accent : 'rgba(64,222,170,0.32)',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-[5px] mt-1.5">
            {PEAK_HOURS.map((h) => (
              <div key={h.label} className="flex-1 text-center text-[8.5px] font-semibold" style={{ color: '#5f7d73' }}>
                {h.label}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-[22px]">
          <div className="flex justify-between items-baseline mb-3.5">
            <div className="text-[15px] font-extrabold text-white">Incoming orders</div>
            <button
              type="button"
              onClick={() => goToPage('orders')}
              className="text-[11px] font-extrabold tracking-wide cursor-pointer hover:opacity-80"
              style={{ color: colors.accent }}
            >
              VIEW ALL →
            </button>
          </div>
          {incomingCount > 0 ? (
            <div className="flex flex-col gap-2.5">
              {incomingPreview.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ border: '1px solid rgba(255,255,255,0.09)' }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 owner-pulse-dot"
                    style={{ background: colors.blue, boxShadow: `0 0 8px ${colors.blue}` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-bold text-white">
                      {o.id} · {o.customer}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
                      {o.itemsCount} items · {o.totalFmt} · {o.placedLabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12.5px] py-5 text-center" style={{ color: colors.textDim }}>
              No new orders right now.
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-[22px]">
          <div className="flex justify-between items-baseline mb-3.5">
            <div className="text-[15px] font-extrabold text-white">Stock alerts</div>
            <button
              type="button"
              onClick={() => goToPage('inventory')}
              className="text-[11px] font-extrabold tracking-wide cursor-pointer hover:opacity-80"
              style={{ color: colors.accent }}
            >
              VIEW ALL →
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            {stockAlertsPreview.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <div
                  className="w-[34px] h-[34px] rounded-[9px] flex-shrink-0"
                  style={{
                    background: 'linear-gradient(160deg,rgba(64,222,170,0.16),rgba(64,222,170,0.03))',
                    border: '1px solid rgba(64,222,170,0.32)',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-bold text-white truncate">{p.name}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
                    SKU {p.sku}
                  </div>
                </div>
                <span
                  className="text-[10.5px] font-extrabold px-2 py-1 rounded-full whitespace-nowrap"
                  style={{
                    background: p.stockMeta.bg,
                    color: p.stockMeta.color,
                    border: `1px solid ${p.stockMeta.border}`,
                  }}
                >
                  {p.stockMeta.label}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
