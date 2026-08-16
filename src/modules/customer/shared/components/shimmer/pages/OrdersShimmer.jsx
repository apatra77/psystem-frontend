import { ShimmerBar, ShimmerCard, ShimmerPage, repeat } from '../primitives'

/** Mirrors OrdersPage: tabs above thumbnail cards with chevron, no action buttons. */
export default function OrdersShimmer({ rows = 4 }) {
  return (
    <ShimmerPage label="Loading orders">
      <ShimmerBar width={150} height={22} />
      <div className="mt-4 flex flex-wrap gap-2">
        {repeat(5, (i) => <ShimmerBar key={i} width={96} height={32} radius={10} />)}
      </div>

      <div className="mt-5 space-y-3">
        {repeat(rows, (i) => (
          <ShimmerCard key={i} padding={16}>
            <div className="flex gap-3.5">
              <ShimmerBar width={72} height={72} radius={12} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <ShimmerBar width={148} height={14} />
                  <ShimmerBar width={84} height={22} radius={99} />
                </div>
                <ShimmerBar className="mt-2.5" width="58%" height={11} />
                <ShimmerBar className="mt-2" width="88%" height={11} />
                <div className="mt-3 flex justify-end">
                  <ShimmerBar width={72} height={28} />
                </div>
              </div>
              <ShimmerBar width={18} height={18} radius={4} />
            </div>
          </ShimmerCard>
        ))}
      </div>
    </ShimmerPage>
  )
}
