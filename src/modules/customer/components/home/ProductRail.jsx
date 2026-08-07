import { Link } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import { colors } from '@/app/themes/colors'
import { ShimmerBar, ShimmerCard } from '@/shared/components/shimmer/primitives'
import Reveal from './Reveal'
import RailProductCard from './RailProductCard'
import { SECTION_MAX, SECTION_X } from './layout'

function RailProductSkeleton() {
  return (
    <ShimmerCard padding={12} className="flex h-full flex-col gap-2.5">
      <ShimmerBar height={118} radius={12} />
      <ShimmerBar width="55%" height={11} />
      <ShimmerBar height={13} />
      <ShimmerBar width="70%" height={13} />
      <div className="mt-auto flex items-center gap-2 pt-2.5">
        <ShimmerBar width={56} height={18} />
        <ShimmerBar width={40} height={12} />
        <ShimmerBar className="ml-auto" width={52} height={30} radius={99} />
      </div>
    </ShimmerCard>
  )
}

/**
 * A merchandising rail: heading plus five product tiles.
 *
 * Desktop keeps the five-column grid from the reference. Below `xl` it becomes
 * a snap-scrolling row so all five stay reachable on a narrow screen without
 * stretching the page — the tiles themselves are unchanged.
 */
export default function ProductRail({ rail, loading = false }) {
  return (
    <section className={`${SECTION_MAX} ${SECTION_X} pt-10`} aria-labelledby={`rail-${rail.id}`}>
      <Reveal className="mb-4 flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <h2 id={`rail-${rail.id}`} className="text-[18px] font-extrabold tracking-[-0.6px] sm:text-[21px]" style={{ color: colors.textBright }}>
          {rail.title}
        </h2>
        <p className="text-[12px] font-semibold" style={{ color: colors.textDim }}>{rail.sub}</p>
        <Link
          to={PATHS.customer.search}
          state={rail.id === 'deals' ? { fromDeals: true } : undefined}
          className="ml-auto whitespace-nowrap text-[11px] font-extrabold tracking-[0.14em]"
          style={{ color: colors.accent }}
        >
          SEE ALL →
        </Link>
      </Reveal>

      <ul className="rail-scroll -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 xl:grid xl:grid-cols-5 xl:overflow-visible xl:pb-0">
        {loading
          ? Array.from({ length: 5 }, (_, i) => (
              <li
                key={`${rail.id}-skeleton-${i}`}
                className="w-[62vw] max-w-[220px] flex-shrink-0 snap-start sm:w-[46vw] md:w-[30vw] xl:w-auto xl:max-w-none"
                aria-hidden="true"
              >
                <RailProductSkeleton />
              </li>
            ))
          : rail.items.map((product, i) => (
              <Reveal
                as="li"
                key={product.id}
                delay={i * 60}
                className="w-[62vw] max-w-[220px] flex-shrink-0 snap-start sm:w-[46vw] md:w-[30vw] xl:w-auto xl:max-w-none"
              >
                <RailProductCard product={product} accent={rail.accent} />
              </Reveal>
            ))}
      </ul>
    </section>
  )
}
