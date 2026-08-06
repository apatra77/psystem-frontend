import { ShimmerBar, ShimmerCard, ShimmerCircle, ShimmerPage, repeat } from '../primitives'

/** Mirrors ProfilePage: identity strip above a two-column form card. */
export default function ProfileShimmer({ fields = 4 }) {
  return (
    <ShimmerPage label="Loading profile">
      <ShimmerBar width={130} height={22} />

      <ShimmerCard className="mt-5 max-w-[560px]" padding={24}>
        <div className="flex items-center gap-4">
          <ShimmerCircle size={64} />
          <div className="min-w-0 flex-1">
            <ShimmerBar width="52%" height={15} />
            <ShimmerBar className="mt-2" width="38%" height={12} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {repeat(fields, (i) => (
            <div key={i}>
              <ShimmerBar width="42%" height={11} />
              <ShimmerBar className="mt-2" height={42} radius={12} />
            </div>
          ))}
        </div>

        <ShimmerBar className="mt-6" width={148} height={44} radius={13} />
      </ShimmerCard>
    </ShimmerPage>
  )
}
