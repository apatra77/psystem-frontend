import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy, Tag } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import Button from '@/shared/ui/Button'
import Badge from '@/shared/ui/Badge'
import { PATHS } from '@/app/router/paths'
import { COUPONS, FREE_DELIVERY_ABOVE } from '@/shared/mocks/pricing'
import { useCartStore } from '@/app/store/cartStore'
import { toast } from '@/app/store/uiStore'
import { fmtINR } from '@/app/utils/format'
import { colors } from '@/app/themes/colors'

/**
 * Offers & coupons.
 *
 * Shares the single COUPONS source with the cart, so a code applied here is the
 * same one CartPage validates — no second list to keep in sync. Applying jumps
 * straight to the cart, where the discount is visible on the bill.
 */
export default function OffersPage() {
  const applyCoupon = useCartStore((s) => s.applyCoupon)
  const [copied, setCopied] = useState(null)

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('Could not copy the code — please note it down manually.')
    }
  }

  /* applyCoupon already raises its own success/failure toast — don't double up. */
  const apply = (code) => applyCoupon(code)

  return (
    <div>
      <PageHeader
        title="Offers & coupons"
        subtitle={`Free delivery on every order above ${fmtINR(FREE_DELIVERY_ABOVE)}`}
        actions={<Button as={Link} to={PATHS.customer.search} variant="secondary" size="sm">Start shopping</Button>}
      />

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {COUPONS.map((coupon) => (
          <li
            key={coupon.code}
            className="flex flex-col gap-3 rounded-[18px] p-5"
            style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                style={{ background: 'rgba(64,222,170,.12)', border: '1px solid rgba(64,222,170,.3)' }}
                aria-hidden="true"
              >
                <Tag size={17} style={{ color: colors.accent }} />
              </span>
              <Badge tone={coupon.type === 'percent' ? 'success' : 'purple'}>
                {coupon.type === 'percent' ? `${coupon.value}% off` : `${fmtINR(coupon.value)} off`}
              </Badge>
            </div>

            <div>
              <p className="text-[15px] font-extrabold tracking-wide" style={{ color: colors.textBright }}>
                {coupon.code}
              </p>
              <p className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>{coupon.label}</p>
            </div>

            <div className="mt-auto flex gap-2 pt-2">
              <Button size="sm" onClick={() => apply(coupon.code)}>Apply</Button>
              <Button
                size="sm"
                variant="secondary"
                icon={copied === coupon.code ? Check : Copy}
                onClick={() => copy(coupon.code)}
              >
                {copied === coupon.code ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
