import { useEffect, useMemo, useState } from 'react'
import {
  Baby,
  ChevronLeft,
  ChevronRight,
  Droplets,
  FlaskConical,
  Leaf,
  Pencil,
  Pill,
  Sparkles,
  Trash2,
  Watch,
} from 'lucide-react'
import PortalModal, { ModalFieldLabel, ModalInput } from '../components/PortalModal'
import { useOwnerPortal } from '../context/OwnerPortalContext'
import { INITIAL_CATEGORIES } from '../data/initialState'
import { getAccentMeta, getCategoryInitials } from '../utils/helpers'
import { createCategory, deleteCategory, updateCategory } from '@/services/products'
import { toast } from '@/app/store/uiStore'
import { colors } from '@/theme/colors'

const PAGE_SIZE = 8

function getCategoryAccentMeta(category) {
  if (typeof category.accent === 'string' && category.accent.startsWith('#')) {
    const color = category.accent
    return {
      c: color,
      bg1: `${color}22`,
      bg2: `${color}08`,
      border: `${color}55`,
    }
  }
  return getAccentMeta(category.accent)
}

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

function CategoryAvatar({ category }) {
  const Icon = resolveCategoryIcon(category)
  const initials = getCategoryInitials(category.name)
  const accentColor = getCategoryAccentMeta(category).c

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

function CategoryFormModal({ category, onClose, onSaved }) {
  const isEdit = Boolean(category)
  const [name, setName] = useState(category?.name ?? '')
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
      if (isEdit) {
        if (category.isFallback) {
          await onSaved({ ...category, name: trimmed })
          toast.success(`Category "${trimmed}" updated`)
          onClose()
          return
        }
        const updated = await updateCategory(category.id, { name: trimmed })
        toast.success(`Category "${trimmed}" updated`)
        await onSaved(updated)
      } else {
        const created = await createCategory({ name: trimmed })
        toast.success(`Category "${trimmed}" created`)
        await onSaved(created)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} category`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PortalModal onClose={onClose} width={420} scrollable={false} closeOnBackdrop={!saving}>
      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="text-[16px] font-extrabold text-white mb-1">
          {isEdit ? 'Edit category' : 'Add category'}
        </h2>
        <p className="text-[12px] mb-5" style={{ color: colors.textSecondary }}>
          {isEdit
            ? 'Update the category name for your storefront aisle.'
            : 'Create a new storefront aisle for your products.'}
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

        {error ? <p className="mt-2 text-[12px] font-bold text-red-400">{error}</p> : null}

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
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create category'}
          </button>
        </div>
      </form>
    </PortalModal>
  )
}

function DeleteCategoryModal({ category, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (deleting) return
    setDeleting(true)
    setError('')

    try {
      if (!category.isFallback) {
        await deleteCategory(category.id)
      }
      toast.success(`Category "${category.name}" deleted`)
      await onDeleted(category.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PortalModal onClose={onClose} width={420} scrollable={false} closeOnBackdrop={!deleting}>
      <div className="p-6">
        <h2 className="text-[16px] font-extrabold text-white mb-1">Delete category</h2>
        <p className="text-[12px] mb-5" style={{ color: colors.textSecondary }}>
          Are you sure you want to delete <span className="text-white font-bold">{category.name}</span>?
          This action cannot be undone.
        </p>

        {error ? <p className="mb-4 text-[12px] font-bold text-red-400">{error}</p> : null}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2.5 rounded-[10px] text-[12.5px] font-bold cursor-pointer disabled:opacity-60"
            style={{ color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2.5 rounded-[10px] text-[12.5px] font-extrabold cursor-pointer disabled:opacity-60"
            style={{ background: '#B91C1C', color: '#ffffff' }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </PortalModal>
  )
}

export default function CategoriesView() {
  const {
    categories,
    categoriesLoading,
    categoriesError,
    loadCategories,
    addCategory,
    updateCategoryInList,
    removeCategoryFromList,
  } = useOwnerPortal()
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deletingCategory, setDeletingCategory] = useState(null)
  const [hiddenCategoryIds, setHiddenCategoryIds] = useState([])
  const [fallbackOverrides, setFallbackOverrides] = useState({})

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const usingFallbackCategories = categories.length === 0

  const displayCategories = useMemo(() => {
    const source = usingFallbackCategories ? INITIAL_CATEGORIES : categories
    return source
      .filter((category) => !hiddenCategoryIds.includes(category.id))
      .map((category) => {
        const override = fallbackOverrides[category.id]
        return {
          ...category,
          ...override,
          isFallback: usingFallbackCategories,
        }
      })
  }, [categories, hiddenCategoryIds, fallbackOverrides, usingFallbackCategories])

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

  const openAddModal = () => {
    setEditingCategory(null)
    setFormOpen(true)
  }

  const openEditModal = (category) => {
    setEditingCategory(category)
    setFormOpen(true)
  }

  const handleCategorySaved = async (category) => {
    if (editingCategory?.isFallback) {
      setFallbackOverrides((prev) => ({
        ...prev,
        [category.id]: { ...prev[category.id], name: category.name },
      }))
      return
    }
    if (editingCategory) {
      updateCategoryInList({ ...editingCategory, ...category })
      return
    }
    addCategory(category)
  }

  const handleCategoryDeleted = async (categoryId) => {
    if (usingFallbackCategories) {
      setHiddenCategoryIds((prev) => (prev.includes(categoryId) ? prev : [...prev, categoryId]))
      return
    }
    removeCategoryFromList(categoryId)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center min-w-[220px] px-6 py-3 rounded-[12px] text-[13px] font-extrabold cursor-pointer"
          style={{
            color: colors.accentText,
            background: colors.primaryBtn,
            boxShadow: '0 8px 24px rgba(64,222,170,0.28)',
          }}
        >
          + Add category
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
            const accent = getCategoryAccentMeta(category)

            return (
              <div
                key={category.id}
                className="rounded-[18px] p-5 flex flex-col gap-3.5"
                style={{
                  background: `linear-gradient(165deg, ${accent.bg1}, ${accent.bg2})`,
                  border: `1px solid ${accent.border}`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <CategoryAvatar category={category} />

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(category)}
                      className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/8"
                      style={{ color: colors.textHighlight }}
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil size={15} strokeWidth={1.9} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCategory(category)}
                      className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/8"
                      style={{ color: colors.textHighlight }}
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 size={15} strokeWidth={1.9} />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[14.5px] font-extrabold text-white">{category.name}</div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: colors.textSecondary }}>
                    {category.count != null ? `${category.count} products` : '0 products'}
                  </div>
                </div>
              </div>
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

      {formOpen ? (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => {
            setFormOpen(false)
            setEditingCategory(null)
          }}
          onSaved={handleCategorySaved}
        />
      ) : null}

      {deletingCategory ? (
        <DeleteCategoryModal
          category={deletingCategory}
          onClose={() => setDeletingCategory(null)}
          onDeleted={handleCategoryDeleted}
        />
      ) : null}
    </div>
  )
}
