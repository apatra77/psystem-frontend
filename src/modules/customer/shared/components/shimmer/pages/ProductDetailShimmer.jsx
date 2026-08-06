import { ShimmerBar, ShimmerCard, ShimmerPage, ShimmerText, repeat } from '../primitives'

/** Mirrors ProductDetailPage: gallery panel, buying column, then related rail. */
export default function ProductDetailShimmer() {
  return (
    <ShimmerPage label="Loading product" className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <ShimmerCard className="min-h-[320px]" padding={0}>
          <ShimmerBar height="100%" radius={22} style={{ minHeight: 320 }} />
        </ShimmerCard>

        <div>
          <div className="mb-3 flex gap-2">
            {repeat(2, (i) => <ShimmerBar key={i} width={70} height={22} radius={99} />)}
          </div>
          <ShimmerBar height={30} width="86%" />
          <ShimmerBar className="mt-2.5" height={14} width="52%" />
          <ShimmerBar className="mt-3" height={14} width="38%" />
          <div className="mt-5 flex items-end gap-3">
            <ShimmerBar width={128} height={32} />
            <ShimmerBar width={68} height={18} />
          </div>
          <ShimmerText className="mt-5" lines={3} height={13} />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ShimmerBar width={124} height={44} radius={12} />
            <ShimmerBar width={168} height={44} radius={12} />
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3">
            {repeat(4, (i) => <ShimmerBar key={i} height={56} radius={14} />)}
          </div>
        </div>
      </div>

      <div>
        <ShimmerBar width={190} height={20} />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {repeat(4, (i) => (
            <ShimmerCard key={i} padding={12} className="flex flex-col gap-2.5">
              <ShimmerBar height={118} radius={12} />
              <ShimmerBar height={13} />
              <ShimmerBar width="60%" height={13} />
            </ShimmerCard>
          ))}
        </div>
      </div>
    </ShimmerPage>
  )
}
