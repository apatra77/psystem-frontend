import { useEffect, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Eye,
  Package,
  Printer,
  Truck,
  X,
} from 'lucide-react'
import PortalModal from '../../components/PortalModal'
import { fetchAdminOrderById, parseAdminOrderDetail } from '@/services/orders'
import { fmtINR, mapOrder } from '../../utils/helpers'
import { colors } from '@/theme/colors'

function Pill({ meta }) {
  return (
    <span
      className="inline-flex items-center text-[10.5px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
    >
      {meta.label}
    </span>
  )
}

function DetailLineThumbnail({ item }) {
  return (
    <div
      className="w-10 h-10 rounded-[9px] flex-shrink-0 overflow-hidden flex items-center justify-center"
      style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${colors.borderSubtle}` }}
    >
      {item.image ? (
        <img src={item.image} alt="" className="w-full h-full object-cover" />
      ) : (
        <Package size={16} style={{ color: colors.textDim }} />
      )}
    </div>
  )
}

function FulfillmentButton({ icon: Icon, label, loadingLabel, onClick, disabled, loading }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-[11px] text-[12px] font-extrabold cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
      style={{
        color: colors.textBright,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${colors.border}`,
      }}
    >
      <Icon size={14} strokeWidth={2.2} />
      {loading ? loadingLabel : label}
    </button>
  )
}

function isOrderDelivered(order) {
  const status = order?.status
  const desc = String(order?.orderStatusDesc ?? order?.statusDisplayMeta?.label ?? '').toLowerCase()
  return status === 'delivered' || desc.includes('delivered')
}

function isOrderOutForDelivery(order) {
  const status = order?.status
  const desc = String(order?.orderStatusDesc ?? order?.statusDisplayMeta?.label ?? '').toLowerCase()
  return status === 'out' || desc.includes('out for deliver')
}

function isOrderPacked(order) {
  const status = order?.status
  const desc = String(order?.orderStatusDesc ?? order?.statusDisplayMeta?.label ?? '').toLowerCase()
  return status === 'ready' || desc.includes('pack')
}

