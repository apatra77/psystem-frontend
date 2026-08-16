import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Check,
  Copy,
  Headphones,
  Package,
  Printer,
  RefreshCw,
  Truck,
  X,
} from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import { useOrderStore } from '@/app/store/orderStore'
import { useUiStore } from '@/app/store/uiStore'
import { useCartStore } from '@/app/store/cartStore'
import { useCatalogStore } from '@/app/store/catalogStore'
import { ORDER_STATUS } from '@/shared/mocks/customer'
import { PATHS, buildPath } from '@/app/router/paths'
import { fmtDecimalINR, fmtINR, titleCase } from '@/app/utils/format'
import { msg } from '@/shared/messages/messages'
import { toast } from '@/app/store/uiStore'
import { fetchOrderInvoice, openOrderInvoiceDocument } from '@/services/orders'
import {
  buildTrackingTimeline,
  fmtOrderDateTime,
  fmtOrderShortDateTime,
  getOrderStatusLabel,
  getStatusTone,
  isOrderCancelled,
  isOrderDelivered,
  isOrderInitiated,
  isOrderRejected,
} from '@/modules/customer/utils/orderHelpers'
import { colors } from '@/app/themes/colors'

function copyOrderId(orderId) {
  navigator.clipboard?.writeText(orderId).then(() => {
    toast.success('Order ID copied')
  }).catch(() => {
    toast.error('Could not copy order ID')
  })
}

