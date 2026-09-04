import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pageToPath } from '../routes'
import {
  INITIAL_ORDERS,
  INITIAL_PROMOS,
  INITIAL_RIDERS,
  INITIAL_STAFF,
  INITIAL_STORE_PROFILES,
} from '../data/initialState'
import { mapOrder, stockMeta } from '../utils/helpers'
import { getStoredAuthUser, updateStoredUserProfile, skipProfileSetup as skipStoredProfileSetup } from '@/services/auth'
import {
  fetchCategories,
  deleteProductById,
} from '@/services/products'
import {
  fetchAdminOrders,
  mapUiSortToApi,
  parseAdminOrdersPage,
} from '@/services/orders'
import { fetchUserProfile, updateAdminStoreStatus } from '@/services/user'
import { toast } from '@/app/store/uiStore'

const OwnerPortalContext = createContext(null)

const DEFAULT_STORE_PROFILE = INITIAL_STORE_PROFILES.ind

function mapAddressToOutlet(address, storeProfiles) {
  const status = storeProfiles[address.id]?.status ?? 'open'
  return {
    id: address.id,
    label: address.label,
    lines: address.lines,
    pincode: address.pincode,
    isDefault: address.isDefault,
    status,
    name: address.label,
    address: address.lines,
  }
}

function createStoreProfileFromAddress(address) {
  return {
    ...DEFAULT_STORE_PROFILE,
    name: address.label,
    address: address.lines,
    status: 'open',
  }
}

const STORE_STATUS = {
  open: { label: 'Store open', color: '#40deaa', bg: 'rgba(64,222,170,.12)', border: 'rgba(64,222,170,.35)' },
  paused: { label: 'Store close', color: '#ff8a80', bg: 'rgba(255,138,128,0.14)', border: 'rgba(255,138,128,0.34)' },
}

function resolveStoreStatusKey(status) {
  return status === 'paused' ? 'paused' : 'open'
}

function applyGlobalStoreStatus(profiles, isStoreOpen) {
  const status = isStoreOpen ? 'open' : 'paused'
  const next = { ...profiles }
  Object.keys(next).forEach((key) => {
    next[key] = { ...next[key], status }
  })
  return next
}

