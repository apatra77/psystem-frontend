import { shimmerFor } from './registry'

/**
 * Renders the shimmer registered for `name`. Use this anywhere a page-shaped
 * placeholder is needed — Suspense fallbacks, but also in-page data loading
 * states, so the lazy-load skeleton and the data skeleton stay identical.
 */
export default function PageShimmer({ name = 'default' }) {
  return shimmerFor(name)
}
