import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Package } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import Tabs from '@/shared/ui/Tabs'
import OrdersShimmer from '@/shared/components/shimmer/pages/OrdersShimmer'
import { useOrderStore } from '@/app/store/orderStore'
import { useCatalogStore } from '@/app/store/catalogStore'
import { ORDER_STATUS } from '@/shared/mocks/customer'
import { PATHS, buildPath } from '@/app/router/paths'
import { fmtINR, titleCase } from '@/app/utils/format'
import { fetchMyOrders, mapOrdersFromApi } from '@/services/orders'
import {
  fmtOrderDateTime,
  getOrderStatusLabel,
  getStatusTone,
  matchesOrderTab,
  ORDER_LIST_TABS,
} from '@/modules/customer/utils/orderHelpers'
import { colors } from '@/app/themes/colors'

function OrderThumbnail({ items, getProduct }) {
  const first = items[0]
  const product = first ? getProduct(first.id) : null
  const imageUrl = first?.image || product?.imageUrl || product?.image || null

  return (
    <div
      className="w-[72px] h-[72px] rounded-[12px] flex-shrink-0 overflow-hidden flex items-center justify-center"
      style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${colors.borderSubtle}` }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <Package size={26} strokeWidth={1.6} style={{ color: colors.textDim }} />
      )}
    </div>
  )
}

export default function OrdersPage() {
  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const orders = useOrderStore((s) => s.orders)
  const setOrdersFromApi = useOrderStore((s) => s.setOrdersFromApi)
  const getProduct = useCatalogStore((s) => s.getProduct)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError('')

      try {
        const payload = await fetchMyOrders()
        if (!cancelled) {
          setOrdersFromApi(mapOrdersFromApi(payload))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load orders')
          setOrdersFromApi([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [setOrdersFromApi])

  const filtered = orders.filter((order) => matchesOrderTab(order, tab))

  if (loading) {
    return <OrdersShimmer rows={3} />
  }

  return (
    <div>
      <PageHeader title="My Orders" subtitle="Track, reorder or raise an issue." />
      <Tabs tabs={ORDER_LIST_TABS} value={tab} onChange={setTab} />

      {error && (
        <div
          className="mb-4 rounded-[12px] px-4 py-3 text-[12px] font-bold text-red-400"
          style={{ background: 'rgba(255,138,128,0.08)', border: '1px solid rgba(255,138,128,0.24)' }}
        >
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No orders here yet" action={<Button as={Link} to={PATHS.customer.search}>Start shopping</Button>} />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const meta = ORDER_STATUS[order.status] ?? { label: titleCase(order.status), tone: 'info' }
            const statusLabel = getOrderStatusLabel(order, meta)
            const statusTone = getStatusTone(order.status)
            const detailPath = buildPath(PATHS.customer.orderDetail, { id: order.id })

            return (
              <Link
                key={order.id}
                to={detailPath}
                className="block rounded-[16px] p-4 transition-colors hover:bg-white/[0.02]"
                style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
              >
                <div className="flex gap-3.5">
                  <OrderThumbnail items={order.items} getProduct={getProduct} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-extrabold truncate" style={{ color: colors.textBright }}>
                        {order.id}
                      </p>
                      <Badge tone={statusTone} className="flex-shrink-0">
                        {statusLabel}
                      </Badge>
                    </div>

                    <p className="text-[11.5px] mt-1" style={{ color: colors.textDim }}>
                      {fmtOrderDateTime(order.statusUpdatedAt)} · {order.items.length} item{order.items.length === 1 ? '' : 's'}
                    </p>

                    <p className="text-[11.5px] mt-1.5 line-clamp-2 leading-relaxed" style={{ color: colors.textMuted }}>
                      {order.items.map((item) => `${item.name} × ${item.qty}`).join(', ')}
                    </p>

                    <div className="flex items-end justify-end mt-3">
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: colors.textDim }}>
                          Total
                        </p>
                        <p className="text-[16px] font-extrabold tabular-nums" style={{ color: colors.accent }}>
                          {fmtINR(order.total)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={18} className="flex-shrink-0 mt-0.5" style={{ color: colors.textDim }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
