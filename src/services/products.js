import { authFetch, authHeaders, getErrorMessage, parseJsonResponse, PRODUCT_API_BASE } from './api'
import { notifyUnauthorized } from '@/shared/api/tokenBridge'

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

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// --- Categories ---

const CATEGORY_ACCENTS = ['#40deaa', '#ffd58f', '#6fc2ff', '#b287ff']

export function mapCategoryFromApi(item, index = 0) {
  const name = pick(item, 'categoryName', 'name') ?? 'Unnamed category'
  const slug = slugify(name)

  return {
    id: String(pick(item, 'id', 'categoryId') ?? slug),
    slug,
    name,
    icon: name.charAt(0).toUpperCase(),
    accent: CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length],
    count: Number(pick(item, 'count', 'productCount')) || 0,
  }
}

let inFlightCategoriesRequest = null
let inFlightCreateCategoryRequest = null

export async function fetchCategories({ force = false } = {}) {
  if (!force && inFlightCategoriesRequest) {
    return inFlightCategoriesRequest
  }

  inFlightCategoriesRequest = authFetch('/api/categories', {}, PRODUCT_API_BASE)
    .then((payload) =>
      extractApiList(payload, ['categories']).map((item, index) =>
        mapCategoryFromApi(item, index),
      ),
    )
    .finally(() => {
      inFlightCategoriesRequest = null
    })

  return inFlightCategoriesRequest
}

/** POST /api/categories — create a new product category. */
export async function createCategory({ name }) {
  const categoryName = String(name ?? '').trim()
  if (!categoryName) {
    throw new Error('Category name is required')
  }

  if (inFlightCreateCategoryRequest) {
    return inFlightCreateCategoryRequest
  }

  inFlightCreateCategoryRequest = authFetch(
    '/api/categories',
    {
      method: 'POST',
      body: JSON.stringify({ categoryName }),
    },
    PRODUCT_API_BASE,
  )
    .then((payload) => {
      const item = payload?.data ?? payload
      return mapCategoryFromApi(item)
    })
    .finally(() => {
      inFlightCreateCategoryRequest = null
    })

  return inFlightCreateCategoryRequest
}

