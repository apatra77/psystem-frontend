import { useEffect, useState } from 'react'
import { Check, Pencil, Plus, Settings, X } from 'lucide-react'
import PortalModal, { ModalFieldLabel, ModalInput } from './PortalModal'
import Spinner from '@/components/ui/Spinner'
import { useOwnerPortal } from '../context/OwnerPortalContext'
import { inferGeneralSettingType } from '@/services/generalSettings'
import { colors } from '@/theme/colors'

function parseValue(value, type, label) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) {
    if (type === 'phone') throw new Error(`${label} is required`)
    return 0
  }

  if (type === 'phone') {
    const digits = trimmed.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 15) {
      throw new Error(`${label} must be a valid mobile number`)
    }
    return digits
  }

  const num = Number(trimmed)
  if (!Number.isFinite(num) || num < 0) {
    throw new Error(`${label} must be a valid non-negative number`)
  }
  if (type === 'quantity' && !Number.isInteger(num)) {
    throw new Error(`${label} must be a whole number`)
  }
  return num
}

function formatDisplayValue(row, value) {
  if (row.type === 'phone') return String(value ?? '').replace(/\D/g, '') || '—'
  if (row.type === 'quantity') return String(value ?? 0)
  return `₹${Number(value ?? 0).toLocaleString('en-IN')}`
}

function isTextLikeSettingType(type) {
  return type === 'phone' || type === 'text'
}

function Th({ children, className = '' }) {
  return (
    <th
      className={`text-left text-[10.5px] font-extrabold tracking-[0.1em] uppercase px-4 py-3 ${className}`}
      style={{ color: colors.textDim }}
    >
      {children}
    </th>
  )
}

function IconButton({ onClick, disabled, title, children, accent = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/8"
      style={
        accent
          ? {
              color: colors.accent,
              border: '1px solid rgba(64,222,170,0.32)',
              background: 'rgba(64,222,170,0.1)',
            }
          : {
              color: colors.textHighlight,
              border: `1px solid ${colors.borderSubtle}`,
              background: 'rgba(255,255,255,0.04)',
            }
      }
    >
      {children}
    </button>
  )
}

