import { authFetch, CART_API_BASE } from './api'
import { resolveProductLooseMeta } from '@/modules/customer/utils/looseQuantity'

function pick(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key]
    if (value != null && value !== '') return value
  }
  return undefined
}

const LINE_ITEM_ID_KEYS = [
  'itemId',
  'cartItemId',
  'lineItemId',
  'cartLineItemId',
  'cartLineId',
  'lineId',
]

const PRODUCT_ID_KEYS = ['productId', 'product_id', 'productID']
const QTY_KEYS = ['quantity', 'qty']

function extractCartItems(payload) {
  const data = payload?.data ?? payload

  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.cartItems)) return data.cartItems
  if (Array.isArray(data?.lines)) return data.lines
  if (Array.isArray(data)) return data

  if (data && typeof data === 'object') {
    const hasLineFields =
      pick(data, ...LINE_ITEM_ID_KEYS, ...PRODUCT_ID_KEYS, ...QTY_KEYS) != null
    if (hasLineFields) return [data]
  }

  const item = payload?.item ?? payload?.cartItem
  if (item && typeof item === 'object') return [item]

  return []
}

/** Find a cart line for a product id inside any cart payload shape. */
export function findCartLineItem(payload, productId) {
  const target = String(productId)
  return (
    extractCartItems(payload).find(
      (item) => String(pick(item, ...PRODUCT_ID_KEYS) ?? '') === target,
    ) ?? null
  )
}

/** Extract server cart line id + quantity from add/update/cart responses. */
export function mapCartItemFromApi(payload, productId) {
  const line =
    productId != null
      ? findCartLineItem(payload, productId)
      : extractCartItems(payload)[0]

  const item = line ?? payload?.data ?? payload?.item ?? payload ?? {}

  return {
    cartItemId: String(pick(item, ...LINE_ITEM_ID_KEYS) ?? ''),
    quantity: Number(pick(item, ...QTY_KEYS)) || undefined,
  }
}

/** Map one API cart line into the zustand cart item shape. */
export function mapCartLineToStoreItem(line) {
  const product = line?.product ?? line?.productDetails ?? line?.productInfo ?? {}

  const productId = pick(line, ...PRODUCT_ID_KEYS) ?? pick(product, 'productId', 'id')
  const cartItemId = pick(line, ...LINE_ITEM_ID_KEYS)
  const packings = product.packings ?? line.packings
  const primaryPacking = Array.isArray(packings) ? packings[0] : null
  const looseMeta = resolveProductLooseMeta({ ...product, packings })

  const price =
    Number(pick(line, 'price', 'unitPrice', 'sellingPrice', 'salePrice')) ||
    Number(pick(product, 'price', 'sellingPrice')) ||
    0
  const mrp =
    Number(pick(line, 'mrp', 'originalPrice', 'maxRetailPrice')) ||
    Number(pick(product, 'mrp')) ||
    price
  const fullPackQty = Number(
    pick(line, 'packQuantity', 'packQty', 'fullPackQuantity', 'fullPackQty'),
  )
  const looseUnitQty = Number(
    pick(line, 'looseQuantity', 'looseQty', 'looseUnitQuantity', 'looseUnitQty'),
  )
  const hasLooseBreakdown =
    (Number.isFinite(fullPackQty) || Number.isFinite(looseUnitQty)) &&
    (fullPackQty > 0 || looseUnitQty > 0)

  let qty = Number(pick(line, ...QTY_KEYS)) || 0
  if (!qty && hasLooseBreakdown) {
    qty = (Number.isFinite(fullPackQty) ? fullPackQty : 0) * looseMeta.unitsPerPack + (Number.isFinite(looseUnitQty) ? looseUnitQty : 0)
  }

  let pack = pick(line, 'pack', 'packing', 'packLabel')
  if (!pack && primaryPacking) {
    const unit = String(primaryPacking.unit ?? 'units').toUpperCase()
    const quantity = Number(primaryPacking.quantity)
    pack = Number.isFinite(quantity) && quantity > 0 ? `${quantity} ${unit}` : unit
  }

  const base = {
    id: String(productId ?? cartItemId ?? ''),
    cartItemId: cartItemId ? String(cartItemId) : null,
    name:
      pick(line, 'productName', 'name', 'title') ??
      pick(product, 'productName', 'name', 'title') ??
      'Product',
    price,
    mrp,
    qty,
    pack: pack ?? '',
    rx: Boolean(
      pick(line, 'rx', 'requiresPrescription', 'prescriptionRequired') ??
        pick(product, 'rx', 'requiresPrescription', 'prescriptionRequired'),
    ),
    image:
      pick(line, 'imageUrl', 'image', 'thumbnailUrl') ??
      pick(product, 'imageUrl', 'image', 'thumbnailUrl') ??
      null,
    unitsPerPack: looseMeta.unitsPerPack,
    packLabel: looseMeta.packLabel,
    unitLabel: looseMeta.unitLabel,
  }

  if (hasLooseBreakdown) {
    return {
      ...base,
      looseQuantity: true,
      fullPackQty: Number.isFinite(fullPackQty) ? fullPackQty : 0,
      looseUnitQty: Number.isFinite(looseUnitQty) ? looseUnitQty : 0,
    }
  }

  return base
}

