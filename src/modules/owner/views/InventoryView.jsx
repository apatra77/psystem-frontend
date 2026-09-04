import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  IndianRupee,
  Package,
  PackageCheck,
  PackageX,
  Pencil,
  Search,
} from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Spinner from '@/components/ui/Spinner'
import { toast } from '@/app/store/uiStore'
import { useOwnerPortal } from '../context/OwnerPortalContext'
import { useInventoryQuery } from '../hooks/useInventoryQuery'
import { pageToPath } from '../routes'
import { stockMeta } from '../utils/helpers'
import {
  downloadInventoryExport,
  mapUiStatusFilterToInventoryApi,
} from '@/services/inventory'
import { fmtDate, fmtDecimalINR } from '@/modules/customer/app/utils/format'
import { colors } from '@/theme/colors'

const INVENTORY_PATH = pageToPath('inventory')
const LOW_STOCK_THRESHOLD = 20

function openProductEditor(navigate, productId) {
  navigate(`/owner/products/${productId}`, { state: { returnTo: INVENTORY_PATH } })
}

const STATUS_FILTERS = [
  { id: 'all', label: 'All Status' },
  { id: 'in', label: 'In Stock' },
  { id: 'low', label: 'Low Stock' },
  { id: 'out', label: 'Out of Stock' },
]

function formatInventoryLastUpdated(value) {
  if (!value) return '—'
  return fmtDate(value, { day: '2-digit', month: 'short', year: 'numeric' })
}

function inferProductForm(name = '') {
  const normalized = String(name).toLowerCase()
  if (/\btab(let)?s?\b/.test(normalized)) return 'Tablet'
  if (/\bsyrup\b|\bsuspension\b/.test(normalized)) return 'Syrup'
  if (/\bcaps(ule)?s?\b/.test(normalized)) return 'Capsule'
  if (/\binj(ection)?\b/.test(normalized)) return 'Injection'
  if (/\bcream\b|\bointment\b|\bgel\b/.test(normalized)) return 'Topical'
  if (/\bdrops\b/.test(normalized)) return 'Drops'
  return '—'
}

function stockCountColor(stock, threshold = LOW_STOCK_THRESHOLD) {
  if (stock <= 0) return '#ff8a80'
  if (stock <= threshold) return colors.gold
  return colors.accent
}

function inventoryStatusMeta(status, stock) {
  switch (String(status ?? '').toUpperCase()) {
    case 'LOW_STOCK':
      return stockMeta(10)
    case 'OUT_OF_STOCK':
      return stockMeta(0)
    case 'IN_STOCK':
      return stockMeta(999)
    default:
      return stockMeta(stock)
  }
}

function FilterSelect({ value, options, onChange, minWidth = 170 }) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.id === value)

  return (
    <div className="relative flex-shrink-0" style={{ minWidth }}>
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

function MetricCard({ label, value, hint, icon: Icon, tone = 'default' }) {
  const toneStyles = {
    default: { bg: 'rgba(64,222,170,0.16)', border: 'rgba(64,222,170,0.34)', color: colors.accent, valueColor: '#fff' },
    mint: { bg: 'rgba(64,222,170,0.16)', border: 'rgba(64,222,170,0.34)', color: colors.accent, valueColor: colors.accent },
    gold: { bg: 'rgba(255,181,71,0.16)', border: 'rgba(255,181,71,0.34)', color: colors.gold, valueColor: colors.gold },
    red: { bg: 'rgba(255,138,128,0.14)', border: 'rgba(255,138,128,0.34)', color: '#ff8a80', valueColor: '#ff8a80' },
    purple: { bg: 'rgba(178,135,255,0.15)', border: 'rgba(178,135,255,0.34)', color: colors.purpleLight, valueColor: '#fff' },
    blue: { bg: 'rgba(96,165,250,0.14)', border: 'rgba(96,165,250,0.34)', color: colors.blue, valueColor: '#fff' },
  }
  const meta = toneStyles[tone] ?? toneStyles.default

  return (
    <GlassCard className="px-4 py-4 flex flex-col min-h-[118px]">
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
        style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
      >
        <Icon size={16} style={{ color: meta.color }} />
      </div>
      <div className="text-[10px] font-bold tracking-[0.1em] uppercase mt-3" style={{ color: colors.textDim }}>
        {label}
      </div>
      <div className="text-[22px] font-extrabold tracking-tight mt-1.5 tabular-nums" style={{ color: meta.valueColor }}>
        {value}
      </div>
      {hint && (
        <div className="text-[11px] font-semibold mt-1" style={{ color: colors.textDim }}>
          {hint}
        </div>
      )}
    </GlassCard>
  )
}

function ProductThumb({ imageUrl, name, compact = false }) {
  const sizeClass = compact ? 'w-[34px] h-[34px] rounded-[8px]' : 'w-[42px] h-[42px] rounded-[10px]'

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClass} flex-shrink-0 object-cover`}
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-center leading-tight px-0.5`}
      style={{
        border: '1.5px dashed rgba(255,255,255,0.2)',
        color: colors.textDim,
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      No image
    </div>
  )
}

