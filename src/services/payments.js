import { authFetch, PAYMENT_API_BASE } from './api'

function pick(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key]
    if (value != null && value !== '') return value
  }
  return undefined
}

export function mapCodPaymentFromApi(payload) {
  const d = payload?.data ?? payload ?? {}

  return {
    message: pick(d, 'message') ?? 'Order placed',
    orderId: String(pick(d, 'orderId', 'order_id', 'id') ?? ''),
    paymentRequestId: pick(d, 'paymentRequestId', 'payment_request_id'),
    paymentStatus: pick(d, 'paymentStatus', 'payment_status') ?? 'COD',
    amount: Number(pick(d, 'amount')) || 0,
  }
}

/** POST /api/payments/cod — record a cash-on-delivery payment attempt. */
export async function createCodPayment({ amount, transactionNote, transactionRefId, deliveryAddressId }) {
  const payload = await authFetch(
    '/api/payments/cod',
    {
      method: 'POST',
      body: JSON.stringify({
        amount: Number(amount),
        transactionNote,
        transactionRefId,
        deliveryAddressId: String(deliveryAddressId),
      }),
    },
    PAYMENT_API_BASE,
  )

  return mapCodPaymentFromApi(payload)
}