export function OwnerPortalProvider({ children }) {
  const navigate = useNavigate()
  const [activeOutlet, setActiveOutlet] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [outletMenuOpen, setOutletMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileAddresses, setProfileAddresses] = useState([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [orders, setOrders] = useState(INITIAL_ORDERS)
  const [incomingOrders, setIncomingOrders] = useState([])
  const [incomingOrdersCount, setIncomingOrdersCount] = useState(0)
  const [totalOrdersCount, setTotalOrdersCount] = useState(0)
  const [incomingOrdersLoading, setIncomingOrdersLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState(null)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState(null)
  const [catalogLoaded, setCatalogLoaded] = useState(false)
  const [productsRefreshKey, setProductsRefreshKey] = useState(0)
  const [staff] = useState(INITIAL_STAFF)
  const [riders] = useState(INITIAL_RIDERS)
  const [promos] = useState(INITIAL_PROMOS)
  const [storeProfiles, setStoreProfiles] = useState(INITIAL_STORE_PROFILES)
  const [storeStatusUpdating, setStoreStatusUpdating] = useState(false)
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

  const loadOutletAddresses = useCallback(async ({ force = false } = {}) => {
    setAddressesLoading(true)
    try {
      const profile = await fetchUserProfile({ force })
      setProfileAddresses(Array.isArray(profile?.addresses) ? profile.addresses : [])
      if (profile?.isStoreOpen !== undefined) {
        setStoreProfiles((prev) => applyGlobalStoreStatus(prev, profile.isStoreOpen))
      }
    } catch {
      setProfileAddresses([])
    } finally {
      setAddressesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOutletAddresses()
  }, [loadOutletAddresses])

  const loadIncomingOrders = useCallback(async ({ force = false } = {}) => {
    setIncomingOrdersLoading(true)
    try {
      const [allPayload, initiatedPayload] = await Promise.all([
        fetchAdminOrders({
          sort: mapUiSortToApi('newest'),
          size: 1,
          page: 0,
          force,
        }),
        fetchAdminOrders({
          status: 'I',
          sort: mapUiSortToApi('newest'),
          size: 50,
          page: 0,
          force,
        }),
      ])
      const allResult = parseAdminOrdersPage(allPayload)
      const initiatedResult = parseAdminOrdersPage(initiatedPayload)
      setTotalOrdersCount(Number(allResult.totalElements) || 0)
      setIncomingOrders(Array.isArray(initiatedResult.orders) ? initiatedResult.orders : [])
      setIncomingOrdersCount(Number(initiatedResult.totalElements) || 0)
    } catch {
      setTotalOrdersCount(0)
      setIncomingOrders([])
      setIncomingOrdersCount(0)
    } finally {
      setIncomingOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIncomingOrders()
  }, [loadIncomingOrders])

  useEffect(() => {
    if (profileAddresses.length === 0) return

    setActiveOutlet((current) => {
      if (current && profileAddresses.some((address) => address.id === current)) return current
      const defaultAddress = profileAddresses.find((address) => address.isDefault) ?? profileAddresses[0]
      return defaultAddress?.id ?? current
    })

    setStoreProfiles((prev) => {
      const next = { ...prev }
      profileAddresses.forEach((address) => {
        if (!next[address.id]) {
          const inheritedStatus = Object.values(next)[0]?.status ?? 'open'
          next[address.id] = { ...createStoreProfileFromAddress(address), status: inheritedStatus }
          return
        }
        next[address.id] = {
          ...next[address.id],
          name: address.label,
          address: address.lines,
        }
      })
      return next
    })
  }, [profileAddresses])

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

  const cycleStoreStatus = useCallback(async () => {
    if (storeStatusUpdating) return

    const currentProfile = storeProfiles[activeOutlet] ?? DEFAULT_STORE_PROFILE
    const isCurrentlyOpen = resolveStoreStatusKey(currentProfile.status) === 'open'
    const nextOpen = !isCurrentlyOpen
    const previousProfiles = storeProfiles

    setStoreProfiles(applyGlobalStoreStatus(storeProfiles, nextOpen))
    setStoreStatusUpdating(true)

    try {
      await updateAdminStoreStatus(nextOpen)
    } catch (err) {
      setStoreProfiles(previousProfiles)
      toast.error(err?.message ?? 'Failed to update store status')
    } finally {
      setStoreStatusUpdating(false)
    }
  }, [activeOutlet, storeProfiles, storeStatusUpdating])

  const acceptOrder = useCallback((id) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id && order.status === 'new' ? { ...order, status: 'preparing' } : order)),
    )
  }, [])

  const rejectOrder = useCallback((id) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id && order.status === 'new' ? { ...order, status: 'rejected' } : order)),
    )
  }, [])

  const updateOrderStatus = useCallback((id, status) => {
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)))
  }, [])

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

  const loadCategories = useCallback(async ({ force = false } = {}) => {
    if (!force && catalogLoaded && categories.length > 0) return categories

    setCategoriesLoading(true)
    setCategoriesError(null)

    try {
      const cats = await fetchCategories({ force })
      setCategories(cats)
      setCategoriesError(null)
      setCatalogLoaded(true)
      return cats
    } catch (err) {
      setCategoriesError(err?.message ?? 'Failed to load categories')
      setCategories([])
      return []
    } finally {
      setCategoriesLoading(false)
    }
  }, [catalogLoaded, categories.length])

  const addCategory = useCallback((category) => {
    if (!category?.id) return

    setCategories((prev) => {
      const exists = prev.some(
        (item) =>
          item.id === category.id ||
          item.name.toLowerCase() === String(category.name ?? '').toLowerCase(),
      )
      if (exists) return prev
      return [...prev, { ...category, status: category.status ?? 'active' }]
    })
    setCategoriesError(null)
    setCatalogLoaded(true)
  }, [])

  const updateCategoryInList = useCallback((category) => {
    if (!category?.id) return

    setCategories((prev) =>
      prev.map((item) => (item.id === category.id ? { ...item, ...category } : item)),
    )
    setCategoriesError(null)
  }, [])

  const removeCategoryFromList = useCallback((categoryId) => {
    setCategories((prev) => prev.filter((item) => item.id !== categoryId))
    setCategoriesError(null)
  }, [])

  const loadProductCatalog = loadCategories

  const reloadProducts = useCallback(() => {
    setProductsRefreshKey((key) => key + 1)
  }, [])

  const value = useMemo(() => {
    const outlets = profileAddresses.map((address) => mapAddressToOutlet(address, storeProfiles))
    const activeAddress = profileAddresses.find((address) => address.id === activeOutlet) ?? profileAddresses[0] ?? null
    const activeOutletMeta = outlets.find((outlet) => outlet.id === activeOutlet) ?? outlets[0] ?? null
    const storeProfile =
      storeProfiles[activeOutlet] ??
      (activeAddress ? createStoreProfileFromAddress(activeAddress) : DEFAULT_STORE_PROFILE)
    const ordersMapped = orders.map(mapOrder)
    const incomingFromApi = incomingOrders
      .map(mapOrder)
      .filter((order) => order.status === 'new')
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
      activeOutletName: activeAddress?.label ?? activeOutletMeta?.label ?? 'Select address',
      activeOutletLines: activeAddress?.lines ?? activeOutletMeta?.lines ?? '',
      outlets,
      addressesLoading,
      reloadOutletAddresses: loadOutletAddresses,
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
      storeStatusMeta: STORE_STATUS[resolveStoreStatusKey(storeProfile.status)],
      storeStatusUpdating,
      cycleStoreStatus,
      incomingCount: incomingOrdersLoading ? 0 : incomingOrdersCount,
      totalOrdersCount: incomingOrdersLoading ? 0 : totalOrdersCount,
      incomingPreview: incomingFromApi,
      incomingOrdersLoading,
      reloadIncomingOrders: loadIncomingOrders,
      lowStockCount: lowStock.length,
      stockAlertsPreview: lowStock.slice(0, 4).map((p) => ({
        ...p,
        stockMeta: stockMeta(p.stock),
      })),
      ordersMapped,
      acceptOrder,
      rejectOrder,
      updateOrderStatus,
      products,
      productsLoading,
      productsError,
      categories,
      categoriesLoading,
      categoriesError,
      loadProductCatalog,
      loadCategories,
      addCategory,
      updateCategoryInList,
      removeCategoryFromList,
      reloadProducts,
      productsRefreshKey,
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
    profileAddresses,
    addressesLoading,
    loadOutletAddresses,
    orders,
    incomingOrders,
    incomingOrdersCount,
    totalOrdersCount,
    incomingOrdersLoading,
    loadIncomingOrders,
    acceptOrder,
    rejectOrder,
    updateOrderStatus,
    products,
    productsLoading,
    productsError,
    categories,
    categoriesLoading,
    categoriesError,
    loadProductCatalog,
    loadCategories,
    addCategory,
    updateCategoryInList,
    removeCategoryFromList,
    reloadProducts,
    productsRefreshKey,
    catalogLoaded,
    staff,
    riders,
    promos,
    storeProfiles,
    storeStatusUpdating,
    cycleStoreStatus,
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