export default function GeneralSettingsModal() {
  const {
    generalSettingsOpen,
    closeGeneralSettings,
    generalSettingRows,
    generalSettingsLoading,
    generalSettingsError,
    loadGeneralSettings,
    saveGeneralSetting,
    createGeneralSetting,
  } = useOwnerPortal()

  const [rows, setRows] = useState(generalSettingRows)
  const [editingCode, setEditingCode] = useState(null)
  const [draftValue, setDraftValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!generalSettingsOpen) return
    setRows(generalSettingRows)
    setEditingCode(null)
    setDraftValue('')
    setAdding(false)
    setNewCode('')
    setNewDescription('')
    setNewValue('')
    setError('')
  }, [generalSettingsOpen, generalSettingRows])

  if (!generalSettingsOpen) return null

  const startEdit = (row) => {
    if (generalSettingsLoading || generalSettingsError || adding) return
    setEditingCode(row.code)
    setDraftValue(String(row.value ?? ''))
    setError('')
  }

  const cancelEdit = () => {
    setEditingCode(null)
    setDraftValue('')
    setError('')
  }

  const startAdd = () => {
    if (generalSettingsLoading || generalSettingsError || editingCode) return
    setAdding(true)
    setNewCode('')
    setNewDescription('')
    setNewValue('')
    setError('')
  }

  const cancelAdd = () => {
    setAdding(false)
    setNewCode('')
    setNewDescription('')
    setNewValue('')
    setError('')
  }

  const saveRow = async (row) => {
    if (saving || generalSettingsLoading) return

    try {
      const parsed = parseValue(draftValue, row.type, row.label)

      setSaving(true)
      setError('')
      await saveGeneralSetting(row.code, parsed)
      setRows((prev) => prev.map((item) => (item.code === row.code ? { ...item, value: parsed } : item)))
      setEditingCode(null)
      setDraftValue('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save setting')
    } finally {
      setSaving(false)
    }
  }

  const saveNewRow = async () => {
    if (saving || generalSettingsLoading) return

    const code = newCode.trim().toUpperCase()
    const description = newDescription.trim()
    const value = newValue.trim()

    if (!code) {
      setError('Code is required')
      return
    }
    if (!description) {
      setError('Description is required')
      return
    }
    if (!value) {
      setError('Value is required')
      return
    }
    if (rows.some((row) => row.code === code)) {
      setError('A setting with this code already exists')
      return
    }

    try {
      const type = inferGeneralSettingType(code, description)
      const parsed = parseValue(value, type, description)
      setSaving(true)
      setError('')
      await createGeneralSetting({ code, description, value: parsed })
      cancelAdd()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create setting')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PortalModal
      onClose={closeGeneralSettings}
      width={640}
      scrollable={false}
      closeOnBackdrop={!saving && !editingCode && !adding}
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(64,222,170,0.14)', border: '1px solid rgba(64,222,170,0.32)' }}
          >
            <Settings size={18} strokeWidth={1.8} style={{ color: colors.accent }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[16px] font-extrabold text-white">Account Settings</h2>
            <p className="text-[12px] mt-1 leading-relaxed" style={{ color: colors.textSecondary }}>
              View and update store configuration values.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={closeGeneralSettings}
          disabled={saving}
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-white/8 disabled:opacity-60"
          style={{ color: colors.textDim }}
          aria-label="Close"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="px-6 pb-6">
        {generalSettingsLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Spinner />
            <p className="text-[12.5px] font-bold" style={{ color: colors.textSecondary }}>
              Loading settings…
            </p>
          </div>
        ) : generalSettingsError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="text-[13px] font-bold text-red-400">{generalSettingsError}</p>
            <button
              type="button"
              onClick={() => loadGeneralSettings({ force: true })}
              className="px-4 py-2.5 rounded-[10px] text-[12.5px] font-extrabold cursor-pointer"
              style={{ background: colors.primaryBtn, color: colors.accentText }}
            >
              Retry
            </button>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
                <Th>Configuration name</Th>
                <Th className="w-[140px]">Value</Th>
                <Th className="w-[88px]">
                  <div className="flex items-center justify-end gap-2">
                    <span>Add</span>
                    <IconButton
                      onClick={startAdd}
                      disabled={saving || adding || !!editingCode}
                      title="Add setting"
                      accent
                    >
                      <Plus size={15} strokeWidth={2.2} />
                    </IconButton>
                  </div>
                </Th>
              </tr>
            </thead>
            <tbody>
              {adding && (
                <tr style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-2">
                      <div>
                        <ModalFieldLabel>Code</ModalFieldLabel>
                        <ModalInput
                          value={newCode}
                          onChange={(e) => {
                            setNewCode(e.target.value.toUpperCase())
                            if (error) setError('')
                          }}
                          placeholder="e.g. DELIVERY_CHARGES"
                          disabled={saving}
                          autoFocus
                          className="py-2 uppercase"
                        />
                      </div>
                      <div>
                        <ModalFieldLabel>Description</ModalFieldLabel>
                        <ModalInput
                          value={newDescription}
                          onChange={(e) => {
                            setNewDescription(e.target.value)
                            if (error) setError('')
                          }}
                          placeholder="e.g. Delivery charges"
                          disabled={saving}
                          className="py-2"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    <ModalFieldLabel>Value</ModalFieldLabel>
                    <ModalInput
                      type={inferGeneralSettingType(newCode, newDescription) === 'phone' ? 'tel' : 'number'}
                      min={inferGeneralSettingType(newCode, newDescription) === 'phone' ? undefined : '0'}
                      step={inferGeneralSettingType(newCode, newDescription) === 'phone' ? undefined : '1'}
                      inputMode={
                        inferGeneralSettingType(newCode, newDescription) === 'phone' ? 'numeric' : 'decimal'
                      }
                      value={newValue}
                      onChange={(e) => {
                        const nextType = inferGeneralSettingType(newCode, newDescription)
                        setNewValue(
                          nextType === 'phone'
                            ? e.target.value.replace(/\D/g, '').slice(0, 10)
                            : e.target.value,
                        )
                        if (error) setError('')
                      }}
                      placeholder={
                        inferGeneralSettingType(newCode, newDescription) === 'phone'
                          ? '10-digit mobile number'
                          : 'e.g. 40'
                      }
                      disabled={saving}
                      className="py-2"
                    />
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    <div className="flex items-center justify-end gap-1.5 pt-5">
                      <IconButton onClick={saveNewRow} disabled={saving} title="Save" accent>
                        <Check size={15} strokeWidth={2.2} />
                      </IconButton>
                      <IconButton onClick={cancelAdd} disabled={saving} title="Cancel">
                        <X size={15} strokeWidth={2.2} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              )}

              {rows.map((row) => {
                const isEditing = editingCode === row.code

                return (
                  <tr key={row.code} style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
                    <td className="px-4 py-3.5">
                      <span className="text-[13px] font-bold text-white">{row.label}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {isEditing ? (
                        <ModalInput
                          type={row.type === 'phone' ? 'tel' : 'number'}
                          min={row.type === 'phone' ? undefined : '0'}
                          step={row.type === 'phone' ? undefined : '1'}
                          inputMode={row.type === 'phone' ? 'tel' : row.type === 'quantity' ? 'numeric' : 'decimal'}
                          value={draftValue}
                          onChange={(e) => {
                            setDraftValue(
                              row.type === 'phone'
                                ? e.target.value.replace(/\D/g, '').slice(0, 10)
                                : e.target.value,
                            )
                            if (error) setError('')
                          }}
                          disabled={saving}
                          autoFocus
                          className="py-2"
                        />
                      ) : (
                        <span className="text-[13px] font-extrabold" style={{ color: colors.accent }}>
                          {formatDisplayValue(row, row.value)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <IconButton onClick={() => saveRow(row)} disabled={saving} title="Save" accent>
                              <Check size={15} strokeWidth={2.2} />
                            </IconButton>
                            <IconButton onClick={cancelEdit} disabled={saving} title="Cancel">
                              <X size={15} strokeWidth={2.2} />
                            </IconButton>
                          </>
                        ) : (
                          <IconButton
                            onClick={() => startEdit(row)}
                            disabled={saving || adding || (editingCode && editingCode !== row.code)}
                            title="Edit"
                          >
                            <Pencil size={14} strokeWidth={1.8} />
                          </IconButton>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {error ? <p className="mt-3 text-[12px] font-bold text-red-400">{error}</p> : null}
      </div>
    </PortalModal>
  )
}
