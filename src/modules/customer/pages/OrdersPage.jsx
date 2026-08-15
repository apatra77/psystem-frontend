import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, RefreshCw } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import Tabs from '@/shared/ui/Tabs'
import OrdersShimmer from '@/shared/components/shimmer/pages/OrdersShimmer'
import { useOrderStore } from '@/app/store/orderStore'
import { useCartStore } from '@/app/store/cartStore'
import { useCatalogStore } from '@/app/store/catalogStore'
import { ORDER_STATUS } from '@/shared/mocks/customer'
import { PATHS, buildPath } from '@/app/router/paths'
import { fmtDateTime, fmtINR, titleCase } from '@/app/utils/format'
import { msg } from '@/shared/messages/messages'
import { toast } from '@/app/store/uiStore'
import { fetchMyOrders, mapOrdersFromApi } from '@/services/orders'
import { colors } from '@/app/themes/colors'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
]

export default function OrdersPage() {
  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const orders = useOrderStore((s) => s.orders)
  const setOrdersFromApi = useOrderStore((s) => s.setOrdersFromApi)
  const addItem = useCartStore((s) => s.addItem)
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

  const filtered = orders.filter((o) =>
    tab === 'all' ? true : tab === 'active' ? !['delivered', 'cancelled'].includes(o.status) : o.status === tab,
  )

  const reorder = (order) => {
    order.items.forEach((line) => {
      const product = getProduct(line.id)
      if (product) addItem(product, line.qty)
    })
    toast.success(msg('customer.reorderAdded', { id: order.id }))
  }

  if (loading) {
    return <OrdersShimmer rows={3} />
  }

  return (
    <div>
      <PageHeader title="My orders" subtitle="Track, reorder or raise an issue." />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

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
            return (
              <article key={order.id} className="p-5 rounded-[18px]" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <p className="text-[14px] font-extrabold" style={{ color: colors.textBright }}>{order.id}</p>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    <p className="text-[12.5px] mt-1" style={{ color: colors.textDim }}>
                      {fmtDateTime(order.statusUpdatedAt)} · {order.items.length} item(s) · {fmtINR(order.total)}
                    </p>
                    <p className="text-[12.5px] mt-1.5" style={{ color: colors.textMuted }}>
                      {order.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* <Button as={Link} to={buildPath(PATHS.customer.orderDetail, { id: order.id })} size="sm" variant="secondary">Details</Button> */}
                    {/* {!['delivered', 'cancelled'].includes(order.status) && (
                      <Button as={Link} to={buildPath(PATHS.customer.orderTracking, { id: order.id })} size="sm">Track</Button>
                    )} */}
                    {order.status === 'delivered' && (
                      <Button size="sm" icon={RefreshCw} onClick={() => reorder(order)}>Reorder</Button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
