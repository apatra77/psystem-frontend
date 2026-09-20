import { STORE_STATUS_BANNER } from '@/shared/mocks/customerHome'
import { colors } from '@/app/themes/colors'

/** Store availability line above the customer home header. */
export default function OfferTicker() {
  return (
    <div
      className="py-2 px-4 text-center"
      style={{ background: colors.bgBanner }}
      role="status"
    >
      <p
        className="text-[11px] font-semibold leading-5 sm:text-[12px] m-0"
        style={{ color: '#bfe9d8' }}
      >
        {STORE_STATUS_BANNER}
      </p>
    </div>
  )
}
