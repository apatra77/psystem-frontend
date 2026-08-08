import { Link } from 'react-router-dom'
import { PATHS, buildPath } from '@/app/router/paths'
import { ShimmerBar, ShimmerCircle } from '@/shared/components/shimmer/primitives'
import { useCatalogStore } from '@/app/store/catalogStore'
import { colors } from '@/app/themes/colors'
import { SECTION_MAX, SECTION_X } from './layout'

/** Same cell width as the old responsive grid (3 / 4 / 6 / 8 columns). */
const CATEGORY_ITEM_WIDTH =
  'w-[calc((100%-2*0.75rem)/3)] flex-shrink-0 snap-start sm:w-[calc((100%-3*0.75rem)/4)] lg:w-[calc((100%-5*0.75rem)/6)] xl:w-[calc((100%-7*0.75rem)/8)]'

/**
 * "Shop by category" row on the customer landing page.
 * Categories are loaded from GET /api/categories on page mount.
 */
export default function CategoryAisles() {
  const categories = useCatalogStore((s) => s.categories)
  const categoriesLoaded = useCatalogStore((s) => s.categoriesLoaded)
  const categoryPath = (slug) => buildPath(PATHS.customer.category, { slug })

  return (
    <section className={`${SECTION_MAX} ${SECTION_X} relative z-10 pt-11`} aria-labelledby="aisles-title">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 id="aisles-title" className="text-[20px] font-extrabold tracking-[-0.8px] sm:text-[24px]" style={{ color: colors.textBright }}>
          Shop by category
        </h2>
        <Link
          to={PATHS.customer.categories}
          className="whitespace-nowrap text-[11px] font-extrabold tracking-[0.16em]"
          style={{ color: colors.accent }}
        >
          ALL CATEGORIES →
        </Link>
      </div>

      {!categoriesLoaded ? (
        <ul
          className="rail-scroll -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
          aria-hidden="true"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <li
              key={i}
              className={`flex flex-col items-center gap-2.5 rounded-[18px] px-2.5 py-4 ${CATEGORY_ITEM_WIDTH}`}
            >
              <ShimmerCircle size={68} />
              <ShimmerBar width="72%" height={12} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="rail-scroll -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {categories.map((cat) => {
          const accent = cat.accent ?? colors.accent

          return (
            <li key={cat.id} className={CATEGORY_ITEM_WIDTH}>
              <Link
                to={categoryPath(cat.slug)}
                className="flex h-full w-full flex-col items-center gap-2.5 rounded-[18px] px-2.5 py-4 transition-colors hover:-translate-y-[2px]"
                style={{
                  background: colors.cardBg,
                  border: '1px solid rgba(255,255,255,.11)',
                }}
              >
                <span
                  className="flex h-[68px] w-[68px] items-center justify-center rounded-full text-[22px] font-extrabold"
                  style={{
                    background: `radial-gradient(circle at 32% 28%, ${accent}33, rgba(255,255,255,0.04) 70%)`,
                    border: `1px solid ${accent}44`,
                    boxShadow: '0 14px 26px rgba(0,0,0,.5)',
                    color: accent,
                  }}
                  aria-hidden="true"
                >
                  {cat.icon ?? cat.name.charAt(0).toUpperCase()}
                </span>
                <span
                  className="min-h-[32px] text-center text-[12px] font-bold leading-tight"
                  style={{ color: '#cfe6dc' }}
                >
                  {cat.name}
                </span>
              </Link>
            </li>
          )
        })}
        </ul>
      )}
    </section>
  )
}