/** PUT /api/categories/{categoryId} — update a product category. */
export async function updateCategory(categoryId, { name }) {
  const categoryName = String(name ?? '').trim()
  if (!categoryName) {
    throw new Error('Category name is required')
  }

  const payload = await authFetch(
    `/api/categories/${encodeURIComponent(categoryId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({ categoryName }),
    },
    PRODUCT_API_BASE,
  )

  const item = payload?.data ?? payload
  return mapCategoryFromApi(item)
}

/** DELETE /api/categories/{categoryId} — remove a product category. */
export async function deleteCategory(categoryId) {
  return authFetch(
    `/api/categories/${encodeURIComponent(categoryId)}`,
    { method: 'DELETE' },
    PRODUCT_API_BASE,
  )
}

// --- Tax groups ---

export function mapSalesTaxFromApi(item) {
  return {
    id: String(pick(item, 'salesTaxId', 'id') ?? ''),
    code: pick(item, 'taxCode', 'code') ?? '',
    name: pick(item, 'taxName', 'name') ?? 'Unnamed tax',
    percent: Number(pick(item, 'taxPercent', 'percent')) || 0,
  }
}

export function mapPurchaseTaxFromApi(item) {
  return {
    id: String(pick(item, 'purchTaxId', 'purchaseTaxId', 'id') ?? ''),
    code: pick(item, 'taxCode', 'code') ?? '',
    name: pick(item, 'taxName', 'name') ?? 'Unnamed tax',
    percent: Number(pick(item, 'taxPercent', 'percent')) || 0,
  }
}

export function toTaxSelectOptions(groups) {
  return groups.map((group) => ({
    value: group.code || group.id,
    label: group.code || group.name,
  }))
}

let inFlightSalesTaxRequest = null
let inFlightPurchaseTaxRequest = null

export async function fetchSalesTaxGroups({ force = false } = {}) {
  if (!force && inFlightSalesTaxRequest) {
    return inFlightSalesTaxRequest
  }

  inFlightSalesTaxRequest = authFetch('/api/sales-tax-groups', {}, PRODUCT_API_BASE)
    .then((payload) => extractApiList(payload).map(mapSalesTaxFromApi))
    .finally(() => {
      inFlightSalesTaxRequest = null
    })

  return inFlightSalesTaxRequest
}

export async function fetchPurchaseTaxGroups({ force = false } = {}) {
  if (!force && inFlightPurchaseTaxRequest) {
    return inFlightPurchaseTaxRequest
  }

  inFlightPurchaseTaxRequest = authFetch('/api/purchase-tax-groups', {}, PRODUCT_API_BASE)
    .then((payload) => extractApiList(payload).map(mapPurchaseTaxFromApi))
    .finally(() => {
      inFlightPurchaseTaxRequest = null
    })

  return inFlightPurchaseTaxRequest
}

let inFlightTaxGroupsRequest = null

export async function fetchTaxGroups({ force = false } = {}) {
  if (!force && inFlightTaxGroupsRequest) {
    return inFlightTaxGroupsRequest
  }

  inFlightTaxGroupsRequest = Promise.all([
    fetchSalesTaxGroups({ force }),
    fetchPurchaseTaxGroups({ force }),
  ])
    .then(([salesTaxGroups, purchaseTaxGroups]) => ({ salesTaxGroups, purchaseTaxGroups }))
    .finally(() => {
      inFlightTaxGroupsRequest = null
    })

  return inFlightTaxGroupsRequest
}

// --- Products ---

function resolveCategory(item, categories = []) {
  const categoryRaw = item.category ?? pick(item, 'categoryId', 'categoryName', 'cat')
  const categoryNameFromItem = pick(item, 'categoryName')

  let categoryId
  let categoryName = categoryNameFromItem

  if (categoryRaw && typeof categoryRaw === 'object') {
    categoryId = categoryRaw.id ?? categoryRaw.code ?? categoryRaw.name
    categoryName = categoryRaw.name ?? categoryRaw.label ?? categoryName
  } else {
    categoryId = categoryRaw
  }

  if (categoryId != null) {
    const idStr = String(categoryId)
    const byId = categories.find((c) => c.id === idStr || c.id === categoryId)
    if (byId) return { cat: byId.id, catName: byId.name }

    const byName = categories.find(
      (c) => c.name.toLowerCase() === idStr.toLowerCase(),
    )
    if (byName) return { cat: byName.id, catName: byName.name }

    return {
      cat: slugify(idStr) || 'uncategorized',
      catName: categoryName ?? idStr,
    }
  }

  return { cat: 'uncategorized', catName: categoryName ?? 'Uncategorized' }
}

function resolveStatus(item) {
  const statusRaw = pick(item, 'status', 'productStatus')
  if (typeof statusRaw === 'string') {
    const normalized = statusRaw.toLowerCase()
    if (normalized === 'inactive' || normalized === 'disabled') return 'inactive'
    return 'active'
  }

  const isActive = pick(item, 'isActive', 'active')
  if (typeof isActive === 'boolean') return isActive ? 'active' : 'inactive'

  return 'active'
}

function resolvePackingStock(item) {
  const packings = Array.isArray(item.packings) ? item.packings : []
  if (packings.length > 0) {
    const primary = packings[0]
    return {
      stock: Number(primary.quantity) || 0,
      stockUnit: primary.unit ?? 'units',
    }
  }

  if (item.stockQuantityPerPack != null) {
    return {
      stock: Number(item.stockQuantityPerPack) || 0,
      stockUnit: pick(item, 'stockUnit', 'unit', 'unitOfMeasure', 'uom', 'unitType') ?? 'units',
    }
  }

  return {
    stock:
      Number(
        pick(item, 'stock', 'stockQuantity', 'stockQty', 'quantity', 'availableStock', 'units'),
      ) || 0,
    stockUnit: pick(item, 'unit', 'stockUnit', 'unitOfMeasure', 'uom', 'unitType') ?? 'units',
  }
}

export function mapProductFromApi(item, categories = []) {
  const { cat, catName } = resolveCategory(item, categories)
  const { stock, stockUnit } = resolvePackingStock(item)
  const mrp = Number(pick(item, 'mrp', 'originalPrice', 'maxRetailPrice', 'listPrice')) || 0
  const sellingPrice = Number(pick(item, 'price', 'sellingPrice', 'salePrice'))
  const price = sellingPrice > 0 ? sellingPrice : mrp

  return {
    id: String(pick(item, 'id', 'productId') ?? ''),
    name: pick(item, 'name', 'productName') ?? 'Untitled product',
    cat,
    catName,
    sku: pick(item, 'sku', 'productSku', 'code', 'packType') ?? '',
    price,
    mrp,
    stock,
    stockUnit,
    rx: Boolean(
      pick(item, 'rx', 'requiresPrescription', 'prescriptionRequired', 'isPrescriptionRequired'),
    ),
    status: resolveStatus(item),
    imageUrl: pick(item, 'imageUrl', 'image', 'photoUrl', 'thumbnailUrl'),
  }
}

function formatPackingLabel(packing) {
  if (!packing) return '—'
  const qty = Number(packing.quantity)
  const unit = String(packing.unit ?? 'units').toUpperCase()
  if (!Number.isFinite(qty) || qty <= 0) return unit
  if (unit === 'TAB' || unit === 'TABLET') {
    return qty === 15 ? 'Strip of 15' : qty === 10 ? 'Strip of 10' : `${qty} tabs`
  }
  return `${qty} ${unit.toLowerCase()}`
}

/** Maps an API product into the customer catalog / rail shape. */
export function mapProductToCustomerCatalog(item, categories = []) {
  const base = mapProductFromApi(item, categories)
  const packings = Array.isArray(item.packings) ? item.packings : []
  const idNum = Number(base.id) || 0
  const mrp = base.mrp || base.price
  const price = base.price
  const off = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

  return {
    ...base,
    brand: pick(item, 'genericName', 'brand') ?? 'MEDIQ',
    pack: formatPackingLabel(packings[0]),
    rating: Math.round((4.4 + (idNum % 5) * 0.1) * 10) / 10,
    reviews: 800 + ((idNum * 137) % 24000),
    eta: idNum % 4 === 0 ? 'Tomorrow' : '2 hrs',
    desc: pick(item, 'description', 'desc') ?? '',
    off,
  }
}

/** Maps a customer catalog product into a landing-page rail tile. */
export function mapProductToRailItem(product) {
  const mrp = product.mrp || product.price
  const price = product.price
  const off = product.off ?? (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0)
  const genericName = product.brand && product.brand !== 'MEDIQ' ? product.brand : null

  return {
    id: product.id,
    name: product.name,
    pack: product.pack ?? '—',
    price,
    mrp,
    off,
    rating: String(typeof product.rating === 'number' ? product.rating.toFixed(1) : product.rating),
    reviews:
      typeof product.reviews === 'number'
        ? product.reviews.toLocaleString('en-IN')
        : String(product.reviews ?? ''),
    eta: product.eta ?? '2 hrs',
    chip: genericName && off >= 20 ? `GENERIC — SAVE ${off}%` : off >= 20 ? `SAVE ${off}%` : null,
    stock: product.stock,
  }
}

let inFlightCustomerProductsRequest = null
let cachedCustomerProducts = null

/** Fetches products and maps them for the customer catalog / landing rails. */
export async function fetchCustomerProducts(categories = [], { force = false } = {}) {
  if (inFlightCustomerProductsRequest) {
    return inFlightCustomerProductsRequest
  }

  if (!force && cachedCustomerProducts) {
    return cachedCustomerProducts
  }

  inFlightCustomerProductsRequest = authFetch('/api/products', {}, PRODUCT_API_BASE)
    .then((payload) => {
      const items = extractApiList(payload, ['products']).map((item) =>
        mapProductToCustomerCatalog(item, categories),
      )
      cachedCustomerProducts = items
      return items
    })
    .finally(() => {
      inFlightCustomerProductsRequest = null
    })

  return inFlightCustomerProductsRequest
}

let inFlightProductsRequest = null
const inFlightProductsByCategoryRequests = new Map()
const inFlightProductsPageRequests = new Map()

export const OWNER_PRODUCTS_PAGE_SIZE = 20

function buildProductsPageQuery({ page = 0, size = OWNER_PRODUCTS_PAGE_SIZE } = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))
  return params.toString()
}

/** Parse paginated GET /api/products response. */
export function parseProductsPage(payload, categories = []) {
  const data = payload?.data ?? payload
  const content = extractApiList(payload, ['products'])

  return {
    products: content.map((item) => mapProductFromApi(item, categories)),
    totalElements: Number(data?.totalElements ?? data?.total ?? content.length) || 0,
    totalPages: Math.max(1, Number(data?.totalPages) || 1),
    page: Number(data?.number ?? data?.page ?? 0) || 0,
    size: Number(data?.size ?? content.length) || 0,
  }
}

export async function fetchProductsPage(categories = [], { page = 0, size = OWNER_PRODUCTS_PAGE_SIZE, force = false } = {}) {
  const query = buildProductsPageQuery({ page, size })
  const path = `/api/products?${query}`

  if (!force && inFlightProductsPageRequests.has(path)) {
    return inFlightProductsPageRequests.get(path)
  }

  const request = authFetch(path, {}, PRODUCT_API_BASE)
    .then((payload) => parseProductsPage(payload, categories))
    .finally(() => {
      inFlightProductsPageRequests.delete(path)
    })

  inFlightProductsPageRequests.set(path, request)
  return request
}

export async function fetchProductsByCategoryPage(
  categoryId,
  categories = [],
  { page = 0, size = OWNER_PRODUCTS_PAGE_SIZE, force = false } = {},
) {
  const query = buildProductsPageQuery({ page, size })
  const path = `/api/products/by-category/${encodeURIComponent(categoryId)}?${query}`

  if (!force && inFlightProductsPageRequests.has(path)) {
    return inFlightProductsPageRequests.get(path)
  }

  const request = authFetch(path, {}, PRODUCT_API_BASE)
    .then((payload) => parseProductsPage(payload, categories))
    .finally(() => {
      inFlightProductsPageRequests.delete(path)
    })

  inFlightProductsPageRequests.set(path, request)
  return request
}

export async function fetchProducts(categories = [], { force = false } = {}) {
  if (!force && inFlightProductsRequest) {
    return inFlightProductsRequest
  }

  inFlightProductsRequest = authFetch('/api/products', {}, PRODUCT_API_BASE)
    .then((payload) =>
      extractApiList(payload, ['products']).map((item) => mapProductFromApi(item, categories)),
    )
    .finally(() => {
      inFlightProductsRequest = null
    })

  return inFlightProductsRequest
}

export async function fetchProductsByCategory(categoryId, categories = [], { force = false } = {}) {
  const key = String(categoryId)
  if (!force && inFlightProductsByCategoryRequests.has(key)) {
    return inFlightProductsByCategoryRequests.get(key)
  }

  const request = authFetch(
    `/api/products/by-category/${encodeURIComponent(categoryId)}`,
    {},
    PRODUCT_API_BASE,
  )
    .then((payload) =>
      extractApiList(payload, ['products']).map((item) => mapProductFromApi(item, categories)),
    )
    .finally(() => {
      inFlightProductsByCategoryRequests.delete(key)
    })

  inFlightProductsByCategoryRequests.set(key, request)
  return request
}

export async function fetchProductsSearch(query, categories = []) {
  const trimmed = query.trim()
  if (!trimmed) return []

  const payload = await authFetch(
    `/api/products/search?query=${encodeURIComponent(trimmed)}`,
    {},
    PRODUCT_API_BASE,
  )
  return extractApiList(payload, ['products']).map((item) => mapProductFromApi(item, categories))
}

export function buildCreateProductPayload({
  productName,
  description,
  mrp,
  price,
  genericName,
  categoryName,
  groupName,
  purchTaxCode,
  salesTaxCode,
  stockQty,
  stockUnit,
  packType,
  fullPackQty,
  looseQty,
  allowLoose,
  discountPercent,
}) {
  const allowsLoose = allowLoose === true || allowLoose === 'yes'

  const payload = {
    productName,
    description,
    salesTaxCode,
    purchTaxCode,
    packType,
    stockQuantityPerPack: Number(stockQty),
    stockUnit,
    looseQuantity: allowsLoose,
    fullPackQuantity: Number(fullPackQty),
    mrp: Number(mrp),
    price: Number(price),
  }

  const trimmedGeneric = genericName?.trim()
  if (trimmedGeneric) payload.genericName = trimmedGeneric

  const trimmedCategory = categoryName?.trim()
  if (trimmedCategory) payload.categoryName = trimmedCategory

  const trimmedGroup = groupName?.trim()
  if (trimmedGroup) payload.groupName = trimmedGroup

  if (allowsLoose) {
    payload.looseUnitQuantity =
      looseQty !== '' && looseQty != null && !Number.isNaN(Number(looseQty)) ? Number(looseQty) : 0
  }

  if (discountPercent !== '' && discountPercent != null && !Number.isNaN(Number(discountPercent))) {
    payload.discountPercent = Number(discountPercent)
  }

  return payload
}

export function buildUpdateProductPayload(basePayload, { productId } = {}) {
  if (productId == null || productId === '') return basePayload
  return {
    ...basePayload,
    productId: Number(productId) || productId,
  }
}

export async function createProduct(payload) {
  return authFetch(
    '/api/products',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    PRODUCT_API_BASE,
  )
}

export async function updateProduct(productId, payload) {
  return authFetch(
    `/api/products/${encodeURIComponent(productId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    PRODUCT_API_BASE,
  )
}

export async function deleteProductById(productId) {
  return authFetch(
    `/api/products/${encodeURIComponent(productId)}`,
    { method: 'DELETE' },
    PRODUCT_API_BASE,
  )
}

const inFlightProductByIdRequests = new Map()

export async function fetchProductById(productId, { force = false } = {}) {
  const key = String(productId)
  if (!force && inFlightProductByIdRequests.has(key)) {
    return inFlightProductByIdRequests.get(key)
  }

  const request = authFetch(
    `/api/products/${encodeURIComponent(productId)}`,
    {},
    PRODUCT_API_BASE,
  ).finally(() => {
    inFlightProductByIdRequests.delete(key)
  })

  inFlightProductByIdRequests.set(key, request)
  return request
}

export function mapProductDetailToFormDraft(detail, categories = []) {
  const d = detail?.data ?? detail ?? {}
  const packings = Array.isArray(d.packings) ? d.packings : []
  const primary = packings[0] ?? {}

  const categoryId = d.categoryId != null ? String(d.categoryId) : ''
  const categoryById = categories.find((c) => c.id === categoryId)
  const categoryByName = categories.find(
    (c) => c.name.toLowerCase() === String(d.categoryName ?? '').toLowerCase(),
  )
  const cat = categoryById?.id ?? categoryByName?.id ?? categoryId

  const mrp = Number(d.mrp) || 0
  const price = Number(d.price) || 0
  const discountAmount = mrp > 0 && price > 0 && price < mrp ? mrp - price : 0
  const discountPercentFromApi = d.discountPercent
  const discountPercent =
    discountPercentFromApi != null && discountPercentFromApi !== ''
      ? String(Number(discountPercentFromApi))
      : mrp > 0 && discountAmount > 0
        ? String(Number(((discountAmount / mrp) * 100).toFixed(2)))
        : ''

  const stockPerPack =
    d.stockQuantityPerPack ?? primary.quantity ?? d.stockQty ?? null
  const packType = d.packType ?? primary.packingType ?? pick(d, 'sku', 'productSku') ?? ''
  const stockUnit = d.stockUnit ?? primary.unit ?? ''
  const fullPackQuantity = d.fullPackQuantity ?? primary.fullPackQuantity
  const looseUnitQuantity = d.looseUnitQuantity ?? primary.looseQuantity
  const allowsLoose =
    d.looseQuantity === true ||
    d.looseQuantity === 'true' ||
    (Number.isFinite(Number(looseUnitQuantity)) && Number(looseUnitQuantity) > 0)

  return {
    id: String(pick(d, 'productId', 'id') ?? ''),
    name: pick(d, 'productName', 'name') ?? '',
    genericName: d.genericName ?? '',
    description: d.description ?? '',
    cat,
    purchaseTax: d.purchTaxCode ?? '',
    salesTax: d.salesTaxCode ?? '',
    packType,
    price: d.price != null ? String(d.price) : '',
    mrp: d.mrp != null ? String(d.mrp) : '',
    discountPercent,
    discountPrice: discountAmount > 0 ? String(Number(discountAmount.toFixed(2))) : '',
    stockPerPack: stockPerPack != null ? String(Number(stockPerPack)) : '',
    stockUnit,
    allowLoose: allowsLoose ? 'yes' : 'no',
    fullPackQty:
      fullPackQuantity != null && !Number.isNaN(Number(fullPackQuantity))
        ? String(fullPackQuantity)
        : '',
    looseQty:
      allowsLoose && looseUnitQuantity != null && !Number.isNaN(Number(looseUnitQuantity))
        ? String(Number(looseUnitQuantity))
        : '',
  }
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

async function readProductApiError(res) {
  const text = await res.text()
  if (!text) return getErrorMessage(null, res.status)
  try {
    return getErrorMessage(JSON.parse(text), res.status)
  } catch {
    return text
  }
}

/** GET /api/products/upload-product-info/template */
export async function downloadProductUploadTemplate() {
  const res = await fetch(`${PRODUCT_API_BASE}/api/products/upload-product-info/template`, {
    headers: authHeaders({ Accept: '*/*' }),
  })

  if (res.status === 401) {
    notifyUnauthorized()
  }

  if (!res.ok) {
    throw new Error(await readProductApiError(res))
  }

  const blob = await res.blob()
  const filename =
    parseFilenameFromDisposition(res.headers.get('content-disposition')) ??
    'product-upload-template.xlsx'
  triggerBlobDownload(blob, filename)
}

/** POST /api/products/upload-product-info */
export function uploadProductBulkFile(file, onProgress) {
  const xhr = new XMLHttpRequest()

  const promise = new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)

    xhr.open('POST', `${PRODUCT_API_BASE}/api/products/upload-product-info`)

    const headers = authHeaders({ Accept: '*/*' })
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value)
    })

    xhr.upload.addEventListener('progress', (event) => {
      if (!onProgress) return
      const percent = event.lengthComputable
        ? Math.round((event.loaded * 100) / event.total)
        : Math.min(99, Math.round((event.loaded / Math.max(file.size, 1)) * 100))
      onProgress(percent)
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 401) {
        notifyUnauthorized()
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(readXhrProductApiError(xhr)))
        return
      }

      onProgress?.(100)

      const contentType = xhr.getResponseHeader('content-type') ?? ''
      if (contentType.includes('application/json')) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          resolve(null)
        }
        return
      }

      resolve(null)
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Could not upload file. Please check your connection and try again.'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled.'))
    })

    xhr.send(formData)
  })

  return {
    promise,
    abort: () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) {
        xhr.abort()
      }
    },
  }
}

