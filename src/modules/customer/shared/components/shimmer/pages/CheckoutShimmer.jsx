import { ShimmerBar, ShimmerCard, ShimmerPage, repeat } from '../primitives'

/** Mirrors CheckoutPage: address / delivery / payment steps beside the order total. */
export default function CheckoutShimmer() {
  return (
    <ShimmerPage label="Loading checkout">
      <ShimmerBar width={150} height={24} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="space-y-3">
          {repeat(3, (i) => (
            <ShimmerCard key={i} padding={20}>
              <div className="flex items-center gap-3">
                <ShimmerBar width={26} height={26} radius="50%" />
                <ShimmerBar width={160} height={14} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {repeat(2, (j) => <ShimmerBar key={j} height={64} radius={14} />)}
              </div>
            </ShimmerCard>
          ))}
        </div>

        <ShimmerCard className="h-fit" padding={20}>
          <ShimmerBar width={120} height={14} />
          <div className="mt-4 grid gap-3">
            {repeat(4, (i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <ShimmerBar width="46%" height={12} />
                <ShimmerBar width={56} height={12} />
              </div>
            ))}
          </div>
          <ShimmerBar className="mt-5" height={46} radius={13} />
        </ShimmerCard>
      </div>
    </ShimmerPage>
  )
}
