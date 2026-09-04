import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Clock3,
  IndianRupee,
  ShoppingCart,
  Tag,
} from 'lucide-react'
import { fetchAdminDashboardRevenueTrend } from '@/services/dashboard'
import RevenueTrendChart, { REVENUE_PERIOD_DEFAULT, REVENUE_PERIOD_OPTIONS } from './dashboard/RevenueTrendChart'
import DashboardShimmer from '@/modules/customer/shared/components/shimmer/pages/DashboardShimmer'
import GlassCard from '../components/GlassCard'
import { useOwnerPortal } from '../context/OwnerPortalContext'
import { useAdminDashboardQuery } from '../hooks/useAdminDashboardQuery'
import {
  buildDonutSegments,
  buildSparklinePath,
  mapOrder,
} from '../utils/helpers'
import { colors } from '@/theme/colors'

const KPI_TREND_META = {
  UP: { color: colors.accent, icon: '▲' },
  DOWN: { color: '#ff8a80', icon: '▼' },
  FLAT: { color: '#5f7d73', icon: '—' },
}

const KPI_ICON_META = {
  revenueToday: { Icon: IndianRupee, bg: 'rgba(64,222,170,0.16)', border: 'rgba(64,222,170,0.34)', color: colors.accent },
  ordersToday: { Icon: ShoppingCart, bg: 'rgba(64,222,170,0.16)', border: 'rgba(64,222,170,0.34)', color: colors.accent },
  avgOrderValue: { Icon: Tag, bg: 'rgba(64,222,170,0.16)', border: 'rgba(64,222,170,0.34)', color: colors.accent },
  pendingOrders: { Icon: Clock3, bg: 'rgba(255,181,71,0.16)', border: 'rgba(255,181,71,0.34)', color: colors.gold },
  lowStockItems: { Icon: AlertTriangle, bg: 'rgba(255,181,71,0.16)', border: 'rgba(255,181,71,0.34)', color: colors.gold },
}

function getKpiTrendMeta(direction, trend) {
  const normalized = String(direction ?? '').toUpperCase()
  if (KPI_TREND_META[normalized]) return KPI_TREND_META[normalized]
  if (String(trend).startsWith('-')) return KPI_TREND_META.DOWN
  if (String(trend).startsWith('+')) return KPI_TREND_META.UP
  return KPI_TREND_META.FLAT
}

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

function KpiIcon({ id }) {
  const meta = KPI_ICON_META[id] ?? KPI_ICON_META.revenueToday
  const Icon = meta.Icon

  return (
    <div
      className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
      style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
    >
      <Icon size={16} style={{ color: meta.color }} />
    </div>
  )
}

