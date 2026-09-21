import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import ProductCard from '@/modules/customer/components/ProductCard'
import SearchInput from '@/shared/ui/SearchInput'
import Button from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import PageHeader from '@/shared/ui/PageHeader'
import DropdownSelect from '@/shared/ui/DropdownSelect'
import { ShimmerBar, ShimmerCard } from '@/shared/components/shimmer/primitives'
import { useCatalogStore } from '@/app/store/catalogStore'
import { useCustomerProductBrowse } from '@/modules/customer/hooks/useCustomerProductBrowse'
import { useCustomerProductSearch } from '@/modules/customer/hooks/useCustomerProductSearch'
import { PATHS, buildPath } from '@/app/router/paths'
import { fetchCategories } from '@/services/products'
import { BRANDS, SORT_OPTIONS, productMatchesAnyShopBrand } from '@/shared/mocks/catalog'
import { colors } from '@/app/themes/colors'
import { resolveCustomerProductStock } from '@/modules/customer/utils/looseQuantity'

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

  if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
  return sorted
}

function applyClientFilters(products, filters, { skipQuery = false, skipCategory = false } = {}) {
  const q = skipQuery ? '' : filters.query.trim().toLowerCase()

  return products.filter((p) => {
    if (q && !`${p.name} ${p.brand} ${p.desc}`.toLowerCase().includes(q)) return false
    if (!skipCategory && filters.category !== 'all' && p.cat !== filters.category) return false
    if (filters.brands.length && !productMatchesAnyShopBrand(p, filters.brands)) return false
    if (p.price < filters.minPrice || p.price > filters.maxPrice) return false
    if (filters.inStockOnly && !resolveCustomerProductStock(p, p.stock).inStock) return false
    return true
  })
}

