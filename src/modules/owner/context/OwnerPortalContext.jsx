import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pageToPath } from '../routes'
import {
  INITIAL_ORDERS,
  INITIAL_OUTLETS,
  INITIAL_PROMOS,
  INITIAL_RIDERS,
  INITIAL_STAFF,
  INITIAL_STORE_PROFILES,
} from '../data/initialState'
import { mapOrder, stockMeta } from '../utils/helpers'
import { getStoredAuthUser, updateStoredUserProfile, skipProfileSetup as skipStoredProfileSetup } from '@/services/auth'
import {
  fetchCategories,
  fetchProducts,
  fetchProductsByCategory,
  fetchProductsSearch,
  deleteProductById,
} from '@/services/products'

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
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState(null)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState(null)
  const [catalogLoaded, setCatalogLoaded] = useState(false)
  const [staff] = useState(INITIAL_STAFF)
  const [riders] = useState(INITIAL_RIDERS)
  const [promos] = useState(INITIAL_PROMOS)
  const [storeProfiles, setStoreProfiles] = useState(INITIAL_STORE_PROFILES)
  const [authUser, setAuthUser] = useState(() => getStoredAuthUser())

  const updateAuthUser = useCallback((profile) => {
    const updated = updateStoredUserProfile(profile)
    if (updated) setAuthUser(updated)
    return updated
  }, [])

  const skipProfileSetup = useCallback(() => {
    const updated = skipStoredProfileSetup()
    if (updated) setAuthUser(updated)
    return updated
  }, [])

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
      genericName: draft.genericName || '',
      description: draft.description || '',
      cat: draft.cat || 'medicines',
      purchaseTax: draft.purchaseTax ?? '',
      salesTax: draft.salesTax ?? '',
      sku: draft.sku || `MQ-NEW-${Math.floor(Math.random() * 9000 + 1000)}`,
      price: Number(draft.price) || 0,
      mrp: Number(draft.mrp) || 0,
      discountPercent: Number(draft.discountPercent) || 0,
      discountPrice: Number(draft.discountPrice) || 0,
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

  const deleteProduct = useCallback(async (id) => {
    await deleteProductById(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const toggleProductStatus = useCallback((id) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p,
      ),
    )
  }, [])

  const loadProductCatalog = useCallback(async ({ force = false } = {}) => {
    if (!force && catalogLoaded) return

    setProductsLoading(true)
    setCategoriesLoading(true)
    setProductsError(null)
    setCategoriesError(null)

    let cats = []

    try {
      cats = await fetchCategories({ force })
      setCategories(cats)
    } catch (err) {
      setCategoriesError(err?.message ?? 'Failed to load categories')
      setCategories([])
    } finally {
      setCategoriesLoading(false)
    }

    try {
      const list = await fetchProducts(cats, { force })
      setProducts(list)
      setProductsError(null)
      setCatalogLoaded(true)
    } catch (err) {
      setProductsError(err?.message ?? 'Failed to load products')
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }, [catalogLoaded])

  const loadProductsByCategory = useCallback(
    async (categoryId = 'all', { force = false } = {}) => {
      setProductsLoading(true)
      setProductsError(null)

      let cats = categories
      if (cats.length === 0) {
        setCategoriesLoading(true)
        setCategoriesError(null)
        try {
          cats = await fetchCategories({ force })
          setCategories(cats)
        } catch (err) {
          setCategoriesError(err?.message ?? 'Failed to load categories')
          setCategories([])
        } finally {
          setCategoriesLoading(false)
        }
      }

      try {
        const list =
          categoryId === 'all'
            ? await fetchProducts(cats, { force })
            : await fetchProductsByCategory(categoryId, cats, { force })
        setProducts(list)
        setProductsError(null)
        setCatalogLoaded(true)
      } catch (err) {
        setProductsError(err?.message ?? 'Failed to load products')
        setProducts([])
      } finally {
        setProductsLoading(false)
      }
    },
    [categories],
  )

  const searchProducts = useCallback(
    async (query, { force = false } = {}) => {
      const trimmed = query.trim()
      if (!trimmed) {
        return loadProductsByCategory('all', { force })
      }

      setProductsLoading(true)
      setProductsError(null)

      let cats = categories
      if (cats.length === 0) {
        setCategoriesLoading(true)
        setCategoriesError(null)
        try {
          cats = await fetchCategories({ force })
          setCategories(cats)
        } catch (err) {
          setCategoriesError(err?.message ?? 'Failed to load categories')
          setCategories([])
        } finally {
          setCategoriesLoading(false)
        }
      }

      try {
        const list = await fetchProductsSearch(trimmed, cats)
        setProducts(list)
        setProductsError(null)
        setCatalogLoaded(true)
      } catch (err) {
        setProductsError(err?.message ?? 'Failed to search products')
        setProducts([])
      } finally {
        setProductsLoading(false)
      }
    },
    [categories, loadProductsByCategory],
  )

  const reloadProducts = useCallback(
    (categoryId = 'all', query = '') => {
      const trimmed = query.trim()
      if (trimmed) return searchProducts(trimmed, { force: true })
      return loadProductsByCategory(categoryId, { force: true })
    },
    [loadProductsByCategory, searchProducts],
  )

  const value = useMemo(() => {
    const outlet = INITIAL_OUTLETS.find((o) => o.id === activeOutlet)
    const storeProfile = storeProfiles[activeOutlet]
    const ordersMapped = orders.map(mapOrder)
    const incoming = ordersMapped.filter((o) => o.status === 'new')
    const lowStock = products.filter((p) => p.stock <= 20)

    const productCategories = categories.length > 0
      ? categories
      : (() => {
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
      anyMenuOpen: outletMenuOpen || notifOpen || profileMenuOpen,
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
      categories,
      categoriesLoading,
      categoriesError,
      loadProductCatalog,
      loadProductsByCategory,
      searchProducts,
      reloadProducts,
      productCategories,
      saveProduct,
      deleteProduct,
      toggleProductStatus,
      staff,
      riders,
      promos,
      authUser,
      updateAuthUser,
      skipProfileSetup,
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
    categories,
    categoriesLoading,
    categoriesError,
    loadProductCatalog,
    loadProductsByCategory,
    searchProducts,
    reloadProducts,
    catalogLoaded,
    staff,
    riders,
    promos,
    storeProfiles,
    saveProduct,
    deleteProduct,
    toggleProductStatus,
    authUser,
    updateAuthUser,
    skipProfileSetup,
  ])

  return <OwnerPortalContext.Provider value={value}>{children}</OwnerPortalContext.Provider>
}

export function useOwnerPortal() {
  const ctx = useContext(OwnerPortalContext)
  if (!ctx) throw new Error('useOwnerPortal must be used within OwnerPortalProvider')
  return ctx
}
