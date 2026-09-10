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

export const GROUPS_PAGE_SIZE = 10

export function mapGroupFromApi(item) {
  return {
    id: String(pick(item, 'groupId', 'id') ?? ''),
    name: pick(item, 'groupName', 'name') ?? 'Unnamed',
    productCount:
      Number(
        pick(item, 'productCount', 'productsCount', 'count', 'totalProducts', 'numberOfProducts'),
      ) || 0,
    createdAt: pick(item, 'createdAt', 'createdOn', 'createdDate') ?? null,
  }
}

export function buildGroupsQuery({ page = 0, size = GROUPS_PAGE_SIZE } = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))
  return params.toString()
}

export function buildGroupsSearchQuery({ query = '', page = 0, size = GROUPS_PAGE_SIZE } = {}) {
  const params = new URLSearchParams()
  params.set('query', String(query ?? '').trim())
  params.set('page', String(page))
  params.set('size', String(size))
  return params.toString()
}

export function parseGroupsPage(payload) {
  const data = payload?.data ?? payload ?? {}
  const content = extractApiList(payload, ['groups']).map(mapGroupFromApi)
  const totalElements = Number(data.totalElements ?? data.total ?? content.length) || 0
  const size = Number(data.size ?? content.length) || GROUPS_PAGE_SIZE
  const reportedTotalPages = Number(data.totalPages)
  const totalPages =
    reportedTotalPages > 0
      ? reportedTotalPages
      : totalElements > 0
        ? Math.ceil(totalElements / size)
        : content.length > 0
          ? 1
          : 0

  return {
    items: content,
    totalElements,
    totalPages,
    page: Number(data.page ?? data.number ?? 0) || 0,
    size,
    isLast: data.last === true || data.hasNext === false,
  }
}

function groupItemKey(item) {
  const id = String(item?.id ?? '').trim()
  if (id) return `id:${id}`
  return `name:${String(item?.name ?? '').trim().toLowerCase()}`
}

export function mergeGroupItems(existing = [], incoming = []) {
  const seen = new Set(existing.map(groupItemKey))
  const merged = [...existing]
  incoming.forEach((item) => {
    const key = groupItemKey(item)
    if (seen.has(key)) return
    seen.add(key)
    merged.push(item)
  })
  return merged
}

let inFlightGroupsListRequest = null
let inFlightGroupsListKey = null
let inFlightGroupsSearchRequest = null
let inFlightGroupsSearchKey = null

/** GET /api/groups?page=0&size=10 — paginated list */
export async function fetchGroupsPage({ page = 0, size = GROUPS_PAGE_SIZE, force = false } = {}) {
  const query = buildGroupsQuery({ page, size })
  const requestKey = query

  if (!force && inFlightGroupsListRequest && inFlightGroupsListKey === requestKey) {
    return inFlightGroupsListRequest
  }

  inFlightGroupsListKey = requestKey
  inFlightGroupsListRequest = authFetch(`/api/groups?${query}`, {}, PRODUCT_API_BASE).finally(() => {
    inFlightGroupsListRequest = null
    inFlightGroupsListKey = null
  })

  return inFlightGroupsListRequest
}

/** GET /api/groups/search?query=...&page=0&size=10 — search groups */
export async function fetchGroupsSearch({
  query = '',
  page = 0,
  size = GROUPS_PAGE_SIZE,
  force = false,
} = {}) {
  const trimmedQuery = String(query ?? '').trim()
  const searchParams = buildGroupsSearchQuery({ query: trimmedQuery, page, size })
  const requestKey = searchParams

  if (!force && inFlightGroupsSearchRequest && inFlightGroupsSearchKey === requestKey) {
    return inFlightGroupsSearchRequest
  }

  inFlightGroupsSearchKey = requestKey
  inFlightGroupsSearchRequest = authFetch(`/api/groups/search?${searchParams}`, {}, PRODUCT_API_BASE).finally(
    () => {
      inFlightGroupsSearchRequest = null
      inFlightGroupsSearchKey = null
    },
  )

  return inFlightGroupsSearchRequest
}

/** POST /api/groups — add group */
export async function createGroup({ groupName }) {
  const trimmedName = String(groupName ?? '').trim()
  if (!trimmedName) throw new Error('Group name is required')

  const response = await authFetch(
    '/api/groups',
    {
      method: 'POST',
      body: JSON.stringify({ groupName: trimmedName }),
    },
    PRODUCT_API_BASE,
  )

  return mapGroupFromApi(response?.data ?? response)
}
