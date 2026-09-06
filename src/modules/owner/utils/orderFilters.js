/** URL query value for initiated (status I) orders. */
export const INITIATED_ORDERS_URL_STATUS = 'initiated'

export const ORDERS_STATUS_URL_KEY = 'status'

const VALID_STATUS_FILTER_IDS = new Set([
  'all',
  'pending',
  'approved',
  'cancelled',
  'rejected',
  'packed',
  'out',
  'delivered',
])

/** Map URL ?status= value to OrdersView filter id. */
export function resolveOrdersStatusFilterFromUrl(urlStatus) {
  if (!urlStatus) return 'all'
  if (urlStatus === INITIATED_ORDERS_URL_STATUS) return 'pending'
  return VALID_STATUS_FILTER_IDS.has(urlStatus) ? urlStatus : 'all'
}

/** Map OrdersView filter id to URL ?status= value (null clears param). */
export function toOrdersStatusUrlValue(filterId) {
  if (!filterId || filterId === 'all') return null
  if (filterId === 'pending') return INITIATED_ORDERS_URL_STATUS
  return filterId
}
