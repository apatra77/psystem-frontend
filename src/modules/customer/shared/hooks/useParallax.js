import { useEffect, useRef } from 'react'

/**
 * Scroll parallax for a decorative element.
 *
 * Writes `transform` from inside a rAF tick and skips the write when the offset
 * has not changed, so scrolling stays on the compositor. Disabled outright when
 * the user prefers reduced motion, and on touch-width viewports where the
 * decorations are hidden anyway.
 */
export default function useParallax(depth = 0.2, { enabled = true } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node || !enabled || typeof window === 'undefined') return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let frame = 0
    let last = null

    const tick = () => {
      frame = 0
      const offset = -(window.scrollY * depth)
      if (last === null || Math.abs(offset - last) > 0.5) {
        last = offset
        node.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`
      }
    }

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(tick)
    }

    tick()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [depth, enabled])

  return ref
}
