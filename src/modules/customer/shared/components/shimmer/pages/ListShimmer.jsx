import { ShimmerBar, ShimmerCard, ShimmerPage, repeat } from '../primitives'

/**
 * Mirrors the flat account list screens — addresses, payment methods,
 * prescriptions, notifications, complaints — which all render a title above a
 * stack of equal-height cards. `rows` and `withIcon` cover the variations.
 */
export default function ListShimmer({ rows = 4, withIcon = true, label = 'Loading' }) {
  return (
    <ShimmerPage label={label}>
      <div className="flex items-center justify-between gap-4">
        <ShimmerBar width={170} height={22} />
        <ShimmerBar width={124} height={36} radius={11} />
      </div>

      <div className="mt-5 space-y-3">
        {repeat(rows, (i) => (
          <ShimmerCard key={i} padding={18} className="flex items-center gap-4">
            {withIcon && <ShimmerBar width={40} height={40} radius={12} />}
            <div className="min-w-0 flex-1">
              <ShimmerBar width="48%" height={13} />
              <ShimmerBar className="mt-2" width="72%" height={12} />
            </div>
            <ShimmerBar width={78} height={30} radius={9} />
          </ShimmerCard>
        ))}
      </div>
    </ShimmerPage>
  )
}
