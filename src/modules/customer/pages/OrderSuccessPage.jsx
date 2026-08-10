import { Link, useParams } from 'react-router-dom'
import {
  Banknote,
  CheckCircle2,
  Info,
  MapPin,
  Package,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react'
import Button from '@/shared/ui/Button'
import { PATHS, buildPath } from '@/app/router/paths'
import { useOrderStore } from '@/app/store/orderStore'
import { fmtDate, fmtINR } from '@/app/utils/format'
import { colors } from '@/app/themes/colors'

const COD = {
  border: 'rgba(240, 160, 48, 0.55)',
  accent: '#f0a030',
  bg: 'rgba(240, 160, 48, 0.08)',
}

const SUCCESS_STEPS = [
  { label: 'Order Confirmed', hint: 'Your order has been placed', icon: ShoppingBag },
  { label: 'Being Prepared', hint: 'The store is preparing your order', icon: Store },
  { label: 'Out for Delivery', hint: 'Your order is on the way', icon: Truck },
  { label: 'Delivered', hint: 'Your order will be delivered soon', icon: CheckCircle2 },
]

function resolveTotals(order) {
  if (order?.totals) return order.totals

  const subtotal = (order?.items ?? []).reduce((sum, item) => sum + item.price * item.qty, 0)
  const total = order?.total ?? subtotal

  return {
    subtotal,
    delivery: Math.max(0, total - subtotal),
    total,
  }
}

function getEstimatedDelivery(scheduledFor) {
  if (scheduledFor) {
    const date = new Date(scheduledFor)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(date)
    target.setHours(0, 0, 0, 0)
    const diffDays = Math.round((target - today) / 86400000)

    let dayLabel = fmtDate(scheduledFor, { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })
    if (diffDays === 0) dayLabel = 'Today'
    if (diffDays === 1) dayLabel = 'Tomorrow'

    return {
      dayLabel,
      date: fmtDate(scheduledFor, { day: '2-digit', month: 'short', year: 'numeric' }),
      window: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  return {
    dayLabel: 'Tomorrow',
    date: fmtDate(tomorrow.toISOString(), { day: '2-digit', month: 'short', year: 'numeric' }),
    window: '10:00 AM - 2:00 PM',
  }
}

function ProductThumb({ item }) {
  if (item.image) {
    return (
      <img
        src={item.image}
        alt=""
        className="w-11 h-11 rounded-[10px] object-cover flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      />
    )
  }

  return (
    <span
      className="w-11 h-11 rounded-[10px] flex items-center justify-center text-[15px] font-extrabold flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.05)', color: colors.accent }}
    >
      {item.name.charAt(0).toUpperCase()}
    </span>
  )
}

function OrderSummaryCard({ order }) {
  const totals = resolveTotals(order)

  return (
    <section
      className="rounded-[18px] p-5 text-left"
      style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
    >
      <ul className="space-y-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <ProductThumb item={item} />
            <span className="flex-1 text-[13.5px] font-semibold truncate" style={{ color: colors.textBright }}>
              {item.name} × {item.qty}
            </span>
            <span className="text-[13.5px] font-bold" style={{ color: colors.textBright }}>
              {fmtINR(item.price * item.qty)}
            </span>
          </li>
        ))}
      </ul>

      <div className="my-4" style={{ borderTop: `1px solid ${colors.borderSubtle}` }} />

      <dl className="space-y-2 text-[13px]" style={{ color: colors.textMuted }}>
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{fmtINR(totals.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Delivery Fee</dt>
          <dd>{totals.delivery === 0 ? 'Free' : fmtINR(totals.delivery)}</dd>
        </div>
      </dl>

      <div
        className="flex justify-between items-center mt-4 pt-4 text-[15px] font-extrabold"
        style={{ borderTop: `1px solid ${colors.borderSubtle}` }}
      >
        <span style={{ color: colors.textBright }}>Total Amount</span>
        <span className="text-[22px]" style={{ color: colors.accent }}>
          {fmtINR(totals.total)}
        </span>
      </div>
    </section>
  )
}

function CodPaymentCard({ amount }) {
  return (
    <section
      className="rounded-[18px] p-5 text-left"
      style={{ background: COD.bg, border: `1px solid ${COD.border}` }}
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
        <div className="flex items-start gap-3">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(240, 160, 48, 0.18)', color: COD.accent }}
          >
            <Banknote size={18} strokeWidth={2} />
          </span>
          <div>
            <p className="text-[11.5px] uppercase tracking-wide font-bold" style={{ color: colors.textDim }}>
              Payment Method
            </p>
            <p className="text-[15px] font-extrabold mt-0.5" style={{ color: colors.textBright }}>
              Cash on Delivery
            </p>
            <p className="text-[12.5px] mt-1" style={{ color: colors.textMuted }}>
              Pay when your order is delivered
            </p>
          </div>
        </div>

        <div className="hidden sm:block w-px self-stretch" style={{ background: colors.borderSubtle }} />

        <div className="sm:text-right">
          <p className="text-[11.5px] uppercase tracking-wide font-bold" style={{ color: colors.textDim }}>
            Amount to Pay
          </p>
          <p className="text-[28px] font-extrabold leading-none mt-1" style={{ color: COD.accent }}>
            {fmtINR(amount)}
          </p>
        </div>
      </div>

      <div
        className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full text-[11.5px] font-semibold"
        style={{ background: 'rgba(240, 160, 48, 0.12)', border: `1px solid ${COD.border}`, color: COD.accent }}
      >
        <Info size={13} strokeWidth={2.5} />
        Pay in cash when your order is delivered
      </div>
    </section>
  )
}

function DeliveryInfoCard({ order, addressDetails }) {
  const eta = getEstimatedDelivery(order.scheduledFor)
  const name = addressDetails?.name ?? order.address.split('·')[0]?.trim() ?? 'Delivery address'
  const cityLine = addressDetails
    ? [addressDetails.city, addressDetails.state, addressDetails.pincode].filter(Boolean).join(', ')
    : order.address.split('·')[1]?.trim() ?? order.address

  return (
    <section
      className="rounded-[18px] p-5 text-left"
      style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
    >
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} style={{ color: colors.accent }} />
            <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: colors.textDim }}>
              Delivering to
            </p>
          </div>
          <p className="text-[14px] font-extrabold" style={{ color: colors.textBright }}>
            {name}
          </p>
          <p className="text-[13px] mt-1 leading-relaxed" style={{ color: colors.textMuted }}>
            {cityLine}
          </p>
          <p className="text-[13px]" style={{ color: colors.textMuted }}>
            India
          </p>
          <Link
            to={PATHS.customer.addresses}
            className="inline-block mt-3 text-[12.5px] font-bold"
            style={{ color: colors.accent }}
          >
            Change Address
          </Link>
        </div>

        <div className="sm:border-l sm:pl-6" style={{ borderColor: colors.borderSubtle }}>
          <div className="flex items-center gap-2 mb-3">
            <Truck size={16} style={{ color: colors.accent }} />
            <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: colors.textDim }}>
              Estimated Delivery
            </p>
          </div>
          <p className="text-[14px] font-extrabold" style={{ color: colors.textBright }}>
            {eta.dayLabel}, {eta.date}
          </p>
          <p className="text-[13px] mt-1" style={{ color: colors.textMuted }}>
            {eta.window}
          </p>
          <Link
            to={buildPath(PATHS.customer.orderTracking, { id: order.id })}
            className="inline-block mt-3 text-[12.5px] font-bold"
            style={{ color: colors.accent }}
          >
            View Delivery Details
          </Link>
        </div>
      </div>
    </section>
  )
}

