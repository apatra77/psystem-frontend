import AppShellShimmer from '@/shared/components/shimmer/pages/AppShellShimmer'

/**
 * Outer Suspense fallback only.
 *
 * Individual routes declare their own page-specific shimmer via `suspend()` in
 * @/app/router/suspend, so this neutral shell is reached only by chunks that
 * sit outside a route boundary (error pages, redirects). Do not use it as the
 * fallback for a real page — register a shimmer instead.
 */
export default function RouteFallback() {
  return <AppShellShimmer />
}
