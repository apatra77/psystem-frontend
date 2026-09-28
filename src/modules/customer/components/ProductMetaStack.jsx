import { Building2, LayoutGrid } from 'lucide-react'
import { colors } from '@/app/themes/colors'
import { cleanMeta, resolveGenericDisplay } from '@/modules/customer/utils/productMeta'

const SIZE = {
  sm: {
    generic: 'text-[11px]',
    meta: 'text-[11px]',
    icon: 12,
    genericMt: 'mt-0.5',
    metaMt: 'mt-1',
  },
  md: {
    generic: 'text-[13px]',
    meta: 'text-[12px]',
    icon: 13,
    genericMt: 'mt-1.5',
    metaMt: 'mt-1.5',
  },
}

/**
 * Product subtitle: generic/salt line + group | pack row (matches search suggestions).
 */
export default function ProductMetaStack({ product, size = 'sm', fallback = '—', className = '' }) {
  const tokens = SIZE[size] ?? SIZE.sm
  const generic = resolveGenericDisplay(product)
  const group = cleanMeta(product?.groupName)
  const pack = cleanMeta(product?.pack)
  const hasMetaRow = Boolean(group || pack)

  if (!generic && !hasMetaRow) {
    const text = product?.desc?.trim() || fallback
    return (
      <p className={`truncate ${tokens.generic} ${className}`} style={{ color: colors.textDim }}>
        {text}
      </p>
    )
  }

  return (
    <div className={`min-w-0 ${className}`}>
      {generic ? (
        <p
          className={`truncate leading-snug ${tokens.generic} ${tokens.genericMt}`}
          style={{ color: colors.textMuted }}
        >
          {generic}
        </p>
      ) : null}
      {hasMetaRow ? (
        <div
          className={`flex min-w-0 items-center gap-2 leading-none ${tokens.meta} ${generic ? tokens.metaMt : tokens.genericMt}`}
          style={{ color: colors.textDim }}
        >
          {group ? (
            <span className="inline-flex min-w-0 max-w-[58%] items-center gap-1.5">
              <Building2 size={tokens.icon} strokeWidth={2} className="flex-shrink-0 opacity-75" aria-hidden />
              <span className="truncate font-medium">{group}</span>
            </span>
          ) : null}
          {group && pack ? (
            <span className="flex-shrink-0 select-none opacity-35" aria-hidden>
              |
            </span>
          ) : null}
          {pack ? (
            <span className="inline-flex min-w-0 flex-1 items-center gap-1.5">
              <LayoutGrid size={tokens.icon} strokeWidth={2} className="flex-shrink-0 opacity-75" aria-hidden />
              <span className="truncate font-medium">{pack}</span>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