function Sparkline({ values, stroke }) {
  const path = buildSparklinePath(values)
  if (!path) return null

  return (
    <svg viewBox="0 0 112 28" className="w-full h-7 mt-auto" preserveAspectRatio="none">
      <polyline
        points={path}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DonutChart({ segments, centerValue, centerLabel }) {
  const donutSegments = buildDonutSegments(segments)

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 130 130" width="128" height="128">
        <g transform="rotate(-90 65 65)">
          <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
          {donutSegments.map((segment) => (
            <circle
              key={segment.label}
              cx="65"
              cy="65"
              r="52"
              fill="none"
              stroke={segment.color}
              strokeWidth="14"
              strokeDasharray={segment.dashArray}
              strokeDashoffset={segment.dashOffset}
              strokeLinecap="butt"
            />
          ))}
        </g>
        <text x="65" y="61" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800" fontFamily="Manrope,sans-serif">
          {centerValue}
        </text>
        <text x="65" y="79" textAnchor="middle" fill={colors.textDim} fontSize="10" fontWeight="700" fontFamily="Manrope,sans-serif">
          {centerLabel}
        </text>
      </svg>
    </div>
  )
}

function StatusPill({ meta }) {
  return (
    <span
      className="inline-flex items-center text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
    >
      {meta.label}
    </span>
  )
}

export default function DashboardView() {
  const {
    ordersMapped,
    stockAlertsPreview,
    lowStockCount,
    incomingCount,
    goToPage,
  } = useOwnerPortal()
  const { dashboard, loading, error, reload } = useAdminDashboardQuery()
  const [revenuePeriod, setRevenuePeriod] = useState(REVENUE_PERIOD_DEFAULT)
  const [chartLabels, setChartLabels] = useState([])
  const [chartValues, setChartValues] = useState([])
  const [revenuePeriodLoading, setRevenuePeriodLoading] = useState(false)
  const revenuePeriodDirtyRef = useRef(false)

  const {
    kpiData = [],
    revLabels = [],
    revValues = [],
    orderValues = [],
    avgOrderValues = [],
    customerOverview = { newPercent: 0, returningPercent: 0 },
    orderStatus = { total: 0, segments: [] },
    bestSellers = [],
    peakHours = [],
    peakHourLabel = '',
    incomingOrders = null,
    stockAlerts = null,
  } = dashboard ?? {}

  useEffect(() => {
    if (revenuePeriodDirtyRef.current) return
    if (revLabels?.length && revValues?.length) {
      setChartLabels(revLabels)
      setChartValues(revValues)
    }
  }, [revLabels, revValues])

  const handleRevenuePeriodChange = useCallback(
    async (periodId) => {
      revenuePeriodDirtyRef.current = true
      setRevenuePeriod(periodId)
      const period =
        REVENUE_PERIOD_OPTIONS.find((option) => option.id === periodId)?.id ?? REVENUE_PERIOD_DEFAULT
      const days = REVENUE_PERIOD_OPTIONS.find((option) => option.id === periodId)?.days ?? 7
      const sliceFallback = () => {
        const start = Math.max(0, revLabels.length - days)
        setChartLabels(revLabels.slice(start))
        setChartValues(revValues.slice(start))
      }

      setRevenuePeriodLoading(true)
      try {
        const revenue = await fetchAdminDashboardRevenueTrend(period)
        if (revenue?.revValues?.length) {
          setChartLabels(revenue.revLabels ?? [])
          setChartValues(revenue.revValues)
        } else {
          sliceFallback()
        }
      } catch {
        sliceFallback()
      } finally {
        setRevenuePeriodLoading(false)
      }
    },
    [revLabels, revValues],
  )

  const tableOrders = useMemo(() => {
    if (incomingOrders?.length) {
      return incomingOrders.map((order) => {
        const mapped = mapOrder({
          id: order.id,
          customer: order.customer,
          status: order.status,
          orderStatusDesc: order.statusDesc,
          payment: order.payment,
          items: Array.from({ length: order.itemsCount || 0 }),
          orderTotal: order.totalFmt,
        })

        return {
          ...mapped,
          id: order.id,
          customer: order.customer,
          itemsCount: order.itemsCount,
          totalFmt: order.totalFmt,
          placedLabel: order.placedLabel,
        }
      })
    }

    return ordersMapped.slice(0, 5)
  }, [incomingOrders, ordersMapped])

  const stockAlertRows = useMemo(() => {
    if (stockAlerts?.length) return stockAlerts
    return stockAlertsPreview.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      label: item.stockMeta.label,
      tone: {
        color: item.stockMeta.color,
        bg: item.stockMeta.bg,
        border: item.stockMeta.border,
      },
    }))
  }, [stockAlerts, stockAlertsPreview])

  const kpiSparklineSeries = useMemo(
    () => ({
      revenueToday: revValues,
      ordersToday: orderValues,
      avgOrderValue: avgOrderValues,
    }),
    [avgOrderValues, orderValues, revValues],
  )

  const enrichedKpis = useMemo(
    () =>
      kpiData
        .filter(
          (kpi) =>
            !['expiringSoon', 'todayProfit'].includes(kpi.id) &&
            !/^(expiring soon|today'?s profit)$/i.test(String(kpi.label ?? '').trim()),
        )
        .map((kpi) => {
        if (kpi.id === 'pendingOrders') {
          return {
            ...kpi,
            showTrend: false,
            sparklineValues: null,
            linkLabel: kpi.linkLabel ?? 'View details',
            linkPage: kpi.linkPage ?? 'orders',
            value:
              kpi.value === '—' || kpi.value == null ? String(incomingCount || 0) : kpi.value,
          }
        }
        if (kpi.id === 'lowStockItems' && (kpi.value === '—' || kpi.value == null)) {
          return { ...kpi, value: String(lowStockCount || 0) }
        }

        const trendSeries = kpiSparklineSeries[kpi.id]
        const sparklineValues =
          kpi.sparkline?.length ? kpi.sparkline : trendSeries?.length ? trendSeries.slice(-7) : null

        return {
          ...kpi,
          sparklineValues,
        }
      }),
    [incomingCount, kpiData, kpiSparklineSeries, lowStockCount],
  )

  if (loading) {
    return <DashboardShimmer />
  }

  if (error) {
    return (
      <GlassCard className="p-10 flex flex-col items-center justify-center text-center min-h-[360px]">
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-4"
          style={{ background: 'rgba(255,138,128,0.12)', border: '1px solid rgba(255,138,128,0.28)' }}
        >
          <AlertTriangle size={22} style={{ color: '#ff8a80' }} />
        </div>
        <h2 className="text-[16px] font-extrabold text-white mb-2">Unable to load dashboard</h2>
        <p className="text-[13px] max-w-md leading-relaxed mb-5" style={{ color: colors.textSecondary }}>
          {error}
        </p>
        <button
          type="button"
          onClick={reload}
          className="text-[12.5px] font-extrabold px-5 py-2.5 rounded-[10px] cursor-pointer transition-opacity hover:opacity-90"
          style={{ color: colors.accentText, background: colors.primaryBtn }}
        >
          Retry
        </button>
      </GlassCard>
    )
  }

  if (!dashboard) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {enrichedKpis.map((kpi) => {
          const trendMeta = getKpiTrendMeta(kpi.direction, kpi.trend)
          const sparklineStroke = kpi.tone === 'gold' ? colors.gold : colors.accent

          return (
            <GlassCard key={kpi.id ?? kpi.label} className="px-4 py-4 flex flex-col min-h-[132px]">
              <KpiIcon id={kpi.id} />
              <div className="text-[10px] font-bold tracking-[0.1em] uppercase mt-3" style={{ color: colors.textDim }}>
                {kpi.label}
              </div>
              <div className="text-[22px] font-extrabold text-white tracking-tight mt-1.5 tabular-nums">{kpi.value}</div>

              {kpi.showTrend ? (
                <div className="flex items-center gap-1 mt-1 text-[11px] font-bold" style={{ color: trendMeta.color }}>
                  <span>{trendMeta.icon}</span>
                  <span>{kpi.trend}</span>
                  <span className="font-semibold" style={{ color: '#5f7d73' }}>
                    vs yesterday
                  </span>
                </div>
              ) : kpi.linkLabel ? (
                <button
                  type="button"
                  onClick={() => kpi.linkPage && goToPage(kpi.linkPage)}
                  className="mt-1 text-[11px] font-bold text-left cursor-pointer hover:opacity-80"
                  style={{ color: colors.gold }}
                >
                  {kpi.linkLabel} →
                </button>
              ) : (
                <div className="mt-1 h-4" />
              )}

              {kpi.sparklineValues?.length ? (
                <Sparkline values={kpi.sparklineValues} stroke={sparklineStroke} />
              ) : (
                <div className="mt-auto h-7" />
              )}
            </GlassCard>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.75fr_0.75fr] gap-4">
        <RevenueTrendChart
          key={`${revenuePeriod}-${chartValues.length}`}
          revLabels={chartLabels}
          revValues={chartValues}
          period={revenuePeriod}
          onPeriodChange={handleRevenuePeriodChange}
          periodLoading={revenuePeriodLoading}
        />

        <GlassCard className="p-5">
          <SectionTitle>Order Status</SectionTitle>
          <DonutChart
            segments={orderStatus.segments}
            centerValue={orderStatus.total}
            centerLabel="Total Orders"
          />
          <div className="flex flex-col gap-2 mt-1">
            {orderStatus.segments.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: segment.color }} />
                  <span className="font-semibold text-white truncate">{segment.label}</span>
                </span>
                <span className="font-bold tabular-nums flex-shrink-0" style={{ color: colors.textDim }}>
                  {Math.round(Number(segment.percent) || 0)}%
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle>Customer Overview</SectionTitle>
          <DonutChart
            segments={[
              { label: 'New', percent: customerOverview.newPercent, color: colors.accent },
              { label: 'Returning', percent: customerOverview.returningPercent, color: colors.blue },
            ]}
            centerValue={`${customerOverview.newPercent}%`}
            centerLabel="New"
          />
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-2 font-semibold text-white">
                <span className="w-2 h-2 rounded-full" style={{ background: colors.accent }} />
                New Customers
              </span>
              <span className="font-bold" style={{ color: colors.textDim }}>
                {customerOverview.newPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-2 font-semibold text-white">
                <span className="w-2 h-2 rounded-full" style={{ background: colors.blue }} />
                Returning Customers
              </span>
              <span className="font-bold" style={{ color: colors.textDim }}>
                {customerOverview.returningPercent}%
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <SectionTitle>Best-Selling Medicines</SectionTitle>
          <div className="flex flex-col gap-3.5">
            {bestSellers.map((item) => (
              <div key={item.rank} className="flex items-center gap-3">
                <span className="text-xs font-extrabold w-3.5" style={{ color: '#5f7d73' }}>
                  {item.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2 text-[12px] font-bold text-white">
                    <span className="truncate">{item.name}</span>
                    <span className="tabular-nums flex-shrink-0" style={{ color: '#9ff0d4' }}>
                      {item.revenueFmt}
                    </span>
                  </div>
                  <div className="h-1.5 rounded bg-white/7 mt-1.5 overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${item.pct}%`, background: colors.primaryBtn }} />
                  </div>
                  <div className="text-[10px] font-semibold mt-1" style={{ color: colors.textDim }}>
                    {item.units} units sold
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle
            action={
              <span className="text-[10px] font-semibold" style={{ color: colors.textDim }}>
                {peakHourLabel}
              </span>
            }
          >
            Peak Ordering Hours
          </SectionTitle>
          <div className="flex gap-3">
            <div className="flex flex-col justify-between h-[132px] py-1 flex-shrink-0">
              {[100, 80, 60, 40, 20, 0].map((tick) => (
                <span key={tick} className="text-[9px] font-semibold" style={{ color: '#5f7d73' }}>
                  {tick}
                </span>
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-end gap-[4px] h-[132px]">
                {peakHours.map((hour) => (
                  <div key={hour.label} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${hour.pct}%`,
                        background: hour.pct === 100 ? colors.accent : 'rgba(64,222,170,0.32)',
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-[4px] mt-1.5">
                {peakHours.map((hour) => (
                  <div key={`${hour.label}-axis`} className="flex-1 text-center text-[7.5px] font-semibold" style={{ color: '#5f7d73' }}>
                    {hour.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 items-stretch">
        <GlassCard className="p-5 overflow-hidden flex flex-col min-h-0">
          <SectionTitle
            action={
              <button
                type="button"
                onClick={() => goToPage('orders')}
                className="text-[10px] font-extrabold tracking-wide cursor-pointer hover:opacity-80"
                style={{ color: colors.accent }}
              >
                VIEW ALL →
              </button>
            }
          >
            Incoming Orders
          </SectionTitle>

          <div className="h-[272px] min-h-[272px] overflow-auto owner-scroll">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  {['Order ID', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Time'].map((heading) => (
                    <th
                      key={heading}
                      className="text-left text-[10px] font-extrabold tracking-[0.1em] uppercase px-3 py-3"
                      style={{ color: colors.textDim, borderBottom: `1px solid ${colors.borderSubtle}` }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableOrders.length ? (
                  tableOrders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
                      <td className="px-3 py-3 text-[12px] font-bold text-white tabular-nums">{order.id}</td>
                      <td className="px-3 py-3 text-[12px] font-semibold text-white">{order.customer}</td>
                      <td className="px-3 py-3 text-[12px] font-semibold" style={{ color: colors.textSecondary }}>
                        {order.itemsCount} items
                      </td>
                      <td className="px-3 py-3 text-[12px] font-bold tabular-nums" style={{ color: '#9ff0d4' }}>
                        {order.totalFmt}
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill meta={order.paymentMeta} />
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill meta={order.statusDisplayMeta ?? order.statusMeta} />
                      </td>
                      <td className="px-3 py-3 text-[12px] font-semibold" style={{ color: colors.textDim }}>
                        {order.placedLabel}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-[12px]" style={{ color: colors.textDim }}>
                      No incoming orders right now.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="p-5 overflow-hidden flex flex-col min-h-0">
          <SectionTitle
            action={
              <button
                type="button"
                onClick={() => goToPage('inventory')}
                className="text-[10px] font-extrabold tracking-wide cursor-pointer hover:opacity-80"
                style={{ color: colors.accent }}
              >
                VIEW ALL →
              </button>
            }
          >
            Stock Alerts
          </SectionTitle>
          <div className="h-[272px] min-h-[272px] overflow-y-auto owner-scroll flex flex-col gap-2.5">
            {stockAlertRows.length ? (
              stockAlertRows.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl"
                  style={{ border: '1px solid rgba(255,255,255,0.09)' }}
                >
                  <div
                    className="w-8 h-8 rounded-[8px] flex-shrink-0"
                    style={{
                      background: 'linear-gradient(160deg,rgba(64,222,170,0.16),rgba(64,222,170,0.03))',
                      border: '1px solid rgba(64,222,170,0.32)',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-white truncate">{item.name}</div>
                    <div className="text-[10.5px] mt-0.5" style={{ color: colors.textSecondary }}>
                      SKU {item.sku}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-extrabold px-2 py-1 rounded-full whitespace-nowrap"
                    style={{
                      background: item.tone.bg,
                      color: item.tone.color,
                      border: `1px solid ${item.tone.border}`,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[12px] py-8 text-center" style={{ color: colors.textDim }}>
                No stock alerts right now.
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
