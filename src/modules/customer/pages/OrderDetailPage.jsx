import { Link, useParams } from 'react-router-dom'
import PageHeader from '@/shared/ui/PageHeader'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import { useOrderStore } from '@/app/store/orderStore'
import { useUiStore } from '@/app/store/uiStore'
import { ORDER_STATUS } from '@/shared/mocks/customer'
import { PATHS, buildPath } from '@/app/router/paths'
import { fmtDateTime, fmtINR } from '@/app/utils/format'
import { msg } from '@/shared/messages/messages'
import { colors } from '@/app/themes/colors'

export default function OrderDetailPage() {
  const { id } = useParams()
  const order = useOrderStore((s) => s.getOrder(id))
  const cancelOrder = useOrderStore((s) => s.cancelOrder)
  const canCancel = useOrderStore((s) => s.canCancel)
  const askConfirm = useUiStore((s) => s.askConfirm)

  if (!order) return <EmptyState title="Order not found" action={<Button as={Link} to={PATHS.customer.orders}>Back to orders</Button>} />

  const meta = ORDER_STATUS[order.status]

  const confirmCancel = () =>
    askConfirm({
      title: 'Cancel this order?',
      message: msg('common.confirmDelete', { name: order.id }),
      confirmLabel: 'Cancel order',
      tone: 'danger',
      onConfirm: () => cancelOrder(order.id),
    })

  return (
    <div>
      <PageHeader
        title={`Order ${order.id}`}
        subtitle={`Placed ${fmtDateTime(order.placedAt)}`}
        actions={
          <div className="flex gap-2">
            {!['delivered', 'cancelled'].includes(order.status) && (
              <Button as={Link} to={buildPath(PATHS.customer.orderTracking, { id: order.id })} size="sm">Track</Button>
            )}
            {canCancel(order) && <Button size="sm" variant="danger" onClick={confirmCancel}>Cancel order</Button>}
            <Button as={Link} to={PATHS.customer.complaints} size="sm" variant="secondary">Raise an issue</Button>
          </div>
        }
      />

      <div className="grid gap-6" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,320px)' }}>
        <section className="rounded-[18px] p-5" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-2.5 mb-4">
            <h2 className="text-[14px] font-extrabold" style={{ color: colors.textBright }}>Items</h2>
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>
          <ul className="space-y-3">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between text-[13px]" style={{ color: colors.textMuted }}>
                <span>{i.name} <span style={{ color: colors.textDim }}>× {i.qty}</span></span>
                <span style={{ color: colors.textBright }}>{fmtINR(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between mt-4 pt-3 text-[15px] font-extrabold" style={{ borderTop: `1px solid ${colors.borderSubtle}`, color: colors.textBright }}>
            <span>Total</span><span>{fmtINR(order.total)}</span>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[18px] p-5" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <p className="text-[11px] font-extrabold uppercase tracking-wider mb-2" style={{ color: colors.textDim }}>Delivery to</p>
            <p className="text-[13px]" style={{ color: colors.text }}>{order.address}</p>
            {order.scheduledFor && (
              <p className="text-[12.5px] mt-2" style={{ color: colors.accentSoft }}>Scheduled: {fmtDateTime(order.scheduledFor)}</p>
            )}
          </div>
          <div className="rounded-[18px] p-5" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <p className="text-[11px] font-extrabold uppercase tracking-wider mb-2" style={{ color: colors.textDim }}>Payment</p>
            <p className="text-[13px] uppercase" style={{ color: colors.text }}>{order.paymentMethod}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