export default function AdminOrderDetailPanel({
  orderId,
  onClose,
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
  printInvoice,
  actionState,
  onOrderUpdated,
}) {
  const [detailRaw, setDetailRaw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!orderId) return undefined

    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError('')

      try {
        const payload = await fetchAdminOrderById(orderId, { force: reloadKey > 0 })
        if (cancelled) return
        setDetailRaw(parseAdminOrderDetail(payload))
      } catch (err) {
        if (cancelled) return
        setDetailRaw(null)
        setError(err instanceof Error ? err.message : 'Could not load order details')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [orderId, reloadKey])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!orderId) return null

  const order = detailRaw ? mapOrder(detailRaw) : null
  const detailItems = detailRaw?.detailItems ?? []
  const rowBusy = Boolean(actionState)
  const isPending = order?.reviewStatus === 'pending'
  const isApproved = order?.reviewStatus === 'approved'
  const delivered = order ? isOrderDelivered(order) : false
  const outForDelivery = order ? isOrderOutForDelivery(order) : false
  const packed = order ? isOrderPacked(order) : false

  const runAction = async (action) => {
    if (!order) return
    await action(order)
    setReloadKey((prev) => prev + 1)
    await onOrderUpdated?.()
  }

  const viewPrescription = () => {
    const url = detailRaw?.prescriptionUrl
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    if (detailRaw?.prescriptionId) {
      window.open(`/api/prescriptions/${detailRaw.prescriptionId}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <PortalModal onClose={onClose} width={760} scrollable={false} maxHeight="90vh">
      <div className="flex flex-col max-h-[90vh]">
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}
        >
          <h2 className="text-[15px] font-extrabold text-white">Order Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/5"
            style={{ color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }}
            aria-label="Close order details"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto owner-scroll px-5 py-4 min-h-0">
        {loading ? (
          <div className="py-16 text-center text-[13px]" style={{ color: colors.textDim }}>
            Loading order details…
          </div>
        ) : error ? (
          <div
            className="rounded-[12px] px-4 py-3 text-[12px] font-bold text-red-400"
            style={{ background: 'rgba(255,138,128,0.08)', border: '1px solid rgba(255,138,128,0.24)' }}
          >
            {error}
          </div>
        ) : order ? (
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span className="text-[14px] font-extrabold text-white">{order.id}</span>
                <Pill meta={order.statusDisplayMeta} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] mb-1" style={{ color: colors.textDim }}>
                    Order Date
                  </p>
                  <p className="text-[12.5px] font-semibold text-white">{order.orderedOn}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] mb-1" style={{ color: colors.textDim }}>
                    Payment Method
                  </p>
                  <p className="text-[12.5px] font-semibold text-white">{order.payment}</p>
                </div>
              </div>
            </div>

            <section>
              <h3 className="text-[12px] font-extrabold uppercase tracking-[0.08em] mb-3" style={{ color: colors.textDim }}>
                Customer Details
              </h3>
              <div className="rounded-[14px] p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}>
                <p className="text-[13px] font-bold text-white">{order.customer}</p>
                <p className="text-[12px]" style={{ color: colors.textSecondary }}>{order.phone}</p>
                {detailRaw?.email ? (
                  <p className="text-[12px]" style={{ color: colors.textSecondary }}>{detailRaw.email}</p>
                ) : null}
                <p className="text-[12px] leading-relaxed pt-1" style={{ color: colors.textMuted }}>
                  {order.address || '—'}
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-[12px] font-extrabold uppercase tracking-[0.08em] mb-3" style={{ color: colors.textDim }}>
                Order Items
              </h3>
              <div className="rounded-[14px] overflow-hidden" style={{ border: `1px solid ${colors.borderSubtle}` }}>
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['Product', 'QTY', 'Unit Price', 'Total'].map((heading) => (
                        <th
                          key={heading}
                          className="text-left text-[10px] font-extrabold uppercase tracking-[0.08em] px-3 py-2.5"
                          style={{ color: colors.textDim, borderBottom: `1px solid ${colors.borderSubtle}` }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detailItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-[12px]" style={{ color: colors.textDim }}>
                          No items found
                        </td>
                      </tr>
                    ) : (
                      detailItems.map((item) => (
                        <tr key={item.id} style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <DetailLineThumbnail item={item} />
                              <div className="min-w-0">
                                <p className="text-[12px] font-bold text-white truncate">{item.name}</p>
                                {item.form ? (
                                  <p className="text-[10.5px] mt-0.5 capitalize" style={{ color: colors.textDim }}>
                                    {item.form}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-[12px] font-semibold text-white tabular-nums">{item.qty}</td>
                          <td className="px-3 py-3 text-[12px] font-semibold text-white tabular-nums whitespace-nowrap">
                            {fmtINR(item.price)}
                          </td>
                          <td className="px-3 py-3 text-[12px] font-extrabold text-white tabular-nums whitespace-nowrap">
                            {fmtINR(item.lineTotal)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[12.5px]" style={{ color: colors.textMuted }}>
                  <span>Subtotal</span>
                  <span className="tabular-nums">{fmtINR(detailRaw?.subtotal ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-[12.5px]" style={{ color: colors.textMuted }}>
                  <span>Delivery Fee</span>
                  <span className="tabular-nums" style={{ color: detailRaw?.deliveryFee === 0 ? colors.accent : colors.textMuted }}>
                    {detailRaw?.deliveryFee === 0 ? 'Free' : fmtINR(detailRaw?.deliveryFee ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12.5px]" style={{ color: colors.textMuted }}>
                  <span>Discount</span>
                  <span className="tabular-nums" style={{ color: colors.accent }}>
                    - {fmtINR(detailRaw?.discount ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 text-[16px] font-extrabold">
                  <span className="text-white">Grand Total</span>
                  <span className="tabular-nums" style={{ color: colors.accent }}>
                    {fmtINR(detailRaw?.grandTotal ?? order.total)}
                  </span>
                </div>
              </div>
            </section>

            {detailRaw?.hasPrescription ? (
              <section
                className="rounded-[14px] p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}
              >
                <p className="text-[12.5px] font-semibold mb-3" style={{ color: colors.textSecondary }}>
                  This order contains prescription based medicines.
                </p>
                <button
                  type="button"
                  onClick={viewPrescription}
                  disabled={!detailRaw?.prescriptionUrl && !detailRaw?.prescriptionId}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[12px] font-extrabold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    color: colors.accent,
                    background: 'rgba(64,222,170,0.08)',
                    border: '1px solid rgba(64,222,170,0.34)',
                  }}
                >
                  <Eye size={14} />
                  View Prescription
                </button>
              </section>
            ) : null}
          </div>
        ) : null}
        </div>

        {order && !loading && !error ? (
          <div
            className="flex-shrink-0 px-5 py-4 flex flex-col gap-2"
            style={{ borderTop: `1px solid ${colors.borderSubtle}`, background: 'rgba(5,15,12,0.55)' }}
          >
          {isPending ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={rowBusy}
                onClick={() => runAction(rejectOrder)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[12px] text-[13px] font-extrabold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  color: '#ff8a80',
                  background: 'rgba(255,138,128,0.08)',
                  border: '1px solid rgba(255,138,128,0.34)',
                }}
              >
                <X size={15} strokeWidth={2.5} />
                {actionState?.id === order.id && actionState.type === 'reject' ? 'Rejecting…' : 'Reject Order'}
              </button>
              <button
                type="button"
                disabled={rowBusy}
                onClick={() => runAction(acceptOrder)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[12px] text-[13px] font-extrabold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: colors.primaryBtn, color: colors.accentText }}
              >
                <Check size={15} strokeWidth={2.5} />
                {actionState?.id === order.id && actionState.type === 'accept' ? 'Accepting…' : 'Accept Order'}
              </button>
            </div>
          ) : null}

          {isApproved ? (
            <div className="flex flex-wrap gap-2">
              {!packed && !outForDelivery && !delivered ? (
                <FulfillmentButton
                  icon={Package}
                  label="Mark as Packed"
                  loadingLabel="Updating…"
                  disabled={rowBusy}
                  loading={actionState?.id === order.id && actionState.type === 'pack'}
                  onClick={() => runAction((o) => updateOrderStatus(o, 'ready'))}
                />
              ) : null}
              {packed && !outForDelivery && !delivered ? (
                <FulfillmentButton
                  icon={Truck}
                  label="Out for Delivery"
                  loadingLabel="Updating…"
                  disabled={rowBusy}
                  loading={actionState?.id === order.id && actionState.type === 'dispatch'}
                  onClick={() => runAction((o) => updateOrderStatus(o, 'out'))}
                />
              ) : null}
              {outForDelivery && !delivered ? (
                <FulfillmentButton
                  icon={CheckCircle2}
                  label="Mark Delivered"
                  loadingLabel="Updating…"
                  disabled={rowBusy}
                  loading={actionState?.id === order.id && actionState.type === 'deliver'}
                  onClick={() => runAction((o) => updateOrderStatus(o, 'delivered'))}
                />
              ) : null}
              <FulfillmentButton
                icon={Printer}
                label="Print Invoice"
                loadingLabel="Opening…"
                disabled={!delivered || rowBusy}
                loading={actionState?.id === order.id && actionState.type === 'print'}
                onClick={() => runAction(printInvoice)}
              />
            </div>
          ) : null}
          </div>
        ) : null}
      </div>
    </PortalModal>
  )
}
