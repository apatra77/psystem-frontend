import { useEffect, useMemo, useState } from 'react'
import {
  Baby,
  ChevronLeft,
  ChevronRight,
  Droplets,
  FlaskConical,
  Leaf,
  MoreVertical,
  Pill,
  Plus,
  Sparkles,
  Watch,
} from 'lucide-react'
import GlassCard from '../components/GlassCard'
import PortalModal, { ModalFieldLabel, ModalInput } from '../components/PortalModal'
import { useOwnerPortal } from '../context/OwnerPortalContext'
import { INITIAL_CATEGORIES } from '../data/initialState'
import { getAccentMeta, getCategoryInitials } from '../utils/helpers'
import { createCategory } from '@/services/products'
import { toast } from '@/app/store/uiStore'
import { colors } from '@/theme/colors'

const PAGE_SIZE = 8

function resolveCategoryIcon(category) {
  const key = String(category.slug ?? category.id ?? '').toLowerCase()
  const name = String(category.name ?? '').toLowerCase()

  if (key.includes('medicin') || name.includes('medicin')) return Pill
  if (key.includes('vitamin') || name.includes('vitamin') || name.includes('supplement')) return FlaskConical
  if (key.includes('diabet') || name.includes('diabet')) return Droplets
  if (key.includes('baby') || name.includes('mother') || name.includes('baby')) return Baby
  if (key.includes('personal') || name.includes('personal')) return Sparkles
  if (key.includes('device') || name.includes('device')) return Watch
  if (key.includes('ayurved') || name.includes('ayurved')) return Leaf
  if (key.includes('skin') || name.includes('skin') || name.includes('hair')) return Sparkles
  return null
}

function getCategoryAccentColor(category) {
  if (typeof category.accent === 'string' && category.accent.startsWith('#')) {
    return category.accent
  }
  return getAccentMeta(category.accent).c
}

function CategoryAvatar({ category }) {
  const Icon = resolveCategoryIcon(category)
  const initials = getCategoryInitials(category.name)
  const accentColor = getCategoryAccentColor(category)

  return (
    <div
      className="w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        background: `${accentColor}22`,
        border: `1px solid ${accentColor}55`,
        color: accentColor,
      }}
    >
      {Icon ? (
        <Icon size={22} strokeWidth={1.85} />
      ) : (
        <span className="text-[14px] font-extrabold tracking-tight">{initials}</span>
      )}
    </div>
  )
}

