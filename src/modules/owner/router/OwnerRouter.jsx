import { Navigate, Route, Routes } from 'react-router-dom'
import { getStoredAuthUser } from '@/services/auth'
import { isJwtExpired } from '@/shared/api/jwt'
import useAuthStore from '@/app/store/authStore'
import OwnerPortalPage from '../pages/OwnerPortalPage'
import DashboardView from '../views/DashboardView'
import OrdersView from '../views/OrdersView'
import CategoriesView from '../views/CategoriesView'
import ProductsLayout from '../views/products/ProductsLayout'
import ProductFormModal from '../views/products/ProductFormModal'
import MyProfileView from '../views/MyProfileView'
import {
  DiscountsView,
  InventoryView,
  LogisticsView,
  StaffView,
  StoreView,
} from '../views/PortalViews'

/** Owner portal routes mounted under `/owner/*`. */
export default function OwnerRouter() {
  const user = getStoredAuthUser()
  if (!user?.token || isJwtExpired(user.token)) {
    if (user?.token) useAuthStore.getState().expireSession()
    return <Navigate to="/" replace />
  }

  return (
    <Routes>
      <Route element={<OwnerPortalPage />}>
        <Route index element={<DashboardView />} />
        <Route path="orders" element={<OrdersView />} />
        <Route path="logistics" element={<LogisticsView />} />
        <Route path="products" element={<ProductsLayout />}>
          <Route path="add" element={<ProductFormModal />} />
          <Route path=":id" element={<ProductFormModal />} />
        </Route>
        <Route path="categories" element={<CategoriesView />} />
        <Route path="inventory" element={<InventoryView />} />
        <Route path="discounts" element={<DiscountsView />} />
        <Route path="staff" element={<StaffView />} />
        <Route path="store" element={<StoreView />} />
        <Route path="profile" element={<MyProfileView />} />
        <Route path="*" element={<Navigate to="/owner" replace />} />
      </Route>
    </Routes>
  )
}
