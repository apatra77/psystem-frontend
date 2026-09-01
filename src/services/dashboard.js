import { authFetch, CART_API_BASE } from './api'

function pick(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key]
    if (value != null && value !== '') return value
  }
  return undefined
}

function parseTrendDate(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return null

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Format chart axis labels as "Jul 7" (short month + day, no year). */
function formatRevenueTrendLabel(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return text

  const parsed = parseTrendDate(text)
  if (parsed) {
    return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  const withoutYear = text.replace(/,?\s*\d{4}$/, '').trim()
  return withoutYear || text
}

function formatRevenueTrendLabels(labels) {
  if (!Array.isArray(labels)) return null
  return labels.map((label) => formatRevenueTrendLabel(label))
}

function fmtINR(n) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '—'
  return `₹${Math.round(num).toLocaleString('en-IN')}`
}

function fmtTrend(value) {
  if (value == null || value === '') return '—'
  const raw = String(value).trim()
  if (raw.endsWith('%')) return raw.startsWith('+') || raw.startsWith('-') ? raw : `+${raw}`
  const num = Number(raw)
  if (!Number.isFinite(num)) return raw
  const pct = Math.abs(num) <= 1 && !raw.includes('%') ? num * 100 : num
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

function formatKpiValue(value, label = '') {
  if (value == null || value === '') return '—'
  if (typeof value === 'string' && /[₹,%]/.test(value)) return value
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value)
  const labelLower = String(label).toLowerCase()
  if (labelLower.includes('revenue') || labelLower.includes('value')) return fmtINR(num)
  return num.toLocaleString('en-IN')
}

function extractDashboardRoot(payload) {
  return payload?.data ?? payload?.dashboard ?? payload
}

function mapKpiArray(items) {
  if (!Array.isArray(items) || items.length === 0) return null

  const mapped = items
    .map((item) => {
      const id = pick(item, 'id', 'key', 'code')
      const label = pick(item, 'label', 'title', 'name', 'kpiName', 'key') ?? ''
      const rawValue = pick(item, 'value', 'amount', 'count', 'total')
      const trend = pick(item, 'trend', 'change', 'changePercent', 'percentage', 'growth')
      const direction = pick(item, 'direction')
      if (!label) return null

      const card = {
        id,
        label,
        value: formatKpiValue(rawValue, label),
        trend: direction ? fmtTrendPercent(trend, direction) : fmtTrend(trend),
        direction: direction ? String(direction).toUpperCase() : undefined,
        tone: pick(item, 'tone') ?? 'mint',
        showTrend: pick(item, 'showTrend') ?? true,
        linkLabel: pick(item, 'linkLabel'),
        linkPage: pick(item, 'linkPage'),
      }

      return isExcludedKpi(card) ? null : card
    })
    .filter(Boolean)

  return mapped.length ? mapped : null
}

function fmtTrendPercent(changePercent, direction) {
  const pct = Math.abs(Number(changePercent) || 0)
  const dir = String(direction ?? 'FLAT').toUpperCase()

  if (dir === 'DOWN') return `-${pct.toFixed(1)}%`
  if (dir === 'UP') return `+${pct.toFixed(1)}%`
  if (pct === 0) return '0%'
  return `${Number(changePercent) >= 0 ? '+' : '-'}${pct.toFixed(1)}%`
}

function mapSummaryMetric(label, metric, { currency = false } = {}) {
  if (!metric || typeof metric !== 'object') {
    return { label, value: '—', trend: '—', direction: 'FLAT' }
  }

  const rawValue = metric.value
  const useCurrency = currency || String(metric.currency ?? '').toUpperCase() === 'INR'
  const direction = String(metric.direction ?? 'FLAT').toUpperCase()

  let value = '—'
  if (rawValue != null && rawValue !== '') {
    value = useCurrency ? fmtINR(rawValue) : Number(rawValue).toLocaleString('en-IN')
  }

  return {
    label,
    value,
    trend: fmtTrendPercent(metric.changePercent, direction),
    direction,
  }
}

const EXCLUDED_KPI_IDS = new Set(['expiringSoon', 'todayProfit', 'expiring', 'profitToday', 'todaysProfit'])

function isExcludedKpi(kpi) {
  const id = String(kpi?.id ?? kpi?.key ?? '').trim()
  const label = String(kpi?.label ?? '')
    .trim()
    .toLowerCase()
  if (EXCLUDED_KPI_IDS.has(id)) return true
  return label === 'expiring soon' || label === "today's profit" || label === 'todays profit'
}

function filterExcludedKpis(kpis) {
  if (!Array.isArray(kpis)) return kpis ?? null
  return kpis.filter((kpi) => !isExcludedKpi(kpi))
}

const SUMMARY_KPI_DEFS = [
  { key: 'revenueToday', label: "Today's Revenue", currency: true, tone: 'mint', showTrend: true },
  { key: 'ordersToday', label: 'Orders Today', currency: false, tone: 'mint', showTrend: true },
  { key: 'avgOrderValue', label: 'Avg Order Value', currency: true, tone: 'mint', showTrend: true },
  {
    key: 'pendingOrders',
    label: 'Pending Orders',
    currency: false,
    tone: 'gold',
    showTrend: false,
    linkLabel: 'View details',
    linkPage: 'orders',
  },
  {
    key: 'lowStockItems',
    label: 'Low Stock Items',
    currency: false,
    tone: 'gold',
    showTrend: false,
    linkLabel: 'View details',
    linkPage: 'inventory',
  },
]

function mapSummaryMetricCard(def, metric, summary) {
  const altKeys = {
    pendingOrders: ['pendingOrders', 'pendingOrderCount', 'ordersPending'],
    lowStockItems: ['lowStockItems', 'lowStockCount', 'lowStock'],
  }

  const rawMetric =
    metric ??
    (altKeys[def.key]
      ? altKeys[def.key].map((key) => summary?.[key]).find((value) => value != null)
      : undefined)

  if (!def.showTrend) {
    const rawValue =
      typeof rawMetric === 'object'
        ? pick(rawMetric, 'value', 'count', 'total')
        : rawMetric
    const value =
      rawValue != null && rawValue !== ''
        ? Number(rawValue).toLocaleString('en-IN')
        : '—'

    return {
      id: def.key,
      label: def.label,
      value,
      tone: def.tone,
      showTrend: false,
      linkLabel: def.linkLabel ?? null,
      linkPage: def.linkPage ?? null,
      sparkline: normalizeSparklineSeries(pick(rawMetric, 'sparkline', 'trendSeries', 'chart')) ?? null,
    }
  }

  const mapped = mapSummaryMetric(def.label, rawMetric, { currency: def.currency })
  return {
    id: def.key,
    label: mapped.label,
    value: mapped.value,
    trend: mapped.trend,
    direction: mapped.direction,
    tone: def.tone,
    showTrend: true,
    sparkline: normalizeSparklineSeries(pick(rawMetric, 'sparkline', 'trendSeries', 'chart')) ?? null,
  }
}

function mapKpisFromSummary(summary) {
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return null

  return SUMMARY_KPI_DEFS.map((def) => mapSummaryMetricCard(def, summary[def.key], summary))
}

function mapKpisFromFields(data) {
  const defs = [
    {
      label: 'Revenue today',
      valueKeys: ['revenueToday', 'todayRevenue', 'revenue', 'totalRevenueToday'],
      trendKeys: ['revenueTodayTrend', 'revenueTrend', 'revenueChange', 'revenueChangePercent'],
    },
    {
      label: 'Orders today',
      valueKeys: ['ordersToday', 'todayOrders', 'orderCount', 'totalOrdersToday'],
      trendKeys: ['ordersTodayTrend', 'ordersTrend', 'orderChange', 'ordersChangePercent'],
    },
    {
      label: 'Avg order value',
      valueKeys: ['avgOrderValue', 'averageOrderValue', 'aov'],
      trendKeys: ['avgOrderValueTrend', 'aovTrend', 'avgOrderChange', 'aovChangePercent'],
    },
    {
      label: 'Active customers',
      valueKeys: ['activeCustomers', 'activeCustomerCount', 'customersActive'],
      trendKeys: ['activeCustomersTrend', 'customersTrend', 'activeCustomerChange'],
    },
  ]

  const mapped = defs
    .map(({ label, valueKeys, trendKeys }) => {
      const rawValue = pick(data, ...valueKeys)
      const trend = pick(data, ...trendKeys)
      if (rawValue == null && trend == null) return null
      return {
        label,
        value: formatKpiValue(rawValue, label),
        trend: fmtTrend(trend),
      }
    })
    .filter(Boolean)

  return mapped.length ? mapped : null
}

function mapKpis(data) {
  const fromSummary = mapKpisFromSummary(data?.summary)
  if (fromSummary?.length) return filterExcludedKpis(fromSummary)

  const fromList =
    mapKpiArray(pick(data, 'kpis', 'kpiData', 'metrics', 'summary')) ??
    mapKpisFromFields(data) ??
    mapKpisFromFields(pick(data, 'todayStats', 'stats', 'summaryStats') ?? {})

  return filterExcludedKpis(fromList)
}

function mapSeriesPoints(series) {
  if (!Array.isArray(series) || series.length === 0) return null

  const labels = []
  const values = []
  const orders = []

  series.forEach((point) => {
    if (point == null) return
    if (typeof point === 'number') {
      values.push(Number(point) || 0)
      labels.push('')
      orders.push(0)
      return
    }

    const label = pick(point, 'label', 'date', 'day', 'name', 'x')
    const value = Number(pick(point, 'value', 'amount', 'revenue', 'total', 'y')) || 0
    const orderCount = Number(pick(point, 'orders', 'orderCount', 'order', 'totalOrders')) || 0
    values.push(value)
    labels.push(label != null ? formatRevenueTrendLabel(label) : '')
    orders.push(orderCount)
  })

  if (!values.length) return null
  return { revLabels: labels, revValues: values, orderValues: orders }
}

function normalizeSparklineSeries(values) {
  if (!Array.isArray(values) || !values.length) return null
  return values.map((value) => Number(value) || 0)
}

function normalizeRevenueTrendResult(result) {
  if (!result?.revValues?.length) return null

  const revValues = result.revValues.map((value) => Number(value) || 0)
  const revLabels = Array.isArray(result.revLabels) ? [...result.revLabels] : []
  const orderValues = Array.isArray(result.orderValues)
    ? result.orderValues.map((value) => Number(value) || 0)
    : revValues.map(() => 0)

  while (revLabels.length < revValues.length) revLabels.push('')
  if (revLabels.length > revValues.length) revLabels.length = revValues.length
  while (orderValues.length < revValues.length) orderValues.push(0)
  if (orderValues.length > revValues.length) orderValues.length = revValues.length

  const avgOrderValues = revValues.map((revenue, index) => {
    const orders = orderValues[index]
    return orders > 0 ? revenue / orders : 0
  })

  return {
    revLabels: revLabels.map((label, index) => {
      const trimmed = String(label ?? '').trim()
      return trimmed || `Day ${index + 1}`
    }),
    revValues,
    orderValues,
    avgOrderValues,
  }
}

function findRevenueTrendArray(data) {
  if (!data || typeof data !== 'object') return null

  const keys = [
    'revenueTrend',
    'revenueChart',
    'revenueHistory',
    'last14DaysRevenue',
    'revenueSeries',
    'trendData',
    'trend',
    'dataPoints',
    'points',
    'series',
    'items',
    'data',
  ]

  for (const key of keys) {
    const value = data[key]
    if (Array.isArray(value) && value.length) return value
  }

  const charts = pick(data, 'charts', 'analytics')
  if (Array.isArray(charts?.revenueTrend) && charts.revenueTrend.length) return charts.revenueTrend
  if (Array.isArray(charts?.revenue) && charts.revenue.length) return charts.revenue

  return null
}

function mapRevenueTrend(data) {
  if (Array.isArray(data)) return normalizeRevenueTrendResult(mapSeriesPoints(data))

  const series = findRevenueTrendArray(data)
  if (series) return normalizeRevenueTrendResult(mapSeriesPoints(series))

  const trend =
    pick(data, 'revenueTrend', 'revenueChart', 'revenueHistory', 'last14DaysRevenue', 'revenueSeries') ??
    pick(data, 'charts', 'analytics')?.revenueTrend ??
    pick(data, 'charts', 'analytics')?.revenue

  if (Array.isArray(trend)) return normalizeRevenueTrendResult(mapSeriesPoints(trend))
  if (!trend || typeof trend !== 'object') return null

  const labels = pick(trend, 'labels', 'dates', 'days', 'xAxis')
  const values =
    pick(trend, 'values', 'amounts', 'revenue', 'data', 'yAxis', 'revenues') ??
    (Array.isArray(trend.items) ? trend.items.map((item) => pick(item, 'revenue', 'value', 'amount')) : null)

  if (Array.isArray(values) && values.length) {
    const mappedLabels =
      Array.isArray(labels) && labels.length === values.length
        ? formatRevenueTrendLabels(labels)
        : Array.isArray(trend.items) && trend.items.length === values.length
          ? formatRevenueTrendLabels(trend.items.map((item) => pick(item, 'date', 'label', 'day')))
          : null

    return normalizeRevenueTrendResult({
      revLabels: mappedLabels,
      revValues: values.map((v) => Number(v) || 0),
    })
  }

  return normalizeRevenueTrendResult(mapSeriesPoints(pick(trend, 'points', 'series', 'items')))
}

/** Parse GET /api/admin/dashboard/revenue-trend response into chart series. */
export function parseAdminDashboardRevenueTrend(payload) {
  const root = extractDashboardRoot(payload)
  return mapRevenueTrend(root) ?? mapRevenueTrend(payload)
}

function mapRepeatPct(data) {
  const mix = pick(data, 'repeatVsNew', 'customerMix', 'customerSplit')
  const raw =
    pick(data, 'repeatCustomerPercent', 'repeatPercent', 'repeatPct', 'repeatPercentage') ??
    pick(mix, 'repeat', 'repeatPercent', 'repeatPercentage', 'repeatCustomers')

  const num = Number(raw)
  if (!Number.isFinite(num)) return null
  if (num >= 0 && num <= 1) return Math.round(num * 100)
  return Math.max(0, Math.min(100, Math.round(num)))
}

function mapBestSellers(data) {
  const items = pick(
    data,
    'bestSellers',
    'bestSellingItems',
    'topProducts',
    'topSellingProducts',
    'bestSellerProducts',
  )
  if (!Array.isArray(items) || items.length === 0) return null

  const revenues = items.map(
    (item) => Number(pick(item, 'revenue', 'totalRevenue', 'amount', 'salesAmount')) || 0,
  )
  const maxRevenue = Math.max(...revenues, 1)

  return items.map((item, index) => {
    const revenue = Number(pick(item, 'revenue', 'totalRevenue', 'amount', 'salesAmount')) || 0
    const pctFromApi = pick(item, 'pct', 'percentage', 'percent', 'share')
    const pct =
      pctFromApi != null
        ? Math.max(0, Math.min(100, Math.round(Number(pctFromApi) || 0)))
        : Math.round((revenue / maxRevenue) * 100)

    return {
      rank: Number(pick(item, 'rank', 'position')) || index + 1,
      name: pick(item, 'name', 'productName', 'title', 'itemName') ?? 'Product',
      units: Number(pick(item, 'units', 'unitsSold', 'quantity', 'qty', 'soldQuantity')) || 0,
      revenueFmt: fmtINR(revenue),
      pct,
    }
  })
}

function mapPeakHours(data) {
  const items = pick(data, 'peakHours', 'orderPeakHours', 'hourlyOrders', 'peakOrderingHours')
  if (!Array.isArray(items) || items.length === 0) return null

  const rawValues = items.map(
    (item) => Number(pick(item, 'pct', 'percentage', 'percent', 'value', 'count', 'orders')) || 0,
  )
  const hasPct = items.some((item) => pick(item, 'pct', 'percentage', 'percent') != null)
  const maxValue = Math.max(...rawValues, 1)

  return items.map((item, index) => {
    const raw = rawValues[index]
    const pct = hasPct ? raw : Math.round((raw / maxValue) * 100)
    return {
      label: String(pick(item, 'label', 'hour', 'hourLabel', 'time', 'slot') ?? ''),
      pct: Math.max(0, Math.min(100, pct)),
    }
  })
}

function mapPeakHourLabel(data) {
  return (
    pick(data, 'peakHourLabel', 'peakHourRange', 'peakTimeLabel', 'peakOrderingWindow') ??
    pick(data, 'peakHoursMeta', 'peakHourSummary')?.label ??
    null
  )
}

const ORDER_STATUS_COLORS = {
  new: '#6fc2ff',
  placed: '#6fc2ff',
  pending: '#ffd58f',
  preparing: '#40deaa',
  confirmed: '#40deaa',
  packed: '#40deaa',
  delivery: '#ffd58f',
  out_for_delivery: '#ffd58f',
  out: '#ffd58f',
  delivered: '#0d8a64',
}

const ORDER_STATUS_BLOCK_META_KEYS = new Set([
  'total',
  'totalOrders',
  'count',
  'segments',
  'slices',
  'items',
  'breakdown',
  'statuses',
  'data',
  'summary',
])

function normalizeStatusKey(status) {
  return String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

function mapOrderStatusSegment(item, index) {
  const rawCode = pick(item, 'code', 'status', 'key', 'id')
  const statusKey = normalizeStatusKey(rawCode)
  const label =
    pick(item, 'label', 'name', 'statusLabel', 'statusDesc', 'statusName') ??
    (statusKey ? statusKey.replace(/_/g, ' ') : `Status ${index + 1}`)
  const count = Number(pick(item, 'count', 'orderCount', 'value', 'orders', 'total')) || 0
  const percent = Number(pick(item, 'percent', 'percentage', 'pct', 'share')) || 0

  return {
    label: label.charAt(0).toUpperCase() + label.slice(1),
    count,
    percent,
    color: pick(item, 'color') ?? ORDER_STATUS_COLORS[statusKey] ?? '#6fc2ff',
  }
}

function mapOrderStatus(data) {
  const block = data?.orderStatus ?? pick(data, 'orderStatusBreakdown', 'ordersByStatus', 'orderBreakdown')
  if (block == null) return null

  const totalFromApi = Number(pick(block, 'totalOrders', 'total', 'count'))
  const hasApiTotal = Number.isFinite(totalFromApi)
  const fromSlices = !Array.isArray(block) && Array.isArray(block.slices)

  let segments = []

  if (Array.isArray(block)) {
    segments = block.map(mapOrderStatusSegment)
  } else if (typeof block === 'object') {
    const segmentsRaw =
      block.slices ?? block.segments ?? block.items ?? block.breakdown ?? block.statuses ?? block.data ?? null

    if (Array.isArray(segmentsRaw)) {
      segments = segmentsRaw.map(mapOrderStatusSegment)
    } else if (segmentsRaw && typeof segmentsRaw === 'object') {
      segments = Object.entries(segmentsRaw).map(([key, value]) =>
        mapOrderStatusSegment(
          typeof value === 'object' && value != null
            ? { ...value, code: pick(value, 'code', 'status', 'key') ?? key }
            : { code: key, count: value },
        ),
      )
    } else {
      segments = Object.entries(block)
        .filter(([key]) => !ORDER_STATUS_BLOCK_META_KEYS.has(key))
        .map(([key, value]) =>
          mapOrderStatusSegment(
            typeof value === 'object' && value != null
              ? { ...value, code: pick(value, 'code', 'status', 'key') ?? key }
              : { code: key, count: value },
          ),
        )
    }
  }

  if (!segments.length) return null

  // API `slices` responses include zero-count statuses — keep them all.
  if (!fromSlices) {
    segments = segments.filter((item) => item.count > 0 || item.percent > 0)
    if (!segments.length) return null
  }

  const total = hasApiTotal ? totalFromApi : segments.reduce((sum, item) => sum + item.count, 0)

  return {
    total,
    segments: segments.map((item) => ({
      ...item,
      percent: fromSlices
        ? item.percent
        : item.percent || (total ? Math.round((item.count / total) * 100) : 0),
    })),
  }
}

function mapCustomerOverview(data) {
  const block = pick(data, 'customerOverview', 'customersOverview', 'customerSplit', 'customerMix')
  const repeatBlock = pick(data, 'repeatVsNew', 'repeatCustomers')

  const newPercentRaw =
    pick(block, 'newPercent', 'newCustomerPercent', 'newCustomersPercent', 'new') ??
    pick(repeatBlock, 'newPercent', 'new', 'newCustomers')

  const returningPercentRaw =
    pick(block, 'returningPercent', 'repeatPercent', 'returningCustomerPercent', 'returning', 'repeat') ??
    pick(repeatBlock, 'repeatPercent', 'repeat', 'returningCustomers')

  let newPercent = Number(newPercentRaw)
  let returningPercent = Number(returningPercentRaw)

  if (!Number.isFinite(newPercent) && Number.isFinite(returningPercent)) {
    newPercent = 100 - returningPercent
  }
  if (!Number.isFinite(returningPercent) && Number.isFinite(newPercent)) {
    returningPercent = 100 - newPercent
  }
  if (!Number.isFinite(newPercent)) return null

  if (newPercent >= 0 && newPercent <= 1) newPercent = Math.round(newPercent * 100)
  if (returningPercent >= 0 && returningPercent <= 1) returningPercent = Math.round(returningPercent * 100)
  if (!Number.isFinite(returningPercent)) returningPercent = Math.max(0, 100 - newPercent)

  return {
    newPercent: Math.max(0, Math.min(100, Math.round(newPercent))),
    returningPercent: Math.max(0, Math.min(100, Math.round(returningPercent))),
  }
}

function mapIncomingOrderRow(order, index) {
  const itemsCount =
    Number(pick(order, 'itemCount', 'itemsCount', 'items', 'quantity')) ||
    (Array.isArray(order?.items) ? order.items.length : 0)
  const total = Number(pick(order, 'totalAmount', 'total', 'amount', 'orderTotal')) || 0

  return {
    id: String(pick(order, 'orderId', 'id', 'orderNumber') ?? index),
    customer: pick(order, 'customerName', 'customer', 'buyerName', 'name') ?? 'Customer',
    itemsCount,
    totalFmt: fmtINR(total),
    payment: pick(order, 'paymentMode', 'paymentMethod', 'payment') ?? '—',
    status: pick(order, 'status', 'orderStatus') ?? 'new',
    statusDesc: pick(order, 'orderStatusDesc', 'statusLabel', 'statusDesc') ?? '',
    placedLabel: pick(order, 'placedLabel', 'timeAgo', 'orderedAgo') ?? pick(order, 'orderedAt', 'placedAt') ?? '—',
  }
}

function mapIncomingOrders(data) {
  const orders = pick(data, 'incomingOrders', 'recentOrders', 'latestOrders')
  if (!Array.isArray(orders) || !orders.length) return null
  return orders.map(mapIncomingOrderRow)
}

function mapStockAlertItem(item, index) {
  const level = normalizeStatusKey(pick(item, 'level', 'severity', 'status', 'alertType'))
  const label =
    pick(item, 'label', 'statusLabel', 'alertLabel') ??
    (level.includes('critical')
      ? 'Critical'
      : level.includes('reorder')
        ? 'Reorder Soon'
        : 'Low Stock')

  const tone =
    level.includes('critical')
      ? { color: '#ff8a80', bg: 'rgba(255,138,128,0.14)', border: 'rgba(255,138,128,0.34)' }
      : level.includes('reorder')
        ? { color: '#ffd58f', bg: 'rgba(255,181,71,0.15)', border: 'rgba(255,181,71,0.34)' }
        : { color: '#ffb347', bg: 'rgba(255,179,71,0.15)', border: 'rgba(255,179,71,0.34)' }

  return {
    id: String(pick(item, 'productId', 'id', 'sku') ?? index),
    name: pick(item, 'productName', 'name', 'title') ?? 'Product',
    sku: pick(item, 'sku', 'packType', 'code') ?? '—',
    label,
    tone,
  }
}

function mapStockAlerts(data) {
  const items = pick(data, 'stockAlerts', 'lowStockAlerts', 'inventoryAlerts')
  if (!Array.isArray(items) || !items.length) return null
  return items.map(mapStockAlertItem)
}

/** Parse GET /api/admin/dashboard/home response into dashboard view model fields. */
export function parseAdminDashboardHome(payload) {
  const data = extractDashboardRoot(payload)
  const revenue = mapRevenueTrend(data)

  return {
    kpiData: mapKpis(data),
    revLabels: revenue?.revLabels ?? null,
    revValues: revenue?.revValues ?? null,
    orderValues: revenue?.orderValues ?? null,
    avgOrderValues: revenue?.avgOrderValues ?? null,
    repeatPct: mapRepeatPct(data),
    customerOverview: mapCustomerOverview(data),
    orderStatus: mapOrderStatus(data),
    bestSellers: mapBestSellers(data),
    peakHours: mapPeakHours(data),
    peakHourLabel: mapPeakHourLabel(data),
    incomingOrders: mapIncomingOrders(data),
    stockAlerts: mapStockAlerts(data),
  }
}

let inFlightDashboardRequest = null
let inFlightDashboardKey = null

/** GET /api/admin/dashboard/home — admin dashboard summary for the home view. */
export async function fetchAdminDashboardHome({ force = false, days } = {}) {
  const params = new URLSearchParams()
  if (days != null && days !== '') params.set('days', String(days))
  const query = params.toString()
  const path = query ? `/api/admin/dashboard/home?${query}` : '/api/admin/dashboard/home'

  if (!force && inFlightDashboardRequest && inFlightDashboardKey === path) {
    return inFlightDashboardRequest
  }

  inFlightDashboardKey = path
  inFlightDashboardRequest = authFetch(path, {}, CART_API_BASE).finally(() => {
    inFlightDashboardRequest = null
    inFlightDashboardKey = null
  })

  return inFlightDashboardRequest
}

let inFlightRevenueTrendRequest = null
let inFlightRevenueTrendKey = null

export const REVENUE_TREND_PERIODS = {
  LAST_7_DAYS: 'LAST_7_DAYS',
  LAST_14_DAYS: 'LAST_14_DAYS',
  LAST_1_MONTH: 'LAST_1_MONTH',
}

/** Fetch revenue trend series for a selected period. */
export async function fetchAdminDashboardRevenueTrend(
  period = REVENUE_TREND_PERIODS.LAST_7_DAYS,
  { force = false } = {},
) {
  const safePeriod = Object.values(REVENUE_TREND_PERIODS).includes(period)
    ? period
    : REVENUE_TREND_PERIODS.LAST_7_DAYS
  const path = `/api/admin/dashboard/revenue-trend?period=${encodeURIComponent(safePeriod)}`

  if (!force && inFlightRevenueTrendRequest && inFlightRevenueTrendKey === path) {
    return inFlightRevenueTrendRequest
  }

  inFlightRevenueTrendKey = path
  inFlightRevenueTrendRequest = authFetch(path, {}, CART_API_BASE)
    .then((payload) => parseAdminDashboardRevenueTrend(payload))
    .finally(() => {
      inFlightRevenueTrendRequest = null
      inFlightRevenueTrendKey = null
    })

  return inFlightRevenueTrendRequest
}
