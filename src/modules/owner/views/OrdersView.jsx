import { useMemo, useState } from 'react'
import { Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, MoreVertical, Package, Printer, Search, Truck, X } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import { useOwnerPortal } from '../context/OwnerPortalContext'
import { colors } from '@/theme/colors'

const PAGE_SIZE = 10

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'approved', label: 'Approved' },
  { id: 'pending', label: 'Pending' },
  { id: 'rejected', label: 'Rejected' },
]

const SORT_OPTIONS = [
  { id: 'newest', label: 'Date: Newest First' },
  { id: 'oldest', label: 'Date: Oldest First' },
]

const ORDER_MENU_OPTIONS = [
  { id: 'ready', label: 'Order Packed', status: 'ready', icon: Package },
  { id: 'out', label: 'Out for Deliver', status: 'out', icon: Truck },
  { id: 'delivered', label: 'Delivered', status: 'delivered', icon: CheckCircle2 },
  { id: 'print', label: 'Print Invoice', icon: Printer, dividerBefore: true },
]

function printOrderInvoice(order) {
  const lines = order.items.map((item) => `<tr><td>${item.n}</td><td>${item.q}</td><td>₹${item.p * item.q}</td></tr>`).join('')
  const html = `<!DOCTYPE html><html><head><title>Invoice ${order.id}</title></head><body style="font-family:sans-serif;padding:24px">
    <h2>Invoice ${order.id}</h2>
    <p><strong>${order.customer}</strong><br/>${order.phone}<br/>${order.address}</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:16px">
      <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
      <tbody>${lines}</tbody>
    </table>
    <p style="margin-top:16px;font-size:18px"><strong>Total: ${order.totalFmt}</strong></p>
  </body></html>`
  const popup = window.open('', '_blank', 'width=720,height=840')
  if (!popup) return
  popup.document.write(html)
  popup.document.close()
  popup.focus()
  popup.print()
}

function OrderActionsMenu({ order, onStatusChange }) {
  const [open, setOpen] = useState(false)

  const handleSelect = (option) => {
    setOpen(false)
    if (option.id === 'print') {
      printOrderInvoice(order)
      return
    }
    if (option.status) onStatusChange(order.id, option.status)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/5"
        style={{ color: colors.textMuted, border: `1px solid ${colors.borderSubtle}`, background: 'rgba(255,255,255,0.03)' }}
        aria-label="More actions"
        aria-expanded={open}
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-20 cursor-default" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[210px] rounded-[14px] py-1.5 shadow-2xl"
            style={{ background: 'rgba(12,28,23,0.98)', border: `1px solid ${colors.borderStrong}` }}
          >
            {ORDER_MENU_OPTIONS.map((option) => {
              const Icon = option.icon
              return (
                <div key={option.id}>
                  {option.dividerBefore && (
                    <div className="my-1.5 mx-2" style={{ borderTop: `1px solid ${colors.borderSubtle}` }} />
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelect(option)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-semibold cursor-pointer hover:bg-white/5"
                    style={{ color: colors.textBright }}
                  >
                    <Icon size={15} strokeWidth={1.9} style={{ color: colors.textMuted, flexShrink: 0 }} />
                    {option.label}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

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
  const { ordersMapped, acceptOrder, rejectOrder, updateOrderStatus } = useOwnerPortal()
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let list = ordersMapped

    if (statusFilter !== 'all') {
      list = list.filter((order) => order.reviewStatus === statusFilter)
    }

    const query = searchQuery.trim().toLowerCase()
    if (query) {
      list = list.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.customer.toLowerCase().includes(query) ||
          order.phone.toLowerCase().includes(query),
      )
    }

    list = [...list].sort((a, b) =>
      sortBy === 'newest' ? b.orderedAtMs - a.orderedAtMs : a.orderedAtMs - b.orderedAtMs,
    )

    return list
  }, [ordersMapped, searchQuery, sortBy, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, '…', totalPages]
    if (currentPage >= totalPages - 2) return [1, '…', totalPages - 2, totalPages - 1, totalPages]
    return [1, '…', currentPage, '…', totalPages]
  }, [currentPage, totalPages])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect
          label="Status"
          value={statusFilter}
          options={STATUS_FILTERS}
          minWidth={120}
          onChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
        />

        <FilterSelect
          label="Sort by"
          value={sortBy}
          options={SORT_OPTIONS}
          minWidth={200}
          onChange={setSortBy}
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
          <span style={{ color: colors.accent }}>{ordersMapped.length}</span>
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto owner-scroll">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Amount</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th>Ordered on</Th>
                <Th align="center" className="whitespace-nowrap w-[1%]">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((order) => (
                <tr key={order.id} style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
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
                    <Pill meta={order.reviewMeta} />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-[12px] font-semibold text-white whitespace-nowrap">{order.orderedOn}</div>
                  </td>
                  <td className="px-4 py-4 align-top whitespace-nowrap w-[1%]">
                    <div className="flex items-center justify-center gap-2">
                      {order.reviewStatus === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => acceptOrder(order.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[11.5px] font-extrabold cursor-pointer"
                            style={{ color: colors.accent, background: 'rgba(64,222,170,0.08)', border: '1px solid rgba(64,222,170,0.34)' }}
                          >
                            <Check size={13} strokeWidth={2.5} />
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => rejectOrder(order.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[11.5px] font-extrabold cursor-pointer"
                            style={{ color: '#ff8a80', background: 'rgba(255,138,128,0.08)', border: '1px solid rgba(255,138,128,0.34)' }}
                          >
                            <X size={13} strokeWidth={2.5} />
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="px-3 py-2 rounded-[10px] text-[11.5px] font-extrabold opacity-70 cursor-default"
                          style={{
                            color: order.reviewMeta.color,
                            background: order.reviewMeta.bg,
                            border: `1px solid ${order.reviewMeta.border}`,
                          }}
                        >
                          {order.reviewMeta.label}
                        </button>
                      )}
                      <OrderActionsMenu order={order} onStatusChange={updateOrderStatus} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pageItems.length === 0 && (
          <div className="px-4 py-12 text-center text-[13px]" style={{ color: colors.textDim }}>
            No orders match this filter.
          </div>
        )}

        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
          style={{ borderTop: `1px solid ${colors.borderSubtle}` }}
        >
          <div className="text-[12px]" style={{ color: colors.textSecondary }}>
            Showing {rangeStart} to {rangeEnd} of {filtered.length} orders
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
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
              disabled={currentPage === totalPages}
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
    </div>
  )
}
