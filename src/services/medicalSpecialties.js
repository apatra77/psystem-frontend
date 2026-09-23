import { authFetch, DOCTOR_API_BASE } from './api'

const PUBLIC_BASE = '/api/v1/public/medical-specialties'
const ADMIN_BASE = '/api/v1/admin/medical-specialties'

let cachedSpecialties = null
let inFlightRequest = null
let cachedAdminSpecialties = null
let inFlightAdminRequest = null

function pick(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key]
    if (value != null && value !== '') return value
  }
  return undefined
}

function unwrapEntity(payload) {
  const data = payload?.data ?? payload
  if (data && typeof data === 'object' && !Array.isArray(data)) return data
  return payload
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload
  const data = payload?.data ?? payload
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.specialties)) return data.specialties
  return []
}

function resolveActiveStatus(item) {
  const activeFlag = pick(item, 'isActive', 'active', 'enabled')
  if (typeof activeFlag === 'boolean') return activeFlag
  if (activeFlag != null) return Boolean(Number(activeFlag))

  const rawStatus = pick(item, 'status')
  if (typeof rawStatus === 'string') {
    const normalized = rawStatus.trim().toUpperCase()
    if (normalized === 'INACTIVE' || normalized === 'DISABLED') return false
    if (normalized === 'ACTIVE' || normalized === 'ENABLED') return true
  }

  return true
}

export function buildSpecialtyCode(name) {
  const code = String(name ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]+/gi, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')

  return code || 'SPECIALTY'
}

export function mapMedicalSpecialtyFromApi(item = {}) {
  const id = pick(item, 'specialtyId', 'id')
  const label = pick(item, 'specialtyName', 'name', 'label') ?? ''

  return {
    id: id != null ? Number(id) || id : '',
    label,
    code: pick(item, 'specialtyCode', 'code') ?? buildSpecialtyCode(label),
    description: pick(item, 'description') ?? '',
    isActive: resolveActiveStatus(item),
  }
}

export function clearMedicalSpecialtiesCache() {
  cachedSpecialties = null
  inFlightRequest = null
  cachedAdminSpecialties = null
  inFlightAdminRequest = null
}

export async function fetchMedicalSpecialties({ force = false, activeOnly = true } = {}) {
  if (!force && cachedSpecialties !== null) return cachedSpecialties
  if (inFlightRequest) return inFlightRequest

  inFlightRequest = authFetch(PUBLIC_BASE, {}, DOCTOR_API_BASE)
    .then((payload) => {
      const list = extractList(payload)
        .map(mapMedicalSpecialtyFromApi)
        .filter((item) => item.id !== '' && item.label)

      cachedSpecialties = (activeOnly ? list.filter((item) => item.isActive) : list).sort((a, b) =>
        a.label.localeCompare(b.label),
      )
      return cachedSpecialties
    })
    .catch((error) => {
      if (force) cachedSpecialties = null
      throw error
    })
    .finally(() => {
      inFlightRequest = null
    })

  return inFlightRequest
}

/** GET /api/v1/admin/medical-specialties — full list for admin manage view. */
export async function fetchAdminMedicalSpecialties({ force = false } = {}) {
  if (!force && cachedAdminSpecialties !== null) return cachedAdminSpecialties
  if (inFlightAdminRequest) return inFlightAdminRequest

  inFlightAdminRequest = authFetch(ADMIN_BASE, {}, DOCTOR_API_BASE)
    .then((payload) => {
      const list = extractList(payload)
        .map(mapMedicalSpecialtyFromApi)
        .filter((item) => item.id !== '' && item.label)
        .sort((a, b) => a.label.localeCompare(b.label))

      cachedAdminSpecialties = list
      mergeMedicalSpecialtiesFromItems(list)
      return list
    })
    .catch((error) => {
      if (force) cachedAdminSpecialties = null
      throw error
    })
    .finally(() => {
      inFlightAdminRequest = null
    })

  return inFlightAdminRequest
}

export function mergeMedicalSpecialtiesFromItems(items = []) {
  const map = new Map((cachedSpecialties ?? []).map((specialty) => [String(specialty.id), specialty]))

  items.forEach((item) => {
    const mapped = typeof item === 'object' ? mapMedicalSpecialtyFromApi(item) : null
    const id = mapped?.id ?? item?.specialtyId ?? item?.id
    const label = mapped?.label ?? item?.specialty ?? item?.specialtyName ?? item?.label
    if (id == null || id === '' || !label) return
    map.set(String(id), {
      id,
      label,
      code: mapped?.code ?? buildSpecialtyCode(label),
      description: mapped?.description ?? '',
      isActive: mapped?.isActive ?? true,
    })
  })

  cachedSpecialties = Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
  return cachedSpecialties
}

export async function createMedicalSpecialty({
  specialtyName,
  specialtyCode,
  description = '',
  isActive = true,
} = {}) {
  const name = String(specialtyName ?? '').trim()
  if (!name) throw new Error('Specialty name is required')

  const payload = {
    specialtyCode: String(specialtyCode ?? buildSpecialtyCode(name)).trim(),
    specialtyName: name,
    description: String(description ?? '').trim() || `${name} specialist`,
    isActive,
  }

  const response = await authFetch(
    ADMIN_BASE,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    DOCTOR_API_BASE,
  )

  const created = mapMedicalSpecialtyFromApi(unwrapEntity(response))
  mergeMedicalSpecialtiesFromItems([created])
  cachedAdminSpecialties = null
  return created
}
