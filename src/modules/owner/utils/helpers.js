export function fmtINR(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

export const accentMeta = {
  mint: { c: '#40deaa', bg1: 'rgba(64,222,170,.16)', bg2: 'rgba(64,222,170,.03)', border: 'rgba(64,222,170,.32)' },
  blue: { c: '#6fc2ff', bg1: 'rgba(90,162,255,.16)', bg2: 'rgba(90,162,255,.03)', border: 'rgba(90,162,255,.3)' },
  gold: { c: '#ffd58f', bg1: 'rgba(255,181,71,.17)', bg2: 'rgba(255,181,71,.03)', border: 'rgba(255,181,71,.32)' },
  purple: { c: '#d4bcff', bg1: 'rgba(178,135,255,.17)', bg2: 'rgba(178,135,255,.03)', border: 'rgba(178,135,255,.32)' },
}

export function getAccentMeta(a) {
  return accentMeta[a] || accentMeta.mint
}

export function orderStatusMeta(s) {
  const danger = { color: '#ff8a80', bg: 'rgba(255,138,128,0.14)', border: 'rgba(255,138,128,0.34)' }
  const map = {
    new: { label: 'New', color: '#9cc4ff', bg: 'rgba(90,162,255,.14)', border: 'rgba(90,162,255,.32)' },
    preparing: { label: 'Preparing', color: '#ffd58f', bg: 'rgba(255,181,71,.15)', border: 'rgba(255,181,71,.34)' },
    ready: { label: 'Ready for pickup', color: '#40deaa', bg: 'rgba(64,222,170,.14)', border: 'rgba(64,222,170,.36)' },
    out: { label: 'Out for delivery', color: '#d4bcff', bg: 'rgba(178,135,255,.15)', border: 'rgba(178,135,255,.34)' },
    delivered: { label: 'Delivered', color: '#68d9b4', bg: 'rgba(64,222,170,.08)', border: 'rgba(64,222,170,.22)' },
    cancelled: { label: 'Cancelled', ...danger },
  }
  return map[s] || map.new
}

export function stockMeta(stock) {
  if (stock <= 0) {
    return { label: 'Out of stock', color: '#ff8a80', bg: 'rgba(255,138,128,0.14)', border: 'rgba(255,138,128,0.34)' }
  }
  if (stock <= 20) {
    return { label: 'Low stock', color: '#ffd58f', bg: 'rgba(255,181,71,.15)', border: 'rgba(255,181,71,.34)' }
  }
  return { label: 'In stock', color: '#40deaa', bg: 'rgba(64,222,170,.14)', border: 'rgba(64,222,170,.36)' }
}

export function orderTotal(o) {
  return o.items.reduce((s, it) => s + it.p * it.q, 0)
}

export function mapOrder(o) {
  const sm = orderStatusMeta(o.status)
  const total = orderTotal(o)
  return {
    ...o,
    itemsCount: o.items.length,
    total,
    totalFmt: fmtINR(total),
    statusMeta: sm,
    placedLabel: o.placedMinAgo != null ? `${o.placedMinAgo} min ago` : `${o.date}, ${o.time}`,
  }
}

export function buildRevenueChart(revValues) {
  const chartW = 680
  const chartH = 200
  const topPad = 14
  const bottomPad = 26
  const baseline = chartH - bottomPad
  const maxRev = Math.max(...revValues)
  const minRev = Math.min(...revValues)
  const stepX = chartW / (revValues.length - 1)
  const pts = revValues.map((v, i) => [
    i * stepX,
    topPad + (1 - (v - minRev) / (maxRev - minRev || 1)) * (chartH - topPad - bottomPad),
  ])
  const revenueLinePoints = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const revenueAreaPath = `M${pts[0][0].toFixed(1)},${baseline} L${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L')} L${pts[pts.length - 1][0].toFixed(1)},${baseline} Z`
  return {
    revenueLinePoints,
    revenueAreaPath,
    revenueLastX: pts[pts.length - 1][0].toFixed(1),
    revenueLastY: pts[pts.length - 1][1].toFixed(1),
  }
}

export const PAGE_META = {
  dashboard: { title: 'Dashboard', subtitleKey: 'outlet' },
  orders: { title: 'Orders', subtitle: 'Live queue and history' },
  products: { title: 'Products', subtitle: 'Catalog, pricing and stock' },
  categories: { title: 'Categories', subtitle: 'Organize your storefront aisles' },
  inventory: { title: 'Inventory', subtitle: 'Stock levels and price sync' },
  discounts: { title: 'Discounts & Promotions', subtitle: 'Offers, codes and Circle perks' },
  logistics: { title: 'Logistics', subtitle: 'Riders, couriers and live deliveries' },
  staff: { title: 'Staff & Roles', subtitleKey: 'staffOutlet' },
  store: { title: 'Store Profile', subtitle: 'Hours, location and delivery radius' },
  profile: { title: 'My Profile', subtitle: 'Manage your personal information' },
}
