import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import ProductsList from './ProductsList'
import { useOwnerPortal } from '../../context/OwnerPortalContext'

export default function ProductsLayout() {
  const { loadProductCatalog } = useOwnerPortal()

  useEffect(() => {
    loadProductCatalog()
  }, [loadProductCatalog])

  return (
    <>
      <ProductsList />
      <Outlet />
    </>
  )
}
