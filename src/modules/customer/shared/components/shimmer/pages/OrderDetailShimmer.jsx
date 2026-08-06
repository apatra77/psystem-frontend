import { ShimmerBar, ShimmerCard, ShimmerPage, repeat } from '../primitives'

/** Mirrors OrderDetailPage / OrderTrackingPage: item list beside a summary panel. */
export default function OrderDetailShimmer() {
  return (
    <ShimmerPage label="Loading order">
      <ShimmerBar width={200} height={22} />
      <ShimmerBar className="mt-2.5" width={140} height={13} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <div className="space-y-3">
          <ShimmerCard padding={20}>
            <ShimmerBar width={130} height={14} />
            <div className="mt-5 grid gap-4">
              {repeat(4, (i) => (
                <div key={i} className="flex items-center gap-3">
                  <ShimmerBar width={26} height={26} radius="50%" />
                  <ShimmerBar width={`${70 - i * 8}%`} height={12} />
                </div>
              ))}
            </div>
          </ShimmerCard>

          {repeat(2, (i) => (
            <ShimmerCard key={i} padding={16} className="flex items-center gap-4">
              <ShimmerBar width={52} height={52} radius={12} />
              <div className="min-w-0 flex-1">
                <ShimmerBar width="56%" height={13} />
                <ShimmerBar className="mt-2" width="30%" height={12} />
              </div>
              <ShimmerBar width={66} height={15} />
            </ShimmerCard>
          ))}
        </div>

        <ShimmerCard className="h-fit" padding={20}>
          <ShimmerBar width={120} height={14} />
          <div className="mt-4 grid gap-3">
            {repeat(5, (i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <ShimmerBar width="48%" height={12} />
                <ShimmerBar width={58} height={12} />
              </div>
            ))}
          </div>
        </ShimmerCard>
      </div>
    </ShimmerPage>
  )
}
