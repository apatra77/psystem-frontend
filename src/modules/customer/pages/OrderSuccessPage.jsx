import { Link, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import Button from '@/shared/ui/Button'
import { PATHS, buildPath } from '@/app/router/paths'
import { useOrderStore } from '@/app/store/orderStore'
import { fmtINR } from '@/app/utils/format'
import { colors } from '@/app/themes/colors'

export default function OrderSuccessPage() {
  const { id } = useParams()
  const order = useOrderStore((s) => s.getOrder(id))

  return (
    <div className="max-w-[560px] mx-auto text-center py-10">
      <CheckCircle2 size={54} style={{ color: colors.accent }} className="mx-auto" />
      <h1 className="text-[26px] font-extrabold mt-5" style={{ color: colors.textBright }}>Order placed</h1>
      <p className="text-[14px] mt-2" style={{ color: colors.textMuted }}>
        Order <strong style={{ color: colors.textBright }}>{id}</strong> is being prepared by the store.
      </p>

      {order && (
        <div className="rounded-[18px] p-5 mt-7 text-left" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <ul className="space-y-2 text-[13px]" style={{ color: colors.textMuted }}>
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between"><span>{i.name} × {i.qty}</span><span>{fmtINR(i.price * i.qty)}</span></li>
            ))}
          </ul>
          <div className="flex justify-between mt-4 pt-3 text-[15px] font-extrabold" style={{ borderTop: `1px solid ${colors.borderSubtle}`, color: colors.textBright }}>
            <span>Paid</span><span>{fmtINR(order.total)}</span>
          </div>
          <p className="text-[12.5px] mt-3" style={{ color: colors.textDim }}>Delivering to {order.address}</p>
        </div>
      )}

      <div className="flex gap-3 justify-center mt-7">
        {/* <Button as={Link} to={buildPath(PATHS.customer.orderTracking, { id })} size="lg">Track order</Button> */}
        <Button as={Link} to={PATHS.customer.search} size="lg" variant="secondary">Keep shopping</Button>
      </div>
    </div>
  )
}
