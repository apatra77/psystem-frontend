import AppShellShimmer from './pages/AppShellShimmer'
import ArticleShimmer from './pages/ArticleShimmer'
import CartShimmer from './pages/CartShimmer'
import CheckoutShimmer from './pages/CheckoutShimmer'
import DashboardShimmer from './pages/DashboardShimmer'
import FormShimmer from './pages/FormShimmer'
import HomeShimmer from './pages/HomeShimmer'
import ListShimmer from './pages/ListShimmer'
import OrderDetailShimmer from './pages/OrderDetailShimmer'
import OrdersShimmer from './pages/OrdersShimmer'
import ProductDetailShimmer from './pages/ProductDetailShimmer'
import ProductGridShimmer from './pages/ProductGridShimmer'
import ProfileShimmer from './pages/ProfileShimmer'
import TableShimmer from './pages/TableShimmer'
import WishlistShimmer from './pages/WishlistShimmer'

/**
 * Route key -> shimmer element.
 *
 * The router names a key per route (see `suspend()` in @/app/router/suspend)
 * and this table decides what the user stares at while that route's chunk
 * downloads. Adding a page means adding one line here, not touching Suspense.
 *
 * Shimmers are imported eagerly on purpose: a lazily loaded fallback would
 * need a fallback of its own. They are markup-only and cost a few hundred bytes.
 */
export const SHIMMERS = {
  /* ---- customer storefront ---- */
  home: <HomeShimmer />,
  productGrid: <ProductGridShimmer />,
  categories: <WishlistShimmer items={8} />,
  offers: <WishlistShimmer items={6} />,
  productDetail: <ProductDetailShimmer />,
  cart: <CartShimmer />,
  checkout: <CheckoutShimmer />,
  orders: <OrdersShimmer />,
  orderDetail: <OrderDetailShimmer />,
  orderSuccess: <OrderDetailShimmer />,
  profile: <ProfileShimmer />,
  wishlist: <WishlistShimmer />,
  addresses: <ListShimmer label="Loading addresses" />,
  paymentMethods: <ListShimmer rows={3} label="Loading payment methods" />,
  prescriptions: <ListShimmer label="Loading prescriptions" />,
  notifications: <ListShimmer rows={6} label="Loading notifications" />,
  support: <ListShimmer rows={5} label="Loading support" />,
  complaints: <ListShimmer rows={3} label="Loading complaints" />,
  chat: <ListShimmer rows={6} withIcon={false} label="Loading conversation" />,
  prescriptionUpload: <FormShimmer fields={3} wide label="Loading prescription upload" />,
  customOrder: <FormShimmer fields={5} wide label="Loading custom order" />,

  /* ---- auth ---- */
  auth: <FormShimmer fields={2} label="Loading sign in" />,

  /* ---- static / legal ---- */
  static: <ArticleShimmer />,
  contact: <FormShimmer fields={4} wide label="Loading contact" />,

  /* ---- back office ---- */
  dashboard: <DashboardShimmer />,
  table: <TableShimmer />,
  wideTable: <TableShimmer columns={6} />,
  productForm: <FormShimmer fields={6} wide label="Loading product form" />,
  settings: <FormShimmer fields={6} wide label="Loading settings" />,

  /* ---- fallback ---- */
  default: <AppShellShimmer />,
}

/** Never throws on an unknown key — an unmapped route degrades to the app shell. */
export const shimmerFor = (name) => SHIMMERS[name] ?? SHIMMERS.default

export default SHIMMERS
