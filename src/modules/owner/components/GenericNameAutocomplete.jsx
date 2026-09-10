import { useEffect, useRef, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import PortalModal from './PortalModal'
import Spinner from '@/components/ui/Spinner'
import { toast } from '@/app/store/uiStore'
import { useGenericNameSearch } from '../hooks/useGenericNameSearch'
import { createGenericName } from '@/services/genericNames'
import { colors } from '@/theme/colors'

function AddGenericConfirmModal({ name, onClose, onConfirm, saving, error }) {
  return (
    <PortalModal onClose={onClose} width={420} scrollable={false} closeOnBackdrop={!saving} zIndex={320}>
      <div className="p-6">
        <div className="text-[17px] font-extrabold text-white mb-2">Add generic name?</div>
        <p className="text-[13px] leading-relaxed mb-1" style={{ color: colors.textSecondary }}>
          Are you sure you want to add{' '}
          <span className="font-semibold text-white">{name}</span>?
        </p>
        <p className="text-[12px]" style={{ color: colors.textDim }}>
          This name is not in the catalog yet.
        </p>
        {error ? <p className="mt-3 text-[12px] font-bold text-red-400">{error}</p> : null}
        <div className="flex justify-end gap-2.5 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-[12.5px] font-bold px-[18px] py-2 rounded-[10px] cursor-pointer disabled:opacity-60"
            style={{
              color: colors.textHighlight,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.16)',
            }}
          >
            No
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="text-[12.5px] font-extrabold px-5 py-2 rounded-[10px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            style={{
              color: colors.accentText,
              background: colors.primaryBtn,
              boxShadow: '0 6px 18px rgba(64,222,170,0.35)',
            }}
          >
            {saving ? (
              <>
                <Spinner />
                Adding…
              </>
            ) : (
              'Yes'
            )}
          </button>
        </div>
      </div>
    </PortalModal>
  )
}

