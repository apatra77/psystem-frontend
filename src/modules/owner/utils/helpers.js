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

/** Derive display initials from a category name (e.g. "Vitamins & Supplements" → "V&S"). */
export function getCategoryInitials(name) {
  const trimmed = String(name ?? '').trim()
  if (!trimmed) return '?'

  if (trimmed.includes('&')) {
    return trimmed
      .split('&')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('&')
  }

  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0][0]?.toUpperCase() ?? '?'

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export function orderStatusMeta(s) {
  const danger = { color: '#ff8a80', bg: 'rgba(255,138,128,0.14)', border: 'rgba(255,138,128,0.34)' }
  const map = {
    new: { label: 'New', color: '#9cc4ff', bg: 'rgba(90,162,255,.14)', border: 'rgba(90,162,255,.32)' },
    preparing: { label: 'Preparing', color: '#ffd58f', bg: 'rgba(255,181,71,.15)', border: 'rgba(255,181,71,.34)' },
    ready: { label: 'Ready for pickup', color: '#40deaa', bg: 'rgba(64,222,170,.14)', border: 'rgba(64,222,170,.36)' },
    out: { label: 'Out for delivery', color: '#d4bcff', bg: 'rgba(178,135,255,.15)', border: 'rgba(178,135,255,.34)' },
    delivered: { label: 'Delivered', color: '#68d9b4', bg: 'rgba(64,222,170,.08)', border: 'rgba(64,222,170,.22)' },
    rejected: { label: 'Rejected', ...danger },
    cancelled: { label: 'Cancelled', ...danger },
  }
  return map[s] || map.new
}

const STATUS_STYLE = {
  danger: { color: '#ff8a80', bg: 'rgba(255,138,128,0.14)', border: 'rgba(255,138,128,0.34)' },
  delivered: { color: '#40deaa', bg: 'rgba(64,222,170,0.16)', border: 'rgba(64,222,170,0.42)' },
  outForDelivery: { color: '#b287ff', bg: 'rgba(178,135,255,0.18)', border: 'rgba(178,135,255,0.4)' },
  packing: { color: '#ffd58f', bg: 'rgba(255,181,71,0.18)', border: 'rgba(255,181,71,0.4)' },
  accepted: { color: '#6fc2ff', bg: 'rgba(111,194,255,0.16)', border: 'rgba(111,194,255,0.38)' },
  warn: { color: '#ffd58f', bg: 'rgba(255,181,71,.15)', border: 'rgba(255,181,71,.34)' },
  info: { color: '#9cc4ff', bg: 'rgba(90,162,255,.14)', border: 'rgba(90,162,255,.32)' },
  purple: { color: '#d4bcff', bg: 'rgba(178,135,255,.15)', border: 'rgba(178,135,255,.34)' },
  mint: { color: '#40deaa', bg: 'rgba(64,222,170,.14)', border: 'rgba(64,222,170,.36)' },
}

export function getOrderStatusDisplayMeta({ status, orderStatusDesc }) {
  const desc = String(orderStatusDesc ?? '').trim()
  const descLower = desc.toLowerCase()
  const fallback = orderStatusMeta(status)
  const label = desc || fallback.label

  if (descLower.includes('cancel')) return { label, ...STATUS_STYLE.danger }
  if (descLower.includes('reject')) return { label, ...STATUS_STYLE.danger }
  if (descLower.includes('out for deliver')) return { label, ...STATUS_STYLE.outForDelivery }
  if (descLower.includes('delivered') || descLower.includes('order delivered')) {
    return { label, ...STATUS_STYLE.delivered }
  }
  if (descLower.includes('pack')) return { label, ...STATUS_STYLE.packing }
  if (descLower.includes('accept')) return { label, ...STATUS_STYLE.accepted }
  if (descLower.includes('prepar') || descLower.includes('approv')) return { label, ...STATUS_STYLE.warn }
  if (descLower.includes('initiat') || descLower.includes('pending') || descLower.includes('incoming')) {
    return { label, ...STATUS_STYLE.info }
  }

  if (status === 'out') return { label, ...STATUS_STYLE.outForDelivery }
  if (status === 'delivered') return { label, ...STATUS_STYLE.delivered }
  if (status === 'ready') return { label, ...STATUS_STYLE.packing }
  if (status === 'preparing') return { label, ...STATUS_STYLE.accepted }

  return { label, color: fallback.color, bg: fallback.bg, border: fallback.border }
}

