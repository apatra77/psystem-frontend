import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import Badge from '@/shared/ui/Badge'
import CartAddControl from '@/modules/customer/components/CartAddControl'
import { PATHS, buildPath } from '@/app/router/paths'
import { useCatalogStore } from '@/app/store/catalogStore'
import { fmtINR } from '@/app/utils/format'
import { colors } from '@/app/themes/colors'

export default function ProductCard({ product }) {
  const wishlist = useCatalogStore((s) => s.wishlist)
  const toggleWishlist = useCatalogStore((s) => s.toggleWishlist)
  const wished = wishlist.includes(product.id)
  const off = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0

  return (
    <article
      className="flex h-full flex-col gap-2.5 rounded-[18px] p-3"
      style={{ background: colors.cardBg, border: '1px solid rgba(255,255,255,.11)' }}
    >
      <div className="relative h-[118px] overflow-hidden rounded-[12px]">
        <Link
          to={buildPath(PATHS.customer.product, { id: product.id })}
          className="block h-full w-full"
          aria-label={`View ${product.name}`}
        >
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-[34px] font-extrabold"
              style={{
                background: `radial-gradient(circle at 30% 25%, ${colors.accent}30, rgba(255,255,255,0.03) 72%)`,
                color: `${colors.accent}cc`,
              }}
            >
              {product.name.charAt(0)}
            </div>
          )}
        </Link>
        {off > 0 && (
          <span
            className="absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-[0.05em]"
            style={{ background: 'rgba(255,255,255,.92)', color: colors.accentText }}
          >
            -{off}%
          </span>
        )}
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className="absolute right-2 top-2 rounded-full p-1.5"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          aria-label="Wishlist"
        >
          <Heart size={14} fill={wished ? colors.accent : 'none'} style={{ color: wished ? colors.accent : colors.textDim }} />
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap min-h-[18px]">
        {product.rx && <Badge tone="purple">Rx</Badge>}
        {product.looseQuantity && (
          <Badge tone="success" className="!bg-[rgba(64,222,170,0.12)] !text-[#9ff0d4] !border-[rgba(64,222,170,0.3)]">
            Loose available
          </Badge>
        )}
        {product.stock <= 0 && <Badge tone="danger">Out of stock</Badge>}
      </div>

      <Link to={buildPath(PATHS.customer.product, { id: product.id })} className="block">
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
        <p className="mt-0.5 text-[11px]" style={{ color: colors.textSecondary }}>
          {product.brand} · {product.pack}
        </p>
      </Link>

      <div
        className="mt-auto flex items-center gap-2 pt-2.5"
        style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}
      >
        <span className="text-[15px] font-extrabold tabular-nums" style={{ color: colors.textBright }}>
          {fmtINR(product.price)}
        </span>
        {off > 0 && (
          <span className="text-[11px] line-through" style={{ color: colors.textDim }}>
            {fmtINR(product.mrp)}
          </span>
        )}
        <CartAddControl product={product} className="ml-auto shrink-0" onInteract={(e) => e.stopPropagation()} />
      </div>
    </article>
  )
}