function readXhrProductApiError(xhr) {
  const text = xhr.responseText
  if (!text) return getErrorMessage(null, xhr.status)
  try {
    return getErrorMessage(JSON.parse(text), xhr.status)
  } catch {
    return text
  }
}

export function normalizeBulkUploadResponse(payload) {
  const root = payload && typeof payload === 'object' ? payload : {}
  const data = root.data && typeof root.data === 'object' ? root.data : root

  return {
    success: root.success !== false,
    message: root.message ?? '',
    totalRows: Number(data.totalRows) || 0,
    successCount: Number(data.successCount) || 0,
    failedCount: Number(data.failedCount) || 0,
    failedRecordsDownloadUrl: data.failedRecordsDownloadUrl ?? null,
  }
}

function resolveProductApiUrl(path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${PRODUCT_API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

/** GET /api/products/upload-product-info/failed-records/{id} */
export async function downloadProductUploadFailedRecords(downloadPath) {
  const url = resolveProductApiUrl(downloadPath)
  if (!url) throw new Error('Failed records download is unavailable.')

  const res = await fetch(url, {
    headers: authHeaders({ Accept: '*/*' }),
  })

  if (res.status === 401) {
    notifyUnauthorized()
  }

  if (!res.ok) {
    throw new Error(await readProductApiError(res))
  }

  const blob = await res.blob()
  const filename =
    parseFilenameFromDisposition(res.headers.get('content-disposition')) ??
    'failed-product-upload-records.xlsx'
  triggerBlobDownload(blob, filename)
}
