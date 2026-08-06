import { ShimmerBar, ShimmerCard, ShimmerPage, repeat } from '../primitives'

/** Mirrors SearchPage / category listing: filter rail plus a product grid. */
export default function ProductGridShimmer({ items = 9 }) {
  return (
    <ShimmerPage label="Loading products">
      <ShimmerBar width={230} height={24} />
      <ShimmerBar className="mt-2.5" width={150} height={13} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <ShimmerCard className="hidden h-fit lg:block" padding={20}>
          <div className="mb-4 flex items-center justify-between">
            <ShimmerBar width={90} height={14} />
            <ShimmerBar width={46} height={12} />
          </div>
          {repeat(4, (i) => (
            <div key={i} className="mb-5">
              <ShimmerBar width="46%" height={11} />
              <div className="mt-2.5 grid gap-2">
                {repeat(3, (j) => <ShimmerBar key={j} height={13} width={j === 2 ? '68%' : '100%'} />)}
              </div>
            </div>
          ))}
        </ShimmerCard>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {repeat(4, (i) => <ShimmerBar key={i} width={96} height={34} radius={11} />)}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {repeat(items, (i) => (
              <ShimmerCard key={i} padding={12} className="flex flex-col gap-2.5">
                <ShimmerBar height={130} radius={12} />
                <ShimmerBar width="52%" height={11} />
                <ShimmerBar height={13} />
                <ShimmerBar width="72%" height={13} />
                <div className="mt-1 flex items-center gap-2">
                  <ShimmerBar width={62} height={16} />
                  <ShimmerBar className="ml-auto" width={70} height={28} radius={99} />
                </div>
              </ShimmerCard>
            ))}
          </div>
        </div>
      </div>
    </ShimmerPage>
  )
}
