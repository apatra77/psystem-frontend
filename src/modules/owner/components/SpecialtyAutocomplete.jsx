import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Loader2, Plus } from 'lucide-react'
import PortalModal from './PortalModal'
import Spinner from '@/components/ui/Spinner'
import { toast } from '@/app/store/uiStore'
import {
  createMedicalSpecialty,
  fetchMedicalSpecialties,
} from '@/services/medicalSpecialties'
import { colors } from '@/theme/colors'

function AddSpecialtyConfirmModal({ name, onClose, onConfirm, saving, error }) {
  return (
    <PortalModal onClose={onClose} width={420} scrollable={false} closeOnBackdrop={!saving} zIndex={320}>
      <div className="p-6">
        <div className="text-[17px] font-extrabold text-white mb-2">Add specialty?</div>
        <p className="text-[13px] leading-relaxed mb-1" style={{ color: colors.textSecondary }}>
          Are you sure you want to add{' '}
          <span className="font-semibold text-white">{name}</span>?
        </p>
        <p className="text-[12px]" style={{ color: colors.textDim }}>
          This specialty is not in the catalog yet.
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

export default function SpecialtyAutocomplete({
  specialtyId = '',
  specialtyName = '',
  specialties: specialtiesProp,
  loading: loadingProp,
  loadError: loadErrorProp = '',
  onSpecialtiesChange,
  onChange,
  disabled = false,
  placeholder = 'Search or add specialty',
}) {
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const blurTimerRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [inputText, setInputText] = useState(specialtyName)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [internalSpecialties, setInternalSpecialties] = useState([])
  const [internalLoading, setInternalLoading] = useState(specialtiesProp === undefined)
  const [internalLoadError, setInternalLoadError] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState(null)

  const usesExternalSpecialties = specialtiesProp !== undefined
  const specialties = usesExternalSpecialties ? specialtiesProp : internalSpecialties
  const loading = usesExternalSpecialties ? Boolean(loadingProp) : internalLoading
  const loadError = usesExternalSpecialties ? loadErrorProp : internalLoadError

  useEffect(() => {
    if (usesExternalSpecialties) return undefined

    let cancelled = false

    fetchMedicalSpecialties({ force: true })
      .then((list) => {
        if (!cancelled) setInternalSpecialties(list)
      })
      .catch((err) => {
        if (!cancelled) {
          setInternalSpecialties([])
          setInternalLoadError(err instanceof Error ? err.message : 'Could not load specialties')
        }
      })
      .finally(() => {
        if (!cancelled) setInternalLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [usesExternalSpecialties])

  const trimmedInput = inputText.trim()
  const displayValue = open ? inputText : specialtyName
  const showDropdown = open && !confirmOpen

  const suggestions = useMemo(() => {
    if (!trimmedInput) return specialties
    const query = trimmedInput.toLowerCase()
    return specialties.filter((item) => item.label.toLowerCase().includes(query))
  }, [specialties, trimmedInput])

  const showEmptyAddState =
    trimmedInput.length > 0 && !loading && suggestions.length === 0 && !loadError

  const updateDropdownPosition = () => {
    const node = inputRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      zIndex: 10050,
    })
  }

  useEffect(() => {
    if (!open) setInputText(specialtyName)
  }, [specialtyName, open])

  useEffect(() => {
    setHighlightIndex(0)
  }, [suggestions, inputText])

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!showDropdown) {
      setDropdownStyle(null)
      return undefined
    }

    updateDropdownPosition()

    const handleReposition = () => updateDropdownPosition()
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)

    return () => {
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [showDropdown, suggestions.length, loading])

  useEffect(() => {
    if (!showDropdown) return undefined

    const handleClickOutside = (event) => {
      const target = event.target
      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  const updateSpecialtyList = (nextList) => {
    if (usesExternalSpecialties) {
      onSpecialtiesChange?.(nextList)
      return
    }
    setInternalSpecialties(nextList)
  }

  const commitSelection = (item) => {
    const name = item?.label ?? ''
    const id = item?.id != null ? String(item.id) : ''
    setInputText(name)
    onChange?.({ id, name })
    setOpen(false)
  }

  const handleInputChange = (event) => {
    const next = event.target.value
    setInputText(next)
    onChange?.({ id: '', name: next })
    if (!open) setOpen(true)
  }

  const handleFocus = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    setInputText(specialtyName)
    setOpen(true)
  }

  const toggleDropdown = () => {
    if (disabled) return
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    setOpen((prev) => {
      const next = !prev
      if (next) setInputText(specialtyName)
      return next
    })
  }

  const handleBlur = () => {
    blurTimerRef.current = setTimeout(() => {
      setOpen(false)
      setInputText(specialtyName)
    }, 150)
  }

  const handleKeyDown = (event) => {
    if (disabled) return

    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      setInputText(specialtyName)
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
      const created = await createMedicalSpecialty({ specialtyName: trimmedInput })
      const nextList = [...specialties.filter((item) => String(item.id) !== String(created.id)), created].sort(
        (a, b) => a.label.localeCompare(b.label),
      )
      updateSpecialtyList(nextList)
      toast.success(`Specialty "${created.label}" added`)
      commitSelection(created)
      setConfirmOpen(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not add specialty')
    } finally {
      setCreating(false)
    }
  }

  const dropdownContent = showDropdown && dropdownStyle ? (
    <div
      ref={dropdownRef}
      role="listbox"
      className="rounded-[10px] p-1.5 owner-dropdown max-h-[220px] overflow-y-auto owner-scroll"
      style={{
        ...dropdownStyle,
        background: 'rgba(10,28,22,0.97)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.13)',
        boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
      }}
    >
      {loading ? (
        <div
          className="px-3 py-3 text-[12px] font-bold flex items-center justify-center gap-2"
          style={{ color: colors.textDim }}
        >
          <Loader2 size={14} className="animate-spin" />
          Loading specialties…
        </div>
      ) : loadError ? (
        <div className="px-3 py-3 text-[12px] font-bold text-red-400">{loadError}</div>
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
            Add as new specialty
          </button>
        </>
      ) : suggestions.length === 0 ? (
        <div className="px-3 py-2 text-[11px] font-semibold" style={{ color: colors.textDim }}>
          {trimmedInput ? 'No matches found' : 'No specialties available'}
        </div>
      ) : (
        suggestions.map((item, index) => {
          const isHighlighted = index === highlightIndex
          const isSelected = String(item.id) === String(specialtyId)
          return (
            <button
              key={item.id}
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
              {item.label}
            </button>
          )
        })
      )}
    </div>
  ) : null

  return (
    <>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
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
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()}
            onClick={toggleDropdown}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-white/8"
            aria-label={open ? 'Close specialty list' : 'Show specialty list'}
          >
            <ChevronDown
              size={14}
              strokeWidth={2.2}
              style={{
                color: colors.textDim,
                transform: open ? 'rotate(180deg)' : undefined,
                transition: 'transform 0.15s ease',
              }}
            />
          </button>
        </div>
      </div>

      {dropdownContent ? createPortal(dropdownContent, document.body) : null}

      {confirmOpen && (
        <AddSpecialtyConfirmModal
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
