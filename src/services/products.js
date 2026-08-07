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

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// --- Categories ---

export function mapCategoryFromApi(item) {
  return {
    id: String(pick(item, 'id', 'categoryId') ?? ''),
    name: pick(item, 'name', 'categoryName') ?? 'Unnamed category',
  }
}

let inFlightCategoriesRequest = null

export async function fetchCategories({ force = false } = {}) {
  if (!force && inFlightCategoriesRequest) {
    return inFlightCategoriesRequest
  }

  inFlightCategoriesRequest = authFetch('/api/categories', {}, PRODUCT_API_BASE)
    .then((payload) => extractApiList(payload, ['categories']).map(mapCategoryFromApi))
    .finally(() => {
      inFlightCategoriesRequest = null
    })

  return inFlightCategoriesRequest
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
    sku: pick(item, 'sku', 'productSku', 'code') ?? '',
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
  purchTaxCode,
  salesTaxCode,
  stockQty,
  stockUnit,
}) {
  return {
    productName,
    description,
    mrp: Number(mrp),
    price: Number(price),
    genericName,
    categoryName,
    purchTaxCode,
    salesTaxCode,
    packings: [
      {
        quantity: Number(stockQty),
        unit: stockUnit,
      },
    ],
  }
}

export function buildUpdateProductPayload(basePayload, { packingId } = {}) {
  const packing = { ...basePayload.packings[0] }
  if (packingId != null && packingId !== '') {
    packing.packingId = packingId
  }
  return {
    ...basePayload,
    packings: [packing],
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
  const discountPercent =
    mrp > 0 && discountAmount > 0
      ? String(Number(((discountAmount / mrp) * 100).toFixed(2)))
      : ''

  return {
    id: String(pick(d, 'productId', 'id') ?? ''),
    name: pick(d, 'productName', 'name') ?? '',
    genericName: d.genericName ?? '',
    description: d.description ?? '',
    cat,
    purchaseTax: d.purchTaxCode ?? '',
    salesTax: d.salesTaxCode ?? '',
    sku: pick(d, 'sku', 'productSku') ?? '',
    price: d.price != null ? String(d.price) : '',
    mrp: d.mrp != null ? String(d.mrp) : '',
    discountPercent,
    discountPrice: discountAmount > 0 ? String(Number(discountAmount.toFixed(2))) : '',
    stock: primary.quantity != null ? String(Number(primary.quantity)) : '',
    stockUnit: primary.unit ?? '',
  }
}
