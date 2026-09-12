import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Search } from 'lucide-react'
import { PATHS, buildPath } from '@/app/router/paths'
import { useCatalogStore } from '@/app/store/catalogStore'
import { useProductSearchSuggestions } from '@/modules/customer/hooks/useProductSearchSuggestions'
import { colors } from '@/app/themes/colors'

function ProductThumb({ product }) {
  if (product.imageUrl) {
    return (
      <img
        src={product.imageUrl}
        alt=""
        className="h-11 w-11 rounded-[10px] object-cover flex-shrink-0"
        style={{ border: `1px solid ${colors.borderSubtle}` }}
      />
    )
  }

  return (
    <div
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] text-lg"
      style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${colors.borderSubtle}` }}
      aria-hidden="true"
    >
      💊
    </div>
  )
}

function buildSubtitle(product) {
  const parts = [product.brand, product.pack].filter(Boolean)
  return parts.join(' · ') || product.desc || 'View product details'
}

export default function ProductSearchAutocomplete({
  value,
  onChange,
  onSubmitSearch,
  placeholder = 'Search medicines, salt composition, lab tests…',
  className = '',
  compact = false,
}) {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const blurTimerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)

  const setFilter = useCatalogStore((s) => s.setFilter)
  const { suggestions, loading } = useProductSearchSuggestions(value)

  const trimmed = value.trim()
  const showDropdown = open && trimmed.length >= 2

  useEffect(() => {
    setHighlightIndex(0)
  }, [suggestions, value])

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!showDropdown) return undefined

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  const goToShop = (term = trimmed) => {
    const next = term.trim()
    setFilter({ query: next })
    setOpen(false)
    onSubmitSearch?.(next)
    if (next) {
      navigate(`${PATHS.customer.search}?${new URLSearchParams({ q: next })}`)
    } else {
      navigate(PATHS.customer.search)
    }
  }

  const goToProduct = (product) => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    setOpen(false)
    navigate(buildPath(PATHS.customer.product, { id: product.id }))
  }

  const handleFocus = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    setOpen(true)
  }

  const handleBlur = () => {
    blurTimerRef.current = setTimeout(() => setOpen(false), 150)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      return
    }

    if (!showDropdown || suggestions.length === 0) {
      if (event.key === 'Enter') {
        event.preventDefault()
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightIndex((prev) => Math.max(prev - 1, 0))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const item = suggestions[highlightIndex]
      if (item) goToProduct(item)
    }
  }

  return (
    <div ref={containerRef} className={`relative min-w-0 flex-1 ${className}`}>
      <div
        className={`flex items-center gap-2 rounded-[14px] ${compact ? 'px-3 py-2' : 'py-1.5 pl-4 pr-1.5'}`}
        style={{ background: 'rgba(255,255,255,.07)', border: `1px solid ${colors.borderStrong}` }}
      >
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
          style={{ color: colors.textBright }}
          aria-label="Search products"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          role="combobox"
        />

        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => goToShop()}
          className={`flex flex-shrink-0 items-center justify-center cursor-pointer transition-opacity hover:opacity-80 ${compact ? 'h-9 w-9 pr-0.5' : 'h-10 w-10 pr-1'}`}
          style={{ color: colors.accentSoft }}
          aria-label="Search in shop"
        >
          <Search size={compact ? 17 : 18} strokeWidth={2} />
        </button>
      </div>

      {showDropdown && (
        <div
          role="listbox"
          className="absolute top-[calc(100%+8px)] left-0 right-0 z-[120] overflow-hidden rounded-[14px] py-1.5"
          style={{
            background: 'rgba(10,28,22,0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.13)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
          }}
        >
          {loading ? (
            <div
              className="flex items-center justify-center gap-2 px-4 py-4 text-[12px] font-bold"
              style={{ color: colors.textDim }}
            >
              <Loader2 size={14} className="animate-spin" />
              Searching…
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-[12px] font-semibold" style={{ color: colors.textDim }}>
              No products found for &quot;{trimmed}&quot;
            </div>
          ) : (
            suggestions.map((product, index) => {
              const highlighted = index === highlightIndex
              return (
                <button
                  key={product.id}
                  type="button"
                  role="option"
                  aria-selected={highlighted}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => goToProduct(product)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left cursor-pointer transition-colors"
                  style={{
                    background: highlighted ? 'rgba(64,222,170,0.1)' : 'transparent',
                  }}
                >
                  <ProductThumb product={product} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[13px] font-extrabold"
                      style={{ color: highlighted ? colors.accent : colors.textBright }}
                    >
                      {product.name}
                    </div>
                    <div className="mt-0.5 truncate text-[11.5px]" style={{ color: colors.textDim }}>
                      {buildSubtitle(product)}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
