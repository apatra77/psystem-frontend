import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react'
import GlassCard from '../../components/GlassCard'
import { useOwnerPortal } from '../../context/OwnerPortalContext'
import { stockMeta } from '../../utils/helpers'
import { colors } from '../../../theme/colors'

const STOCK_FILTERS = [
  { key: 'all', label: 'All stock' },
  { key: 'in', label: 'In stock' },
  { key: 'low', label: 'Low stock' },
  { key: 'out', label: 'Out of stock' },
]

function ProductThumb() {
  return (
    <div
      className="w-[42px] h-[42px] rounded-[10px] flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-center leading-tight px-1"
      style={{
        border: '1.5px dashed rgba(255,255,255,0.2)',
        color: colors.textDim,
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      Drop an image
    </div>
  )
}

function Th({ children }) {
  return (
    <th
      className="text-left text-[10.5px] font-extrabold tracking-[0.1em] uppercase px-4 py-3.5"
      style={{ color: colors.textDim, borderBottom: `1px solid ${colors.borderSubtle}` }}
    >
      {children}
    </th>
  )
}

export default function ProductsList() {
  const navigate = useNavigate()
  const { products, categories, activeOutletName, deleteProduct, toggleProductStatus } = useOwnerPortal()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [addMenuOpen, setAddMenuOpen] = useState(false)

  const totalCatalogCount = useMemo(
    () => categories.reduce((sum, c) => sum + c.count, 0),
    [categories],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (q && !(p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))) return false
      if (catFilter !== 'all' && p.cat !== catFilter) return false
      if (stockFilter === 'low' && !(p.stock > 0 && p.stock <= 20)) return false
      if (stockFilter === 'out' && p.stock !== 0) return false
      if (stockFilter === 'in' && p.stock <= 20) return false
      return true
    })
  }, [products, search, catFilter, stockFilter])

  const stockChips = STOCK_FILTERS.map((f) => {
    const active = stockFilter === f.key
    const meta =
      f.key === 'all'
        ? { color: '#fff', bg: 'rgba(255,255,255,.12)', border: 'rgba(255,255,255,.22)' }
        : f.key === 'in'
          ? stockMeta(999)
          : f.key === 'low'
            ? stockMeta(10)
            : stockMeta(0)
    return {
      ...f,
      bg: active ? meta.bg : 'rgba(255,255,255,.05)',
      color: active ? meta.color : colors.textSecondary,
      border: active ? meta.border : 'rgba(255,255,255,.14)',
    }
  })

  const handleDelete = (p) => {
    if (window.confirm(`Delete "${p.name}"?`)) {
      deleteProduct(p.id)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5 flex-wrap">
        <div
          className="flex-1 min-w-[220px] flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}
        >
          <Search size={14} style={{ color: '#68d9b4', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search products or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-white text-[12.5px] font-[inherit]"
          />
        </div>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="text-[12.5px] font-bold rounded-xl px-3 py-2.5 cursor-pointer"
          style={{
            color: '#cfe6dc',
            background: '#0d211a',
            border: '1px solid rgba(255,255,255,0.16)',
          }}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="flex gap-1.5 flex-wrap">
          {stockChips.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStockFilter(f.key)}
              className="text-[11.5px] font-bold px-[13px] py-2 rounded-full cursor-pointer whitespace-nowrap transition-colors"
              style={{ background: f.bg, color: f.color, border: `1px solid ${f.border}` }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setAddMenuOpen(false)
              navigate('/owner/products/add')
            }}
            className="text-[12.5px] font-extrabold rounded-l-[11px] pl-[18px] pr-3.5 py-2.5 cursor-pointer whitespace-nowrap"
            style={{
              color: colors.accentText,
              background: colors.primaryBtn,
              boxShadow: '0 6px 18px rgba(64,222,170,0.35)',
            }}
          >
            + Add product
          </button>
          <button
            type="button"
            onClick={() => setAddMenuOpen(!addMenuOpen)}
            className="text-[12.5px] font-extrabold rounded-r-[11px] px-3 py-2.5 cursor-pointer flex items-center"
            style={{
              color: colors.accentText,
              background: colors.primaryBtn,
              boxShadow: '0 6px 18px rgba(64,222,170,0.35)',
              borderLeft: '1px solid rgba(4,20,15,0.28)',
            }}
          >
            <ChevronDown size={12} strokeWidth={2.6} />
          </button>
          {addMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAddMenuOpen(false)} aria-hidden="true" />
              <div
                className="absolute top-[calc(100%+8px)] right-0 w-[210px] z-50 rounded-[14px] p-2 owner-dropdown"
                style={{
                  background: 'rgba(10,28,22,0.97)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.13)',
                  boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAddMenuOpen(false)
                    navigate('/owner/products/add')
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[12.5px] font-bold rounded-[9px] cursor-pointer hover:bg-white/6 text-left"
                  style={{ color: colors.textHighlight }}
                >
                  <Plus size={15} strokeWidth={1.8} />
                  Add single product
                </button>
                <button
                  type="button"
                  onClick={() => setAddMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[12.5px] font-bold rounded-[9px] cursor-pointer hover:bg-white/6 text-left"
                  style={{ color: colors.textHighlight }}
                >
                  <Upload size={15} strokeWidth={1.8} />
                  Bulk upload CSV
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>Price</Th>
              <Th>Stock</Th>
              <Th>Rx</Th>
              <Th>Status</Th>
              <th className="px-4 py-3.5" style={{ borderBottom: `1px solid ${colors.borderSubtle}` }} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const cat = categories.find((c) => c.id === p.cat)
              const sm = stockMeta(p.stock)
              const isActive = p.status === 'active'
              return (
                <tr key={p.id} className="border-b border-white/6 hover:bg-white/3">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <ProductThumb />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/owner/products/${p.id}`)}
                          className="text-[12.5px] font-bold text-white whitespace-nowrap hover:text-[#40deaa] cursor-pointer text-left"
                        >
                          {p.name}
                        </button>
                        <div className="text-[10.5px] mt-0.5" style={{ color: colors.textDim }}>
                          {p.sku}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: '#cfe6dc' }}>
                    {cat?.name ?? p.cat}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="text-[12.5px] font-bold text-white tabular-nums">₹{p.price}</span>
                    <span className="text-[11px] line-through ml-1.5" style={{ color: '#5f7d73' }}>
                      ₹{p.mrp}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="text-xs" style={{ color: '#cfe6dc' }}>
                      {p.stock} units
                    </div>
                    <span
                      className="text-[9.5px] font-extrabold px-[7px] py-0.5 rounded-full inline-block mt-0.5"
                      style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}
                    >
                      {sm.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {p.rx && (
                      <span
                        className="text-[9.5px] font-extrabold px-[7px] py-0.5 rounded-md"
                        style={{
                          color: colors.purpleLight,
                          background: 'rgba(178,135,255,0.15)',
                          border: '1px solid rgba(178,135,255,0.32)',
                        }}
                      >
                        RX
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleProductStatus(p.id)}
                      className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full cursor-pointer"
                      style={{
                        background: isActive ? 'rgba(64,222,170,0.14)' : 'rgba(255,255,255,0.08)',
                        color: isActive ? colors.accent : colors.textSecondary,
                        border: isActive ? '1px solid rgba(64,222,170,0.34)' : '1px solid rgba(255,255,255,0.16)',
                      }}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => navigate(`/owner/products/${p.id}`)}
                        className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/8 hover:text-white transition-colors"
                        style={{ color: colors.textSecondary }}
                        aria-label="Edit product"
                      >
                        <Pencil size={15} strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center cursor-pointer transition-colors hover:bg-red-500/15 hover:text-red-400"
                        style={{ color: colors.textSecondary }}
                        aria-label="Delete product"
                      >
                        <Trash2 size={15} strokeWidth={1.8} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </GlassCard>

      <div className="text-[11.5px]" style={{ color: '#5f7d73' }}>
        Showing {filtered.length} of {totalCatalogCount} products across {activeOutletName}.
      </div>
    </div>
  )
}
