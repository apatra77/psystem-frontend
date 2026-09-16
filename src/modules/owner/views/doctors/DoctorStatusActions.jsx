import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { setAdminDoctorStatus } from '@/services/adminDoctors'
import { toast } from '@/app/store/uiStore'
import { colors } from '@/theme/colors'

function getStatusActions(status) {
  switch (status) {
    case 'active':
      return [
        { id: 'on_leave', label: 'Mark as On Leave', tone: 'warning' },
        { id: 'inactive', label: 'Deactivate Doctor', tone: 'danger' },
      ]
    case 'on_leave':
      return [
        { id: 'active', label: 'Mark as Available', tone: 'success' },
        { id: 'inactive', label: 'Deactivate Doctor', tone: 'danger' },
      ]
    case 'inactive':
      return [{ id: 'active', label: 'Activate Doctor', tone: 'success' }]
    default:
      return [
        { id: 'active', label: 'Mark as Available', tone: 'success' },
        { id: 'on_leave', label: 'Mark as On Leave', tone: 'warning' },
        { id: 'inactive', label: 'Deactivate Doctor', tone: 'danger' },
      ]
  }
}

function actionColor(tone) {
  if (tone === 'danger') return '#f87171'
  if (tone === 'warning') return colors.gold
  return colors.accent
}

export default function DoctorStatusActions({ doctor, onUpdated, disabled = false }) {
  const [open, setOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const handleClick = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const actions = getStatusActions(doctor?.status)

  const handleSelect = async (nextStatus) => {
    if (!doctor?.id || updating) return
    setOpen(false)
    setUpdating(true)
    try {
      await setAdminDoctorStatus(doctor.id, nextStatus)
      toast.success(
        nextStatus === 'inactive'
          ? 'Doctor deactivated'
          : nextStatus === 'on_leave'
            ? 'Doctor marked as on leave'
            : 'Doctor marked as available',
      )
      onUpdated?.(nextStatus)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update doctor status')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled || updating}
        onClick={() => setOpen((value) => !value)}
        className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/8 hover:text-white transition-colors disabled:opacity-50"
        style={{ color: colors.textSecondary }}
        aria-label={`Status actions for ${doctor?.name ?? 'doctor'}`}
      >
        <MoreHorizontal size={15} strokeWidth={1.8} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[190px] rounded-[12px] p-1.5 owner-dropdown shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
            style={{ background: '#102820', border: `1px solid ${colors.borderSubtle}` }}
          >
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handleSelect(action.id)}
                className="w-full text-left px-3 py-2 rounded-[8px] text-[12px] font-bold cursor-pointer hover:bg-white/8 transition-colors"
                style={{ color: actionColor(action.tone) }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
