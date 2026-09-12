import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import ProductCard from '@/modules/customer/components/ProductCard'
import SearchInput from '@/shared/ui/SearchInput'
import Button from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import PageHeader from '@/shared/ui/PageHeader'
import { ShimmerBar, ShimmerCard } from '@/shared/components/shimmer/primitives'
import { useCatalogStore } from '@/app/store/catalogStore'
import { useCustomerProductSearch } from '@/modules/customer/hooks/useCustomerProductSearch'
import { fetchCustomerProducts } from '@/services/products'
import { BRANDS, SORT_OPTIONS } from '@/shared/mocks/catalog'
import { colors } from '@/app/themes/colors'

function FilterBlock({ title, children }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-extrabold uppercase tracking-wider mb-2.5" style={{ color: colors.textDim }}>{title}</p>
      {children}
    </div>
  )
}

function sortProducts(list, sort) {
  const sorted = [...list]
  const etaMinutes = (eta) => Number(String(eta).match(/\d+/)?.[0] ?? 999)

  if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
  if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating)
  if (sort === 'eta') sorted.sort((a, b) => etaMinutes(a.eta) - etaMinutes(b.eta))
  return sorted
}

function applyClientFilters(products, filters, { skipQuery = false } = {}) {
  const q = skipQuery ? '' : filters.query.trim().toLowerCase()

  return products.filter((p) => {
    if (q && !`${p.name} ${p.brand} ${p.desc}`.toLowerCase().includes(q)) return false
    if (filters.category !== 'all' && p.cat !== filters.category) return false
    if (filters.brands.length && !filters.brands.includes(p.brand)) return false
    if (p.price < filters.minPrice || p.price > filters.maxPrice) return false
    if (p.rating < filters.minRating) return false
    if (filters.rxOnly && !p.rx) return false
    if (filters.inStockOnly && p.stock <= 0) return false
    return true
  })
}

function SearchPagination({
  currentPage,
  totalPages,
  pageNumbers,
  rangeStart,
  rangeEnd,
  totalElements,
  loading,
  onChange,
}) {
  if (totalElements <= 0) return null

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 pt-1">
      <div className="text-[12px]" style={{ color: colors.textSecondary }}>
        Showing {Number(rangeStart).toLocaleString('en-IN')} to {Number(rangeEnd).toLocaleString('en-IN')} of{' '}
        {Number(totalElements).toLocaleString('en-IN')} products
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={loading || currentPage === 1}
          onClick={() => onChange(Math.max(1, currentPage - 1))}
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
              onClick={() => onChange(item)}
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
          onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
          className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }}
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

