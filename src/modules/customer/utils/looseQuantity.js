function pick(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key]
    if (value != null && value !== '') return value
  }
  return undefined
}

export function formatUnitLabel(unit) {
  const raw = String(unit ?? 'unit').trim()
  const normalized = raw.toLowerCase()
  if (normalized === 'tab' || normalized === 'tablet' || normalized === 'tablets') return 'Tablet'
  if (normalized === 'cap' || normalized === 'capsule' || normalized === 'capsules') return 'Capsule'
  if (normalized === 'ml') return 'ml'
  if (normalized === 'unit' || normalized === 'units') return 'Unit'
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

export function formatPackLabel(packType) {
  const raw = String(packType ?? 'pack').trim()
  if (!raw) return 'Pack'
  const normalized = raw.toLowerCase()
  if (normalized.includes('strip')) return 'Strip'
  if (normalized.includes('bottle')) return 'Bottle'
  if (normalized.includes('box')) return 'Box'
  if (normalized.includes('tube')) return 'Tube'
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

export function resolveProductLooseMeta(item) {
  const packings = Array.isArray(item?.packings) ? item.packings : []
  const primary = packings[0] ?? {}
  const unitsPerPack =
    Number(pick(item, 'stockQuantityPerPack', 'stockQtyPerPack') ?? primary.quantity) || 1
  const stockUnit = pick(item, 'stockUnit', 'unit', 'unitOfMeasure') ?? primary.unit ?? 'TAB'
  const packType = pick(item, 'packType', 'packingType', 'sku') ?? primary.packingType ?? ''
  const looseQuantity =
    item?.looseQuantity === true ||
    item?.looseQuantity === 'true' ||
    String(item?.looseQuantity ?? '').toLowerCase() === 'yes'

  return {
    looseQuantity,
    unitsPerPack,
    packLabel: formatPackLabel(packType),
    unitLabel: formatUnitLabel(stockUnit),
    packType,
    stockUnit,
  }
}

export function resolveLooseSaleAllowed(item, product = {}) {
  const allowed = pick(item, 'looseSaleAllowed', 'looseSaleEnabled', 'allowLoose')
  if (allowed === true || allowed === 'true') return true
  if (allowed === false || allowed === 'false') return false

  const productFlag = pick(product, 'looseSaleAllowed', 'looseSaleEnabled', 'allowLoose')
  if (productFlag === true || productFlag === 'true') return true
  if (productFlag === false || productFlag === 'false') return false

  if (product?.looseQuantity === true || product?.looseQuantity === 'true') return true
  return false
}

export function productAllowsLoose(product) {
  return (
    product?.looseSaleAllowed === true ||
    product?.looseSaleAllowed === 'true' ||
    product?.looseQuantity === true ||
    product?.looseQuantity === 'true'
  )
}

export function isLooseCartLine(item) {
  return item?.looseSaleAllowed === true && item?.looseQuantity === true
}

export function getProductUnitsPerPack(product) {
  const units = Number(product?.unitsPerPack)
  return Number.isFinite(units) && units > 0 ? units : 1
}

export function calcLooseLineAmounts(product, fullPackQty, looseUnitQty) {
  const unitsPerPack = getProductUnitsPerPack(product)
  const fullPacks = Math.max(0, Number(fullPackQty) || 0)
  const looseUnits = Math.max(0, Number(looseUnitQty) || 0)
  const packPrice = Number(product?.price) || 0
  const packMrp = Number(product?.mrp) || packPrice
  const unitPrice = packPrice / unitsPerPack
  const unitMrp = packMrp / unitsPerPack

  return {
    unitsPerPack,
    fullPacks,
    looseUnits,
    totalUnits: fullPacks * unitsPerPack + looseUnits,
    subtotal: fullPacks * packPrice + looseUnits * unitPrice,
    mrpTotal: fullPacks * packMrp + looseUnits * unitMrp,
    unitPrice,
    unitMrp,
  }
}

export function formatLoosePackLine(product) {
  const unitsPerPack = getProductUnitsPerPack(product)
  const packLabel = product?.packLabel ?? 'Pack'
  const unitLabel = (product?.unitLabel ?? 'Unit').toLowerCase()
  const unitPlural = unitsPerPack === 1 ? unitLabel : `${unitLabel}s`
  return `${packLabel} (${unitsPerPack} ${unitPlural})`
}

export function formatLooseUnitLine(product) {
  const unitLabel = product?.unitLabel ?? 'Unit'
  return `${unitLabel} (1 ${unitLabel.toLowerCase()})`
}

export function formatLooseCartSummary(item) {
  if (!isLooseCartLine(item)) return null

  const parts = []
  const packLabel = item.packLabel ?? 'Pack'
  const unitLabel = item.unitLabel ?? 'Unit'
  const fullPackQty = Number(item.fullPackQty) || 0
  const looseUnitQty = Number(item.looseUnitQty) || 0
  const unitsPerPack = getProductUnitsPerPack(item)
  const totalUnits = fullPackQty * unitsPerPack + looseUnitQty

  if (fullPackQty > 0) {
    parts.push(`${fullPackQty} ${packLabel.toLowerCase()}${fullPackQty === 1 ? '' : 's'}`)
  }
  if (looseUnitQty > 0) {
    parts.push(`${looseUnitQty} ${unitLabel.toLowerCase()}${looseUnitQty === 1 ? '' : 's'}`)
  }

  if (!parts.length) return null

  const unitPlural = totalUnits === 1 ? unitLabel.toLowerCase() : `${unitLabel.toLowerCase()}s`
  return {
    short: parts.join(' + '),
    long: `${parts.join(' + ')} (${totalUnits} ${unitPlural})`,
    totalUnits,
  }
}

export function formatPackCartSummary(item) {
  const packLabel = item?.packLabel ?? 'Pack'
  const unitLabel = item?.unitLabel ?? 'Unit'
  const packCount = Number(item?.fullPackQty ?? item?.qty) || 0
  const unitsPerPack = getProductUnitsPerPack(item)
  const totalUnits = packCount * unitsPerPack
  const packLower = packLabel.toLowerCase()
  const unitLower = unitLabel.toLowerCase()

  return {
    short: `${packCount} ${packLower}${packCount === 1 ? '' : 's'}`,
    detail: `${packCount} ${packLower}${packCount === 1 ? '' : 's'} (${totalUnits} ${totalUnits === 1 ? unitLower : `${unitLower}s`})`,
    totalUnits,
  }
}

export function getCartLineSubtotal(item) {
  if (isLooseCartLine(item)) {
    const { subtotal } = calcLooseLineAmounts(item, item.fullPackQty, item.looseUnitQty)
    return subtotal
  }
  if (Number.isFinite(Number(item?.lineTotal))) return Number(item.lineTotal)
  return (Number(item?.price) || 0) * (Number(item?.qty) || 0)
}

export function getCartLineMrpTotal(item) {
  if (isLooseCartLine(item)) {
    const { mrpTotal } = calcLooseLineAmounts(item, item.fullPackQty, item.looseUnitQty)
    return mrpTotal
  }
  return (Number(item?.mrp) || Number(item?.price) || 0) * (Number(item?.qty) || 0)
}
