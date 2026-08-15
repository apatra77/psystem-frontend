import { useEffect, useRef } from 'react'
import { ArrowLeft, Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useOwnerPortal } from '../context/OwnerPortalContext'
import { useOwnerPage } from '../routes'
import { clearAuthSession, getUserInitials } from '@/services/auth'
import { PAGE_META } from '../utils/helpers'
import { colors } from '@/theme/colors'

export default function TopBar() {
  const navigate = useNavigate()
  const page = useOwnerPage()
  const {
    activeOutletName,
    activeOutletLines,
    outlets,
    activeOutlet,
    outletMenuOpen,
    setOutletMenuOpen,
    notifOpen,
    setNotifOpen,
    profileMenuOpen,
    setProfileMenuOpen,
    closeMenus,
    anyMenuOpen,
    selectOutlet,
    storeStatusMeta,
    cycleStoreStatus,
    incomingCount,
    incomingPreview,
    authUser,
    addressesLoading,
  } = useOwnerPortal()

  const displayName = authUser?.fullName?.trim() || authUser?.email || 'User'
  const displayRole = authUser?.role || '—'
  const initials = getUserInitials(authUser)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    if (!profileMenuOpen) return undefined

    const handleOutsideClick = (event) => {
      if (profileMenuRef.current?.contains(event.target)) return
      setProfileMenuOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [profileMenuOpen, setProfileMenuOpen])

  const meta = PAGE_META[page] || PAGE_META.dashboard
  const subtitle =
    meta.subtitleKey === 'outlet'
      ? `Today's performance across ${activeOutletName}.`
      : meta.subtitleKey === 'staffOutlet'
        ? `Team access for ${activeOutletName}`
        : meta.subtitle

  const toggleOutlet = () => {
    setOutletMenuOpen(!outletMenuOpen)
    setNotifOpen(false)
    setProfileMenuOpen(false)
  }

  const toggleNotif = () => {
    setNotifOpen(!notifOpen)
    setOutletMenuOpen(false)
    setProfileMenuOpen(false)
  }

  const toggleProfile = () => {
    setProfileMenuOpen(!profileMenuOpen)
    setOutletMenuOpen(false)
    setNotifOpen(false)
  }

  const handleLogout = () => {
    clearAuthSession()
    setProfileMenuOpen(false)
    navigate('/', { replace: true })
  }

  const openMyProfile = () => {
    setProfileMenuOpen(false)
    navigate('/owner/profile')
  }

  return (
    <>
      <header
        className="sticky top-0 z-50 flex items-center gap-4 px-9 py-4"
        style={{
          background: 'rgba(10,23,18,0.92)',
          backdropFilter: 'blur(18px)',
          borderBottom: `1px solid ${colors.borderSubtle}`,
        }}
      >
        <div className="flex-1 min-w-0 flex items-center gap-3">
          {page === 'profile' && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0 hover:bg-white/8"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.13)',
                color: colors.textHighlight,
              }}
              aria-label="Go back"
            >
              <ArrowLeft size={16} strokeWidth={2} />
            </button>
          )}
          <div className="min-w-0">
            <div className="text-[21px] font-extrabold tracking-tight text-white">{meta.title}</div>
            <div className="text-[12.5px] mt-0.5" style={{ color: colors.textSecondary }}>
              {subtitle}
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={toggleOutlet}
            disabled={addressesLoading && outlets.length === 0}
            className="flex items-center gap-2 text-[12.5px] font-bold px-[13px] py-[9px] rounded-xl cursor-pointer max-w-[280px] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              color: colors.textHighlight,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.13)',
            }}
          >
            <span
              className="w-[7px] h-[7px] rounded-full flex-shrink-0"
              style={{ background: colors.accent, boxShadow: `0 0 8px ${colors.accent}` }}
            />
            <span className="min-w-0 text-left">
              <span className="block truncate">
                {addressesLoading ? 'Loading addresses…' : activeOutletName}
              </span>
              {!addressesLoading && activeOutletLines && (
                <span className="block text-[10px] font-medium truncate mt-0.5" style={{ color: colors.textDim }}>
                  {activeOutletLines}
                </span>
              )}
            </span>
            <ChevronDown size={13} strokeWidth={2.2} style={{ color: colors.textDim, flexShrink: 0 }} />
          </button>
          {outletMenuOpen && (
            <div
              className="absolute top-[calc(100%+8px)] left-0 w-[320px] z-[60] rounded-[14px] p-2 owner-dropdown"
              style={{
                background: 'rgba(10,28,22,0.97)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.13)',
                boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
              }}
            >
              <div className="text-[10px] font-extrabold tracking-[0.14em] px-2.5 py-1.5" style={{ color: '#5f7d73' }}>
                SWITCH ADDRESS
              </div>
              {outlets.length > 0 ? (
                outlets.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => selectOutlet(o.id)}
                    className="w-full flex items-start gap-2.5 p-2.5 rounded-[10px] cursor-pointer text-left hover:bg-[rgba(64,222,170,0.1)]"
                    style={{ background: o.id === activeOutlet ? 'rgba(64,222,170,0.1)' : 'transparent' }}
                  >
                    <span
                      className="w-[7px] h-[7px] rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: o.status === 'open' ? colors.accent : o.status === 'paused' ? colors.gold : '#5f7d73' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12.5px] font-bold text-white">{o.label}</span>
                        {o.isDefault && (
                          <span
                            className="text-[9px] font-extrabold px-2 py-0.5 rounded-full"
                            style={{
                              color: colors.accent,
                              background: 'rgba(64,222,170,0.12)',
                              border: '1px solid rgba(64,222,170,0.28)',
                            }}
                          >
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] mt-1 leading-relaxed" style={{ color: colors.textSecondary }}>
                        {o.lines || '—'}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-2.5 py-3 text-[11.5px] leading-relaxed" style={{ color: colors.textDim }}>
                  No saved addresses yet. Add one from My Profile.
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={cycleStoreStatus}
          className="flex items-center gap-2 text-[12.5px] font-bold px-3.5 py-[9px] rounded-xl cursor-pointer whitespace-nowrap"
          style={{
            background: storeStatusMeta.bg,
            color: storeStatusMeta.color,
            border: `1px solid ${storeStatusMeta.border}`,
          }}
        >
          <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: storeStatusMeta.color }} />
          {storeStatusMeta.label}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={toggleNotif}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
            }}
          >
            <Bell size={18} strokeWidth={1.8} style={{ color: colors.textHighlight }} />
            {incomingCount > 0 && (
              <span
                className="absolute -top-1 -right-1 text-[10px] font-extrabold rounded-full px-1.5 py-0.5"
                style={{
                  background: colors.accent,
                  color: colors.accentText,
                  boxShadow: '0 2px 8px rgba(64,222,170,0.5)',
                }}
              >
                {incomingCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div
              className="absolute top-[calc(100%+8px)] right-0 w-[320px] z-[60] rounded-2xl p-2.5 owner-dropdown"
              style={{
                background: 'rgba(10,28,22,0.97)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.13)',
                boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
              }}
            >
              <div className="text-[11px] font-extrabold tracking-wide px-2.5 py-1.5 pb-2" style={{ color: '#5f7d73' }}>
                INCOMING ORDERS
              </div>
              {incomingCount > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {incomingPreview.map((o) => (
                    <div key={o.id} className="flex items-center gap-2.5 p-2.5 rounded-[10px] hover:bg-white/6">
                      <span
                        className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                        style={{ background: colors.blue, boxShadow: `0 0 8px ${colors.blue}` }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white">
                          {o.id} · {o.customer}
                        </div>
                        <div className="text-[10.5px] mt-px" style={{ color: colors.textSecondary }}>
                          {o.itemsCount} items · {o.totalFmt} · {o.placedLabel}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs py-4 text-center" style={{ color: colors.textDim }}>
                  No new orders right now.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={toggleProfile}
            className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-[13px] flex-shrink-0 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg,#d4bcff,#8f6fd1)',
              color: '#1c1030',
            }}
            aria-label="Open profile menu"
          >
            {initials}
          </button>
          {profileMenuOpen && (
            <div
              className="absolute top-[calc(100%+8px)] right-0 w-[240px] z-[60] rounded-[14px] p-2 owner-dropdown"
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
                  className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg,#d4bcff,#8f6fd1)',
                    color: '#1c1030',
                  }}
                >
                  {initials}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-white truncate">{displayName}</div>
                  <div className="text-[11px] font-bold mt-0.5" style={{ color: colors.textDim }}>
                    {displayRole}
                  </div>
                </div>
              </div>
              <div className="border-t my-1.5" style={{ borderColor: colors.borderSubtle }} />
              <button
                type="button"
                onClick={openMyProfile}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[12.5px] font-bold rounded-[9px] cursor-pointer hover:bg-white/6 text-left"
                style={{ color: colors.textHighlight }}
              >
                <User size={15} strokeWidth={1.8} style={{ color: colors.textDim }} />
                My Profile
              </button>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[12.5px] font-bold rounded-[9px] cursor-pointer hover:bg-white/6 text-left"
                style={{ color: colors.textHighlight }}
              >
                <Settings size={15} strokeWidth={1.8} style={{ color: colors.textDim }} />
                Account Settings
              </button>
              <div className="border-t my-1.5" style={{ borderColor: colors.borderSubtle }} />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[12.5px] font-bold rounded-[9px] cursor-pointer hover:bg-white/6 text-left"
                style={{ color: colors.textHighlight }}
              >
                <LogOut size={15} strokeWidth={1.8} style={{ color: colors.textDim }} />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {anyMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={closeMenus} aria-hidden="true" />
      )}
    </>
  )
}