export default function SearchPage() {
  const { slug } = useParams()
  const { state } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''
  const [page, setPage] = useState(1)
  const [keywordDraft, setKeywordDraft] = useState(urlQuery)

  const { filters, setFilter, resetFilters, toggleBrand, categories, loading: browseLoading } = useCatalogStore()
  const browseResults = useCatalogStore((s) => s.results())
  const fromDeals = state?.fromDeals === true

  const {
    products: searchProducts,
    totalElements,
    totalPages,
    currentPage,
    rangeStart,
    rangeEnd,
    pageNumbers,
    loading: searchLoading,
    error: searchError,
    isSearchMode,
  } = useCustomerProductSearch(urlQuery, { page })

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      useCatalogStore.getState().setLoading(true)
      try {
        const items = await fetchCustomerProducts()
        if (cancelled) return
        useCatalogStore.getState().setProductsFromApi(items)
      } catch {
        /* Keep existing catalog on failure. */
      } finally {
        if (!cancelled) useCatalogStore.getState().setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setKeywordDraft(urlQuery)
    setFilter({ query: urlQuery })
    setPage(1)
  }, [urlQuery, setFilter])

  useEffect(() => {
    if (slug) {
      setFilter({ category: slug })
      return
    }
    if (!isSearchMode) {
      setFilter({ category: 'all' })
    }
  }, [slug, isSearchMode, setFilter])

  const applyKeywordSearch = (value = keywordDraft) => {
    const trimmed = value.trim()
    setFilter({ query: trimmed })
    if (trimmed) {
      setSearchParams({ q: trimmed }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
    setPage(1)
  }

  const filteredSearchProducts = useMemo(
    () => applyClientFilters(searchProducts, filters, { skipQuery: true }),
    [searchProducts, filters],
  )

  const sortedSearchProducts = useMemo(
    () => sortProducts(filteredSearchProducts, filters.sort),
    [filteredSearchProducts, filters.sort],
  )

  const displayProducts = isSearchMode ? sortedSearchProducts : browseResults
  const loading = isSearchMode ? searchLoading : browseLoading

  const handleReset = () => {
    resetFilters()
    setKeywordDraft('')
    setSearchParams({}, { replace: true })
    setPage(1)
  }

  const pageTitle = isSearchMode
    ? `Results for "${urlQuery.trim()}"`
    : fromDeals
      ? 'Deals of the day'
      : slug
        ? categories.find((c) => c.slug === slug)?.name ?? 'Browse'
        : 'Search'

  const subtitle = isSearchMode
    ? totalElements === 0
      ? 'No products matched your search'
      : filteredSearchProducts.length !== searchProducts.length
        ? `${filteredSearchProducts.length.toLocaleString('en-IN')} product(s) match your filters · ${totalElements.toLocaleString('en-IN')} total from search`
        : `Showing ${rangeStart.toLocaleString('en-IN')}–${rangeEnd.toLocaleString('en-IN')} of ${totalElements.toLocaleString('en-IN')} product(s)`
    : `${browseResults.length.toLocaleString('en-IN')} product(s) available near you`

  return (
    <div>
      <PageHeader
        title={pageTitle}
        subtitle={subtitle}
        actions={
          <select
            value={filters.sort}
            onChange={(e) => setFilter({ sort: e.target.value })}
            className="rounded-[11px] px-3 py-2 text-[12.5px] outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.borderSubtle}`, color: colors.textBright }}
          >
            {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        }
      />

      <div className="grid gap-6" style={{ gridTemplateColumns: 'minmax(0,240px) minmax(0,1fr)' }}>
        <aside className="rounded-[18px] p-5 h-fit" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <span className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: colors.textBright }}>
              <SlidersHorizontal size={14} /> Filters
            </span>
            <button type="button" onClick={handleReset} className="text-[12px] font-bold" style={{ color: colors.accent }}>Reset</button>
          </div>

          <FilterBlock title="Keyword">
            <SearchInput
              value={keywordDraft}
              onChange={setKeywordDraft}
              placeholder="Search products"
              showIcon={false}
              onSubmit={() => applyKeywordSearch()}
            />
            <button
              type="button"
              onClick={() => applyKeywordSearch()}
              className="mt-2 w-full rounded-[10px] px-3 py-2 text-[12px] font-extrabold cursor-pointer"
              style={{ background: colors.primaryBtn, color: colors.accentText }}
            >
              Search
            </button>
          </FilterBlock>

          <FilterBlock title="Category">
                <select
                  value={filters.category}
                  onChange={(e) => setFilter({ category: e.target.value })}
                  className="w-full rounded-[11px] px-3 py-2.5 text-[12.5px] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.borderSubtle}`, color: colors.textBright }}
                >
                  <option value="all">All categories</option>
                  {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </FilterBlock>

              <FilterBlock title={`Max price · ₹${filters.maxPrice}`}>
                <input
                  type="range" min={50} max={5000} step={50} value={filters.maxPrice}
                  onChange={(e) => setFilter({ maxPrice: Number(e.target.value) })}
                  className="w-full accent-[#40deaa]"
                />
              </FilterBlock>

              <FilterBlock title="Minimum rating">
                <div className="flex gap-1.5">
                  {[0, 4, 4.5].map((r) => (
                    <button
                      key={r} type="button" onClick={() => setFilter({ minRating: r })}
                      className="text-[12px] font-bold px-2.5 py-1.5 rounded-[9px]"
                      style={{
                        background: filters.minRating === r ? 'rgba(64,222,170,.14)' : 'rgba(255,255,255,0.04)',
                        color: filters.minRating === r ? colors.accent : colors.textMuted,
                        border: `1px solid ${filters.minRating === r ? 'rgba(64,222,170,.34)' : colors.borderSubtle}`,
                      }}
                    >
                      {r === 0 ? 'Any' : `${r}+`}
                    </button>
                  ))}
                </div>
              </FilterBlock>

              <FilterBlock title="Brand">
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {BRANDS.map((b) => (
                    <label key={b} className="flex items-center gap-2 text-[12.5px] cursor-pointer" style={{ color: colors.textMuted }}>
                      <input type="checkbox" className="accent-[#40deaa]" checked={filters.brands.includes(b)} onChange={() => toggleBrand(b)} />
                      {b}
                    </label>
                  ))}
                </div>
              </FilterBlock>

              <FilterBlock title="Availability">
                <label className="flex items-center gap-2 text-[12.5px] cursor-pointer mb-1.5" style={{ color: colors.textMuted }}>
                  <input type="checkbox" className="accent-[#40deaa]" checked={filters.inStockOnly} onChange={(e) => setFilter({ inStockOnly: e.target.checked })} />
                  In stock only
                </label>
                <label className="flex items-center gap-2 text-[12.5px] cursor-pointer" style={{ color: colors.textMuted }}>
                  <input type="checkbox" className="accent-[#40deaa]" checked={filters.rxOnly} onChange={(e) => setFilter({ rxOnly: e.target.checked })} />
                  Prescription items only
                </label>
              </FilterBlock>
        </aside>

        <section>
          {searchError ? (
            <EmptyState title="Search failed" description={searchError} action={<Button onClick={() => applyKeywordSearch()}>Try again</Button>} />
          ) : loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <ShimmerCard key={i} padding={16} className="flex flex-col gap-3">
                  <ShimmerBar width="40%" height={20} />
                  <ShimmerBar height={16} />
                  <ShimmerBar width="70%" height={12} />
                  <ShimmerBar width="50%" height={12} />
                  <div className="mt-2 flex items-end justify-between">
                    <ShimmerBar width={72} height={20} />
                    <ShimmerBar width={64} height={32} radius={99} />
                  </div>
                </ShimmerCard>
              ))}
            </div>
          ) : displayProducts.length === 0 ? (
            <EmptyState
              title={isSearchMode ? 'No products match your search' : 'No products match those filters'}
              description={isSearchMode ? 'Try a different medicine name or salt composition.' : 'Try widening the price range or clearing a filter.'}
              action={
                isSearchMode ? (
                  <Button onClick={() => applyKeywordSearch('')}>Clear search</Button>
                ) : (
                  <Button onClick={handleReset}>Reset filters</Button>
                )
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {displayProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
      </div>

      {isSearchMode && !searchLoading && !searchError && totalElements > 0 && displayProducts.length > 0 && (
        <SearchPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageNumbers={pageNumbers}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          totalElements={totalElements}
          loading={searchLoading}
          onChange={setPage}
        />
      )}
    </div>
  )
}
