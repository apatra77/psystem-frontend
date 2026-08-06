import { ShimmerBar, ShimmerCard, ShimmerPage, repeat } from '../primitives'

/** Mirrors the admin / super-admin dashboards: KPI row, chart, activity panel. */
export default function DashboardShimmer() {
  return (
    <ShimmerPage label="Loading dashboard" className="space-y-5">
      <div>
        <ShimmerBar width={210} height={24} />
        <ShimmerBar className="mt-2.5" width={280} height={13} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {repeat(4, (i) => (
          <ShimmerCard key={i} padding={20}>
            <ShimmerBar width="52%" height={11} />
            <ShimmerBar className="mt-3" width="66%" height={26} />
            <ShimmerBar className="mt-3" width="40%" height={11} />
          </ShimmerCard>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ShimmerCard padding={20}>
          <ShimmerBar width={170} height={14} />
          <ShimmerBar className="mt-5" height={240} radius={14} />
        </ShimmerCard>
        <ShimmerCard padding={20}>
          <ShimmerBar width={140} height={14} />
          <div className="mt-5 grid gap-4">
            {repeat(5, (i) => (
              <div key={i} className="flex items-center gap-3">
                <ShimmerBar width={34} height={34} radius={11} />
                <div className="min-w-0 flex-1">
                  <ShimmerBar width="64%" height={12} />
                  <ShimmerBar className="mt-2" width="40%" height={11} />
                </div>
              </div>
            ))}
          </div>
        </ShimmerCard>
      </div>
    </ShimmerPage>
  )
}
