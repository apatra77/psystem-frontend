import { useCallback, useEffect, useState } from 'react'
import { fetchAdminDashboardHome, parseAdminDashboardHome } from '@/services/dashboard'
import {
  BEST_SELLERS,
  PEAK_HOURS,
  REV_LABELS,
  REV_VALUES,
} from '../data/initialState'

const DEFAULT_REPEAT_PCT = 68

export const DEFAULT_TOP_KPIS = [
  { id: 'revenueToday', label: "Today's Revenue", value: '₹1,84,320', trend: '+12.4%', direction: 'UP', tone: 'mint', showTrend: true },
  { id: 'ordersToday', label: 'Orders Today', value: '142', trend: '+8.1%', direction: 'UP', tone: 'mint', showTrend: true },
  { id: 'avgOrderValue', label: 'Avg Order Value', value: '₹1,298', trend: '+3.2%', direction: 'UP', tone: 'mint', showTrend: true },
  {
    id: 'pendingOrders',
    label: 'Pending Orders',
    value: '6',
    tone: 'gold',
    showTrend: false,
    linkLabel: 'View details',
    linkPage: 'orders',
  },
  { id: 'lowStockItems', label: 'Low Stock Items', value: '12', tone: 'gold', showTrend: false, linkLabel: 'View details', linkPage: 'inventory' },
]

export const DEFAULT_ORDER_STATUS = {
  total: 24,
  segments: [
    { label: 'New', count: 6, percent: 25, color: '#6fc2ff' },
    { label: 'Preparing', count: 4, percent: 17, color: '#40deaa' },
    { label: 'Delivery', count: 3, percent: 13, color: '#ffd58f' },
    { label: 'Delivered', count: 11, percent: 45, color: '#0d8a64' },
  ],
}

export const DEFAULT_CUSTOMER_OVERVIEW = {
  newPercent: 62,
  returningPercent: 38,
}

function withDefaults(parsed) {
  const revValues = parsed?.revValues?.length ? parsed.revValues : REV_VALUES
  const orderValues = parsed?.orderValues?.length
    ? parsed.orderValues
    : revValues.map((value) => Math.max(0, Math.round(value / 1300)))
  const avgOrderValues = parsed?.avgOrderValues?.length
    ? parsed.avgOrderValues
    : revValues.map((value, index) => {
        const orders = orderValues[index] || 0
        return orders > 0 ? value / orders : 0
      })

  return {
    kpiData: parsed?.kpiData?.length ? parsed.kpiData : DEFAULT_TOP_KPIS,
    revLabels: parsed?.revLabels?.length ? parsed.revLabels : REV_LABELS,
    revValues,
    orderValues,
    avgOrderValues,
    repeatPct: parsed?.repeatPct ?? DEFAULT_REPEAT_PCT,
    customerOverview: parsed?.customerOverview ?? DEFAULT_CUSTOMER_OVERVIEW,
    orderStatus:
      parsed && 'orderStatus' in parsed && parsed.orderStatus != null
        ? parsed.orderStatus
        : DEFAULT_ORDER_STATUS,
    bestSellers: parsed?.bestSellers?.length ? parsed.bestSellers : BEST_SELLERS,
    peakHours: parsed?.peakHours?.length ? parsed.peakHours : PEAK_HOURS,
    peakHourLabel: parsed?.peakHourLabel ?? 'Peak: 6 PM - 7 PM',
    incomingOrders: parsed?.incomingOrders ?? null,
    stockAlerts: parsed?.stockAlerts ?? null,
  }
}

export function useAdminDashboardQuery() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)

      try {
        const payload = await fetchAdminDashboardHome({ force: reloadKey > 0 })
        if (cancelled) return
        setDashboard(withDefaults(parseAdminDashboardHome(payload)))
      } catch (err) {
        if (cancelled) return
        setDashboard(null)
        setError(err instanceof Error ? err.message : 'Could not load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { dashboard, loading, error, reload }
}
