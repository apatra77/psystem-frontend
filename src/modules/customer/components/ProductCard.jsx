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
    <article className="rounded-[18px] p-4 flex flex-col" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {product.rx && <Badge tone="purple">Rx</Badge>}
          {off > 0 && <Badge tone="success">{off}% off</Badge>}
          {product.looseQuantity && (
            <Badge tone="success" className="!bg-[rgba(64,222,170,0.12)] !text-[#9ff0d4] !border-[rgba(64,222,170,0.3)]">
              Loose available
            </Badge>
          )}
          {product.stock <= 0 && <Badge tone="danger">Out of stock</Badge>}
        </div>
        <button type="button" onClick={() => toggleWishlist(product.id)} aria-label="Wishlist">
          <Heart size={16} fill={wished ? colors.accent : 'none'} style={{ color: wished ? colors.accent : colors.textDim }} />
        </button>
      </div>

      <Link to={buildPath(PATHS.customer.product, { id: product.id })} className="mt-3 block">
        <h3 className="text-[14px] font-extrabold leading-snug" style={{ color: colors.textBright }}>{product.name}</h3>
        <p className="text-[12px] mt-1" style={{ color: colors.textDim }}>{product.brand} · {product.pack}</p>
      </Link>

      <div className="flex items-end justify-between gap-2 mt-4">
        <div>
          <span className="text-[16px] font-extrabold" style={{ color: colors.textBright }}>{fmtINR(product.price)}</span>
          {off > 0 && <span className="text-[12px] line-through ml-2" style={{ color: colors.textDim }}>{fmtINR(product.mrp)}</span>}
        </div>
        <CartAddControl product={product} className="shrink-0" />
      </div>
    </article>
  )
}
