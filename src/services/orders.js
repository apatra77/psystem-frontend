import { authFetch, CART_API_BASE } from './api'

function pick(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key]
    if (value != null && value !== '') return value
  }
  return undefined
}

function normalizeOrderStatus(status) {
  const normalized = String(status ?? 'placed')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  const map = {
    placed: 'placed',
    order_placed: 'placed',
    pending: 'placed',
    new: 'placed',
    confirmed: 'confirmed',
    processing: 'confirmed',
    packed: 'packed',
    preparing: 'packed',
    ready: 'packed',
    shipped: 'out_for_delivery',
    out_for_delivery: 'out_for_delivery',
    out: 'out_for_delivery',
    on_the_way: 'out_for_delivery',
    delivered: 'delivered',
    completed: 'delivered',
    cancelled: 'cancelled',
    canceled: 'cancelled',
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
      pick(order, 'placedAt', 'createdAt', 'orderDate', 'date', 'orderedAt') ??
      new Date().toISOString(),
    status: normalizeOrderStatus(pick(order, 'status', 'orderStatus')),
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