function OrderLineThumbnail({ item, getProduct }) {
  const product = getProduct(item.id)
  const imageUrl = item.image || product?.imageUrl || product?.image || null

  return (
    <div
      className="w-12 h-12 rounded-[10px] flex-shrink-0 overflow-hidden flex items-center justify-center"
      style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${colors.borderSubtle}` }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <Package size={18} style={{ color: colors.textDim }} />
      )}
    </div>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const order = useOrderStore((s) => s.getOrder(id))
  const cancelOrder = useOrderStore((s) => s.cancelOrder)
  const askConfirm = useUiStore((s) => s.askConfirm)
  const addItem = useCartStore((s) => s.addItem)
  const getProduct = useCatalogStore((s) => s.getProduct)
  const [printing, setPrinting] = useState(false)

  if (!order) {
    return <EmptyState title="Order not found" action={<Button as={Link} to={PATHS.customer.orders}>Back to orders</Button>} />
  }

  const meta = ORDER_STATUS[order.status] ?? { label: titleCase(order.status), tone: 'info', step: 0 }
  const statusLabel = getOrderStatusLabel(order, meta)
  const statusTone = isOrderRejected(order) || isOrderCancelled(order) ? 'danger' : getStatusTone(order.status)
  const delivered = isOrderDelivered(order)
  const initiated = isOrderInitiated(order)
  const rejected = isOrderRejected(order)
  const cancelled = isOrderCancelled(order)
  const failed = rejected || cancelled
  const timeline = buildTrackingTimeline(order)
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const deliveryFee = order.totals?.delivery ?? (subtotal >= 100 ? 0 : 49)
  const discount = order.totals?.discount ?? 0
  const grandTotal = order.totals?.total ?? order.total ?? subtotal + deliveryFee - discount

  const confirmCancel = () =>
    askConfirm({
      title: 'Cancel this order?',
      message: msg('customer.confirmCancelOrder', { name: order.id }),
      confirmLabel: 'Cancel order',
      loadingLabel: 'Cancelling…',
      tone: 'danger',
      onConfirm: () => cancelOrder(order.id),
    })

  const reorder = () => {
    order.items.forEach((line) => {
      const product = getProduct(line.id)
      if (product) addItem(product, line.qty)
    })
    toast.success(msg('customer.reorderAdded', { id: order.id }))
  }

  const printInvoice = async () => {
    setPrinting(true)
    try {
      const invoice = await fetchOrderInvoice(order.id)
      openOrderInvoiceDocument(invoice)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load invoice')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div className="pb-28 lg:pb-8">
      <PageHeader title="Order Details" subtitle="" />

      <section
        className="rounded-[18px] p-5 mb-4"
        style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: failed
                  ? 'rgba(255,138,128,0.14)'
                  : delivered
                    ? 'rgba(64,222,170,0.14)'
                    : 'rgba(255,255,255,0.06)',
                border: `1px solid ${failed ? 'rgba(255,138,128,0.34)' : delivered ? 'rgba(64,222,170,0.34)' : colors.borderSubtle}`,
              }}
            >
              {failed ? (
                <X size={28} strokeWidth={2.5} style={{ color: '#ff8a80' }} />
              ) : (
                <Check size={28} strokeWidth={2.5} style={{ color: delivered ? colors.accent : colors.textDim }} />
              )}
            </div>
            <div className="min-w-0">
              <Badge tone={statusTone} className="mb-2">{statusLabel}</Badge>
              <p className="text-[12.5px]" style={{ color: colors.textDim }}>
                {fmtOrderDateTime(order.statusUpdatedAt ?? order.placedAt)}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] mb-1" style={{ color: colors.textDim }}>
              Order ID
            </p>
            <div className="flex items-center justify-end gap-1.5">
              <p className="text-[12px] font-extrabold" style={{ color: colors.textBright }}>{order.id}</p>
              <button
                type="button"
                onClick={() => copyOrderId(order.id)}
                className="p-1 rounded-lg cursor-pointer hover:bg-white/5"
                aria-label="Copy order ID"
              >
                <Copy size={13} style={{ color: colors.textDim }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section
        className="rounded-[18px] p-5 mb-4 overflow-x-auto"
        style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
      >
        <div className={`relative flex items-start ${timeline.length <= 2 ? 'min-w-[280px]' : 'min-w-[560px]'}`}>
          <div className="absolute inset-x-0 top-3 flex z-0 pointer-events-none">
            {timeline.map((step, index) => {
              const previous = timeline[index - 1]
              const connectorColor = previous?.failed
                ? '#ff8a80'
                : previous?.done
                  ? colors.accent
                  : 'rgba(255,255,255,0.1)'

              return (
                <div key={`connector-${step.key}-${index}`} className="flex-1 relative h-[2px]">
                  {index > 0 && (
                    <span
                      className="absolute right-1/2 h-full"
                      style={{ width: '100%', background: connectorColor }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {timeline.map((step, index) => (
            <div key={`${step.key}-${index}`} className="relative z-10 flex-1 flex flex-col items-center text-center px-1">
              <span
                className="relative w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: step.failed
                    ? 'rgba(255,138,128,0.18)'
                    : step.done
                      ? colors.primaryBtn
                      : colors.bgElevated,
                  color: step.failed ? '#ff8a80' : step.done ? colors.accentText : colors.textDim,
                  border: `1px solid ${step.done ? (step.failed ? 'rgba(255,138,128,0.45)' : 'transparent') : colors.borderSubtle}`,
                }}
              >
                {step.failed ? <X size={12} strokeWidth={3} /> : step.done ? <Check size={12} strokeWidth={3} /> : index + 1}
              </span>
              <p
                className="text-[10.5px] font-bold mt-2 leading-tight"
                style={{ color: step.done ? (step.failed ? '#ff8a80' : colors.textBright) : colors.textDim }}
              >
                {step.label}
              </p>
              {step.at && (
                <p className="text-[9.5px] mt-1 leading-tight" style={{ color: colors.textDim }}>
                  {fmtOrderShortDateTime(step.at)}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 mb-4 lg:grid-cols-2">
        <section className="rounded-[18px] p-5" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-extrabold" style={{ color: colors.textBright }}>Delivery Address</h2>
            <Button as={Link} to={PATHS.customer.addresses} size="sm" variant="ghost">Change</Button>
          </div>
          <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: colors.textMuted }}>
            {order.address || '—'}
          </p>
        </section>

        <section className="rounded-[18px] p-5" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <h2 className="text-[14px] font-extrabold mb-3" style={{ color: colors.textBright }}>Payment Details</h2>
          <div className="flex items-center justify-between text-[13px] mb-2">
            <span style={{ color: colors.textDim }}>Payment Method</span>
            <span className="font-bold uppercase" style={{ color: colors.textBright }}>{order.paymentMethod}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span style={{ color: colors.textDim }}>Payment Status</span>
            <span className="font-bold" style={{ color: colors.accent }}>
              {delivered || order.paymentMethod !== 'cod' ? 'Paid' : 'Pending'}
            </span>
          </div>
        </section>
      </div>

      <section className="rounded-[18px] p-5 mb-4" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <h2 className="text-[14px] font-extrabold mb-4" style={{ color: colors.textBright }}>
          Items ({order.items.length})
        </h2>
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <OrderLineThumbnail item={item} getProduct={getProduct} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate" style={{ color: colors.textBright }}>{item.name}</p>
                <p className="text-[11.5px] mt-0.5" style={{ color: colors.textDim }}>
                  {fmtDecimalINR(item.price)} × {item.qty}
                </p>
              </div>
              <p className="text-[13px] font-extrabold tabular-nums" style={{ color: colors.textBright }}>
                {fmtDecimalINR(item.price * item.qty)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-5 pt-4 space-y-2" style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
          <div className="flex justify-between text-[13px]" style={{ color: colors.textMuted }}>
            <span>Subtotal</span><span>{fmtDecimalINR(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[13px]" style={{ color: colors.textMuted }}>
            <span>Delivery Fee</span>
            <span style={{ color: deliveryFee === 0 ? colors.accent : colors.textMuted }}>
              {deliveryFee === 0 ? 'Free' : fmtDecimalINR(deliveryFee)}
            </span>
          </div>
          <div className="flex justify-between text-[13px]" style={{ color: colors.textMuted }}>
            <span>Discount</span><span>- {fmtDecimalINR(discount)}</span>
          </div>
          <div className="flex justify-between pt-2 text-[18px] font-extrabold" style={{ color: colors.accent }}>
            <span style={{ color: colors.textBright }}>Grand Total</span>
            <span>{fmtDecimalINR(grandTotal)}</span>
          </div>
        </div>
      </section>

      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 lg:static lg:px-0 lg:py-0 lg:mt-2"
        style={{
          background: 'rgba(10,23,18,0.96)',
          borderTop: `1px solid ${colors.borderSubtle}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-[1180px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Button
            as={Link}
            to={buildPath(PATHS.customer.orderTracking, { id: order.id })}
            size="sm"
            variant="secondary"
            icon={Truck}
            className="w-full"
          >
            Track Order
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={Printer}
            className="w-full"
            disabled={!delivered || printing}
            loading={printing}
            onClick={printInvoice}
          >
            Download Invoice
          </Button>
          {initiated ? (
            <Button
              size="sm"
              variant="danger"
              icon={X}
              className="w-full"
              disabled={!initiated}
              onClick={confirmCancel}
            >
              Cancel order
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              icon={RefreshCw}
              className="w-full"
              disabled={!delivered}
              onClick={reorder}
            >
              Reorder
            </Button>
          )}
          <Button
            as={Link}
            to={PATHS.customer.support}
            size="sm"
            variant="secondary"
            icon={Headphones}
            className="w-full"
          >
            Need Help?
          </Button>
        </div>
      </div>
    </div>
  )
}