/** Map GET /api/carts/me (or similar) into store-ready cart lines. */
export function mapCartFromApi(payload) {
  return extractCartItems(payload)
    .map(mapCartLineToStoreItem)
    .filter((item) => item.id && item.qty > 0)
}

let inFlightCartRequest = null

/** GET /api/carts/me — fetch the current user's cart. */
export async function fetchMyCart({ force = false } = {}) {
  if (!force && inFlightCartRequest) {
    return inFlightCartRequest
  }

  inFlightCartRequest = authFetch('/api/carts/me', {}, CART_API_BASE).finally(() => {
    inFlightCartRequest = null
  })

  return inFlightCartRequest
}

/** POST /api/carts/me/items — add a product to the cart. */
export async function addCartItem({ productId, quantity, price, packQuantity, looseQuantity }) {
  const body = {
    productId: Number(productId),
    price: Number(price),
  }

  if (packQuantity != null || looseQuantity != null) {
    body.packQuantity = Number(packQuantity ?? 0)
    body.looseQuantity = Number(looseQuantity ?? 0)
  } else {
    body.quantity = Number(quantity ?? 1)
  }

  return authFetch(
    '/api/carts/me/items',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    CART_API_BASE,
  )
}

/** PUT /api/carts/me/items/{itemId} — update line-item quantity. */
export async function updateCartItem(itemId, payload) {
  const options = typeof payload === 'object' && payload != null ? payload : { quantity: payload }

  const body =
    options.packQuantity != null || options.looseQuantity != null
      ? {
          packQuantity: Number(options.packQuantity ?? 0),
          looseQuantity: Number(options.looseQuantity ?? 0),
        }
      : { quantity: Number(options.quantity ?? 1) }

  return authFetch(
    `/api/carts/me/items/${encodeURIComponent(itemId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
    CART_API_BASE,
  )
}

/** DELETE /api/carts/me/items/{itemId} — remove a line item from the cart. */
export async function deleteCartItem(itemId) {
  return authFetch(
    `/api/carts/me/items/${encodeURIComponent(itemId)}`,
    { method: 'DELETE' },
    CART_API_BASE,
  )
}

/** Resolve the server line-item id for a product, using POST response then GET cart. */
export async function resolveCartItemId(productId, postResponse) {
  const fromPost = mapCartItemFromApi(postResponse, productId)
  if (fromPost.cartItemId) return fromPost

  const cart = await fetchMyCart()
  return mapCartItemFromApi(cart, productId)
}
