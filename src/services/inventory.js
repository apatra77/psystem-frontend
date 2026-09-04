import { authFetch, authHeaders, getErrorMessage, INVENTORY_API_BASE } from './api'
import { notifyUnauthorized } from '@/shared/api/tokenBridge'

function pick(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key]
    if (value != null && value !== '') return value
  }
  return undefined
}

export const INVENTORY_PAGE_SIZE = 20
export const INVENTORY_DEFAULT_SORT = 'lastUpdatedAt,desc'

const UI_STATUS_TO_API = {
  all: '',
  in: 'IN_STOCK',
  low: 'LOW_STOCK',
  out: 'OUT_OF_STOCK',
}

let inFlightInventorySummaryRequest = null
let inFlightInventoryListRequest = null
let inFlightInventoryListKey = null

export function mapUiStatusFilterToInventoryApi(statusFilter = 'all') {
  return UI_STATUS_TO_API[statusFilter] ?? ''
}

export function buildInventoryQuery({
  page = 0,
  size = INVENTORY_PAGE_SIZE,
  search = '',
  status = '',
  categoryId = '',
  sort = INVENTORY_DEFAULT_SORT,
} = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))
  params.set('search', search ?? '')
  params.set('status', status ?? '')
  if (categoryId) params.set('categoryId', String(categoryId))
  params.set('sort', sort ?? INVENTORY_DEFAULT_SORT)
  return params.toString()
}

export function mapInventoryItem(item) {
  const stock = Number(pick(item, 'stock', 'stockQuantity', 'quantity')) || 0

  return {
    id: String(pick(item, 'productId', 'id') ?? ''),
    name: pick(item, 'productName', 'name') ?? 'Untitled product',
    sku: pick(item, 'sku', 'productSku') ?? '',
    stock,
    stockUnit: pick(item, 'stockUnit', 'unit') ?? 'units',
    status: String(pick(item, 'status', 'stockStatus') ?? '').toUpperCase(),
    lastUpdatedAt: pick(item, 'lastUpdatedAt', 'updatedAt') ?? null,
    imageUrl: pick(item, 'imageUrl', 'image', 'thumbnailUrl') ?? null,
    mrp: pick(item, 'mrp', 'price') != null ? Number(pick(item, 'mrp', 'price')) : null,
    price: pick(item, 'price', 'sellingPrice') != null ? Number(pick(item, 'price', 'sellingPrice')) : null,
    categoryId: pick(item, 'categoryId', 'cat') != null ? String(pick(item, 'categoryId', 'cat')) : null,
    categoryName: pick(item, 'categoryName', 'category') ?? null,
  }
}

export function parseInventorySummary(payload) {
  const data = payload?.data ?? payload ?? {}
  const inStockCount = Number(data.inStockCount) || 0
  const lowStockCount = Number(data.lowStockCount) || 0
  const rawStockValue = pick(data, 'totalStockValue', 'stockValue', 'inventoryValue')

  return {
    totalProducts: Number(data.totalProducts) || 0,
    inStock: inStockCount,
    lowStock: lowStockCount,
    outOfStock: Number(data.outOfStockCount) || 0,
    totalStockValue: rawStockValue != null ? Number(rawStockValue) : null,
    lowStockThreshold: Number(data.lowStockThreshold) || 20,
    lastUpdatedAt: data.lastUpdatedAt ?? null,
  }
}

export function parseInventoryPage(payload) {
  const data = payload?.data ?? payload ?? {}
  const content = Array.isArray(data.content)
    ? data.content
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(payload)
        ? payload
        : []

  return {
    items: content.map(mapInventoryItem),
    totalElements: Number(data.totalElements ?? data.total ?? content.length) || 0,
    totalPages: Math.max(1, Number(data.totalPages) || 1),
    page: Number(data.page ?? data.number ?? 0) || 0,
    size: Number(data.size ?? content.length) || INVENTORY_PAGE_SIZE,
  }
}

/** GET /api/v1/inventory/summary */
export async function fetchInventorySummary({ force = false } = {}) {
  if (!force && inFlightInventorySummaryRequest) {
    return inFlightInventorySummaryRequest
  }

  inFlightInventorySummaryRequest = authFetch('/api/v1/inventory/summary', {}, INVENTORY_API_BASE).finally(
    () => {
      inFlightInventorySummaryRequest = null
    },
  )

  return inFlightInventorySummaryRequest
}

/** GET /api/v1/inventory */
export async function fetchInventoryPage(
  {
    page = 0,
    size = INVENTORY_PAGE_SIZE,
    search = '',
    status = '',
    categoryId = '',
    sort = INVENTORY_DEFAULT_SORT,
    force = false,
  } = {},
) {
  const query = buildInventoryQuery({ page, size, search, status, categoryId, sort })
  const path = `/api/v1/inventory?${query}`

  if (!force && inFlightInventoryListRequest && inFlightInventoryListKey === path) {
    return inFlightInventoryListRequest
  }

  inFlightInventoryListKey = path
  inFlightInventoryListRequest = authFetch(path, {}, INVENTORY_API_BASE).finally(() => {
    inFlightInventoryListRequest = null
    inFlightInventoryListKey = null
  })

  return inFlightInventoryListRequest
}

function parseFilenameFromDisposition(header) {
  if (!header) return null
  const match = header.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)
  return match ? decodeURIComponent(match[1].replace(/"/g, '')) : null
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function readInventoryApiError(res) {
  const text = await res.text()
  if (!text) return getErrorMessage(null, res.status)
  try {
    return getErrorMessage(JSON.parse(text), res.status)
  } catch {
    return text
  }
}

export function buildInventoryExportQuery({
  search = '',
  status = '',
  categoryId = '',
  sort = INVENTORY_DEFAULT_SORT,
} = {}) {
  const params = new URLSearchParams()
  const trimmedSearch = search.trim()

  if (trimmedSearch) params.set('search', trimmedSearch)
  if (status) params.set('status', status)
  if (categoryId) params.set('categoryId', String(categoryId))
  if (sort && sort !== INVENTORY_DEFAULT_SORT) params.set('sort', sort)

  return params.toString()
}

/** GET /api/v1/inventory/export */
export async function downloadInventoryExport({
  search = '',
  status = '',
  categoryId = '',
  sort = INVENTORY_DEFAULT_SORT,
} = {}) {
  const query = buildInventoryExportQuery({ search, status, categoryId, sort })
  const path = query ? `/api/v1/inventory/export?${query}` : '/api/v1/inventory/export'
  const res = await fetch(`${INVENTORY_API_BASE}${path}`, {
    headers: authHeaders({ Accept: '*/*' }),
  })

  if (res.status === 401) {
    notifyUnauthorized()
  }

  if (!res.ok) {
    throw new Error(await readInventoryApiError(res))
  }

  const blob = await res.blob()
  const filename =
    parseFilenameFromDisposition(res.headers.get('content-disposition')) ??
    `inventory-export-${new Date().toISOString().slice(0, 10)}.xlsx`
  triggerBlobDownload(blob, filename)
}
