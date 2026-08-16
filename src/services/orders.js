import { authFetch, authHeaders, CART_API_BASE, getErrorMessage } from './api'
import { notifyUnauthorized } from '@/shared/api/tokenBridge'

function pick(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key]
    if (value != null && value !== '') return value
  }
  return undefined
}

function normalizeOrderStatus(status) {
  const raw = String(status ?? 'placed').trim()
  if (raw.length === 1) {
    const codeMap = {
      I: 'placed',
      A: 'confirmed',
      P: 'packed',
      O: 'out_for_delivery',
      D: 'delivered',
      C: 'cancelled',
      R: 'rejected',
    }
    const mapped = codeMap[raw.toUpperCase()]
    if (mapped) return mapped
  }

  const normalized = raw.toLowerCase().replace(/[\s-]+/g, '_')

  const map = {
    placed: 'placed',
    order_placed: 'placed',
    pending: 'placed',
    new: 'placed',
    initiated: 'placed',
    initiate: 'placed',
    incoming: 'placed',
    confirmed: 'confirmed',
    processing: 'confirmed',
    approved: 'confirmed',
    accepted: 'confirmed',
    preparing: 'confirmed',
    packed: 'packed',
    ready: 'packed',
    shipped: 'out_for_delivery',
    out_for_delivery: 'out_for_delivery',
    out: 'out_for_delivery',
    on_the_way: 'out_for_delivery',
    delivered: 'delivered',
    completed: 'delivered',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    rejected: 'rejected',
  }

  return map[normalized] ?? normalized
}

function formatOrderAddress(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  return [
    value.label,
    value.line1 ?? value.addressLine1,
    value.line2 ?? value.addressLine2,
    value.city,
    value.state,
    value.pincode ?? value.postalCode,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')
}

function extractOrders(payload) {
  const data = payload?.data ?? payload

  if (Array.isArray(data?.orders)) return data.orders
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data)) return data

  return []
}

function extractOrderItems(order) {
  const items = order?.items ?? order?.orderItems ?? order?.lineItems ?? order?.products ?? []
  return Array.isArray(items) ? items : []
}

function mapOrderItemFromApi(line, index) {
  const product = line?.product ?? line?.productDetails ?? line?.productInfo ?? {}

  return {
    id: String(
      pick(line, 'productId', 'id', 'itemId', 'orderItemId') ??
        pick(product, 'productId', 'id') ??
        index,
    ),
    name:
      pick(line, 'productName', 'name', 'title') ??
      pick(product, 'productName', 'name', 'title') ??
      'Product',
    qty: Number(pick(line, 'quantity', 'qty')) || 1,
    price:
      Number(pick(line, 'price', 'unitPrice', 'sellingPrice', 'salePrice')) ||
      Number(pick(product, 'price', 'sellingPrice')) ||
      0,
    image:
      pick(line, 'imageUrl', 'image', 'thumbnailUrl') ??
      pick(product, 'imageUrl', 'image', 'thumbnailUrl', 'photoUrl') ??
      null,
  }
}

/** Map one API order into the customer order store shape. */
export function mapOrderFromApi(order, index = 0) {
  const items = extractOrderItems(order).map(mapOrderItemFromApi)
  const total =
    Number(pick(order, 'totalAmount', 'total', 'amount', 'grandTotal', 'orderTotal')) ||
    items.reduce((sum, item) => sum + item.price * item.qty, 0)

  return {
    id: String(pick(order, 'orderId', 'id', 'orderNumber') ?? `ORD-${index + 1}`),
    placedAt:
      pick(order, 'placedAt', 'createdAt', 'orderDate', 'date', 'orderedAt', 'orderPlacedAt') ??
      new Date().toISOString(),
    statusUpdatedAt:
      pick(order, 'statusUpdatedAT', 'statusUpdatedAt', 'status_updated_at', 'statusUpdatedOn') ??
      pick(order, 'placedAt', 'createdAt', 'orderDate', 'date', 'orderedAt', 'orderPlacedAt') ??
      new Date().toISOString(),
    status: normalizeOrderStatus(pick(order, 'status', 'orderStatus')),
    orderStatusDesc:
      pick(order, 'orderStatusDesc', 'statusDesc', 'statusDescription', 'orderStatusDescription') ?? '',
    paymentMethod: String(pick(order, 'paymentMethod', 'paymentMode', 'paymentStatus') ?? 'cod').toLowerCase(),
    address: formatOrderAddress(
      pick(order, 'deliveryAddress', 'shippingAddress', 'address') ?? order?.addressDetails,
    ),
    rider: order?.rider ?? null,
    items,
    total,
  }
}

/** Map GET /api/orders/me into store-ready orders. */
export function mapOrdersFromApi(payload) {
  return extractOrders(payload).map(mapOrderFromApi)
}

