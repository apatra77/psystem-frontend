import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { PATHS, buildPath } from '@/app/router/paths'
import { AISLES } from '@/shared/mocks/customerHome'
import { colors } from '@/app/themes/colors'
import { SECTION_MAX, SECTION_X } from './layout'

/**
 * "Shop by category" grid with hover/focus sub-category dropdowns.
 *
 * The grid steps 3 -> 4 -> 6 -> 8 columns, and the dropdown is suppressed below
 * `lg` where there is no hover and no room: on touch the tile is a plain link
 * into the category page, which is where the same sub-categories live.
 */
export default function CategoryAisles() {
  const navigate = useNavigate()
  const [openSlug, setOpenSlug] = useState(null)

  const close = useCallback(() => setOpenSlug(null), [])
  const categoryPath = (slug) => buildPath(PATHS.customer.category, { slug })

  /**
   * The dropdown only exists at `xl`, where the grid really is 8 columns — so
   * column position can be derived from the index. First and last column anchor
   * to their own edge; everything between is centred on the tile.
   */
  const dropdownAnchor = (index) => {
    const column = index % 8
    if (column === 0) return { left: 0 }
    if (column === 7) return { right: 0 }
    return { left: '50%', transform: 'translateX(-50%)' }
  }

  return (
    <section className={`${SECTION_MAX} ${SECTION_X} relative z-10 pt-11`} aria-labelledby="aisles-title">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 id="aisles-title" className="text-[20px] font-extrabold tracking-[-0.8px] sm:text-[24px]" style={{ color: colors.textBright }}>
          Shop by category
        </h2>
        <Link
          to={PATHS.customer.search}
          className="whitespace-nowrap text-[11px] font-extrabold tracking-[0.16em]"
          style={{ color: colors.accent }}
        >
          ALL CATEGORIES →
        </Link>
      </div>

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {AISLES.map((cat, index) => {
          const open = openSlug === cat.slug

          return (
            <li
              key={cat.slug}
              className="relative"
              onMouseEnter={() => setOpenSlug(cat.slug)}
              onMouseLeave={close}
            >
              <Link
                to={categoryPath(cat.slug)}
                onFocus={() => setOpenSlug(cat.slug)}
                onBlur={close}
                className="flex flex-col items-center gap-2.5 rounded-[18px] px-2.5 py-4 transition-colors"
                style={{
                  background: colors.cardBg,
                  border: `1px solid ${open ? 'rgba(64,222,170,.5)' : 'rgba(255,255,255,.11)'}`,
                }}
              >
                <span
                  className="flex h-[68px] w-[68px] items-center justify-center rounded-full text-[26px]"
                  style={{
                    background: `radial-gradient(circle at 32% 28%, ${cat.accent}33, rgba(255,255,255,0.04) 70%)`,
                    border: `1px solid ${cat.accent}44`,
                    boxShadow: '0 14px 26px rgba(0,0,0,.5)',
                  }}
                  aria-hidden="true"
                >
                  <span style={{ color: cat.accent, fontWeight: 800, fontSize: 22 }}>{cat.name.charAt(0)}</span>
                </span>
                <span
                  className="flex items-center gap-1.5 text-center text-[12px] font-bold leading-tight"
                  style={{ color: '#cfe6dc' }}
                >
                  {cat.name}
                  <ChevronDown size={11} className="hidden xl:block" style={{ color: colors.textDim }} aria-hidden="true" />
                </span>
              </Link>

              {open && (
                <div
                  className="absolute z-40 hidden pt-3 xl:block"
                  style={{ top: 'calc(100% - 6px)', ...dropdownAnchor(index) }}
                >
                  <div
                    className="aisle-dropdown w-[236px] rounded-[16px] p-2.5"
                    style={{
                      background: 'rgba(10,28,22,.94)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(64,222,170,.28)',
                      boxShadow: '0 30px 70px rgba(0,0,0,.65)',
                    }}
                  >
                    <p className="px-3 pb-1.5 pt-2 text-[10px] font-extrabold tracking-[0.18em]" style={{ color: colors.accentSoft }}>
                      {cat.name.toUpperCase()}
                    </p>
                    {cat.subs.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => navigate(categoryPath(cat.slug))}
                        className="flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-[13px] font-semibold"
                        style={{ color: '#cfe6dc' }}
                      >
                        {sub}
                        <ArrowRight size={12} style={{ color: colors.textDim }} aria-hidden="true" />
                      </button>
                    ))}
                    <Link
                      to={categoryPath(cat.slug)}
                      className="mt-1.5 block px-3 py-3 text-[11px] font-extrabold tracking-[0.14em]"
                      style={{ borderTop: '1px solid rgba(255,255,255,.09)', color: colors.accent }}
                    >
                      VIEW ALL →
                    </Link>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