export function getReviewStatus(status, orderStatusDesc = '') {
  const desc = String(orderStatusDesc).toLowerCase()
  if (status === 'new') return 'pending'
  if (status === 'rejected' || desc.includes('reject')) return 'rejected'
  if (status === 'cancelled' || desc.includes('cancel')) return 'cancelled'
  return 'approved'
}

export function reviewStatusMeta(reviewStatus) {
  const map = {
    pending: { label: 'Pending', color: '#ffd58f', bg: 'rgba(255,181,71,.15)', border: 'rgba(255,181,71,.34)' },
    approved: { label: 'Approved', color: '#40deaa', bg: 'rgba(64,222,170,.14)', border: 'rgba(64,222,170,.36)' },
    rejected: { label: 'Rejected', color: '#ff8a80', bg: 'rgba(255,138,128,0.14)', border: 'rgba(255,138,128,0.34)' },
    cancelled: { label: 'Cancelled', color: '#ff8a80', bg: 'rgba(255,138,128,0.14)', border: 'rgba(255,138,128,0.34)' },
  }
  return map[reviewStatus] || map.pending
}

export function paymentStatusMeta(payment = '') {
  const isCod = String(payment).toUpperCase() === 'COD'
  return isCod
    ? { label: 'COD', color: '#ffd58f', bg: 'rgba(255,181,71,.15)', border: 'rgba(255,181,71,.34)' }
    : { label: 'Paid', color: '#40deaa', bg: 'rgba(64,222,170,.14)', border: 'rgba(64,222,170,.36)' }
}

export function formatOrderedOn(order) {
  if (order.orderedAt) {
    return new Date(order.orderedAt).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  if (order.date && order.time) return `${order.date} ${order.time}`
  if (order.placedMinAgo != null) return `${order.placedMinAgo} min ago`
  return '—'
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
  const total =
    o.orderTotal != null && o.orderTotal !== ''
      ? Number(o.orderTotal)
      : orderTotal(o)
  const reviewStatus = getReviewStatus(o.status, o.orderStatusDesc)
  const reviewMeta = {
    ...reviewStatusMeta(reviewStatus),
    ...(reviewStatus === 'cancelled' && o.orderStatusDesc?.trim()
      ? { label: o.orderStatusDesc.trim() }
      : {}),
  }
  const orderedAtMs = o.orderedAt
    ? new Date(o.orderedAt).getTime()
    : o.placedMinAgo != null
      ? Date.now() - o.placedMinAgo * 60_000
      : 0

  return {
    ...o,
    itemsCount:
      o.itemCount != null && o.itemCount !== ''
        ? Number(o.itemCount)
        : o.items.length,
    total,
    totalFmt: fmtINR(total),
    statusMeta: sm,
    reviewStatus,
    reviewMeta,
    statusDisplayMeta: getOrderStatusDisplayMeta({
      status: o.status,
      orderStatusDesc: o.orderStatusDesc,
    }),
    paymentMeta: paymentStatusMeta(o.payment),
    orderedOn: formatOrderedOn(o),
    orderedAtMs,
    phone: o.phone ?? '—',
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
  orders: { title: 'Orders', subtitle: 'Manage and review customer orders.' },
  products: { title: 'Products', subtitle: 'Catalog, pricing and stock' },
  categories: { title: 'Categories', subtitle: 'Organize your storefront aisles' },
  inventory: { title: 'Inventory', subtitle: 'Stock levels and price sync' },
  discounts: { title: 'Discounts & Promotions', subtitle: 'Offers, codes and Circle perks' },
  logistics: { title: 'Logistics', subtitle: 'Riders, couriers and live deliveries' },
  staff: { title: 'Staff & Roles', subtitleKey: 'staffOutlet' },
  store: { title: 'Store Profile', subtitle: 'Hours, location and delivery radius' },
  profile: { title: 'My Profile', subtitle: 'Manage your personal information' },
}
