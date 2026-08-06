import { ShimmerBar, ShimmerCard, ShimmerPage, ShimmerText, repeat } from '../primitives'

/** Mirrors StaticContentPage: title, then stacked prose sections. */
export default function ArticleShimmer({ sections = 3 }) {
  return (
    <ShimmerPage label="Loading page">
      <ShimmerBar width={220} height={24} />
      <ShimmerBar className="mt-2.5" width={320} height={13} />

      <div className="mt-5 max-w-[760px] space-y-5">
        {repeat(sections, (i) => (
          <ShimmerCard key={i} padding={24}>
            <ShimmerBar width="38%" height={15} />
            <ShimmerText className="mt-3.5" lines={3} height={12} />
          </ShimmerCard>
        ))}
      </div>
    </ShimmerPage>
  )
}
