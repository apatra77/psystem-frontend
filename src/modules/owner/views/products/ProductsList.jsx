import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react'
import GlassCard from '../../components/GlassCard'
import PortalModal from '../../components/PortalModal'
import BulkUploadModal from './BulkUploadModal'
import Spinner from '@/components/ui/Spinner'
import { ModalSelect } from '../../components/PortalModal'
import { useOwnerPortal } from '../../context/OwnerPortalContext'
import { useProductsQuery } from '../../hooks/useProductsQuery'
import { stockMeta } from '../../utils/helpers'
import { colors } from '@/theme/colors'

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
  const {
    categories: contextCategories,
    categoriesLoading,
    deleteProduct,
    reloadProducts,
    productsRefreshKey,
  } = useOwnerPortal()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const {
    products,
    categories: fetchedCategories,
    totalElements,
    totalPages,
    page,
    setPage,
    currentPage,
    rangeStart,
    rangeEnd,
    pageNumbers,
    loading: productsLoading,
    error: productsError,
    isSearchMode,
    refetch,
    updateProductLocally,
    removeProductLocally,
  } = useProductsQuery({
    categoryId: catFilter,
    searchQuery: search,
    refreshKey: productsRefreshKey,
  })
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const categories = contextCategories.length > 0 ? contextCategories : fetchedCategories

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'All categories' },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories],
  )
  const isLoading = productsLoading || categoriesLoading

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
  }

  const closeDeleteModal = () => {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteError('')
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteProduct(deleteTarget.id)
      removeProductLocally(deleteTarget.id)
      setDeleteTarget(null)
      await refetch()
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Failed to delete product. Please try again.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div
          className="flex-1 min-w-0 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}
        >
          <Search size={14} style={{ color: '#68d9b4', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search products or SKU…"
            value={search}
            onChange={handleSearchChange}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-white text-[12.5px] font-[inherit]"
          />
        </div>

        <ModalSelect
          className="w-[190px] flex-shrink-0"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          options={categoryOptions}
          placeholder="All categories"
        />

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
                  onClick={() => {
                    setAddMenuOpen(false)
                    setBulkUploadOpen(true)
                  }}
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
        {isLoading ? (
          <div className="flex items-center justify-center gap-2.5 py-16 text-[13px]" style={{ color: colors.textSecondary }}>
            <Spinner />
            Loading products…
          </div>
        ) : productsError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
            <div className="text-[13px] font-bold text-red-400">{productsError}</div>
            <button
              type="button"
              onClick={refetch}
              className="text-[12.5px] font-bold px-4 py-2 rounded-[10px] cursor-pointer"
              style={{
                color: colors.accentText,
                background: colors.primaryBtn,
              }}
            >
              Retry
            </button>
          </div>
        ) : (
        <>
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
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-[13px]" style={{ color: colors.textDim }}>
                  No products found.
                </td>
              </tr>
            ) : (
            products.map((p) => {
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
                    {categories.find((c) => c.id === p.cat)?.name ?? p.catName ?? p.cat}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="text-[12.5px] font-bold text-white tabular-nums">₹{p.price}</span>
                    {p.mrp > p.price && (
                      <span className="text-[11px] line-through ml-1.5" style={{ color: '#5f7d73' }}>
                        ₹{p.mrp}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="text-xs" style={{ color: '#cfe6dc' }}>
                      {p.stock} {p.stockUnit ?? 'units'}
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
                      onClick={() =>
                        updateProductLocally(p.id, (product) => ({
                          ...product,
                          status: product.status === 'active' ? 'inactive' : 'active',
                        }))
                      }
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
                        onClick={() => {
                          setDeleteError('')
                          setDeleteTarget(p)
                        }}
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
            })
            )}
          </tbody>
        </table>

        {!isSearchMode && (
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
                disabled={isLoading || currentPage === 1}
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
                disabled={isLoading || currentPage === totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }}
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {isSearchMode && products.length > 0 && (
          <div
            className="px-4 py-3.5 text-[12px]"
            style={{ color: colors.textSecondary, borderTop: `1px solid ${colors.borderSubtle}` }}
          >
            Showing {products.length} search result{products.length === 1 ? '' : 's'}
          </div>
        )}
        </>
        )}
      </GlassCard>

      {bulkUploadOpen && (
        <BulkUploadModal
          onClose={() => setBulkUploadOpen(false)}
          onUploaded={() => reloadProducts()}
        />
      )}

      {deleteTarget && (
        <PortalModal onClose={closeDeleteModal} width={420} scrollable={false}>
          <div className="p-6">
            <div className="text-[17px] font-extrabold text-white mb-2">Delete product?</div>
            <p className="text-[13px] leading-relaxed mb-1" style={{ color: colors.textSecondary }}>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">{deleteTarget.name}</span>?
            </p>
            <p className="text-[12px]" style={{ color: colors.textDim }}>
              This action cannot be undone.
            </p>
            {deleteError && (
              <div className="mt-3 text-[12px] font-bold text-red-400">{deleteError}</div>
            )}
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="text-[12.5px] font-bold px-[18px] py-2 rounded-[10px] cursor-pointer disabled:opacity-60"
                style={{
                  color: colors.textHighlight,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.16)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="text-[12.5px] font-extrabold px-5 py-2 rounded-[10px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                style={{
                  color: '#fff',
                  background: '#c0392b',
                  boxShadow: '0 6px 18px rgba(192,57,43,0.35)',
                }}
              >
                {deleting ? (
                  <>
                    <Spinner />
                    Deleting…
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </PortalModal>
      )}
    </div>
  )
}
