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

export async function fetchTaxGroups({ force = false } = {}) {
  const [salesTaxGroups, purchaseTaxGroups] = await Promise.all([
    fetchSalesTaxGroups({ force }),
    fetchPurchaseTaxGroups({ force }),
  ])

  return { salesTaxGroups, purchaseTaxGroups }
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

let inFlightProductsRequest = null

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
