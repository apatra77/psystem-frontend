import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Minus, Plus, ShieldCheck, Star, Truck } from 'lucide-react'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import ProductCard from '@/modules/customer/components/ProductCard'
import { useCatalogStore } from '@/app/store/catalogStore'
import { useCartStore } from '@/app/store/cartStore'
import { PATHS } from '@/app/router/paths'
import { fmtINR } from '@/app/utils/format'
import { msg } from '@/shared/messages/messages'
import { colors } from '@/app/themes/colors'

export default function ProductDetailPage() {
  const { id } = useParams()
  const [qty, setQty] = useState(1)
  const product = useCatalogStore((s) => s.getProduct(id))
  const products = useCatalogStore((s) => s.products)
  const addItem = useCartStore((s) => s.addItem)

  if (!product) return <EmptyState title="Product not found" action={<Button as={Link} to={PATHS.customer.search}>Back to shop</Button>} />

  const related = products.filter((p) => p.cat === product.cat && p.id !== product.id).slice(0, 4)
  const off = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[22px] flex items-center justify-center min-h-[320px] text-7xl" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          💊
        </div>

        <div>
          <div className="flex gap-2 mb-3">
            {product.rx && <Badge tone="purple">Prescription required</Badge>}
            {off > 0 && <Badge tone="success">{off}% off</Badge>}
            <Badge tone={product.stock > 0 ? 'success' : 'danger'}>{product.stock > 0 ? 'In stock' : 'Out of stock'}</Badge>
          </div>

          <h1 className="text-[26px] font-extrabold leading-tight" style={{ color: colors.textBright }}>{product.name}</h1>
          <p className="text-[13px] mt-1.5" style={{ color: colors.textMuted }}>{product.brand} · {product.pack}</p>

          <div className="flex items-center gap-1.5 mt-3 text-[13px]" style={{ color: colors.textMuted }}>
            <Star size={13} fill={colors.gold} style={{ color: colors.gold }} />
            <strong style={{ color: colors.textBright }}>{product.rating}</strong> ({product.reviews} reviews)
          </div>

          <div className="flex items-end gap-3 mt-5">
            <span className="text-[30px] font-extrabold" style={{ color: colors.textBright }}>{fmtINR(product.price)}</span>
            {off > 0 && <span className="text-[15px] line-through mb-1" style={{ color: colors.textDim }}>{fmtINR(product.mrp)}</span>}
          </div>

          <p className="text-[13.5px] leading-relaxed mt-5" style={{ color: colors.textMuted }}>{product.desc}</p>

          {product.rx && (
            <p className="text-[12.5px] mt-4 px-3 py-2.5 rounded-[11px]" style={{ background: 'rgba(178,135,255,.10)', border: '1px solid rgba(178,135,255,.3)', color: colors.purpleLight }}>
              {msg('customer.rxRequired')}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <div className="flex items-center rounded-[12px]" style={{ border: `1px solid ${colors.border}` }}>
              <button type="button" className="px-3 py-2.5" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease"><Minus size={14} /></button>
              <span className="px-4 text-[14px] font-extrabold" style={{ color: colors.textBright }}>{qty}</span>
              <button type="button" className="px-3 py-2.5" onClick={() => setQty((q) => q + 1)} aria-label="Increase"><Plus size={14} /></button>
            </div>
            <Button size="lg" disabled={product.stock <= 0} onClick={() => addItem(product, qty)}>Add to cart</Button>
            <Button as={Link} to={PATHS.customer.cart} size="lg" variant="secondary">Go to cart</Button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-7">
            <div className="flex items-center gap-2.5 text-[12.5px]" style={{ color: colors.textMuted }}>
              <Truck size={16} style={{ color: colors.accent }} /> Delivery in {product.eta}
            </div>
            <div className="flex items-center gap-2.5 text-[12.5px]" style={{ color: colors.textMuted }}>
              <ShieldCheck size={16} style={{ color: colors.accent }} /> 100% genuine, licensed store
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="text-[18px] font-extrabold mb-4" style={{ color: colors.textBright }}>Similar products</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
