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

/** Infer display/edit type from DB code + description (no fixed code list). */
export function inferGeneralSettingType(code, description = '') {
  const haystack = `${String(code ?? '')} ${String(description ?? '')}`.toUpperCase()

  if (/MOBILE|PHONE|CONTACT|WHATSAPP|TEL/.test(haystack)) return 'phone'
  if (/EMAIL|MAIL/.test(haystack)) return 'text'
  if (/QUANTITY|STOCK|QTY|COUNT/.test(haystack)) return 'quantity'

  return 'amount'
}

function isPhoneSetting(code, description = '') {
  const key = `${code} ${description}`.toUpperCase()
  return key.includes('MOBILE') || key.includes('PHONE')
}

function parseSettingValue(item, type) {
  const raw = item?.value
  if (type === 'phone') {
    return String(raw ?? '').replace(/\D/g, '')
  }
  const num = Number(raw)
  return Number.isFinite(num) ? num : 0
}

/** Build modal rows purely from GET /api/admin/general-master-setting. */
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

  const rows = GENERAL_SETTING_ROW_ORDER.map(({ code, type: defaultType }) => {
    const item = byCode.get(code)
    const description = item?.description?.trim() || FALLBACK_LABELS[code] || code
    const type = isPhoneSetting(code, description) ? 'phone' : defaultType
    return {
      code,
      label: description,
      value: parseSettingValue(item, type),
      type,
    }
  })

  list.forEach((item) => {
    const code = String(item?.code ?? '').trim()
    if (!code || knownCodes.has(code)) return
    const description = item?.description?.trim() || code
    const type = isPhoneSetting(code, description) ? 'phone' : 'amount'
    rows.push({
      code,
      label: description,
      value: parseSettingValue(item, type),
      type,
    })
  })

  const settingsByCode = Object.fromEntries(rows.map((row) => [row.code, row.value]))

  return { rows, settingsByCode }
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

export function getNumericSetting(settingsByCode, code) {
  const value = settingsByCode?.[code]
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

export function formatContactPhoneDisplay(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  if (digits.length === 11 && digits.startsWith('0')) {
    const local = digits.slice(1)
    return `${local.slice(0, 4)}-${local.slice(4, 7)}-${local.slice(7)}`
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    const local = digits.slice(2)
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`
  }

  return raw
}

export function contactPhoneTelHref(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10) return `tel:+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `tel:+${digits}`
  return `tel:${digits}`
}

let inFlightStoreContactRequest = null

/** GET /api/public/store-contact — owner mobile for customer call bar (port 8080, no auth). */
export async function fetchStoreContactPhone({ force = false } = {}) {
  if (!force && inFlightStoreContactRequest) return inFlightStoreContactRequest

  inFlightStoreContactRequest = authFetch('/api/public/store-contact')
    .then((payload) => {
      const data = payload?.data ?? payload ?? {}
      return String(data.mobileNumber ?? data.value ?? '').trim()
    })
    .finally(() => {
      inFlightStoreContactRequest = null
    })

  return inFlightStoreContactRequest
}