function CategoryCardMenu({ category, onToggleStatus }) {
  const [open, setOpen] = useState(false)
  const isActive = category.status !== 'inactive'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/5"
        style={{ color: colors.textMuted }}
        aria-label={`Actions for ${category.name}`}
        aria-expanded={open}
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[168px] rounded-[12px] py-1.5 shadow-2xl"
            style={{ background: 'rgba(12,28,23,0.98)', border: `1px solid ${colors.borderStrong}` }}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onToggleStatus(category.id)
              }}
              className="w-full px-3.5 py-2.5 text-left text-[12.5px] font-semibold cursor-pointer hover:bg-white/5"
              style={{ color: colors.textHighlight }}
            >
              {isActive ? 'Mark inactive' : 'Mark active'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function AddCategoryModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Category name is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const created = await createCategory({ name: trimmed })
      toast.success(`Category "${trimmed}" created`)
      await onCreated(created)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PortalModal onClose={onClose} width={420} scrollable={false} closeOnBackdrop={!saving}>
      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="text-[16px] font-extrabold text-white mb-1">Add category</h2>
        <p className="text-[12px] mb-5" style={{ color: colors.textSecondary }}>
          Create a new storefront aisle for your products.
        </p>

        <ModalFieldLabel>Category name</ModalFieldLabel>
        <ModalInput
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (error) setError('')
          }}
          placeholder="e.g. Medicines"
          autoFocus
          disabled={saving}
        />

        {error ? (
          <p className="mt-2 text-[12px] font-bold text-red-400">{error}</p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-[10px] text-[12.5px] font-bold cursor-pointer disabled:opacity-60"
            style={{ color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 rounded-[10px] text-[12.5px] font-extrabold cursor-pointer disabled:opacity-60"
            style={{ background: colors.primaryBtn, color: colors.accentText }}
          >
            {saving ? 'Creating…' : 'Create category'}
          </button>
        </div>
      </form>
    </PortalModal>
  )
}

export default function CategoriesView() {
  const { categories, categoriesLoading, categoriesError, loadCategories, addCategory } = useOwnerPortal()
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [statusOverrides, setStatusOverrides] = useState({})

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const displayCategories = useMemo(() => {
    const source = categories.length > 0 ? categories : INITIAL_CATEGORIES
    return source.map((category) => ({
      ...category,
      status: statusOverrides[category.id] ?? category.status ?? 'active',
    }))
  }, [categories, statusOverrides])

  const totalElements = displayCategories.length
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = displayCategories.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeStart = totalElements === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalElements)

  const pageNumbers = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, '…', totalPages]
    if (currentPage >= totalPages - 2) return [1, '…', totalPages - 2, totalPages - 1, totalPages]
    return [1, '…', currentPage, '…', totalPages]
  })()

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(1, totalPages))
  }, [page, totalPages])

  const toggleCategoryStatus = (id) => {
    setStatusOverrides((prev) => {
      const current = displayCategories.find((c) => c.id === id)?.status ?? 'active'
      return { ...prev, [id]: current === 'active' ? 'inactive' : 'active' }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[11px] text-[12.5px] font-extrabold cursor-pointer"
          style={{
            color: colors.accent,
            background: 'rgba(64,222,170,0.08)',
            border: '1px solid rgba(64,222,170,0.34)',
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          Add category
        </button>
      </div>

      {categoriesError ? (
        <div
          className="rounded-[12px] px-4 py-3 text-[12px] font-bold text-red-400"
          style={{ background: 'rgba(255,138,128,0.08)', border: '1px solid rgba(255,138,128,0.24)' }}
        >
          {categoriesError}
        </div>
      ) : null}

      {categoriesLoading ? (
        <div className="py-16 text-center text-[13px]" style={{ color: colors.textDim }}>
          Loading categories…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {pageItems.map((category) => {
            const isActive = category.status !== 'inactive'

            return (
              <GlassCard key={category.id} className="p-5 flex flex-col gap-3.5">
                <div className="flex items-start justify-between gap-3">
                  <CategoryAvatar category={category} />
                  <CategoryCardMenu category={category} onToggleStatus={toggleCategoryStatus} />
                </div>

                <div>
                  <div className="text-[14.5px] font-extrabold text-white">{category.name}</div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: colors.textSecondary }}>
                    {category.count != null ? `${category.count} products` : '0 products'}
                  </div>
                </div>

                <span
                  className="text-[10px] font-extrabold px-2.5 py-1 rounded-full self-start"
                  style={
                    isActive
                      ? {
                          background: 'rgba(64,222,170,0.14)',
                          color: colors.accent,
                          border: '1px solid rgba(64,222,170,0.34)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.06)',
                          color: colors.textDim,
                          border: `1px solid ${colors.borderSubtle}`,
                        }
                  }
                >
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </GlassCard>
            )
          })}
        </div>
      )}

      {!categoriesLoading && totalElements > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <div className="text-[12px]" style={{ color: colors.textSecondary }}>
            Showing {rangeStart} to {rangeEnd} of {totalElements} categories
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={categoriesLoading || currentPage === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>

            {pageNumbers.map((item, index) =>
              item === '…' ? (
                <span key={`ellipsis-${index}`} className="px-1 text-[12px]" style={{ color: colors.textDim }}>
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  className="min-w-8 h-8 px-2 rounded-[9px] text-[12px] font-extrabold cursor-pointer"
                  style={
                    item === currentPage
                      ? { background: colors.primaryBtn, color: colors.accentText }
                      : { color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }
                  }
                >
                  {item}
                </button>
              ),
            )}

            <button
              type="button"
              disabled={categoriesLoading || currentPage === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }}
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      ) : null}

      {addOpen ? (
        <AddCategoryModal
          onClose={() => setAddOpen(false)}
          onCreated={addCategory}
        />
      ) : null}
    </div>
  )
}
