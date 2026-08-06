import {
  AppTrustBand,
  CategoryAisles,
  HomeFooter,
  HomeHeader,
  HomeHero,
  OfferTicker,
  PrescriptionBand,
  ProductRail,
  ServiceCards,
} from '@/modules/customer/components/home'
import { RAILS } from '@/shared/mocks/customerHome'
import { colors } from '@/app/themes/colors'

/**
 * Landing page for a signed-in customer.
 *
 * Rendered by HomePage on "/" whenever `isAuthenticated` is true — there is no
 * separate route and no redirect after login. Section order follows the
 * approved design: ticker, header, hero, aisles, rails, Rx band, services,
 * app/trust band, footer.
 */
export default function CustomerLandingPage() {
  return (
    <div style={{ background: colors.pageBg, color: colors.text, overflowX: 'clip' }}>
      <OfferTicker />
      <HomeHeader />

      <main>
        <HomeHero />
        <CategoryAisles />

        {RAILS.map((rail) => (
          <ProductRail key={rail.id} rail={rail} />
        ))}

        <PrescriptionBand />
        <ServiceCards />
        <AppTrustBand />
      </main>

      <HomeFooter />
    </div>
  )
}
