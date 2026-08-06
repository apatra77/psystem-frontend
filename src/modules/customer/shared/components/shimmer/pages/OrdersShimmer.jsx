import { ShimmerBar, ShimmerCard, ShimmerPage, repeat } from '../primitives'

/** Mirrors OrdersPage: status tabs above a stack of order cards. */
export default function OrdersShimmer({ rows = 4 }) {
  return (
    <ShimmerPage label="Loading orders">
      <ShimmerBar width={150} height={22} />
      <div className="mt-4 flex flex-wrap gap-2">
        {repeat(4, (i) => <ShimmerBar key={i} width={92} height={32} radius={10} />)}
      </div>

      <div className="mt-5 space-y-3">
        {repeat(rows, (i) => (
          <ShimmerCard key={i} padding={20}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <ShimmerBar width={128} height={15} />
                  <ShimmerBar width={78} height={20} radius={99} />
                </div>
                <ShimmerBar className="mt-2.5" width="46%" height={12} />
                <ShimmerBar className="mt-2" width="62%" height={12} />
              </div>
              <div className="flex gap-2">
                <ShimmerBar width={94} height={32} radius={9} />
                <ShimmerBar width={82} height={32} radius={9} />
              </div>
            </div>
          </ShimmerCard>
        ))}
      </div>
    </ShimmerPage>
  )
}
