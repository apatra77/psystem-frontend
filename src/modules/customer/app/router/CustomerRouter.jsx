import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ROLES } from '@/app/config/roles'
import RoleGuard from './guards/RoleGuard'
import RouteFallback from '@/shared/components/feedback/RouteFallback'
import { suspend } from './suspend'
import CustomerLayout from '@/app/layouts/CustomerLayout'
import AccountLayout from '@/app/layouts/AccountLayout'
import CustomerProfileGate from './CustomerProfileGate'

const CustomerLandingPage = lazy(() => import('@/modules/customer/pages/CustomerLandingPage'))
const SearchPage = lazy(() => import('@/modules/customer/pages/SearchPage'))
const CategoriesPage = lazy(() => import('@/modules/customer/pages/CategoriesPage'))
const OffersPage = lazy(() => import('@/modules/customer/pages/OffersPage'))
const ContactPage = lazy(() => import('@/modules/customer/pages/ContactPage'))
const StaticContentPage = lazy(() => import('@/modules/customer/pages/StaticContentPage'))
const ProductDetailPage = lazy(() => import('@/modules/customer/pages/ProductDetailPage'))
const CartPage = lazy(() => import('@/modules/customer/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/modules/customer/pages/CheckoutPage'))
const OrderSuccessPage = lazy(() => import('@/modules/customer/pages/OrderSuccessPage'))
const OrdersPage = lazy(() => import('@/modules/customer/pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('@/modules/customer/pages/OrderDetailPage'))
const OrderTrackingPage = lazy(() => import('@/modules/customer/pages/OrderTrackingPage'))
const ProfilePage = lazy(() => import('@/modules/customer/pages/ProfilePage'))
const AddressesPage = lazy(() => import('@/modules/customer/pages/AddressesPage'))
const PaymentMethodsPage = lazy(() => import('@/modules/customer/pages/PaymentMethodsPage'))
const PrescriptionUploadPage = lazy(() => import('@/modules/customer/pages/PrescriptionUploadPage'))
const PrescriptionsPage = lazy(() => import('@/modules/customer/pages/PrescriptionsPage'))
const CustomOrderPage = lazy(() => import('@/modules/customer/pages/CustomOrderPage'))
const WishlistPage = lazy(() => import('@/modules/customer/pages/WishlistPage'))
const NotificationsPage = lazy(() => import('@/modules/customer/pages/NotificationsPage'))
const SupportPage = lazy(() => import('@/modules/customer/pages/SupportPage'))
const ChatPage = lazy(() => import('@/modules/customer/pages/ChatPage'))
const ComplaintsPage = lazy(() => import('@/modules/customer/pages/ComplaintsPage'))

/** Customer portal routes mounted under `/customer/*`. */
export default function CustomerRouter() {
  return (
    <CustomerProfileGate>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route index element={suspend(<CustomerLandingPage />, 'home')} />

          <Route element={<CustomerLayout />}>
            <Route path="search" element={suspend(<SearchPage />, 'productGrid')} />
            <Route path="categories" element={suspend(<CategoriesPage />, 'categories')} />
            <Route path="offers" element={suspend(<OffersPage />, 'offers')} />
            <Route path="category/:slug" element={suspend(<SearchPage />, 'productGrid')} />
            <Route path="product/:id" element={suspend(<ProductDetailPage />, 'productDetail')} />
            <Route path="cart" element={suspend(<CartPage />, 'cart')} />
            <Route path="prescription-upload" element={suspend(<PrescriptionUploadPage />, 'prescriptionUpload')} />
            <Route path="custom-order" element={suspend(<CustomOrderPage />, 'customOrder')} />
            <Route path="support" element={suspend(<SupportPage />, 'support')} />
            <Route path="about" element={suspend(<StaticContentPage slug="about" />, 'static')} />
            <Route path="contact" element={suspend(<ContactPage />, 'contact')} />
            <Route path="legal/:slug" element={suspend(<StaticContentPage />, 'static')} />

            <Route element={<RoleGuard allow={[ROLES.CUSTOMER]} />}>
              <Route path="checkout" element={suspend(<CheckoutPage />, 'checkout')} />
              <Route path="orders/:id/success" element={suspend(<OrderSuccessPage />, 'orderSuccess')} />
              <Route path="account/orders/:id/track" element={suspend(<OrderTrackingPage />, 'orderDetail')} />
              <Route path="support/complaints" element={suspend(<ComplaintsPage />, 'complaints')} />
              <Route path="support/chat/:threadId" element={suspend(<ChatPage />, 'chat')} />
              <Route element={<AccountLayout />}>
                <Route path="account/orders" element={suspend(<OrdersPage />, 'orders')} />
                <Route path="account/orders/:id" element={suspend(<OrderDetailPage />, 'orderDetail')} />
                <Route path="account/profile" element={suspend(<ProfilePage />, 'profile')} />
                <Route path="account/addresses" element={suspend(<AddressesPage />, 'addresses')} />
                <Route path="account/payment-methods" element={suspend(<PaymentMethodsPage />, 'paymentMethods')} />
                <Route path="account/prescriptions" element={suspend(<PrescriptionsPage />, 'prescriptions')} />
                <Route path="account/wishlist" element={suspend(<WishlistPage />, 'wishlist')} />
                <Route path="account/notifications" element={suspend(<NotificationsPage />, 'notifications')} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </CustomerProfileGate>
  )
}
