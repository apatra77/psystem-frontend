import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Loader2, Plus } from 'lucide-react'
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
  const blurTimerRef = useRef(null)
  const loadMoreRef = useRef(() => {})
  const hasMoreRef = useRef(false)
  const loadingRef = useRef(false)
  const loadingMoreRef = useRef(false)

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
  hasMoreRef.current = hasMore
  loadingRef.current = loading
  loadingMoreRef.current = loadingMore

  const trimmedInput = inputText.trim()
  const displayValue = open ? inputText : value
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
    if (
      remaining < 48 &&
      hasMoreRef.current &&
      !loadingMoreRef.current &&
      !loadingRef.current
    ) {
      loadMoreRef.current()
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
        <div className="relative">
          <input
            type="text"
            disabled={disabled}
            value={displayValue}
            placeholder={placeholder}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full rounded-[10px] px-3 py-2 pr-8 text-[13px] text-white font-[inherit] outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.16)',
              color: displayValue ? '#ffffff' : colors.textDim,
            }}
            role="combobox"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            aria-haspopup="listbox"
          />
          <ChevronDown
            size={14}
            strokeWidth={2.2}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              color: colors.textDim,
              transform: open ? 'rotate(180deg)' : undefined,
              transition: 'transform 0.15s ease',
            }}
            aria-hidden="true"
          />
        </div>

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
                    onMouseEnter={() => setHighlightIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => commitSelection(item)}
                    className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] font-bold cursor-pointer transition-colors hover:bg-[rgba(64,222,170,0.08)]"
                    style={{
                      color: isHighlighted || isSelected ? colors.accent : '#cfe6dc',
                      background:
                        isHighlighted || isSelected ? 'rgba(64,222,170,0.1)' : 'transparent',
                    }}
                  >
                    {item.name}
                  </button>
                )
              })
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
