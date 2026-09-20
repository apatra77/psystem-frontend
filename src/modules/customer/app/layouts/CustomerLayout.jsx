import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import CustomerHeader from '@/modules/customer/components/CustomerHeader'
import CustomerFooter from '@/modules/customer/components/CustomerFooter'
import { useCartStore } from '@/app/store/cartStore'
import { colors } from '@/app/themes/colors'

/**
 * Chrome for every customer page except the landing route.
 *
 * The header and footer were previously not rendered, which left every inner
 * page (search, cart, orders, account…) with no navigation at all. They are
 * mounted here now, and "/" is routed *outside* this layout because the landing
 * pages ship their own header and footer.
 *
 * `overflow-x-clip`, not `overflow-x-hidden`: hidden makes this a scroll
 * container, which silently breaks `position: sticky` on the header.
 */
export default function CustomerLayout() {
  useEffect(() => {
    useCartStore.getState().loadCart({ silent: true })
  }, [])

  return (
    <div
      className="flex h-screen max-h-[100dvh] w-full flex-col overflow-hidden"
      style={{
        fontFamily: "'Manrope', sans-serif",
        background: colors.pageBg,
        color: colors.text,
      }}
    >
      <CustomerHeader />

      <main className="mx-auto w-full max-w-[1180px] flex-1 min-h-0 overflow-y-auto overflow-x-clip px-4 py-6 sm:px-5 sm:py-8">
        <Outlet />
      </main>

      <CustomerFooter />
    </div>
  )
}
