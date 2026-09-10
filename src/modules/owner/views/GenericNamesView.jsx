import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import GlassCard from '../components/GlassCard'
import PortalModal, { ModalFieldLabel, ModalInput } from '../components/PortalModal'
import Spinner from '@/components/ui/Spinner'
import { useAdminGenericNamesQuery } from '../hooks/useAdminGenericNamesQuery'
import {
  createGenericName,
  deleteGenericName,
  GENERIC_NAMES_PAGE_SIZE,
  updateGenericName,
} from '@/services/genericNames'
import { toast } from '@/app/store/uiStore'
import { colors } from '@/theme/colors'

function Th({ children, className = '', align = 'left' }) {
  return (
    <th
      className={`${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      } text-[10px] font-extrabold tracking-[0.08em] uppercase px-3 py-3 ${className}`}
      style={{ color: colors.textDim, borderBottom: `1px solid ${colors.borderSubtle}` }}
    >
      {children}
    </th>
  )
}

function Td({ children, className = '', align = 'left' }) {
  return (
    <td
      className={`px-3 py-2.5 align-middle ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      } ${className}`}
    >
      {children}
    </td>
  )
}

function GenericNameFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [name, setName] = useState(item?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Generic name is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const saved = isEdit
        ? await updateGenericName(item.id, { name: trimmedName })
        : await createGenericName({ name: trimmedName })

      toast.success(isEdit ? `Generic name "${trimmedName}" updated` : `Generic name "${trimmedName}" added`)
      await onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save generic name')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PortalModal onClose={onClose} width={520}>
      <form onSubmit={handleSubmit} className="p-6">
        <div className="text-[18px] font-extrabold text-white">
          {isEdit ? 'Edit generic name' : 'Add generic name'}
        </div>
        <p className="text-[12px] mt-1 mb-5" style={{ color: colors.textSecondary }}>
          Manage salt/composition names used across products.
        </p>

        <div>
          <ModalFieldLabel>Generic name</ModalFieldLabel>
          <ModalInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Azithromycin"
            autoFocus
          />
        </div>

        {error && (
          <div
            className="mt-4 rounded-[10px] px-3 py-2 text-[11px] font-bold text-red-400"
            style={{ background: 'rgba(255,138,128,0.08)', border: '1px solid rgba(255,138,128,0.24)' }}
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-[11px] text-[12.5px] font-bold cursor-pointer disabled:opacity-50"
            style={{ color: colors.textHighlight, border: `1px solid ${colors.border}` }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[11px] text-[12.5px] font-extrabold cursor-pointer disabled:opacity-50"
            style={{ color: colors.accentText, background: colors.primaryBtn }}
          >
            {saving ? <Spinner /> : null}
            {isEdit ? 'Save changes' : 'Add generic name'}
          </button>
        </div>
      </form>
    </PortalModal>
  )
}

function RowActions({ item, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/8"
        style={{ color: colors.textSecondary }}
        aria-label={`Edit ${item.name}`}
      >
        <Pencil size={15} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(item)}
        className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/8 hover:text-[#ff8a80]"
        style={{ color: colors.textSecondary }}
        aria-label={`Delete ${item.name}`}
      >
        <Trash2 size={15} strokeWidth={1.8} />
      </button>
    </div>
  )
}

function DeleteGenericNameModal({ item, onClose, onConfirm, deleting }) {
  return (
    <PortalModal onClose={onClose} width={440}>
      <div className="p-6">
        <div className="text-[18px] font-extrabold text-white">Delete generic name?</div>
        <p className="text-[12.5px] mt-2 leading-relaxed" style={{ color: colors.textSecondary }}>
          This will remove <span className="font-bold text-white">{item.name}</span> from the catalog. Products already
          using this name will not be deleted.
        </p>

        <div className="flex items-center justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2.5 rounded-[11px] text-[12.5px] font-bold cursor-pointer disabled:opacity-50"
            style={{ color: colors.textHighlight, border: `1px solid ${colors.border}` }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[11px] text-[12.5px] font-extrabold cursor-pointer disabled:opacity-50"
            style={{ color: '#fff', background: 'rgba(255,138,128,0.24)', border: '1px solid rgba(255,138,128,0.42)' }}
          >
            {deleting ? <Spinner /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>
      </div>
    </PortalModal>
  )
}

export default function GenericNamesView() {
  const [search, setSearch] = useState('')
  const [formTarget, setFormTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const {
    items,
    totalElements,
    totalPages,
    page,
    setPage,
    currentPage,
    rangeStart,
    rangeEnd,
    pageNumbers,
    loading,
    error,
    refetch,
  } = useAdminGenericNamesQuery({
    searchQuery: search,
    pageSize: GENERIC_NAMES_PAGE_SIZE,
  })

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteGenericName(deleteTarget.id)
      toast.info(`"${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
      await refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete generic name')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2.5 min-w-0 w-full">
        <div className="flex-1 min-w-0 basis-0">
          <div
            className="relative flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}
          >
            <Search size={14} style={{ color: '#68d9b4', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search generic name, composition…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="flex-1 min-w-0 w-0 bg-transparent border-none outline-none text-white text-[12.5px] font-[inherit] placeholder:text-[#6b9a88] pr-8"
            />
            <button
              type="button"
              onClick={() => setSearch('')}
              disabled={!search}
              tabIndex={search ? 0 : -1}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity ${
                search ? 'opacity-100 cursor-pointer hover:bg-white/10' : 'opacity-0 pointer-events-none'
              }`}
              style={{ color: colors.textSecondary }}
              aria-label="Clear search"
              aria-hidden={!search}
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFormTarget({ mode: 'create' })}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[11px] text-[12.5px] font-extrabold cursor-pointer whitespace-nowrap"
          style={{
            color: colors.accentText,
            background: colors.primaryBtn,
            boxShadow: '0 8px 22px rgba(64,222,170,0.28)',
          }}
        >
          <Plus size={14} strokeWidth={2.4} />
          Add Generic Name
        </button>
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex-1 rounded-[12px] px-4 py-3 text-[12px] font-bold text-red-400"
            style={{ background: 'rgba(255,138,128,0.08)', border: '1px solid rgba(255,138,128,0.24)' }}
          >
            {error}
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2.5 rounded-[11px] text-[12.5px] font-extrabold cursor-pointer"
            style={{ color: colors.accentText, background: colors.primaryBtn }}
          >
            Retry
          </button>
        </div>
      )}

      <GlassCard className="overflow-hidden">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col style={{ width: '48px' }} />
            <col />
            <col style={{ width: '12%' }} />
            <col style={{ width: '96px' }} />
          </colgroup>
          <thead>
            <tr>
              <Th align="center">#</Th>
              <Th>Generic Name</Th>
              <Th align="center">Products</Th>
              <Th align="center">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-16 text-center">
                  <div className="inline-flex items-center gap-2 text-[13px]" style={{ color: colors.textDim }}>
                    <Spinner />
                    Loading generic names…
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-14 text-center text-[13px]" style={{ color: colors.textDim }}>
                  No generic names found.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const rowNumber = rangeStart + index

                return (
                  <tr key={item.id} className="border-b border-white/6 hover:bg-white/3">
                    <Td align="center">
                      <span className="text-[12px] font-bold tabular-nums" style={{ color: colors.textDim }}>
                        {rowNumber}
                      </span>
                    </Td>
                    <Td className="max-w-0">
                      <span className="block text-[12.5px] font-bold text-white truncate" title={item.name}>
                        {item.name}
                      </span>
                    </Td>
                    <Td align="center">
                      <span className="text-[12px] font-bold tabular-nums" style={{ color: colors.textHighlight }}>
                        {item.productCount}
                      </span>
                    </Td>
                    <Td align="center" className="px-1">
                      <RowActions
                        item={item}
                        onEdit={(target) => setFormTarget({ mode: 'edit', item: target })}
                        onDelete={setDeleteTarget}
                      />
                    </Td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
          style={{ borderTop: `1px solid ${colors.borderSubtle}` }}
        >
          <div className="text-[12px]" style={{ color: colors.textSecondary }}>
            Showing {rangeStart} to {rangeEnd} of {totalElements} generic names
          </div>

          <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={loading || currentPage === 1}
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
                disabled={loading || currentPage === totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }}
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
          </div>
        </div>
      </GlassCard>

      {formTarget && (
        <GenericNameFormModal
          item={formTarget.mode === 'edit' ? formTarget.item : null}
          onClose={() => setFormTarget(null)}
          onSaved={refetch}
        />
      )}

      {deleteTarget && (
        <DeleteGenericNameModal
          item={deleteTarget}
          onClose={() => {
            if (deleting) return
            setDeleteTarget(null)
          }}
          onConfirm={handleConfirmDelete}
          deleting={deleting}
        />
      )}
    </div>
  )
}