const ADMIN_STATUS_FROM_API = {
  I: 'new',
  A: 'preparing',
  P: 'ready',
  O: 'out',
  D: 'delivered',
  C: 'cancelled',
  R: 'rejected',
}

const UI_STATUS_TO_API = {
  pending: 'I',
  approved: 'A',
  cancelled: 'C',
  rejected: 'R',
  packed: 'P',
  out: 'O',
  delivered: 'D',
}

/** Map owner-portal UI status filter to API status code (omit for all). */
export function mapUiStatusFilterToApi(statusFilter) {
  if (!statusFilter || statusFilter === 'all') return undefined
  return UI_STATUS_TO_API[statusFilter]
}

/** Map sort UI value to API sort param. */
export function mapUiSortToApi(sortBy) {
  return sortBy === 'oldest' ? 'orderPlacedAt,asc' : 'orderPlacedAt,desc'
}

function mapAdminApiStatus(status) {
  const raw = String(status ?? '').trim()
  if (!raw) return 'new'
  if (raw.length === 1) return ADMIN_STATUS_FROM_API[raw.toUpperCase()] ?? 'new'

  const normalized = raw.toLowerCase()
  const wordMap = {
    incoming: 'new',
    initiated: 'new',
    pending: 'new',
    new: 'new',
    accepted: 'preparing',
    approved: 'preparing',
    preparing: 'preparing',
    packed: 'ready',
    ready: 'ready',
    shipped: 'out',
    out_for_delivery: 'out',
    out: 'out',
    delivered: 'delivered',
    completed: 'delivered',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    rejected: 'rejected',
  }
  return wordMap[normalized.replace(/[\s-]+/g, '_')] ?? 'new'
}

/** Map one admin API order into the owner portal raw order shape. */
export function mapAdminOrderFromApi(order, index = 0) {
  const items = extractOrderItems(order).map((line, lineIndex) => {
    const product = line?.product ?? line?.productDetails ?? line?.productInfo ?? {}
    return {
      n:
        pick(line, 'productName', 'name', 'title') ??
        pick(product, 'productName', 'name', 'title') ??
        'Product',
      q: Number(pick(line, 'quantity', 'qty')) || 1,
      p:
        Number(pick(line, 'price', 'unitPrice', 'sellingPrice', 'salePrice')) ||
        Number(pick(product, 'price', 'sellingPrice')) ||
        0,
    }
  })

  const paymentRaw = String(pick(order, 'paymentMethod', 'paymentMode', 'paymentStatus') ?? 'cod').toLowerCase()
  const payment = paymentRaw.includes('cod') || paymentRaw === 'cash' ? 'COD' : 'Card'
  const itemsTotal = items.reduce((sum, item) => sum + item.p * item.q, 0)
  const orderTotal =
    Number(pick(order, 'orderTotal', 'totalAmount', 'total', 'amount', 'grandTotal', 'orderTotalAmount')) ||
    itemsTotal
  const itemCount =
    Number(pick(order, 'itemCount', 'itemsCount', 'totalItems', 'lineItemCount')) ||
    items.length
  const apiOrderId = String(
    pick(order, 'orderId', 'id') ?? pick(order, 'orderNumber') ?? `ORD-${index + 1}`,
  )
  const displayId = String(
    pick(order, 'orderNumber', 'orderId', 'id') ?? `ORD-${index + 1}`,
  )

  return {
    id: displayId,
    apiOrderId,
    customer:
      pick(order, 'customerName', 'customer', 'userName', 'name', 'fullName') ??
      'Customer',
    phone: pick(order, 'customerPhone', 'phone', 'mobile', 'contactNumber') ?? '',
    email: pick(order, 'customerEmail', 'email') ?? '',
    address: formatOrderAddress(
      pick(order, 'deliveryAddress', 'shippingAddress', 'address') ?? order?.addressDetails,
    ),
    status: mapAdminApiStatus(pick(order, 'status', 'orderStatus')),
    orderStatusDesc:
      pick(order, 'orderStatusDesc', 'statusDesc', 'statusDescription', 'orderStatusDescription') ??
      '',
    payment,
    orderedAt:
      pick(order, 'orderPlacedAt', 'placedAt', 'createdAt', 'orderDate', 'orderedAt') ??
      new Date().toISOString(),
    orderTotal,
    itemCount,
    items,
  }
}

/** Parse paginated GET /api/admin/orders response. */
export function parseAdminOrdersPage(payload) {
  const data = payload?.data ?? payload
  const content = extractOrders(payload)

  return {
    orders: content.map(mapAdminOrderFromApi),
    totalElements: Number(data?.totalElements ?? data?.total ?? content.length) || 0,
    totalPages: Math.max(1, Number(data?.totalPages) || 1),
    page: Number(data?.number ?? data?.page ?? 0) || 0,
    size: Number(data?.size ?? content.length) || 0,
  }
}

