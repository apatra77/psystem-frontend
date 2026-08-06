import { ShimmerBar, ShimmerCard, ShimmerPage, repeat } from '../primitives'

/**
 * Mirrors the single-card form screens — prescription upload, custom order,
 * support and the auth screens. `fields` and `wide` are the only differences
 * between them, so one shimmer covers the set instead of five near-copies.
 */
export default function FormShimmer({ fields = 4, wide = false, label = 'Loading' }) {
  return (
    <ShimmerPage label={label}>
      <ShimmerBar width={190} height={22} />
      <ShimmerBar className="mt-2.5" width={260} height={13} />

      <ShimmerCard className={`mt-5 ${wide ? 'max-w-[760px]' : 'max-w-[520px]'}`} padding={24}>
        <div className="grid gap-4">
          {repeat(fields, (i) => (
            <div key={i}>
              <ShimmerBar width="34%" height={11} />
              <ShimmerBar className="mt-2" height={42} radius={12} />
            </div>
          ))}
        </div>
        <ShimmerBar className="mt-6" height={46} radius={13} />
      </ShimmerCard>
    </ShimmerPage>
  )
}