export default function GenericNameAutocomplete({
  value = '',
  onChange,
  disabled = false,
  placeholder = 'e.g. Amlodipine',
}) {
  const containerRef = useRef(null)
  const listRef = useRef(null)
  const sentinelRef = useRef(null)
  const blurTimerRef = useRef(null)
  const loadMoreRef = useRef(() => {})

  const [open, setOpen] = useState(false)
  const [inputText, setInputText] = useState(value)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const {
    debouncedQuery,
    suggestions,
    totalElements,
    loading,
    loadingMore,
    error: searchError,
    hasMore,
    loadMore,
  } = useGenericNameSearch(inputText)

  loadMoreRef.current = loadMore

  const trimmedInput = inputText.trim()
  const showDropdown = open && trimmedInput.length > 0 && !confirmOpen
  const isSearchPending = trimmedInput.length > 0 && debouncedQuery !== trimmedInput
  const showEmptyAddState =
    trimmedInput.length > 0 &&
    !loading &&
    !isSearchPending &&
    debouncedQuery === trimmedInput &&
    totalElements === 0 &&
    !searchError

  useEffect(() => {
    if (!open) setInputText(value)
  }, [value, open])

  useEffect(() => {
    setHighlightIndex(0)
  }, [suggestions, inputText])

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

  useEffect(() => {
    if (!showDropdown || !hasMore || loading || loadingMore) return undefined

    const root = listRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreRef.current()
        }
      },
      {
        root,
        rootMargin: '24px',
        threshold: 0,
      },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [showDropdown, hasMore, loading, loadingMore, suggestions.length])

  const commitSelection = (item) => {
    const name = item?.name ?? ''
    setInputText(name)
    onChange?.({ name, id: item?.id ?? '' })
    setOpen(false)
  }

  const handleInputChange = (event) => {
    const next = event.target.value
    setInputText(next)
    onChange?.({ name: next, id: '' })
    if (!open) setOpen(true)
  }

  const handleFocus = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    setOpen(true)
  }

  const handleBlur = () => {
    blurTimerRef.current = setTimeout(() => {
      setOpen(false)
      setInputText(value)
    }, 150)
  }

  const handleScroll = (event) => {
    const node = event.currentTarget
    const remaining = node.scrollHeight - node.scrollTop - node.clientHeight
    if (remaining < 48 && hasMore && !loadingMore && !loading) {
      loadMore()
    }
  }

  const handleKeyDown = (event) => {
    if (disabled) return

    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      setInputText(value)
      return
    }

    if (!showDropdown) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightIndex((prev) => Math.min(prev + 1, Math.max(suggestions.length - 1, 0)))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightIndex((prev) => Math.max(prev - 1, 0))
      return
    }

    if (event.key === 'Enter' && suggestions.length > 0) {
      event.preventDefault()
      const item = suggestions[highlightIndex]
      if (item) commitSelection(item)
    }
  }

  const openConfirm = () => {
    if (!trimmedInput) return
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    setOpen(false)
    setCreateError('')
    setConfirmOpen(true)
  }

  const handleConfirmAdd = async () => {
    if (creating || !trimmedInput) return

    setCreating(true)
    setCreateError('')

    try {
      const created = await createGenericName({ name: trimmedInput })
      toast.success(`Generic name "${created.name}" added`)
      commitSelection(created)
      setConfirmOpen(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not add generic name')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <div ref={containerRef} className="relative">
        <input
          type="text"
          disabled={disabled}
          value={inputText}
          placeholder={placeholder}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full rounded-[10px] px-3 py-2 text-[13px] text-white font-[inherit] outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.16)',
          }}
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-haspopup="listbox"
        />

        {showDropdown && (
          <div
            ref={listRef}
            role="listbox"
            onScroll={handleScroll}
            className="absolute top-[calc(100%+6px)] left-0 right-0 z-[300] rounded-[10px] p-1.5 owner-dropdown max-h-[220px] overflow-y-auto owner-scroll"
            style={{
              background: 'rgba(10,28,22,0.97)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.13)',
              boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
            }}
          >
            {loading || isSearchPending ? (
              <div
                className="px-3 py-3 text-[12px] font-bold flex items-center justify-center gap-2"
                style={{ color: colors.textDim }}
              >
                <Loader2 size={14} className="animate-spin" />
                Searching…
              </div>
            ) : searchError ? (
              <div className="px-3 py-3 text-[12px] font-bold text-red-400">{searchError}</div>
            ) : showEmptyAddState ? (
              <>
                <div className="px-3 py-2 text-[11px] font-semibold truncate" style={{ color: colors.textDim }}>
                  No results for &quot;{trimmedInput}&quot;
                </div>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={openConfirm}
                  className="w-full text-left px-3 py-2 rounded-[8px] text-[12px] font-extrabold cursor-pointer flex items-center gap-1.5 transition-colors hover:bg-white/6"
                  style={{ color: colors.accent }}
                >
                  <Plus size={13} strokeWidth={2.4} />
                  Add as new generic name
                </button>
              </>
            ) : suggestions.length === 0 ? (
              <div className="px-3 py-2 text-[11px] font-semibold" style={{ color: colors.textDim }}>
                No matches found
              </div>
            ) : (
              suggestions.map((item, index) => {
                const isHighlighted = index === highlightIndex
                const isSelected = item.name === value
                return (
                  <button
                    key={item.id || `${item.name}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => commitSelection(item)}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-[12.5px] font-bold cursor-pointer transition-colors"
                    style={{
                      color: isHighlighted || isSelected ? colors.accentText : colors.textHighlight,
                      background:
                        isHighlighted || isSelected ? 'rgba(64,222,170,0.16)' : 'transparent',
                    }}
                  >
                    {item.name}
                  </button>
                )
              })
            )}

            {hasMore && suggestions.length > 0 && (
              <div ref={sentinelRef} className="min-h-[1px] w-full" aria-hidden="true" />
            )}

            {loadingMore && (
              <div
                className="px-3 py-2 text-[11px] font-bold flex items-center justify-center gap-2"
                style={{ color: colors.textDim }}
              >
                <Loader2 size={12} className="animate-spin" />
                Loading more…
              </div>
            )}

            {!loading && !loadingMore && hasMore && suggestions.length > 0 && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => loadMoreRef.current()}
                className="w-full mt-1 px-3 py-2 rounded-[8px] text-[11px] font-extrabold cursor-pointer hover:bg-white/6"
                style={{ color: colors.accent }}
              >
                Load more results
              </button>
            )}
          </div>
        )}
      </div>

      {confirmOpen && (
        <AddGenericConfirmModal
          name={trimmedInput}
          saving={creating}
          error={createError}
          onClose={() => {
            if (creating) return
            setConfirmOpen(false)
            setCreateError('')
          }}
          onConfirm={handleConfirmAdd}
        />
      )}
    </>
  )
}
