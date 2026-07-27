import { Outlet } from 'react-router-dom'
import ProductsList from './ProductsList'

export default function ProductsLayout() {
  return (
    <>
      <ProductsList />
      <Outlet />
    </>
  )
}
