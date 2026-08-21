import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from '@/app/store/uiStore'
import {
  acceptAdminOrder,
  buildAdminOrdersParams,
  deliverAdminOrder,
  dispatchAdminOrder,
  fetchAdminOrders,
  fetchAdminOrderInvoice,
  openOrderInvoiceDocument,
  parseAdminOrdersPage,
  rejectAdminOrder,
  startPackingAdminOrder,
} from '@/services/orders'
import { mapOrder } from '../utils/helpers'

const SEARCH_DEBOUNCE_MS = 350
export const ADMIN_ORDERS_PAGE_SIZE = 20

const FULFILLMENT_ACTIONS = {
  ready: { request: startPackingAdminOrder, type: 'pack' },
  out: { request: dispatchAdminOrder, type: 'dispatch' },
  delivered: { request: deliverAdminOrder, type: 'deliver' },
}

const FULFILLMENT_ERROR_MESSAGES = {
  ready: 'Failed to mark order as packed',
  out: 'Failed to dispatch order',
  delivered: 'Failed to mark order as delivered',
}

const ACTION_SUCCESS_MESSAGES = {
  accept: (orderId) => `Order ${orderId} accepted successfully`,
  reject: (orderId) => `Order ${orderId} rejected successfully`,
  pack: (orderId) => `Order ${orderId} marked as packed`,
  dispatch: (orderId) => `Order ${orderId} marked as out for delivery`,
  deliver: (orderId) => `Order ${orderId} marked as delivered`,
}

export function useAdminOrdersQuery({ statusFilter, paymentFilter, sortBy, searchQuery, page }) {
  const [orders, setOrders] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionState, setActionState] = useState(null)
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const skipInitialSearchDebounceRef = useRef(true)

  useEffect(() => {
    if (skipInitialSearchDebounceRef.current) {
      skipInitialSearchDebounceRef.current = false
      return
    }

    const timer = setTimeout(() => setDebouncedSearch(searchQuery), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const queryParams = useMemo(
    () =>
      buildAdminOrdersParams({
        statusFilter,
        paymentFilter,
        sortBy,
        search: debouncedSearch,
        page,
        pageSize: ADMIN_ORDERS_PAGE_SIZE,
      }),
    [debouncedSearch, page, paymentFilter, sortBy, statusFilter],
  )

  const applyOrdersResult = useCallback((result) => {
    setOrders(result.orders)
    setTotalElements(result.totalElements)
    setTotalPages(result.totalPages)
  }, [])

  const fetchOrdersList = useCallback(
    async (force = false) => {
      const payload = await fetchAdminOrders({ ...queryParams, force })
      return parseAdminOrdersPage(payload)
    },
    [queryParams],
  )

  const refetchOrders = useCallback(async () => {
    const result = await fetchOrdersList(true)
    applyOrdersResult(result)
  }, [applyOrdersResult, fetchOrdersList])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError('')

      try {
        const result = await fetchOrdersList()
        if (cancelled) return
        applyOrdersResult(result)
      } catch (err) {
        if (cancelled) return
        setOrders([])
        setTotalElements(0)
        setTotalPages(1)
        setError(err instanceof Error ? err.message : 'Could not load orders')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [applyOrdersResult, fetchOrdersList])

  const ordersMapped = useMemo(() => orders.map(mapOrder), [orders])

  const runOrderAction = useCallback(
    async (order, { type, request, errorMessage, successMessage }) => {
      const apiOrderId = order.apiOrderId ?? order.id
      setActionState({ id: order.id, type })

      try {
        await request(apiOrderId)
        await refetchOrders()
        toast.success(successMessage(order.id))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : errorMessage)
      } finally {
        setActionState(null)
      }
    },
    [refetchOrders],
  )

  const acceptOrder = useCallback(
    async (order) => {
      if (order.status !== 'new') return
      await runOrderAction(order, {
        type: 'accept',
        request: acceptAdminOrder,
        errorMessage: 'Failed to accept order',
        successMessage: ACTION_SUCCESS_MESSAGES.accept,
      })
    },
    [runOrderAction],
  )

  const rejectOrder = useCallback(
    async (order) => {
      if (order.status !== 'new') return
      await runOrderAction(order, {
        type: 'reject',
        request: rejectAdminOrder,
        errorMessage: 'Failed to reject order',
        successMessage: ACTION_SUCCESS_MESSAGES.reject,
      })
    },
    [runOrderAction],
  )

  const updateOrderStatus = useCallback(
    async (order, actionId) => {
      const action = FULFILLMENT_ACTIONS[actionId]
      if (!action) return

      await runOrderAction(order, {
        type: action.type,
        request: action.request,
        errorMessage: FULFILLMENT_ERROR_MESSAGES[actionId],
        successMessage: ACTION_SUCCESS_MESSAGES[action.type],
      })
    },
    [runOrderAction],
  )

  const printInvoice = useCallback(async (order) => {
    const apiOrderId = order.apiOrderId ?? order.id
    setActionState({ id: order.id, type: 'print' })

    try {
      const invoice = await fetchAdminOrderInvoice(apiOrderId)
      openOrderInvoiceDocument(invoice)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load invoice')
    } finally {
      setActionState(null)
    }
  }, [])

  return {
    ordersMapped,
    totalElements,
    totalPages,
    loading,
    error,
    actionState,
    acceptOrder,
    rejectOrder,
    updateOrderStatus,
    printInvoice,
  }
}
