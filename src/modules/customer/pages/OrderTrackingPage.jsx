import { Link, useParams } from 'react-router-dom'
import { Check, Phone, Truck, X } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import { useOrderStore } from '@/app/store/orderStore'
import { ORDER_STATUS } from '@/shared/mocks/customer'
import { PATHS } from '@/app/router/paths'
import { titleCase } from '@/app/utils/format'
import {
  buildTrackingTimeline,
  fmtOrderDateTime,
  getDeliveryPartner,
  getExpectedDeliveryWindow,
  getOrderStatusLabel,
  getStatusTone,
  isOrderCancelled,
  isOrderRejected,
} from '@/modules/customer/utils/orderHelpers'
import { colors } from '@/app/themes/colors'

export default function OrderTrackingPage() {
  const { id } = useParams()
  const order = useOrderStore((s) => s.getOrder(id))

  if (!order) {
    return <EmptyState title="Order not found" action={<Button as={Link} to={PATHS.customer.orders}>Back to orders</Button>} />
  }

  const meta = ORDER_STATUS[order.status] ?? { label: titleCase(order.status), tone: 'info' }
  const statusLabel = getOrderStatusLabel(order, meta)
  const statusTone = isOrderRejected(order) || isOrderCancelled(order) ? 'danger' : getStatusTone(order.status)
  const timeline = buildTrackingTimeline(order)
  const partner = getDeliveryPartner(order)

  return (
    <div className="space-y-4 pb-8">
      <PageHeader title="Track Order" subtitle="" />

      <section
        className="rounded-[18px] p-5"
        style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-1" style={{ color: colors.textDim }}>
              Order ID
            </p>
            <p className="text-[14px] font-extrabold" style={{ color: colors.textBright }}>{order.id}</p>
          </div>
          <Badge tone={statusTone}>{statusLabel}</Badge>
        </div>
        <p className="text-[12.5px]" style={{ color: colors.textMuted }}>
          Expected Delivery: {getExpectedDeliveryWindow(order)}
        </p>
      </section>

      <section
        className="rounded-[18px] p-5"
        style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
      >
        <ol className="space-y-0">
          {timeline.map((step, index) => {
            const isLast = index === timeline.length - 1
            const showTruck = step.key === 'out_for_delivery' && step.done && !step.failed
            const stepColor = step.failed ? '#ff8a80' : colors.accent
            const stepBg = step.failed
              ? 'rgba(255,138,128,0.18)'
              : step.done
                ? colors.primaryBtn
                : 'rgba(255,255,255,0.06)'

            return (
              <li key={`${step.key}-${index}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: stepBg,
                      color: step.failed ? '#ff8a80' : step.done ? colors.accentText : colors.textDim,
                      border: `1px solid ${step.done ? (step.failed ? 'rgba(255,138,128,0.45)' : 'transparent') : colors.borderSubtle}`,
                    }}
                  >
                    {step.failed ? (
                      <X size={14} strokeWidth={2.8} />
                    ) : showTruck ? (
                      <Truck size={14} strokeWidth={2.2} />
                    ) : step.done ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      <span className="text-[11px] font-extrabold">{index + 1}</span>
                    )}
                  </span>
                  {!isLast && (
                    <span
                      className="w-[2px] flex-1 min-h-[48px] my-1"
                      style={{ background: step.done ? stepColor : 'rgba(255,255,255,0.1)' }}
                    />
                  )}
                </div>

                <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-6'}`}>
                  <p
                    className="text-[13px] font-extrabold"
                    style={{ color: step.done ? (step.failed ? '#ff8a80' : colors.textBright) : colors.textDim }}
                  >
                    {step.label}
                  </p>
                  {step.at && (
                    <p className="text-[11.5px] mt-0.5" style={{ color: colors.textDim }}>
                      {fmtOrderDateTime(step.at)}
                    </p>
                  )}
                  {step.description && (
                    <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: colors.textMuted }}>
                      {step.description}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {partner && (
        <section
          className="rounded-[18px] p-5"
          style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
        >
          <h2 className="text-[14px] font-extrabold mb-4" style={{ color: colors.textBright }}>Delivery Partner</h2>
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-extrabold flex-shrink-0"
              style={{ background: colors.primaryBtn, color: colors.accentText }}
            >
              {partner.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-extrabold" style={{ color: colors.textBright }}>{partner.company}</p>
              <p className="text-[12px] mt-0.5" style={{ color: colors.textMuted }}>{partner.name}</p>
              <p className="text-[12px] mt-0.5" style={{ color: colors.textDim }}>{partner.phone}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              icon={Phone}
              as="a"
              href={`tel:${partner.phone}`}
              className="flex-shrink-0"
            >
              Call
            </Button>
          </div>
        </section>
      )}

      <section
        className="rounded-[18px] p-5"
        style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
      >
        <h2 className="text-[14px] font-extrabold mb-3" style={{ color: colors.textBright }}>Delivery Address</h2>
        <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: colors.textMuted }}>
          {order.address || '—'}
        </p>
      </section>
    </div>
  )
}
