import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/shared/ui/PageHeader'
import { PATHS, buildPath } from '@/app/router/paths'
import { useCatalogStore } from '@/app/store/catalogStore'
import { fetchCategories } from '@/services/products'
import { colors } from '@/app/themes/colors'

/**
 * Category index — loads categories from GET /api/categories and links into search.
 */
export default function CategoriesPage() {
  const categories = useCatalogStore((s) => s.categories)
  const products = useCatalogStore((s) => s.products)

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

  const countFor = (slug) => products.filter((p) => p.cat === slug).length

  return (
    <div>
      <PageHeader
        title="Shop by category"
        subtitle={`${categories.length} categories · everything from daily medicines to home diagnostics`}
      />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => {
          const accent = category.accent ?? colors.accent
          const productCount = countFor(category.slug) || category.count

          return (
            <li key={category.id}>
              <Link
                to={buildPath(PATHS.customer.category, { slug: category.slug })}
                className="flex h-full flex-col items-center gap-3 rounded-[18px] px-4 py-6 text-center transition-transform hover:-translate-y-[3px]"
                style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
              >
                <span
                  className="flex h-[62px] w-[62px] items-center justify-center rounded-full text-[22px] font-extrabold"
                  style={{
                    background: `radial-gradient(circle at 32% 28%, ${accent}33, rgba(255,255,255,0.04) 70%)`,
                    border: `1px solid ${accent}44`,
                    color: accent,
                  }}
                  aria-hidden="true"
                >
                  {category.icon ?? category.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-[14px] font-extrabold" style={{ color: colors.textBright }}>
                  {category.name}
                </span>
                <span className="text-[12px]" style={{ color: colors.textDim }}>
                  {productCount} products
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
