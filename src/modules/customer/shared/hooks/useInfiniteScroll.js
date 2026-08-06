import { useEffect, useRef } from 'react'

/**
 * Calls `onLoadMore` when the sentinel scrolls into view.
 *   const ref = useInfiniteScroll(hasMore, loadMore)
 *   <div ref={ref} />
 */
export function useInfiniteScroll(hasMore, onLoadMore, { rootMargin = '240px' } = {}) {
  const sentinelRef = useRef(null)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore) return undefined

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onLoadMore() },
      { rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore, rootMargin])

  return sentinelRef
}

export default useInfiniteScroll
