import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import OwnerRoute from './pages/OwnerRoute'
import DashboardView from './owner/views/DashboardView'
import OrdersView from './owner/views/OrdersView'
import ProductsLayout from './owner/views/products/ProductsLayout'
import ProductFormModal from './owner/views/products/ProductFormModal'
import MyProfileView from './owner/views/MyProfileView'
import {
  CategoriesView,
  DiscountsView,
  InventoryView,
  LogisticsView,
  StaffView,
  StoreView,
} from './owner/views/PortalViews'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/owner" element={<OwnerRoute />}>
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
    </BrowserRouter>
  )
}
