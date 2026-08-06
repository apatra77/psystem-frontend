import { Link } from 'react-router-dom'
import PageHeader from '@/shared/ui/PageHeader'
import { PATHS, buildPath } from '@/app/router/paths'
import { useCatalogStore } from '@/app/store/catalogStore'
import { colors } from '@/app/themes/colors'

/**
 * Category index — the landing spot for "All categories".
 *
 * Categories come from the catalog store, so this page needs no changes when
 * the mock array is swapped for the /categories endpoint. Each tile links into
 * SearchPage, which already handles the `:slug` param.
 */
export default function CategoriesPage() {
  const categories = useCatalogStore((s) => s.categories)
  const products = useCatalogStore((s) => s.products)

  const countFor = (slug) => products.filter((p) => p.cat === slug).length

  return (
    <div>
      <PageHeader
        title="Shop by category"
        subtitle={`${categories.length} categories · everything from daily medicines to home diagnostics`}
      />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              to={buildPath(PATHS.customer.category, { slug: category.slug })}
              className="flex h-full flex-col items-center gap-3 rounded-[18px] px-4 py-6 text-center transition-transform hover:-translate-y-[3px]"
              style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
            >
              <span
                className="flex h-[62px] w-[62px] items-center justify-center rounded-full text-[26px]"
                style={{ background: 'rgba(64,222,170,.1)', border: '1px solid rgba(64,222,170,.28)' }}
                aria-hidden="true"
              >
                {category.icon}
              </span>
              <span className="text-[14px] font-extrabold" style={{ color: colors.textBright }}>
                {category.name}
              </span>
              <span className="text-[12px]" style={{ color: colors.textDim }}>
                {countFor(category.slug) || category.count} products
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
