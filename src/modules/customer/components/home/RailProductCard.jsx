import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { PATHS } from '@/app/router/paths'
import { useCatalogStore } from '@/app/store/catalogStore'
import { fmtINR } from '@/app/utils/format'
import { colors } from '@/app/themes/colors'
import CartAddControl from '@/modules/customer/components/CartAddControl'

/**
 * One product tile inside a merchandising rail on the customer landing page.
 */
function RailProductCard({ product, accent = colors.accent }) {
  const navigate = useNavigate()
  const setFilter = useCatalogStore((s) => s.setFilter)

  const openProduct = () => {
    setFilter({ query: product.name })
    navigate(PATHS.customer.search)
  }

  return (
    <article
      className="flex h-full cursor-pointer flex-col gap-2.5 rounded-[18px] p-3 transition-transform hover:-translate-y-[3px]"
      style={{ background: colors.cardBg, border: '1px solid rgba(255,255,255,.11)' }}
      onClick={openProduct}
      onKeyDown={(e) => { if (e.key === 'Enter') openProduct() }}
      role="link"
      tabIndex={0}
    >
      <div className="relative h-[118px] overflow-hidden rounded-[12px]" aria-hidden="true">
        <div
          className="flex h-full w-full items-center justify-center text-[34px] font-extrabold"
          style={{
            background: `radial-gradient(circle at 30% 25%, ${accent}30, rgba(255,255,255,0.03) 72%)`,
            color: `${accent}cc`,
          }}
        >
          {product.name.charAt(0)}
        </div>
        {product.off > 0 && (
          <span
            className="absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-[0.05em]"
            style={{ background: 'rgba(255,255,255,.92)', color: colors.accentText }}
          >
            -{product.off}%
          </span>
        )}
      </div>

      <p className="flex items-center gap-1.5 text-[11px] font-bold">
        <Star size={11} fill={colors.gold} style={{ color: colors.gold }} aria-hidden="true" />
        <span style={{ color: colors.gold }}>{product.rating}</span>
        <span style={{ color: colors.textDim }}>({product.reviews})</span>
        <span className="ml-auto" style={{ color: colors.accentSoft }}>{product.eta}</span>
      </p>

      <div>
        <h3
          className="min-h-[34px] text-[13px] font-bold leading-tight"
          style={{
            color: colors.textBright,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.name}
        </h3>
        <p className="mt-0.5 text-[11px]" style={{ color: colors.textSecondary }}>{product.pack}</p>
      </div>

      {product.chip && (
        <p
          className="self-start rounded-md px-2 py-1 text-[10px] font-extrabold"
          style={{ color: '#9ff0d4', background: 'rgba(64,222,170,.1)', border: '1px solid rgba(64,222,170,.3)' }}
        >
          {product.chip}
        </p>
      )}

      <div
        className="mt-auto flex items-center gap-2 pt-2.5"
        style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}
      >
        <span className="text-[15px] font-extrabold tabular-nums" style={{ color: colors.textBright }}>
          {fmtINR(product.price)}
        </span>
        {product.mrp > product.price && (
          <span className="text-[11px] line-through" style={{ color: colors.textDim }}>
            {fmtINR(product.mrp)}
          </span>
        )}
        <CartAddControl product={product} className="ml-auto shrink-0" />
      </div>
    </article>
  )
}

export default memo(RailProductCard)
