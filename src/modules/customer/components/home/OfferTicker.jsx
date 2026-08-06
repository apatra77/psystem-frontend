import { TICKER_OFFERS } from '@/shared/mocks/customerHome'
import { colors } from '@/app/themes/colors'

/**
 * Continuous marquee of live offers.
 *
 * The list is rendered twice inside a `width:max-content` track so the -50%
 * keyframe lands exactly on the seam and the loop never visibly jumps.
 * Decorative for screen readers — the same offers are reachable in Offer Zone.
 */
export default function OfferTicker() {
  const marquee = [...TICKER_OFFERS, ...TICKER_OFFERS]

  return (
    <div className="overflow-hidden py-2" style={{ background: colors.bgBanner }} aria-hidden="true">
      <div className="ticker-track flex w-max gap-8 sm:gap-16">
        {marquee.map((offer, i) => (
          <span key={`${offer}-${i}`} className="flex items-center gap-8 sm:gap-16">
            <span
              className="whitespace-nowrap text-[11px] font-semibold leading-5 sm:text-[12px]"
              style={{ color: '#bfe9d8' }}
            >
              {offer}
            </span>
            <span className="ticker-sep inline-block text-[11px] font-extrabold leading-5" style={{ color: colors.accentSoft }}>
              ＋
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
