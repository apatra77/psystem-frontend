import { Suspense } from 'react'
import PageShimmer from '@/shared/components/shimmer/PageShimmer'
import RouteBoundary from '@/shared/components/feedback/RouteBoundary'

/**
 * Wraps a lazy route element in its own error boundary + Suspense boundary:
 *
 *   <Route path="/cart" element={suspend(<CartPage />, 'cart')} />
 *
 * The boundary means a crash inside one page renders an inline retry instead of
 * blanking the whole app, and the Suspense fallback is the shimmer that matches
 * that page's layout. `shimmer` is a key in
 * @/shared/components/shimmer/registry; an unknown key degrades to the neutral
 * app shell rather than throwing.
 */
export const suspend = (element, shimmer = 'default') => (
  <RouteBoundary>
    <Suspense fallback={<PageShimmer name={shimmer} />}>{element}</Suspense>
  </RouteBoundary>
)

export default suspend
