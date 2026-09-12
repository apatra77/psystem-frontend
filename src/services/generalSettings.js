import { authFetch } from './api'

let inFlightRequest = null

/** Infer display/edit type from DB code + description (no fixed code list). */
export function inferGeneralSettingType(code, description = '') {
  const haystack = `${String(code ?? '')} ${String(description ?? '')}`.toUpperCase()

  if (/MOBILE|PHONE|CONTACT|WHATSAPP|TEL/.test(haystack)) return 'phone'
  if (/EMAIL|MAIL/.test(haystack)) return 'text'
  if (/QUANTITY|STOCK|QTY|COUNT/.test(haystack)) return 'quantity'

  return 'amount'
}

function parseSettingValue(item, type) {
  const raw = String(item?.value ?? '').trim()
  if (type === 'phone' || type === 'text') return raw

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

  const rows = list
    .map((item) => {
      const code = String(item?.code ?? '').trim()
      if (!code) return null

      const label = String(item?.description ?? '').trim() || code
      const type = inferGeneralSettingType(code, label)

      return {
        code,
        label,
        value: parseSettingValue(item, type),
        type,
      }
    })
    .filter(Boolean)

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
