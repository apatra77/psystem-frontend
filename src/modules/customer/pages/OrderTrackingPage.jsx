import { Link, useParams } from 'react-router-dom'
import { Check, MessageSquare, Phone } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import Button from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import { useOrderStore } from '@/app/store/orderStore'
import { ORDER_STATUS, TRACKING_STEPS } from '@/shared/mocks/customer'
import { PATHS, buildPath } from '@/app/router/paths'
import { colors } from '@/app/themes/colors'

/** Lightweight map placeholder — swap the panel for Google Maps / Mapbox when keys are available. */
function RiderMap({ rider }) {
  return (
    <div className="relative rounded-[18px] overflow-hidden h-[300px]" style={{ background: 'linear-gradient(160deg,#0a2b21,#071410)', border: `1px solid ${colors.border}` }}>
      <svg className="absolute inset-0 w-full h-full opacity-40">
        <defs>
          <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M34 0H0v34" fill="none" stroke="rgba(255,255,255,0.08)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <path d="M60,250 C160,220 200,140 320,120 S520,80 600,60" fill="none" stroke={colors.accent} strokeWidth="3" strokeDasharray="7 7" />
      </svg>
      <span className="absolute left-[58px] bottom-[42px] w-3 h-3 rounded-full" style={{ background: colors.blue, boxShadow: `0 0 0 6px rgba(111,194,255,0.2)` }} />
      <span className="absolute right-[70px] top-[52px] w-3.5 h-3.5 rounded-full" style={{ background: colors.accent, boxShadow: `0 0 0 7px rgba(64,222,170,0.22)` }} />
      {rider && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 px-4 py-3 rounded-[14px]" style={{ background: 'rgba(6,18,14,0.9)', border: `1px solid ${colors.border}` }}>
          <span className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-extrabold" style={{ background: colors.primaryBtn, color: colors.accentText }}>
            {rider.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="flex-1">
            <p className="text-[13px] font-extrabold" style={{ color: colors.textBright }}>{rider.name}</p>
            <p className="text-[11.5px]" style={{ color: colors.textDim }}>{rider.vehicle} · arriving in {rider.eta}</p>
          </div>
          <Button size="sm" variant="secondary" icon={Phone} as="a" href={`tel:${rider.phone}`}>Call</Button>
        </div>
      )}
    </div>
  )
}

export default function OrderTrackingPage() {
  const { id } = useParams()
  const order = useOrderStore((s) => s.getOrder(id))

  if (!order) return <EmptyState title="Order not found" action={<Button as={Link} to={PATHS.customer.orders}>Back to orders</Button>} />

  const currentStep = ORDER_STATUS[order.status]?.step ?? 0

  return (
    <div>
      <PageHeader
        title={`Tracking ${order.id}`}
        subtitle={order.rider ? `${order.rider.name} is on the way` : 'The store is preparing your order'}
        actions={
          <div className="flex gap-2">
            <Button as={Link} to={buildPath(PATHS.customer.chat, { threadId: 'th2' })} size="sm" icon={MessageSquare}>Chat</Button>
            <Button as={Link} to={buildPath(PATHS.customer.orderDetail, { id: order.id })} size="sm" variant="secondary">Order details</Button>
          </div>
        }
      />

      <div className="grid gap-6" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,320px)' }}>
        <RiderMap rider={order.rider} />

        <aside className="rounded-[18px] p-5" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <p className="text-[14px] font-extrabold mb-5" style={{ color: colors.textBright }}>Progress</p>
          <ol className="space-y-4">
            {TRACKING_STEPS.map((key, index) => {
              const done = currentStep >= index
              return (
                <li key={key} className="flex items-start gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: done ? colors.primaryBtn : 'rgba(255,255,255,0.06)',
                      color: done ? colors.accentText : colors.textDim,
                      border: `1px solid ${done ? 'transparent' : colors.borderSubtle}`,
                    }}
                  >
                    {done ? <Check size={13} strokeWidth={3} /> : index + 1}
                  </span>
                  <span className="text-[13px] font-bold" style={{ color: done ? colors.textBright : colors.textDim }}>
                    {ORDER_STATUS[key].label}
                  </span>
                </li>
              )
            })}
          </ol>
        </aside>
      </div>
    </div>
  )
}
