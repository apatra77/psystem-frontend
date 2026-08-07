import { useEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import ProductCard from '@/modules/customer/components/ProductCard'
import SearchInput from '@/shared/ui/SearchInput'
import Button from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import PageHeader from '@/shared/ui/PageHeader'
import { ShimmerBar, ShimmerCard } from '@/shared/components/shimmer/primitives'
import { useCatalogStore } from '@/app/store/catalogStore'
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

export default function SearchPage() {
  const { slug } = useParams()
  const { state } = useLocation()
  const { filters, setFilter, resetFilters, toggleBrand, categories, loading } = useCatalogStore()
  const results = useCatalogStore((s) => s.results())
  const fromDeals = state?.fromDeals === true

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
    if (slug) {
      setFilter({ category: slug })
      return
    }
    resetFilters()
  }, [slug, setFilter, resetFilters])

  const pageTitle = fromDeals
    ? 'Deals of the day'
    : slug
      ? categories.find((c) => c.slug === slug)?.name ?? 'Browse'
      : 'Search'

  return (
    <div>
      <PageHeader
        title={pageTitle}
        subtitle={`${results.length} product(s) available near you`}
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
            <button type="button" onClick={resetFilters} className="text-[12px] font-bold" style={{ color: colors.accent }}>Reset</button>
          </div>

          <FilterBlock title="Keyword">
            <SearchInput value={filters.query} onChange={(v) => setFilter({ query: v })} placeholder="Search products" />
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
          {loading ? (
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
          ) : results.length === 0 ? (
            <EmptyState title="No products match those filters" description="Try widening the price range or clearing a filter." action={<Button onClick={resetFilters}>Reset filters</Button>} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
