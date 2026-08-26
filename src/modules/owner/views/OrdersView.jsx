import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import AdminOrderDetailPanel from './orders/AdminOrderDetailPanel'
import { useAdminOrdersQuery, ADMIN_ORDERS_PAGE_SIZE } from '../hooks/useAdminOrdersQuery'
import { colors } from '@/theme/colors'

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'packed', label: 'Order Packed' },
  { id: 'out', label: 'Out For Delivery' },
  { id: 'delivered', label: 'Delivered' },
]

const SORT_OPTIONS = [
  { id: 'newest', label: 'Date: Newest First' },
  { id: 'oldest', label: 'Date: Oldest First' },
]

const PAYMENT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'cod', label: 'COD' },
  { id: 'online', label: 'Online' },
]

function Pill({ meta }) {
  return (
    <span
      className="inline-flex items-center text-[10.5px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
    >
      {meta.label}
    </span>
  )
}

function FilterSelect({ label, value, options, onChange, minWidth = 170 }) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.id === value)

  return (
    <div className="relative flex-shrink-0" style={{ minWidth }}>
      {label && (
        <div className="text-[11px] font-bold mb-1.5" style={{ color: colors.textDim }}>
          {label}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 w-full px-3.5 py-2.5 rounded-[11px] text-[12.5px] font-bold cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}`, color: colors.textBright }}
      >
        <span className="flex-1 text-left">{selected?.label}</span>
        <ChevronDown size={14} style={{ color: colors.textDim }} />
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-20 cursor-default" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-full rounded-[12px] p-1.5 shadow-2xl"
            style={{ background: 'rgba(10,28,22,0.98)', border: `1px solid ${colors.borderStrong}` }}
          >
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id)
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-left text-[12.5px] font-semibold cursor-pointer hover:bg-white/5"
                style={{ color: option.id === value ? colors.accent : colors.textHighlight }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Th({ children, align = 'left', className = '' }) {
  return (
    <th
      className={`${align === 'center' ? 'text-center' : 'text-left'} text-[10.5px] font-extrabold tracking-[0.1em] uppercase px-4 py-3.5 ${className}`}
      style={{ color: colors.textDim, borderBottom: `1px solid ${colors.borderSubtle}` }}
    >
      {children}
    </th>
  )
}

export default function OrdersView() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const {
    ordersMapped,
    totalElements,
    totalPages,
    loading,
    error,
    actionState,
    refetchOrders,
    acceptOrder,
    rejectOrder,
    updateOrderStatus,
    printInvoice,
  } = useAdminOrdersQuery({ statusFilter, paymentFilter, sortBy, searchQuery, page })

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(1, totalPages))
  }, [page, totalPages])

  const currentPage = Math.min(page, totalPages)
  const pageItems = ordersMapped
  const rangeStart = totalElements === 0 ? 0 : (currentPage - 1) * ADMIN_ORDERS_PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * ADMIN_ORDERS_PAGE_SIZE, totalElements)

  const pageNumbers = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, '…', totalPages]
    if (currentPage >= totalPages - 2) return [1, '…', totalPages - 2, totalPages - 1, totalPages]
    return [1, '…', currentPage, '…', totalPages]
  })()

  const openOrderDetail = (order) => {
    setSelectedOrderId(order.apiOrderId ?? order.id)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect
          label="Status"
          value={statusFilter}
          options={STATUS_FILTERS}
          minWidth={168}
          onChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
        />

        <FilterSelect
          label="Payment"
          value={paymentFilter}
          options={PAYMENT_FILTERS}
          minWidth={140}
          onChange={(value) => {
            setPaymentFilter(value)
            setPage(1)
          }}
        />

        <FilterSelect
          label="Sort by"
          value={sortBy}
          options={SORT_OPTIONS}
          minWidth={200}
          onChange={(value) => {
            setSortBy(value)
            setPage(1)
          }}
        />

        <div className="flex-1 min-w-[240px]">
          <div
            className="flex items-center gap-2.5 rounded-[11px] px-3.5 py-2.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}` }}
          >
            <input
              type="text"
              placeholder="Search by Order ID, Customer name or Phone"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="flex-1 bg-transparent border-none outline-none text-white text-[12.5px] font-[inherit] placeholder:text-[#6b9a88]"
            />
            <Search size={15} style={{ color: colors.textBright, flexShrink: 0 }} />
          </div>
        </div>

        <div className="ml-auto flex-shrink-0 text-[13px] font-semibold pb-2.5" style={{ color: colors.textBright }}>
          Total Orders:{' '}
          <span style={{ color: colors.accent }}>{totalElements}</span>
        </div>
      </div>

      {error && (
        <div
          className="rounded-[12px] px-4 py-3 text-[12px] font-bold text-red-400"
          style={{ background: 'rgba(255,138,128,0.08)', border: '1px solid rgba(255,138,128,0.24)' }}
        >
          {error}
        </div>
      )}

      <GlassCard className="overflow-hidden w-full">
          <div className="overflow-x-auto owner-scroll">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Amount</Th>
                  <Th>Payment</Th>
                  <Th>Status</Th>
                  <Th>Ordered on</Th>
                  <Th align="center" className="whitespace-nowrap w-[1%]">Action</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[13px]" style={{ color: colors.textDim }}>
                      Loading orders…
                    </td>
                  </tr>
                ) : (
                  pageItems.map((order) => {
                    const isSelected =
                      selectedOrderId === order.id || selectedOrderId === order.apiOrderId

                    return (
                      <tr
                        key={order.id}
                        style={{
                          borderBottom: `1px solid ${colors.borderSubtle}`,
                          background: isSelected ? 'rgba(64,222,170,0.06)' : undefined,
                        }}
                      >
                        <td className="px-4 py-4 align-top">
                          <div className="text-[13px] font-extrabold text-white">{order.id}</div>
                          <div className="text-[11px] mt-1" style={{ color: colors.textDim }}>
                            {order.itemsCount} item{order.itemsCount === 1 ? '' : 's'}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="text-[13px] font-bold text-white">{order.customer}</div>
                          <div className="text-[11.5px] mt-1" style={{ color: colors.textSecondary }}>{order.phone}</div>
                          <div className="text-[11px] mt-1 max-w-[220px] truncate" style={{ color: colors.textDim }}>
                            {order.address}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="text-[13px] font-extrabold text-white tabular-nums">{order.totalFmt}</div>
                          <div className="text-[11px] mt-1" style={{ color: colors.textDim }}>{order.payment}</div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <Pill meta={order.paymentMeta} />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <Pill meta={order.statusDisplayMeta} />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="text-[12px] font-semibold text-white whitespace-nowrap">{order.orderedOn}</div>
                        </td>
                        <td className="px-4 py-4 align-top whitespace-nowrap w-[1%]">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => openOrderDetail(order)}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-[10px] text-[11.5px] font-extrabold cursor-pointer"
                              style={{
                                color: colors.accent,
                                background: isSelected ? 'rgba(64,222,170,0.14)' : 'rgba(64,222,170,0.08)',
                                border: '1px solid rgba(64,222,170,0.34)',
                              }}
                            >
                              View
                              <ChevronRight size={13} strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && pageItems.length === 0 && (
            <div className="px-4 py-12 text-center text-[13px]" style={{ color: colors.textDim }}>
              No orders match this filter.
            </div>
          )}

          <div
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
            style={{ borderTop: `1px solid ${colors.borderSubtle}` }}
          >
            <div className="text-[12px]" style={{ color: colors.textSecondary }}>
              Showing {rangeStart} to {rangeEnd} of {totalElements} orders
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={loading || currentPage === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }}
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>

              {pageNumbers.map((item, index) =>
                item === '…' ? (
                  <span key={`ellipsis-${index}`} className="px-1 text-[12px]" style={{ color: colors.textDim }}>
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className="min-w-8 h-8 px-2 rounded-[9px] text-[12px] font-extrabold cursor-pointer"
                    style={
                      item === currentPage
                        ? { background: colors.primaryBtn, color: colors.accentText }
                        : { color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }
                    }
                  >
                    {item}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={loading || currentPage === totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }}
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </GlassCard>

      {selectedOrderId ? (
        <AdminOrderDetailPanel
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          acceptOrder={acceptOrder}
          rejectOrder={rejectOrder}
          updateOrderStatus={updateOrderStatus}
          printInvoice={printInvoice}
          actionState={actionState}
          onOrderUpdated={refetchOrders}
        />
      ) : null}
    </div>
  )
}
