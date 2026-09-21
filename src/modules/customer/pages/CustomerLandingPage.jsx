import { useEffect, useMemo, useState } from 'react'
import {
  AppTrustBand,
  CategoryAisles,
  FloatingOrderCallbackBar,
  HomeFooter,
  HomeHeader,
  HomeHero,
  OfferTicker,
  ProductRail,
} from '@/modules/customer/components/home'
import { RAILS } from '@/shared/mocks/customerHome'
import { colors } from '@/app/themes/colors'
import { useCatalogStore } from '@/app/store/catalogStore'
import { useCartStore } from '@/app/store/cartStore'
import {
  fetchCategories,
  fetchCustomerProducts,
  mapProductToRailItem,
} from '@/services/products'

const DEALS_RAIL = RAILS.find((rail) => rail.id === 'deals') ?? RAILS[0]

/**
 * Landing page for a signed-in customer.
 * Deals rail loads live products from the product API on mount.
 */
export default function CustomerLandingPage() {
  const [dealsItems, setDealsItems] = useState(DEALS_RAIL.items)
  const [dealsLoading, setDealsLoading] = useState(true)
  const [callbackBarOpen, setCallbackBarOpen] = useState(true)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const [categories, catalogItems] = await Promise.all([
          fetchCategories().catch(() => []),
          fetchCustomerProducts().catch(() => []),
        ])
        if (cancelled) return

        if (categories.length > 0) {
          useCatalogStore.getState().setCategoriesFromApi(categories)
        }

        if (catalogItems.length > 0) {
          useCatalogStore.getState().mergeProducts(catalogItems)

          const railItems = catalogItems.slice(0, 5).map(mapProductToRailItem)
          setDealsItems(railItems)
        }
      } catch {
        /* Keep mock data on failure — rest of the page still works. */
      }

      if (!cancelled) {
        try {
          await useCartStore.getState().loadCart({ silent: true })
        } catch {
          /* Header badge falls back to empty/local cart on failure. */
        }
        setDealsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const rails = useMemo(
    () => [{ ...DEALS_RAIL, items: dealsItems }, ...RAILS.filter((rail) => rail.id !== 'deals')],
    [dealsItems],
  )

  return (
    <div
      className={`flex min-h-[100dvh] flex-col ${callbackBarOpen ? 'pb-[88px] sm:pb-[76px]' : ''}`}
      style={{ background: colors.pageBg, color: colors.text, overflowX: 'clip' }}
    >
      <OfferTicker />
      <HomeHeader />

      <main className="flex-1">
        <HomeHero />
        <CategoryAisles />

        {rails.map((rail) => (
          <ProductRail key={rail.id} rail={rail} loading={rail.id === 'deals' && dealsLoading} />
        ))}

        <AppTrustBand />
      </main>

      <HomeFooter />
      <FloatingOrderCallbackBar onDismiss={() => setCallbackBarOpen(false)} />
    </div>
  )
}
