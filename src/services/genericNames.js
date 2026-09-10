import { authFetch, PRODUCT_API_BASE } from './api'

function pick(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key]
    if (value != null && value !== '') return value
  }
  return undefined
}

function extractApiList(payload, nestedKeys = []) {
  if (Array.isArray(payload)) return payload

  const data = payload?.data ?? payload
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.items)) return data.items

  for (const key of nestedKeys) {
    if (Array.isArray(data?.[key])) return data[key]
  }

  return []
}

function normalizeAlternateNames(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join(', ')
  }
  return String(value ?? '').trim()
}

function parseAlternateNamesInput(value) {
  return String(value ?? '')
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function resolveActiveStatus(item) {
  const rawStatus = pick(item, 'status')
  if (typeof rawStatus === 'string') {
    const normalized = rawStatus.trim().toUpperCase()
    if (normalized === 'INACTIVE' || normalized === 'DISABLED') return false
    if (normalized === 'ACTIVE' || normalized === 'ENABLED') return true
  }

  const activeFlag = pick(item, 'active', 'isActive', 'enabled')
  if (typeof activeFlag === 'boolean') return activeFlag
  if (activeFlag != null) return Boolean(Number(activeFlag))
  return true
}

export const GENERIC_NAMES_PAGE_SIZE = 10

export function mapGenericNameFromApi(item) {
  const active = resolveActiveStatus(item)

  return {
    id: String(pick(item, 'genericId', 'genericNameId', 'id') ?? ''),
    name: pick(item, 'genericName', 'name') ?? 'Unnamed',
    alternateNames: normalizeAlternateNames(
      pick(item, 'alternateNames', 'alternates', 'alternateName', 'synonyms'),
    ),
    productCount:
      Number(
        pick(
          item,
          'productCount',
          'productsCount',
          'count',
          'totalProducts',
          'noOfProducts',
          'numberOfProducts',
        ),
      ) || 0,
    active,
    status: active ? 'ACTIVE' : 'INACTIVE',
    createdAt: pick(item, 'createdAt', 'createdOn', 'createdDate') ?? null,
  }
}

export function buildGenericNamesQuery({ page = 0, size = GENERIC_NAMES_PAGE_SIZE } = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))
  return params.toString()
}

export function buildGenericNamesSearchQuery({
  query = '',
  page = 0,
  size = GENERIC_NAMES_PAGE_SIZE,
} = {}) {
  const params = new URLSearchParams()
  params.set('query', String(query ?? '').trim())
  params.set('page', String(page))
  params.set('size', String(size))
  return params.toString()
}

export function parseGenericNamesPage(payload) {
  const data = payload?.data ?? payload ?? {}
  const content = extractApiList(payload, ['generics']).map(mapGenericNameFromApi)

  return {
    items: content,
    totalElements: Number(data.totalElements ?? data.total ?? content.length) || 0,
    totalPages: Math.max(1, Number(data.totalPages) || 1),
    page: Number(data.page ?? data.number ?? 0) || 0,
    size: Number(data.size ?? content.length) || GENERIC_NAMES_PAGE_SIZE,
  }
}

let inFlightGenericNamesListRequest = null
let inFlightGenericNamesListKey = null
let inFlightGenericNamesSearchRequest = null
let inFlightGenericNamesSearchKey = null
let inFlightGenericByIdRequest = null
let inFlightGenericByIdKey = null

/** GET /api/generics?page=0&size=20 — paginated list */
export async function fetchGenericNamesPage({ page = 0, size = GENERIC_NAMES_PAGE_SIZE, force = false } = {}) {
  const query = buildGenericNamesQuery({ page, size })
  const requestKey = query

  if (!force && inFlightGenericNamesListRequest && inFlightGenericNamesListKey === requestKey) {
    return inFlightGenericNamesListRequest
  }

  inFlightGenericNamesListKey = requestKey
  const path = `/api/generics?${query}`

  inFlightGenericNamesListRequest = authFetch(path, {}, PRODUCT_API_BASE).finally(() => {
    inFlightGenericNamesListRequest = null
    inFlightGenericNamesListKey = null
  })

  return inFlightGenericNamesListRequest
}

/** GET /api/generics/search?query=dolo&page=0&size=20 — search generics */
export async function fetchGenericNamesSearch({
  query = '',
  page = 0,
  size = GENERIC_NAMES_PAGE_SIZE,
  force = false,
} = {}) {
  const trimmedQuery = String(query ?? '').trim()
  const searchParams = buildGenericNamesSearchQuery({ query: trimmedQuery, page, size })
  const requestKey = searchParams

  if (!force && inFlightGenericNamesSearchRequest && inFlightGenericNamesSearchKey === requestKey) {
    return inFlightGenericNamesSearchRequest
  }

  inFlightGenericNamesSearchKey = requestKey
  const path = `/api/generics/search?${searchParams}`

  inFlightGenericNamesSearchRequest = authFetch(path, {}, PRODUCT_API_BASE).finally(() => {
    inFlightGenericNamesSearchRequest = null
    inFlightGenericNamesSearchKey = null
  })

  return inFlightGenericNamesSearchRequest
}

/** GET /api/generics/{id} — fetch one generic by id */
export async function fetchGenericById(id, { force = false } = {}) {
  const genericId = String(id ?? '').trim()
  if (!genericId) throw new Error('Generic id is required')

  if (!force && inFlightGenericByIdRequest && inFlightGenericByIdKey === genericId) {
    return inFlightGenericByIdRequest
  }

  inFlightGenericByIdKey = genericId
  inFlightGenericByIdRequest = authFetch(
    `/api/generics/${encodeURIComponent(genericId)}`,
    {},
    PRODUCT_API_BASE,
  )
    .then((payload) => mapGenericNameFromApi(payload?.data ?? payload))
    .finally(() => {
      inFlightGenericByIdRequest = null
      inFlightGenericByIdKey = null
    })

  return inFlightGenericByIdRequest
}

/** POST /api/generics — add generic */
export async function createGenericName({ name, alternateNames = '', active = true }) {
  const genericName = String(name ?? '').trim()
  if (!genericName) throw new Error('Generic name is required')

  const payload = {
    name: genericName,
    genericName,
    alternateNames: parseAlternateNamesInput(alternateNames),
    active,
    status: active ? 'ACTIVE' : 'INACTIVE',
  }

  const response = await authFetch(
    '/api/generics',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    PRODUCT_API_BASE,
  )

  return mapGenericNameFromApi(response?.data ?? response)
}

/** PUT /api/generics/{id} — update generic */
export async function updateGenericName(id, { name, alternateNames, active }) {
  const genericId = String(id ?? '').trim()
  if (!genericId) throw new Error('Generic id is required')

  const payload = {}
  if (name != null) {
    payload.name = String(name).trim()
    payload.genericName = String(name).trim()
  }
  if (alternateNames != null) payload.alternateNames = parseAlternateNamesInput(alternateNames)
  if (active != null) {
    payload.active = Boolean(active)
    payload.status = active ? 'ACTIVE' : 'INACTIVE'
  }

  const response = await authFetch(
    `/api/generics/${encodeURIComponent(genericId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    PRODUCT_API_BASE,
  )

  return mapGenericNameFromApi(response?.data ?? response)
}

/** DELETE /api/generics/{id} — delete generic */
export async function deleteGenericName(id) {
  const genericId = String(id ?? '').trim()
  if (!genericId) throw new Error('Generic id is required')

  await authFetch(
    `/api/generics/${encodeURIComponent(genericId)}`,
    { method: 'DELETE' },
    PRODUCT_API_BASE,
  )
}
