import { ShimmerBar, ShimmerCard, ShimmerPage, repeat } from '../primitives'

/**
 * Neutral last-resort shimmer. Only used by the router's outer Suspense
 * boundary, which catches chunks that have no page-specific shimmer registered
 * (error pages, redirects). Every real route gets its own.
 */
export default function AppShellShimmer() {
  return (
    <ShimmerPage label="Loading" className="space-y-4 p-8">
      <ShimmerBar width="34%" height={30} />
      <ShimmerBar width="52%" height={14} />
      <div className="grid gap-4 pt-3 sm:grid-cols-2 xl:grid-cols-4">
        {repeat(4, (i) => <ShimmerCard key={i} padding={0}><ShimmerBar height={104} radius={18} /></ShimmerCard>)}
      </div>
      <ShimmerBar height={280} radius={18} />
    </ShimmerPage>
  )
}
