import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Mail, Phone, User } from 'lucide-react'
import { useAuthStore } from '@/app/store/authStore'
import { toast } from '@/app/store/uiStore'
import { msg } from '@/shared/messages/messages'
import { getUserInitials } from '@/services/auth'
import { PATHS } from '@/app/router/paths'
import { colors } from '@/app/themes/colors'

function formatRole(role) {
  const value = String(role ?? 'Customer').replace(/_/g, ' ').toLowerCase()
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatPhone(mobile, countryCode = '+91') {
  const digits = String(mobile ?? '').replace(/\D/g, '')
  if (!digits) return ''
  const local = digits.length >= 10 ? digits.slice(-10) : digits
  const spaced = local.replace(/(\d{5})(\d{5})/, '$1 $2')
  return `${countryCode} ${spaced}`.trim()
}

/**
 * Account avatar + dropdown (name, details, My Profile, Sign out) — matches owner TopBar pattern.
 */
export default function CustomerProfileMenu({ variant = 'landing', onNavigate }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const displayName = user?.fullName?.trim() || user?.email || 'User'
  const displayEmail = user?.email || ''
  const displayPhone = formatPhone(user?.mobile, user?.countryCode)
  const displayRole = formatRole(user?.role || 'Customer')
  const initials = getUserInitials({ ...user, fullName: displayName, email: displayEmail })
  const isLanding = variant === 'landing'

  useEffect(() => {
    if (!open) return undefined

    const handleOutsideClick = (event) => {
      if (menuRef.current?.contains(event.target)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    toast.success(msg('auth.logoutSuccess'))
    navigate(PATHS.root, { replace: true })
  }

  const openProfile = () => {
    setOpen(false)
    onNavigate?.()
    navigate(PATHS.customer.profile)
  }

  const toggleMenu = () => setOpen((value) => !value)

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={toggleMenu}
        className="flex flex-col items-center gap-[3px]"
        aria-label="Open account menu"
        aria-expanded={open}
      >
        <span
          className={`flex items-center justify-center rounded-full font-extrabold ${
            isLanding ? 'h-10 w-10 text-[11px]' : 'h-8 w-8 text-[11px]'
          }`}
          style={{ background: colors.primaryBtn, color: colors.accentText }}
        >
          {initials}
        </span>
        {isLanding && (
          <span className="hidden text-[10px] font-bold tracking-wider sm:block" style={{ color: colors.textDim }}>
            Account
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+8px)] right-0 z-[60] w-[260px] rounded-[14px] p-2"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(10,28,22,0.97)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.13)',
            boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
              style={{ background: colors.primaryBtn, color: colors.accentText }}
            >
              {initials}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-bold" style={{ color: colors.textBright }}>
                {displayName}
              </div>
              <div className="mt-0.5 text-[11px] font-bold" style={{ color: colors.textDim }}>
                {displayRole}
              </div>
            </div>
          </div>

          {(displayEmail || displayPhone) && (
            <div className="space-y-1 px-2.5 pb-2">
              {displayEmail && (
                <div className="flex items-center gap-2 text-[11px]" style={{ color: colors.textMuted }}>
                  <Mail size={12} style={{ color: colors.textDim }} />
                  <span className="truncate">{displayEmail}</span>
                </div>
              )}
              {displayPhone && (
                <div className="flex items-center gap-2 text-[11px]" style={{ color: colors.textMuted }}>
                  <Phone size={12} style={{ color: colors.textDim }} />
                  <span>{displayPhone}</span>
                </div>
              )}
            </div>
          )}

          <div className="my-1.5 border-t" style={{ borderColor: colors.borderSubtle }} />

          <button
            type="button"
            onClick={openProfile}
            className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[12.5px] font-bold hover:bg-white/6"
            style={{ color: colors.textHighlight }}
          >
            <User size={15} strokeWidth={1.8} style={{ color: colors.textDim }} />
            My Profile
          </button>

          <div className="my-1.5 border-t" style={{ borderColor: colors.borderSubtle }} />

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[12.5px] font-bold hover:bg-white/6"
            style={{ color: colors.textHighlight }}
          >
            <LogOut size={15} strokeWidth={1.8} style={{ color: colors.textDim }} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
