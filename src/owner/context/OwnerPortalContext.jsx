import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pageToPath } from '../routes'
import {
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_OUTLETS,
  INITIAL_PROMOS,
  INITIAL_RIDERS,
  INITIAL_STAFF,
  INITIAL_STORE_PROFILES,
} from '../data/initialState'
import { mapOrder, stockMeta } from '../utils/helpers'
import { getStoredAuthUser } from '../../services/auth'
import { fetchProducts } from '../../services/products'

const OwnerPortalContext = createContext(null)

const STORE_STATUS = {
  open: { label: 'Store open', color: '#40deaa', bg: 'rgba(64,222,170,.12)', border: 'rgba(64,222,170,.35)' },
  busy: { label: 'Busy · slower prep', color: '#ffd58f', bg: 'rgba(255,181,71,.15)', border: 'rgba(255,181,71,.34)' },
  paused: { label: 'Orders paused', color: '#ff8a80', bg: 'rgba(255,138,128,0.14)', border: 'rgba(255,138,128,0.34)' },
}

export function OwnerPortalProvider({ children }) {
  const navigate = useNavigate()
  const [activeOutlet, setActiveOutlet] = useState('ind')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [outletMenuOpen, setOutletMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [orders, setOrders] = useState(INITIAL_ORDERS)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState(null)
  const [categories] = useState(INITIAL_CATEGORIES)
  const [staff] = useState(INITIAL_STAFF)
  const [riders] = useState(INITIAL_RIDERS)
  const [promos] = useState(INITIAL_PROMOS)
  const [storeProfiles, setStoreProfiles] = useState(INITIAL_STORE_PROFILES)
  const [authUser] = useState(() => getStoredAuthUser())

  const closeMenus = () => {
    setOutletMenuOpen(false)
    setNotifOpen(false)
    setProfileMenuOpen(false)
  }

  const goToPage = useCallback(
    (next) => {
      navigate(pageToPath(next))
      setOutletMenuOpen(false)
      setNotifOpen(false)
      setProfileMenuOpen(false)
    },
    [navigate],
  )

  const selectOutlet = (id) => {
    setActiveOutlet(id)
    setOutletMenuOpen(false)
  }

  const cycleStoreStatus = () => {
    const order = ['open', 'busy', 'paused']
    setStoreProfiles((prev) => {
      const cur = prev[activeOutlet].status
      const next = order[(order.indexOf(cur) + 1) % order.length]
      return { ...prev, [activeOutlet]: { ...prev[activeOutlet], status: next } }
    })
  }

  const saveProduct = useCallback((draft) => {
    const rec = {
      id: draft.id || `p${Date.now()}`,
      name: draft.name || 'Untitled product',
      cat: draft.cat || 'medicines',
      sku: draft.sku || `MQ-NEW-${Math.floor(Math.random() * 9000 + 1000)}`,
      price: Number(draft.price) || 0,
      mrp: Number(draft.mrp) || 0,
      stock: Number(draft.stock) || 0,
      stockUnit: draft.stockUnit || 'units',
      rx: !!draft.rx,
      status: draft.status || 'active',
    }
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === rec.id)
      return exists ? prev.map((p) => (p.id === rec.id ? rec : p)) : [rec, ...prev]
    })
  }, [])

  const deleteProduct = useCallback((id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const toggleProductStatus = useCallback((id) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p,
      ),
    )
  }, [])

  const loadProducts = useCallback(async ({ force = false } = {}) => {
    setProductsLoading(true)
    setProductsError(null)
    try {
      const list = await fetchProducts(categories, { force })
      setProducts(list)
    } catch (err) {
      setProductsError(err?.message ?? 'Failed to load products')
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }, [categories])

  useEffect(() => {
    loadProducts()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- load once on portal mount

  const value = useMemo(() => {
    const outlet = INITIAL_OUTLETS.find((o) => o.id === activeOutlet)
    const storeProfile = storeProfiles[activeOutlet]
    const ordersMapped = orders.map(mapOrder)
    const incoming = ordersMapped.filter((o) => o.status === 'new')
    const lowStock = products.filter((p) => p.stock <= 20)

    const productCategories = (() => {
      const map = new Map()
      products.forEach((p) => {
        if (p.cat) map.set(p.cat, p.catName || p.cat)
      })
      return Array.from(map, ([id, name]) => ({ id, name }))
    })()

    return {
      goToPage,
      activeOutlet,
      activeOutletName: outlet?.name ?? 'Indiranagar',
      outlets: INITIAL_OUTLETS,
      selectOutlet,
      sidebarCollapsed,
      setSidebarCollapsed,
      outletMenuOpen,
      setOutletMenuOpen,
      notifOpen,
      setNotifOpen,
      profileMenuOpen,
      setProfileMenuOpen,
      closeMenus,
      anyMenuOpen: outletMenuOpen || notifOpen,
      storeProfile,
      storeStatusMeta: STORE_STATUS[storeProfile.status],
      cycleStoreStatus,
      incomingCount: incoming.length,
      incomingPreview: incoming.slice(0, 3),
      lowStockCount: lowStock.length,
      stockAlertsPreview: lowStock.slice(0, 4).map((p) => ({
        ...p,
        stockMeta: stockMeta(p.stock),
      })),
      ordersMapped,
      products,
      productsLoading,
      productsError,
      reloadProducts: () => loadProducts({ force: true }),
      productCategories,
      categories,
      saveProduct,
      deleteProduct,
      toggleProductStatus,
      staff,
      riders,
      promos,
      authUser,
    }
  }, [
    goToPage,
    activeOutlet,
    sidebarCollapsed,
    outletMenuOpen,
    notifOpen,
    profileMenuOpen,
    orders,
    products,
    productsLoading,
    productsError,
    loadProducts,
    categories,
    staff,
    riders,
    promos,
    storeProfiles,
    saveProduct,
    deleteProduct,
    toggleProductStatus,
  ])

  return <OwnerPortalContext.Provider value={value}>{children}</OwnerPortalContext.Provider>
}

export function useOwnerPortal() {
  const ctx = useContext(OwnerPortalContext)
  if (!ctx) throw new Error('useOwnerPortal must be used within OwnerPortalProvider')
  return ctx
}
