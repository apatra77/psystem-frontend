import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import GlassCard from '../../components/GlassCard'
import {
  buildRevenueAxisLabelIndexes,
  buildRevenueChart,
  buildRevenueYAxisTicks,
  fmtINR,
  getRevenueHoverIndex,
} from '../../utils/helpers'
import { colors } from '@/theme/colors'

export const REVENUE_PERIOD_OPTIONS = [
  { id: 'LAST_7_DAYS', label: '7 days', days: 7 },
  { id: 'LAST_14_DAYS', label: '14 days', days: 14 },
  { id: 'LAST_1_MONTH', label: '1 month', days: 30 },
]

export const REVENUE_PERIOD_DEFAULT = 'LAST_7_DAYS'

function SectionTitle({ children, action = null }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="text-[11px] font-extrabold tracking-[0.12em] uppercase" style={{ color: colors.textDim }}>
        {children}
      </div>
      {action}
    </div>
  )
}

function RevenuePeriodSelect({ value, onChange, loading }) {
  const [open, setOpen] = useState(false)
  const selected = REVENUE_PERIOD_OPTIONS.find((option) => option.id === value) ?? REVENUE_PERIOD_OPTIONS.find((option) => option.id === REVENUE_PERIOD_DEFAULT)

  return (
    <div className="relative">
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-full cursor-pointer disabled:opacity-60"
        style={{ color: colors.textDim, border: `1px solid ${colors.borderSubtle}` }}
      >
        <span>{selected.label}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default"
            aria-label="Close period menu"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[120px] rounded-[12px] p-1.5 shadow-2xl"
            style={{ background: 'rgba(10,28,22,0.98)', border: `1px solid ${colors.borderStrong}` }}
          >
            {REVENUE_PERIOD_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id)
                  setOpen(false)
                }}
                className="w-full px-3 py-2 rounded-[8px] text-left text-[12px] font-semibold cursor-pointer hover:bg-white/5"
                style={{ color: option.id === value ? colors.accent : colors.textHighlight }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function RevenueTrendChart({
  revLabels,
  revValues,
  period,
  onPeriodChange,
  periodLoading = false,
}) {
  const plotRef = useRef(null)
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const chart = useMemo(() => buildRevenueChart(revValues), [revValues])
  const yAxisTicks = useMemo(() => buildRevenueYAxisTicks(chart.maxRev), [chart.maxRev])
  const axisIndexes = useMemo(
    () => buildRevenueAxisLabelIndexes(revLabels.length),
    [revLabels.length],
  )

  const activeIndex = hoveredIndex ?? revValues.length - 1
  const activePoint = chart.points[activeIndex]

  const updateHoverFromEvent = useCallback(
    (event) => {
      const rect = plotRef.current?.getBoundingClientRect()
      if (!rect?.width) return
      const ratio = (event.clientX - rect.left) / rect.width
      setHoveredIndex(getRevenueHoverIndex(ratio, revValues.length))
    },
    [revValues.length],
  )

  useEffect(() => {
    setHoveredIndex(null)
  }, [period, revLabels, revValues])

  return (
    <GlassCard className="p-5">
      <SectionTitle
        action={
          <RevenuePeriodSelect value={period} onChange={onPeriodChange} loading={periodLoading} />
        }
      >
        Revenue Trend
      </SectionTitle>

      <div className={`flex gap-3 transition-opacity duration-200 ${periodLoading ? 'opacity-60 pointer-events-none' : ''}`}>
        <div className="flex flex-col justify-between h-[200px] py-1 flex-shrink-0">
          {yAxisTicks.map((tick) => (
            <span key={tick.label} className="text-[9.5px] font-semibold tabular-nums" style={{ color: '#5f7d73' }}>
              {tick.label}
            </span>
          ))}
        </div>

        <div className="relative flex-1 min-w-0">
          <div
            ref={plotRef}
            className="relative h-[200px]"
            onMouseMove={updateHoverFromEvent}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <svg
              viewBox={`0 0 ${chart.chartW} ${chart.chartH}`}
              preserveAspectRatio="none"
              className="w-full h-full block overflow-visible"
            >
              {yAxisTicks.slice(1, -1).map((tick) => (
                <line
                  key={tick.label}
                  x1="0"
                  x2={chart.chartW}
                  y1={14 + tick.pct * 160}
                  y2={14 + tick.pct * 160}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
              ))}
              <path d={chart.revenueAreaPath} fill="rgba(64,222,170,0.16)" />
              <path
                d={chart.revenueLinePath}
                fill="none"
                stroke={colors.accent}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {activePoint && hoveredIndex != null && (
                <>
                  <line
                    x1={activePoint.x}
                    x2={activePoint.x}
                    y1={14}
                    y2={chart.baseline}
                    stroke="rgba(64,222,170,0.22)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    pointerEvents="none"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="5"
                    fill={colors.bg}
                    stroke={colors.accent}
                    strokeWidth="2.5"
                    pointerEvents="none"
                  />
                </>
              )}
            </svg>

            {activePoint && hoveredIndex != null && (
              <div
                className="pointer-events-none absolute z-10"
                style={{
                  left: `${(activePoint.x / chart.chartW) * 100}%`,
                  top: `${(activePoint.y / chart.chartH) * 100}%`,
                  transform: 'translate(-50%, calc(-100% - 14px))',
                }}
              >
                <div
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap shadow-lg"
                  style={{
                    background: 'rgba(8, 18, 14, 0.94)',
                    border: '1px solid rgba(64,222,170,0.35)',
                    color: '#fff',
                  }}
                >
                  <div style={{ color: colors.textDim }}>{revLabels[hoveredIndex]}</div>
                  <div className="tabular-nums mt-0.5" style={{ color: colors.accent }}>
                    {fmtINR(revValues[hoveredIndex])}
                  </div>
                </div>
                <div
                  className="mx-auto mt-1 h-0 w-0"
                  style={{
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '6px solid rgba(64,222,170,0.35)',
                  }}
                />
              </div>
            )}
          </div>

          <div className="relative h-6 mt-2 px-0.5">
            {axisIndexes.map((index, tickIndex) => {
              const point = chart.points[index]
              if (!point) return null

              const isFirst = tickIndex === 0
              const isLast = tickIndex === axisIndexes.length - 1
              const positionPct = (point.x / chart.chartW) * 100

              return (
                <span
                  key={`axis-${index}`}
                  className="absolute top-0 text-[10px] font-medium tracking-wide whitespace-nowrap"
                  style={{
                    left: `${positionPct}%`,
                    transform: isFirst ? 'translateX(0)' : isLast ? 'translateX(-100%)' : 'translateX(-50%)',
                    color: hoveredIndex === index ? colors.accent : '#5f7d73',
                    textAlign: isFirst ? 'left' : isLast ? 'right' : 'center',
                  }}
                  title={revLabels[index]}
                >
                  {revLabels[index]}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
