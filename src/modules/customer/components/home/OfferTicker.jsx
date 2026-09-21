import {
  STORE_STATUS_BANNER_CLOSED,
  STORE_STATUS_BANNER_OPEN,
} from '@/shared/mocks/customerHome'
import { useCustomerStoreOpen } from '@/modules/customer/hooks/useCustomerStoreOpen'
import { colors } from '@/app/themes/colors'

const OPEN_STYLE = {
  background: colors.bgBanner,
  color: '#eaf5f0',
  borderBottom: '1px solid rgba(64, 222, 170, 0.22)',
}

const CLOSED_STYLE = {
  background: 'linear-gradient(180deg, #5c2222 0%, #3a1414 100%)',
  color: '#ffe8e8',
  borderBottom: '1px solid rgba(255, 120, 120, 0.4)',
}

function StatusDot({ closed }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{
        background: closed ? '#ff7070' : colors.accent,
        boxShadow: closed ? '0 0 6px rgba(255, 112, 112, 0.55)' : '0 0 6px rgba(64, 222, 170, 0.45)',
      }}
      aria-hidden="true"
    />
  )
}

/** Store availability line above the customer home header. */
export default function OfferTicker() {
  const isStoreOpen = useCustomerStoreOpen()
  const closed = !isStoreOpen
  const bannerStyle = closed ? CLOSED_STYLE : OPEN_STYLE
  const message = closed ? STORE_STATUS_BANNER_CLOSED : STORE_STATUS_BANNER_OPEN

  return (
    <div className="py-2.5 px-4 text-center" style={bannerStyle} role="status" aria-live="polite">
      <p className="text-[11px] font-semibold leading-5 sm:text-[12px] m-0 inline-flex flex-wrap items-center justify-center gap-2 max-w-[920px] mx-auto">
        <StatusDot closed={closed} />
        <span>{message}</span>
      </p>
    </div>
  )
}