function StatusPill({ status, stock, compact = false }) {
  const meta = inventoryStatusMeta(status, stock)
  return (
    <span
      className={`inline-flex items-center font-extrabold rounded-full whitespace-nowrap ${
        compact ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1'
      }`}
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
    >
      {meta.label}
    </span>
  )
}

function Th({ children, className = '', align = 'left' }) {
  return (
    <th
      className={`${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      } text-[10px] font-extrabold tracking-[0.08em] uppercase px-2.5 py-3 ${className}`}
      style={{ color: colors.textDim, borderBottom: `1px solid ${colors.borderSubtle}` }}
    >
      {children}
    </th>
  )
}

function Td({ children, className = '', align = 'left' }) {
  return (
    <td
      className={`px-2.5 py-2 align-middle ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      } ${className}`}
    >
      {children}
    </td>
  )
}

export default function InventoryView() {
  const navigate = useNavigate()
  const { productsRefreshKey, categories, loadCategories } = useOwnerPortal()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const categoryOptions = useMemo(
    () => [
      { id: 'all', label: 'All Categories' },
      ...categories.map((category) => ({ id: category.id, label: category.name })),
    ],
    [categories],
  )

  const {
    summary,
    items,
    totalElements,
    totalPages,
    page,
    setPage,
    currentPage,
    rangeStart,
    rangeEnd,
    pageNumbers,
    loading,
    error,
  } = useInventoryQuery({
    statusFilter,
    categoryFilter: catFilter,
    searchQuery: search,
    refreshKey: productsRefreshKey,
  })

  const lowStockThreshold = summary?.lowStockThreshold ?? LOW_STOCK_THRESHOLD

  const metrics = useMemo(
    () => ({
      totalProducts: summary?.totalProducts ?? 0,
      inStock: summary?.inStock ?? 0,
      lowStock: summary?.lowStock ?? 0,
      outOfStock: summary?.outOfStock ?? 0,
      totalStockValue: summary?.totalStockValue,
    }),
    [summary],
  )

  const handleExport = async () => {
    setExporting(true)
    try {
      await downloadInventoryExport({
        search: search.trim(),
        status: mapUiStatusFilterToInventoryApi(statusFilter),
        categoryId: catFilter === 'all' ? '' : String(catFilter),
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export inventory')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <MetricCard
          label="Total Products"
          value={metrics.totalProducts.toLocaleString('en-IN')}
          hint="All products"
          icon={Package}
        />
        <MetricCard
          label="In Stock"
          value={metrics.inStock.toLocaleString('en-IN')}
          hint="Products available"
          icon={PackageCheck}
          tone="mint"
        />
        <MetricCard
          label="Low Stock"
          value={metrics.lowStock.toLocaleString('en-IN')}
          hint="Products running low"
          icon={AlertTriangle}
          tone="gold"
        />
        <MetricCard
          label="Out of Stock"
          value={metrics.outOfStock.toLocaleString('en-IN')}
          hint="Currently unavailable"
          icon={PackageX}
          tone="red"
        />
        <MetricCard
          label="Total Stock Value"
          value={metrics.totalStockValue != null ? fmtDecimalINR(metrics.totalStockValue) : '—'}
          hint="At MRP"
          icon={IndianRupee}
          tone="purple"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div
          className="flex-1 min-w-[240px] flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}
        >
          <Search size={14} style={{ color: '#68d9b4', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by product name, SKU or barcode…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-white text-[12.5px] font-[inherit] placeholder:text-[#6b9a88]"
          />
        </div>

        <FilterSelect
          value={catFilter}
          options={categoryOptions}
          onChange={setCatFilter}
          minWidth={180}
        />

        <FilterSelect
          value={statusFilter}
          options={STATUS_FILTERS}
          onChange={setStatusFilter}
          minWidth={150}
        />

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 ml-auto px-4 py-2.5 rounded-[11px] text-[12.5px] font-extrabold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: colors.accentText,
            background: colors.primaryBtn,
            boxShadow: '0 8px 22px rgba(64,222,170,0.28)',
          }}
        >
          {exporting ? <Spinner /> : <Download size={14} />}
          Export
        </button>
      </div>

      {error && (
        <div
          className="rounded-[12px] px-4 py-3 text-[12px] font-bold text-red-400"
          style={{ background: 'rgba(255,138,128,0.08)', border: '1px solid rgba(255,138,128,0.24)' }}
        >
          {error}
        </div>
      )}

      <GlassCard className="overflow-hidden">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col style={{ width: '31%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '56px' }} />
          </colgroup>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>SKU</Th>
              <Th>Category</Th>
              <Th align="center">Stock</Th>
              <Th>MRP</Th>
              <Th>Updated</Th>
              <Th>Status</Th>
              <Th align="center" className="px-1">Action</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-2.5 py-16 text-center">
                  <div className="inline-flex items-center gap-2 text-[13px]" style={{ color: colors.textDim }}>
                    <Spinner />
                    Loading inventory…
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-2.5 py-14 text-center text-[13px]" style={{ color: colors.textDim }}>
                  No products found.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const form = inferProductForm(item.name)
                const rowLastUpdated = formatInventoryLastUpdated(item.lastUpdatedAt)

                return (
                  <tr key={item.id} className="border-b border-white/6 hover:bg-white/3">
                    <Td className="max-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <ProductThumb imageUrl={item.imageUrl} name={item.name} compact />
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => openProductEditor(navigate, item.id)}
                            className="text-[12px] font-bold text-white text-left hover:text-[#40deaa] cursor-pointer truncate block w-full"
                            title={item.name}
                          >
                            {item.name}
                          </button>
                          <div className="text-[10px] mt-0.5 truncate" style={{ color: colors.textDim }} title={form}>
                            {form}
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td className="max-w-0">
                      <span
                        className="block text-[11px] font-semibold truncate"
                        style={{ color: '#cfe6dc' }}
                        title={item.sku || '—'}
                      >
                        {item.sku || '—'}
                      </span>
                    </Td>
                    <Td className="max-w-0">
                      <span
                        className="block text-[11px] truncate"
                        style={{ color: '#cfe6dc' }}
                        title={item.categoryName || '—'}
                      >
                        {item.categoryName || '—'}
                      </span>
                    </Td>
                    <Td align="center">
                      <span
                        className="text-[12px] font-bold tabular-nums"
                        style={{ color: stockCountColor(item.stock, lowStockThreshold) }}
                      >
                        {item.stock}
                      </span>
                    </Td>
                    <Td className="max-w-0">
                      <span className="block text-[11.5px] font-bold text-white tabular-nums truncate">
                        {item.mrp != null || item.price != null ? fmtDecimalINR(item.mrp ?? item.price) : '—'}
                      </span>
                    </Td>
                    <Td className="max-w-0">
                      <span
                        className="block text-[11px] truncate"
                        style={{ color: colors.textSecondary }}
                        title={rowLastUpdated}
                      >
                        {rowLastUpdated}
                      </span>
                    </Td>
                    <Td>
                      <StatusPill status={item.status} stock={item.stock} compact />
                    </Td>
                    <Td align="center" className="px-1">
                      <div className="flex items-center justify-center w-full">
                        <button
                          type="button"
                          onClick={() => openProductEditor(navigate, item.id)}
                          className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/8 hover:text-white transition-colors"
                          style={{ color: colors.textSecondary }}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil size={15} strokeWidth={1.8} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
          style={{ borderTop: `1px solid ${colors.borderSubtle}` }}
        >
          <div className="text-[12px]" style={{ color: colors.textSecondary }}>
            Showing {rangeStart} to {rangeEnd} of {totalElements} products
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
    </div>
  )
}
