import { authFetch } from './api'

/**
 * Stable backend codes (GeneralMasterService). Used only to define UI row order.
 * Values and labels come from GET /api/admin/general-master-setting on popup open.
 */
export const GENERAL_SETTING_ROW_ORDER = [
  { code: 'MIN_ORDER_DELIVERY_CHARGES', type: 'amount' },
  { code: 'DELIVERY_CHARGES', type: 'amount' },
  { code: 'PACKING_CHARGES', type: 'amount' },
  { code: 'LOW_STOCK_QUANTITY', type: 'quantity' },
]

const FALLBACK_LABELS = {
  MIN_ORDER_DELIVERY_CHARGES: 'Minimum order for Delivery Charges',
  DELIVERY_CHARGES: 'Delivery charges',
  PACKING_CHARGES: 'Packing charges',
  LOW_STOCK_QUANTITY: 'Define low stock quantity',
}

let inFlightRequest = null

/** Build modal rows from GET /api/admin/general-master-setting response. */
export function parseGeneralMasterSettingsResponse(payload) {
  const list = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : []

  const byCode = new Map(
    list.map((item) => [String(item?.code ?? '').trim(), item]),
  )

  const knownCodes = new Set(GENERAL_SETTING_ROW_ORDER.map(({ code }) => code))

  const rows = GENERAL_SETTING_ROW_ORDER.map(({ code, type }) => {
    const item = byCode.get(code)
    const num = Number(item?.value)
    return {
      code,
      label: item?.description?.trim() || FALLBACK_LABELS[code] || code,
      value: Number.isFinite(num) ? num : 0,
      type,
    }
  })

  list.forEach((item) => {
    const code = String(item?.code ?? '').trim()
    if (!code || knownCodes.has(code)) return
    const num = Number(item?.value)
    rows.push({
      code,
      label: item?.description?.trim() || code,
      value: Number.isFinite(num) ? num : 0,
      type: 'amount',
    })
  })

  const settings = {
    minOrderForDelivery: rows.find((r) => r.code === 'MIN_ORDER_DELIVERY_CHARGES')?.value ?? 0,
    deliveryCharges: rows.find((r) => r.code === 'DELIVERY_CHARGES')?.value ?? 0,
    packingCharges: rows.find((r) => r.code === 'PACKING_CHARGES')?.value ?? 0,
    lowStockQuantity: rows.find((r) => r.code === 'LOW_STOCK_QUANTITY')?.value ?? 0,
  }

  return { rows, settings }
}

/** GET /api/admin/general-master-setting — fetch all general store settings. */
export async function fetchGeneralMasterSettings({ force = false } = {}) {
  if (!force && inFlightRequest) return inFlightRequest

  inFlightRequest = authFetch('/api/admin/general-master-setting').finally(() => {
    inFlightRequest = null
  })

  return inFlightRequest
}

/** PATCH /api/admin/general-master-setting/{code} — update a single setting value. */
export async function patchGeneralMasterSetting(code, value) {
  return authFetch(`/api/admin/general-master-setting/${encodeURIComponent(code)}`, {
    method: 'PATCH',
    body: JSON.stringify({ value: String(value) }),
  })
}

/** POST /api/admin/general-master-setting — create a new setting. */
export async function createGeneralMasterSetting({ code, description, value }) {
  return authFetch('/api/admin/general-master-setting', {
    method: 'POST',
    body: JSON.stringify({
      code: String(code).trim().toUpperCase(),
      description: String(description).trim(),
      value: String(value).trim(),
    }),
  })
}
