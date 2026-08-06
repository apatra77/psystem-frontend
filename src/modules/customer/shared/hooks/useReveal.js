import { useEffect, useRef } from 'react'

/**
 * Reveal-on-scroll. Attach the returned ref to any element carrying the
 * `reveal-on-scroll` class; it gains `is-visible` the first time it enters the
 * viewport and is unobserved immediately after, so the observer never keeps
 * work alive for elements that have already animated.
 *
 * Falls back to visible-by-default where IntersectionObserver is missing, and
 * the CSS itself no-ops under prefers-reduced-motion.
 */
export default function useReveal({ threshold = 0.12, rootMargin = '0px 0px -40px 0px' } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-visible')
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold, rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return ref
}
