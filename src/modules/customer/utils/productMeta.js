import { titleCase } from '@/app/utils/format'

export function cleanMeta(value) {
  const text = String(value ?? '').trim()
  return text && text !== '—' ? text : ''
}

/** Readable salt / generic line (search suggestions). */
export function formatGenericLabel(brand) {
  const raw = cleanMeta(brand)
  if (!raw) return ''
  const lowered = raw.toLowerCase()
  if (lowered === 'mediq' || lowered === 'generic') return ''
  return raw
    .split('+')
    .map((part) => titleCase(part.trim().toLowerCase()))
    .filter(Boolean)
    .join(' + ')
}

/** Dot-separated generic · group · pack for cards and product detail. */
export function productMetaParts(product) {
  const brand = cleanMeta(product?.brand)
  const brandPart = brand && brand.toLowerCase() !== 'mediq' ? brand : ''
  return [brandPart, cleanMeta(product?.groupName), cleanMeta(product?.pack)].filter(Boolean)
}

export function formatProductMetaLine(product) {
  return productMetaParts(product).join(' · ')
}

/** Generic line for stacked UI; keeps placeholder labels like "Generic" when salt is unknown. */
export function resolveGenericDisplay(product) {
  const formatted = formatGenericLabel(product?.brand)
  if (formatted) return formatted
  const raw = cleanMeta(product?.brand)
  if (!raw || raw.toLowerCase() === 'mediq') return ''
  return raw
}
