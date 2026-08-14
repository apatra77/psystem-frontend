import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, Tag, Trash2 } from 'lucide-react'
import Button from '@/shared/ui/Button'
import Badge from '@/shared/ui/Badge'
import EmptyState from '@/shared/ui/EmptyState'
import PageHeader from '@/shared/ui/PageHeader'
import CartShimmer from '@/shared/components/shimmer/pages/CartShimmer'
import PortalModal from '@/shared/ui/PortalModal'
import Spinner from '@/shared/ui/Spinner'
import { useCartStore } from '@/app/store/cartStore'
import { PATHS } from '@/app/router/paths'
import { fmtINR } from '@/app/utils/format'
import { msg } from '@/shared/messages/messages'
import { colors } from '@/app/themes/colors'

export default function CartPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const { items, coupon, loading, setQty, removeItem, clear, applyCoupon, removeCoupon } =
    useCartStore()
  const totals = useCartStore((s) => s.totals())
  const needsRx = useCartStore((s) => s.requiresPrescription())

  useEffect(() => {
    useCartStore.getState().loadCart()
  }, [])

  const closeDeleteModal = () => {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteError('')
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await removeItem(deleteTarget.id)
      setDeleteTarget(null)
    } catch (error) {
      setDeleteError(error?.message ?? 'Failed to remove item. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <CartShimmer rows={Math.max(items.length, 3)} />
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title={msg('customer.cartEmpty')}
        description="Add medicines or devices and they'll show up here."
        action={<Button as={Link} to={PATHS.customer.search}>Browse products</Button>}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Your cart"
        subtitle={`${items.length} item(s)`}
      />

      <div className="grid gap-6" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)' }}>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.cartItemId ?? item.id} className="flex items-center gap-4 p-4 rounded-[16px]" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <span className="w-14 h-14 rounded-[12px] flex items-center justify-center text-2xl font-extrabold" style={{ background: 'rgba(255,255,255,0.05)', color: colors.accent }}>
                {item.name.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-extrabold truncate" style={{ color: colors.textBright }}>{item.name}</p>
                <p className="text-[12px] mt-0.5" style={{ color: colors.textDim }}>
                  {item.pack || fmtINR(item.price)}
                </p>
                {item.rx && <Badge tone="purple" className="mt-1.5">Rx</Badge>}
              </div>
              <div className="flex items-center rounded-[11px]" style={{ border: `1px solid ${colors.border}` }}>
                <button type="button" className="px-2.5 py-2" onClick={() => setQty(item.id, item.qty - 1)} aria-label="Decrease"><Minus size={13} /></button>
                <span className="px-3 text-[13px] font-extrabold" style={{ color: colors.textBright }}>{item.qty}</span>
                <button type="button" className="px-2.5 py-2" onClick={() => setQty(item.id, item.qty + 1)} aria-label="Increase"><Plus size={13} /></button>
              </div>
              <p className="w-[86px] text-right text-[14px] font-extrabold" style={{ color: colors.textBright }}>{fmtINR(item.price * item.qty)}</p>
              <button type="button" onClick={() => setDeleteTarget(item)} aria-label="Remove" style={{ color: colors.textDim }}><Trash2 size={16} /></button>
            </div>
          ))}

          {needsRx && (
            <p className="text-[12.5px] px-4 py-3 rounded-[13px]" style={{ background: 'rgba(178,135,255,.10)', border: '1px solid rgba(178,135,255,.3)', color: colors.purpleLight }}>
              {msg('customer.rxRequired')}{' '}
              <Link to={PATHS.customer.prescription} className="font-bold underline">Upload now</Link>
            </p>
          )}
        </div>

        <aside className="rounded-[18px] p-5 h-fit sticky top-[84px]" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <p className="text-[14px] font-extrabold mb-4" style={{ color: colors.textBright }}>Bill summary</p>

          <div className="flex gap-2 mb-4">
            <input
              value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code"
              className="flex-1 rounded-[11px] px-3 py-2.5 text-[12.5px] outline-none uppercase"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.borderSubtle}`, color: colors.textBright }}
            />
            <Button size="sm" icon={Tag} onClick={() => applyCoupon(code)}>Apply</Button>
          </div>

          {coupon && (
            <div className="flex items-center justify-between text-[12.5px] mb-3 px-3 py-2 rounded-[10px]" style={{ background: 'rgba(64,222,170,.10)', color: colors.accent }}>
              {coupon.code} applied
              <button type="button" onClick={removeCoupon} className="font-bold">Remove</button>
            </div>
          )}

          <dl className="space-y-2 text-[13px]" style={{ color: colors.textMuted }}>
            <div className="flex justify-between"><dt>Item total</dt><dd>{fmtINR(totals.subtotal)}</dd></div>
            {totals.savings > 0 && <div className="flex justify-between" style={{ color: colors.accent }}><dt>MRP savings</dt><dd>−{fmtINR(totals.savings)}</dd></div>}
            {totals.couponDiscount > 0 && <div className="flex justify-between" style={{ color: colors.accent }}><dt>Coupon</dt><dd>−{fmtINR(totals.couponDiscount)}</dd></div>}
            <div className="flex justify-between"><dt>Delivery</dt><dd>{totals.delivery === 0 ? 'Free' : fmtINR(totals.delivery)}</dd></div>
            <div className="flex justify-between"><dt>Packaging</dt><dd>{fmtINR(totals.packaging)}</dd></div>
          </dl>

          <div className="flex justify-between items-center mt-4 pt-4 text-[16px] font-extrabold" style={{ borderTop: `1px solid ${colors.borderSubtle}`, color: colors.textBright }}>
            <span>To pay</span><span>{fmtINR(totals.total)}</span>
          </div>

          <Button className="w-full mt-5" size="lg" onClick={() => navigate(PATHS.customer.checkout)}>Proceed to checkout</Button>
        </aside>
      </div>

      {deleteTarget && (
        <PortalModal onClose={closeDeleteModal} width={420}>
          <div className="p-6">
            <div className="text-[17px] font-extrabold mb-2" style={{ color: colors.textBright }}>
              Remove item?
            </div>
            <p className="text-[13px] leading-relaxed mb-1" style={{ color: colors.textSecondary }}>
              Are you sure you want to remove{' '}
              <span className="font-semibold" style={{ color: colors.textBright }}>{deleteTarget.name}</span>{' '}
              from your cart?
            </p>
            <p className="text-[12px]" style={{ color: colors.textDim }}>
              This action cannot be undone.
            </p>
            {deleteError && (
              <div className="mt-3 text-[12px] font-bold text-red-400">{deleteError}</div>
            )}
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="text-[12.5px] font-bold px-[18px] py-2 rounded-[10px] cursor-pointer disabled:opacity-60"
                style={{
                  color: colors.textBright,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.16)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="text-[12.5px] font-extrabold px-5 py-2 rounded-[10px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                style={{
                  color: '#fff',
                  background: '#c0392b',
                  boxShadow: '0 6px 18px rgba(192,57,43,0.35)',
                }}
              >
                {deleting ? (
                  <>
                    <Spinner />
                    Removing…
                  </>
                ) : (
                  'Remove'
                )}
              </button>
            </div>
          </div>
        </PortalModal>
      )}
    </div>
  )
}
