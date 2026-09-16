import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'
import { setAdminDoctorStatus } from '@/services/adminDoctors'
import { toast } from '@/app/store/uiStore'
import { colors } from '@/theme/colors'

const MENU_WIDTH = 168
const MENU_ESTIMATED_HEIGHT = 96

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

function computeMenuStyle(buttonNode, menuNode) {
  const rect = buttonNode.getBoundingClientRect()
  const menuHeight = menuNode?.offsetHeight || MENU_ESTIMATED_HEIGHT
  const spaceBelow = window.innerHeight - rect.bottom
  const openUpward = spaceBelow < menuHeight + 12 && rect.top > menuHeight + 12
  const top = openUpward ? rect.top - menuHeight - 6 : rect.bottom + 6
  const left = Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8)

  return {
    position: 'fixed',
    top,
    left,
    width: MENU_WIDTH,
    zIndex: 10050,
  }
}

function stylesEqual(a, b) {
  if (!a || !b) return false
  return a.top === b.top && a.left === b.left && a.width === b.width
}

export default function DoctorStatusActions({ doctor, onUpdated, disabled = false }) {
  const [open, setOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const actions = getStatusActions(doctor?.status)

  const applyMenuPosition = useCallback(() => {
    const buttonNode = buttonRef.current
    if (!buttonNode) return

    const nextStyle = computeMenuStyle(buttonNode, menuRef.current)
    setMenuStyle((prev) => (stylesEqual(prev, nextStyle) ? prev : nextStyle))
  }, [])

  useLayoutEffect(() => {
    if (!open) return undefined

    applyMenuPosition()
    const rafId = requestAnimationFrame(() => applyMenuPosition())

    const handleReposition = () => applyMenuPosition()
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [open, actions.length, applyMenuPosition])

  useEffect(() => {
    if (!open) {
      setMenuStyle(null)
      return undefined
    }

    const handleClickOutside = (event) => {
      const target = event.target
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

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

  const menu = open
    ? createPortal(
        <>
          <div className="fixed inset-0 z-[10049]" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            ref={menuRef}
            className="rounded-[10px] p-1 owner-dropdown shadow-[0_12px_28px_rgba(0,0,0,0.4)]"
            style={{
              ...(menuStyle ?? {
                position: 'fixed',
                top: -9999,
                left: -9999,
                width: MENU_WIDTH,
                zIndex: 10050,
                visibility: 'hidden',
              }),
              background: '#102820',
              border: `1px solid ${colors.borderSubtle}`,
              visibility: menuStyle ? 'visible' : 'hidden',
            }}
          >
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handleSelect(action.id)}
                className="w-full text-left px-2.5 py-1.5 rounded-[7px] text-[11px] font-bold leading-snug cursor-pointer hover:bg-white/8 transition-colors"
                style={{ color: actionColor(action.tone) }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>,
        document.body,
      )
    : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled || updating}
        onClick={() => setOpen((value) => !value)}
        className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/8 hover:text-white transition-colors disabled:opacity-50"
        style={{ color: colors.textSecondary }}
        aria-label={`Status actions for ${doctor?.name ?? 'doctor'}`}
        aria-expanded={open}
      >
        <MoreHorizontal size={15} strokeWidth={1.8} />
      </button>
      {menu}
    </>
  )
}