let inFlightAdminOrdersRequest = null
let inFlightAdminOrdersKey = null

function buildAdminOrdersQuery({ status, fromDate, toDate, search, page, size, sort } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (fromDate) params.set('fromDate', fromDate)
  if (toDate) params.set('toDate', toDate)
  if (search?.trim()) params.set('search', search.trim())
  if (page != null && page !== '') params.set('page', String(page))
  if (size != null && size !== '') params.set('size', String(size))
  if (sort) params.set('sort', sort)
  return params.toString()
}

/** Build query params only for active (non-default) filters. */
export function buildAdminOrdersParams({
  statusFilter = 'all',
  sortBy = 'newest',
  search = '',
  page = 1,
  fromDate,
  toDate,
  pageSize = 20,
} = {}) {
  const params = {}
  const apiStatus = mapUiStatusFilterToApi(statusFilter)
  const trimmedSearch = search.trim()

  if (apiStatus) params.status = apiStatus
  if (fromDate) params.fromDate = fromDate
  if (toDate) params.toDate = toDate
  if (trimmedSearch) params.search = trimmedSearch
  if (sortBy !== 'newest') params.sort = mapUiSortToApi(sortBy)
  if (page > 1) {
    params.page = page - 1
    params.size = pageSize
  }

  return params
}

/** GET /api/admin/orders — fetch paginated admin orders with optional filters. */
export async function fetchAdminOrders(
  {
    status,
    fromDate,
    toDate,
    search,
    page,
    size,
    sort,
    force = false,
    signal,
  } = {},
) {
  const query = buildAdminOrdersQuery({ status, fromDate, toDate, search, page, size, sort })
  const path = query ? `/api/admin/orders?${query}` : '/api/admin/orders'
  const requestKey = path

  if (!force && inFlightAdminOrdersRequest && inFlightAdminOrdersKey === requestKey) {
    return inFlightAdminOrdersRequest
  }

  inFlightAdminOrdersKey = requestKey
  inFlightAdminOrdersRequest = authFetch(
    path,
    signal ? { signal } : {},
    CART_API_BASE,
  ).finally(() => {
    inFlightAdminOrdersRequest = null
    inFlightAdminOrdersKey = null
  })

  return inFlightAdminOrdersRequest
}

