import { Outlet } from 'react-router-dom'
import CustomerHeader from '@/modules/customer/components/CustomerHeader'
import CustomerFooter from '@/modules/customer/components/CustomerFooter'
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
  return (
    <div
      className="flex min-h-screen w-full flex-col overflow-x-clip"
      style={{
        fontFamily: "'Manrope', sans-serif",
        background: colors.pageBg,
        color: colors.text,
      }}
    >
      <CustomerHeader />

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-6 sm:px-5 sm:py-8">
        <Outlet />
      </main>

      <CustomerFooter />
    </div>
  )
}