function ShopPagination({
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
  const navigate = useNavigate()
  const { state } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [keywordDraft, setKeywordDraft] = useState(urlQuery)
  const resultsTopRef = useRef(null)
  const scrollAfterPageChangeRef = useRef(false)

  const { filters, setFilter, resetFilters, toggleBrand, categories } = useCatalogStore()
  const fromDeals = state?.fromDeals === true
  const isSearchMode = urlQuery.trim().length > 0
  const activeCategorySlug =
    slug ?? (filters.category !== 'all' ? filters.category : '')

  const searchState = useCustomerProductSearch(urlQuery, { page, enabled: isSearchMode, refreshKey })
  const browseState = useCustomerProductBrowse({
    page,
    categorySlug: activeCategorySlug,
    enabled: !isSearchMode,
    refreshKey,
  })

  const apiState = isSearchMode ? searchState : browseState
  const {
    products: apiProducts,
    totalElements,
    totalPages,
    currentPage,
    rangeStart,
    rangeEnd,
    pageNumbers,
    loading,
    error: apiError,
  } = apiState

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const payload = await fetchCategories()
        if (!cancelled && payload.length > 0) {
          useCatalogStore.getState().setCategoriesFromApi(payload)
        }
      } catch {
        /* Keep existing categories on failure. */
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
    setPage(1)
  }, [slug])

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

  const filteredProducts = useMemo(
    () =>
      applyClientFilters(apiProducts, filters, {
        skipQuery: isSearchMode,
        skipCategory: Boolean(activeCategorySlug),
      }),
    [apiProducts, filters, isSearchMode, activeCategorySlug],
  )

  const displayProducts = useMemo(
    () => sortProducts(filteredProducts, filters.sort),
    [filteredProducts, filters.sort],
  )

  const handleReset = () => {
    resetFilters()
    setKeywordDraft('')
    setSearchParams({}, { replace: true })
    setPage(1)
  }

  const scrollToResultsTop = useCallback(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultsTopRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [])

  const handlePageChange = useCallback((nextPage) => {
    scrollAfterPageChangeRef.current = true
    setPage(nextPage)
  }, [])

  const handleCategoryChange = useCallback(
    (category) => {
      setPage(1)

      if (category === 'all') {
        setFilter({ category: 'all' })
        if (slug) navigate(PATHS.customer.search)
        return
      }

      setFilter({ category })

      if (slug) {
        navigate(buildPath(PATHS.customer.category, { slug: category }))
      }
    },
    [navigate, setFilter, slug],
  )

  useEffect(() => {
    if (!scrollAfterPageChangeRef.current || loading) return
    scrollAfterPageChangeRef.current = false
    scrollToResultsTop()
  }, [page, loading, scrollToResultsTop])

  const pageTitle = isSearchMode
    ? `Results for "${urlQuery.trim()}"`
    : fromDeals
      ? 'Deals of the day'
      : activeCategorySlug
        ? categories.find((c) => c.slug === activeCategorySlug)?.name ?? 'Browse'
        : 'Shop'

  const subtitle = totalElements === 0
    ? isSearchMode
      ? 'No products matched your search'
      : 'No products available right now'
    : filteredProducts.length !== apiProducts.length
      ? `${filteredProducts.length.toLocaleString('en-IN')} product(s) match your filters · ${totalElements.toLocaleString('en-IN')} total`
      : `Showing ${rangeStart.toLocaleString('en-IN')} to ${rangeEnd.toLocaleString('en-IN')} of ${totalElements.toLocaleString('en-IN')} products`

  const paginationProps = {
    currentPage,
    totalPages,
    pageNumbers,
    rangeStart,
    rangeEnd,
    totalElements,
    loading,
    onChange: handlePageChange,
  }

  return (
    <div ref={resultsTopRef} className="scroll-mt-24">
      <PageHeader
        title={pageTitle}
        subtitle={subtitle}
        actions={
          <DropdownSelect
            value={filters.sort}
            onChange={(sort) => setFilter({ sort })}
            options={SORT_OPTIONS}
            minWidth={190}
            align="right"
            ariaLabel="Sort products"
          />
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
            <DropdownSelect
              value={filters.category}
              onChange={handleCategoryChange}
              options={[
                { id: 'all', label: 'All categories' },
                ...categories.map((c) => ({ id: c.slug, label: c.name })),
              ]}
              fullWidth
              ariaLabel="Filter by category"
            />
          </FilterBlock>

          <FilterBlock title={`Max price · ₹${filters.maxPrice}`}>
            <input
              type="range" min={50} max={5000} step={50} value={filters.maxPrice}
              onChange={(e) => setFilter({ maxPrice: Number(e.target.value) })}
              className="w-full accent-[#40deaa]"
            />
          </FilterBlock>

              <FilterBlock title="Brand">
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {BRANDS.map((b) => (
                <label key={b} className="flex items-start gap-2 text-[12px] leading-snug cursor-pointer" style={{ color: colors.textMuted }}>
                  <input type="checkbox" className="accent-[#40deaa] mt-0.5 shrink-0" checked={filters.brands.includes(b)} onChange={() => toggleBrand(b)} />
                  <span title={b}>{b}</span>
                </label>
              ))}
            </div>
          </FilterBlock>

          <FilterBlock title="Availability">
            <label className="flex items-center gap-2 text-[12.5px] cursor-pointer mb-1.5" style={{ color: colors.textMuted }}>
              <input
                type="radio"
                name="shop-availability"
                className="accent-[#40deaa]"
                checked={!filters.inStockOnly}
                onChange={() => setFilter({ inStockOnly: false })}
              />
              In stock and out of stock
            </label>
            <label className="flex items-center gap-2 text-[12.5px] cursor-pointer" style={{ color: colors.textMuted }}>
              <input
                type="radio"
                name="shop-availability"
                className="accent-[#40deaa]"
                checked={filters.inStockOnly}
                onChange={() => setFilter({ inStockOnly: true })}
              />
              In stock only
            </label>
          </FilterBlock>
        </aside>

        <section>
          {apiError ? (
            <EmptyState
              title={isSearchMode ? 'Search failed' : 'Could not load products'}
              description={apiError}
              action={<Button onClick={() => setRefreshKey((key) => key + 1)}>Try again</Button>}
            />
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

      {!loading && !apiError && totalElements > 0 && displayProducts.length > 0 && (
        <ShopPagination {...paginationProps} />
      )}
    </div>
  )
}