function normalizeAdminOrderId(orderId) {
  return encodeURIComponent(String(orderId).trim().replace(/^#/, ''))
}

/** POST /api/admin/orders/{orderId}/accept */
export async function acceptAdminOrder(orderId) {
  return authFetch(
    `/api/admin/orders/${normalizeAdminOrderId(orderId)}/accept`,
    { method: 'POST' },
    CART_API_BASE,
  )
}

/** POST /api/admin/orders/{orderId}/reject */
export async function rejectAdminOrder(orderId) {
  return authFetch(
    `/api/admin/orders/${normalizeAdminOrderId(orderId)}/reject`,
    { method: 'POST' },
    CART_API_BASE,
  )
}

function postAdminOrderAction(orderId, action) {
  return authFetch(
    `/api/admin/orders/${normalizeAdminOrderId(orderId)}/${action}`,
    { method: 'POST' },
    CART_API_BASE,
  )
}

/** POST /api/admin/orders/{orderId}/start-packing */
export async function startPackingAdminOrder(orderId) {
  return postAdminOrderAction(orderId, 'start-packing')
}

/** POST /api/admin/orders/{orderId}/dispatch */
export async function dispatchAdminOrder(orderId) {
  return postAdminOrderAction(orderId, 'dispatch')
}

/** POST /api/admin/orders/{orderId}/deliver */
export async function deliverAdminOrder(orderId) {
  return postAdminOrderAction(orderId, 'deliver')
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildInvoiceHtmlFromPayload(payload) {
  const data = payload?.data ?? payload ?? {}
  const orderId = pick(data, 'orderId', 'orderNumber', 'id') ?? 'Invoice'
  const customer =
    pick(data, 'customerName', 'customer', 'userName', 'name', 'fullName') ?? 'Customer'
  const phone = pick(data, 'customerPhone', 'phone', 'mobile') ?? ''
  const email = pick(data, 'customerEmail', 'email') ?? ''
  const address = formatOrderAddress(
    pick(data, 'deliveryAddress', 'shippingAddress', 'address') ?? data?.addressDetails,
  )
  const items = extractOrderItems(data)
  const lines = items
    .map((line, index) => {
      const product = line?.product ?? line?.productDetails ?? line?.productInfo ?? {}
      const name =
        pick(line, 'productName', 'name', 'title') ??
        pick(product, 'productName', 'name', 'title') ??
        'Product'
      const qty = Number(pick(line, 'quantity', 'qty')) || 1
      const price =
        Number(pick(line, 'price', 'unitPrice', 'sellingPrice', 'salePrice')) ||
        Number(pick(product, 'price', 'sellingPrice')) ||
        0
      return `<tr><td>${escapeHtml(name)}</td><td>${qty}</td><td>₹${price * qty}</td></tr>`
    })
    .join('')
  const total =
    Number(pick(data, 'orderTotal', 'totalAmount', 'total', 'grandTotal', 'orderTotalAmount')) ||
    items.reduce((sum, line) => {
      const product = line?.product ?? {}
      const qty = Number(pick(line, 'quantity', 'qty')) || 1
      const price =
        Number(pick(line, 'price', 'unitPrice', 'sellingPrice')) ||
        Number(pick(product, 'price', 'sellingPrice')) ||
        0
      return sum + price * qty
    }, 0)

  return `<!DOCTYPE html><html><head><title>Invoice ${escapeHtml(orderId)}</title></head><body style="font-family:sans-serif;padding:24px">
    <h2>Invoice ${escapeHtml(orderId)}</h2>
    <p><strong>${escapeHtml(customer)}</strong><br/>${escapeHtml(phone)}${email ? `<br/>${escapeHtml(email)}` : ''}<br/>${escapeHtml(address)}</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:16px">
      <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
      <tbody>${lines || `<tr><td colspan="3">No line items</td></tr>`}</tbody>
    </table>
    <p style="margin-top:16px;font-size:18px"><strong>Total: ₹${Math.round(total).toLocaleString('en-IN')}</strong></p>
  </body></html>`
}

async function fetchInvoiceFromPath(path) {
  const res = await fetch(`${CART_API_BASE}${path}`, {
    headers: authHeaders({ Accept: 'application/json, text/html, application/pdf, */*' }),
  })

  if (res.status === 401) {
    notifyUnauthorized()
  }

  if (!res.ok) {
    let message = getErrorMessage(null, res.status)
    try {
      message = getErrorMessage(await res.json(), res.status)
    } catch {
      try {
        const text = await res.text()
        if (text) message = text
      } catch {
        /* ignore */
      }
    }
    throw new Error(message)
  }

  const contentType = res.headers.get('content-type') ?? ''

  if (contentType.includes('application/pdf')) {
    return { kind: 'pdf', blob: await res.blob() }
  }

  if (contentType.includes('text/html')) {
    return { kind: 'html', html: await res.text() }
  }

  const text = await res.text()
  try {
    return { kind: 'json', data: JSON.parse(text)?.data ?? JSON.parse(text) }
  } catch {
    if (text.trim().startsWith('<')) {
      return { kind: 'html', html: text }
    }
    throw new Error('Unexpected invoice response format')
  }
}

/** GET /api/orders/{orderId}/invoice/pdf — customer portal */
export async function fetchOrderInvoice(orderId) {
  return fetchInvoiceFromPath(`/api/orders/${normalizeAdminOrderId(orderId)}/invoice/pdf`)
}

/** GET /api/admin/orders/{orderId}/invoice/pdf — admin portal */
export async function fetchAdminOrderInvoice(orderId) {
  return fetchInvoiceFromPath(`/api/admin/orders/${normalizeAdminOrderId(orderId)}/invoice/pdf`)
}

/** Open invoice document from API response in a printable window. */
export function openOrderInvoiceDocument(result) {
  const popup = window.open('', '_blank', 'width=720,height=840')
  if (!popup) {
    throw new Error('Pop-up blocked — allow pop-ups to print the invoice')
  }

  if (result.kind === 'pdf') {
    const url = URL.createObjectURL(result.blob)
    popup.location.href = url
    popup.onload = () => {
      popup.focus()
      popup.print()
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    }
    return
  }

  const html =
    result.kind === 'html' ? result.html : buildInvoiceHtmlFromPayload(result.data)

  popup.document.open()
  popup.document.write(html)
  popup.document.close()
  popup.focus()
  popup.print()
}

function normalizeCustomerOrderId(orderId) {
  return encodeURIComponent(String(orderId).trim().replace(/^#/, ''))
}

/** POST /api/orders/{orderId}/cancel */
export async function cancelCustomerOrder(orderId, reason) {
  return authFetch(
    `/api/orders/${normalizeCustomerOrderId(orderId)}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify(reason != null && reason !== '' ? { reason } : {}),
    },
    CART_API_BASE,
  )
}

let inFlightOrdersRequest = null

/** GET /api/orders/me — fetch the signed-in customer's orders. */
export async function fetchMyOrders({ force = false } = {}) {
  if (!force && inFlightOrdersRequest) {
    return inFlightOrdersRequest
  }

  inFlightOrdersRequest = authFetch('/api/orders/me', {}, CART_API_BASE).finally(() => {
    inFlightOrdersRequest = null
  })

  return inFlightOrdersRequest
}