function OrderProgressStepper() {
  const activeThrough = 1

  return (
    <section
      className="rounded-[18px] px-4 py-5 sm:px-6"
      style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
    >
      <ol className="grid grid-cols-2 gap-y-6 gap-x-3 sm:grid-cols-4 sm:gap-0">
        {SUCCESS_STEPS.map((step, index) => {
          const active = index <= activeThrough
          const Icon = step.icon

          return (
            <li key={step.label} className="relative flex flex-col items-center text-center px-1">
              {index < SUCCESS_STEPS.length - 1 && (
                <span
                  className="hidden sm:block absolute top-5 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-px border-t border-dashed"
                  style={{ borderColor: index < activeThrough ? colors.accent : colors.borderSubtle }}
                />
              )}
              <span
                className="relative z-[1] w-10 h-10 rounded-full flex items-center justify-center mb-2"
                style={{
                  background: active ? 'rgba(64,222,170,0.14)' : 'rgba(255,255,255,0.04)',
                  color: active ? colors.accent : colors.textDim,
                  border: `1px solid ${active ? 'rgba(64,222,170,0.35)' : colors.borderSubtle}`,
                }}
              >
                <Icon size={17} strokeWidth={2} />
              </span>
              <p className="text-[12px] font-extrabold leading-tight" style={{ color: active ? colors.textBright : colors.textDim }}>
                {step.label}
              </p>
              <p className="text-[10.5px] mt-1 leading-snug max-w-[120px]" style={{ color: colors.textDim }}>
                {step.hint}
              </p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default function OrderSuccessPage() {
  const { id } = useParams()
  const order = useOrderStore((s) => s.getOrder(id))
  const totals = order ? resolveTotals(order) : null
  const isCod = order?.paymentMethod === 'cod'

  return (
    <div className="max-w-[720px] mx-auto py-8 sm:py-10">
      <div className="text-center mb-8">
        <CheckCircle2 size={54} style={{ color: colors.accent }} className="mx-auto" strokeWidth={1.75} />
        <h1 className="text-[28px] font-extrabold mt-5" style={{ color: colors.textBright }}>
          Order placed
        </h1>
        <p className="text-[14px] mt-2 max-w-[520px] mx-auto" style={{ color: colors.textMuted }}>
          Order <strong style={{ color: colors.textBright }}>{id}</strong> is being prepared by the store.
        </p>
      </div>

      {order && (
        <div className="space-y-4">
          <OrderSummaryCard order={order} />
          {isCod && <CodPaymentCard amount={totals.total} />}
          <DeliveryInfoCard order={order} addressDetails={order.addressDetails} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
        <Button as={Link} to={buildPath(PATHS.customer.orderTracking, { id })} size="lg" icon={Package}>
          Track Order
        </Button>
        <Button as={Link} to={PATHS.customer.search} size="lg" variant="secondary" icon={ShoppingBag}>
          Continue Shopping
        </Button>
      </div>

      <div className="mt-8">
        <OrderProgressStepper />
      </div>
    </div>
  )
}
