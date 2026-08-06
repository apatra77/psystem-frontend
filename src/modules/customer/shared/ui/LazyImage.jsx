import { useState } from 'react'
import { colors } from '@/app/themes/colors'

/**
 * Native lazy loading plus a skeleton until the bytes arrive, so long product
 * grids don't fetch every image up front.
 */
export default function LazyImage({ src, alt, className = '', style, fallback = '💊', ratio = '1 / 1' }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: ratio, background: 'rgba(255,255,255,0.05)', ...style }}
    >
      {!src || failed ? (
        <span className="absolute inset-0 flex items-center justify-center text-3xl">{fallback}</span>
      ) : (
        <>
          {!loaded && <span className="absolute inset-0 animate-pulse" style={{ background: colors.borderSubtle }} />}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className="w-full h-full object-cover"
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity .25s ease' }}
          />
        </>
      )}
    </div>
  )
}
