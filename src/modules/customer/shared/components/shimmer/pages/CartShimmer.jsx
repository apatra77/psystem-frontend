import { ShimmerBar, ShimmerCard, ShimmerPage, repeat } from '../primitives'

/** Mirrors CartPage: line-item rows on the left, sticky bill summary on the right. */
export default function CartShimmer({ rows = 3 }) {
  return (
    <ShimmerPage label="Loading cart">
      <ShimmerBar width={170} height={24} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="space-y-3">
          {repeat(rows, (i) => (
            <ShimmerCard key={i} padding={16} className="flex items-center gap-4">
              <ShimmerBar width={56} height={56} radius={12} />
              <div className="min-w-0 flex-1">
                <ShimmerBar width="58%" height={14} />
                <ShimmerBar className="mt-2" width="34%" height={12} />
              </div>
              <ShimmerBar className="hidden sm:block" width={104} height={36} radius={11} />
              <ShimmerBar width={72} height={16} />
            </ShimmerCard>
          ))}
        </div>

        <ShimmerCard className="h-fit" padding={20}>
          <ShimmerBar width={110} height={15} />
          <div className="mt-4 flex gap-2">
            <ShimmerBar height={38} radius={11} />
            <ShimmerBar width={78} height={38} radius={11} />
          </div>
          <div className="mt-5 grid gap-3">
            {repeat(4, (i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <ShimmerBar width="46%" height={12} />
                <ShimmerBar width={62} height={12} />
              </div>
            ))}
          </div>
          <ShimmerBar className="mt-5" height={46} radius={13} />
        </ShimmerCard>
      </div>
    </ShimmerPage>
  )
}
