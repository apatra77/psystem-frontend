import { ShimmerBar, ShimmerCard, ShimmerPage, repeat } from '../primitives'

/** Mirrors WishlistPage: saved products in a compact card grid. */
export default function WishlistShimmer({ items = 6 }) {
  return (
    <ShimmerPage label="Loading wishlist">
      <ShimmerBar width={140} height={22} />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {repeat(items, (i) => (
          <ShimmerCard key={i} padding={12} className="flex flex-col gap-2.5">
            <ShimmerBar height={118} radius={12} />
            <ShimmerBar height={13} />
            <ShimmerBar width="62%" height={13} />
            <ShimmerBar className="mt-1" height={30} radius={99} />
          </ShimmerCard>
        ))}
      </div>
    </ShimmerPage>
  )
}
