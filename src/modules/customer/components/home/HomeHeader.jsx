import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, MapPin, Menu, RotateCcw, Search, ShoppingCart, User, X, Zap } from 'lucide-react'
import Logo from '@/shared/ui/Logo'
import { PATHS, buildPath } from '@/app/router/paths'
import { useAuthStore } from '@/app/store/authStore'
import { useCartStore } from '@/app/store/cartStore'
import { useCatalogStore } from '@/app/store/catalogStore'
import { toast } from '@/app/store/uiStore'
import { msg } from '@/shared/messages/messages'
import { getInitials } from '@/app/utils/format'
import { HOME_NAV } from '@/shared/mocks/customerHome'
import { colors } from '@/app/themes/colors'
import { SECTION_MAX, SECTION_X } from './layout'

/**
 * Sticky storefront header for the signed-in landing page.
 *
 * Desktop keeps the reference layout (pincode chip, wide search, icon cluster,
 * category strip). Below `lg` the pincode chip and category strip collapse into
 * a disclosure panel so the row never wraps on a phone.
 */
export default function HomeHeader({ pincode = '560001' }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const cartCount = useCartStore((s) => s.count())
  const setFilter = useCatalogStore((s) => s.setFilter)

  const submitSearch = (e) => {
    e.preventDefault()
    setFilter({ query })
    setMenuOpen(false)
    navigate(PATHS.customer.search)
  }

  /**
   * Signing out clears the session and returns the user to the public landing
   * page. This header only renders on "/", so the navigate is a no-op in
   * practice — HomePage swaps to the public page on the next render — but it
   * keeps the behaviour identical wherever the component is reused.
   */
  const handleLogout = async () => {
    await logout()
    toast.success(msg('auth.logoutSuccess'))
    navigate(PATHS.customer.home, { replace: true })
  }

  const categoryPath = (slug) => buildPath(PATHS.customer.category, { slug })

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: colors.headerBg,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${colors.borderSubtle}`,
      }}
    >
      <div className={`${SECTION_MAX} ${SECTION_X}`}>
        <div className="flex items-center gap-3 py-3 lg:gap-5">
          <Link to={PATHS.customer.home} aria-label="MEDIQ home">
            <Logo />
          </Link>

          <button
            type="button"
            className="hidden items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-[13px] font-bold xl:flex"
            style={{
              color: colors.textHighlight,
              background: 'rgba(255,255,255,.06)',
              border: `1px solid ${colors.border}`,
            }}
          >
            <span
              className="h-[7px] w-[7px] rounded-full"
              style={{ background: colors.accent, boxShadow: `0 0 10px ${colors.accent}` }}
            />
            Deliver to <span style={{ color: colors.textBright }}>{pincode}</span>
          </button>

          <form onSubmit={submitSearch} className="hidden flex-1 items-center gap-3 rounded-[14px] py-1.5 pl-5 pr-1.5 md:flex"
            style={{ background: 'rgba(255,255,255,.07)', border: `1px solid ${colors.borderStrong}` }}
          >
            <Search size={15} style={{ color: colors.accentSoft }} aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
              style={{ color: colors.textBright }}
              placeholder="Search medicines, salt composition, lab tests…"
              aria-label="Search products"
            />
            <button
              type="submit"
              className="rounded-[10px] px-5 py-2.5 text-[13px] font-extrabold"
              style={{ background: colors.primaryBtn, color: colors.accentText }}
            >
              Search
            </button>
          </form>

          <nav className="ml-auto flex items-center gap-3 sm:gap-4" aria-label="Account">
            <IconAction to={PATHS.customer.orders} label="Orders" title="Returns & Orders">
              <RotateCcw size={18} style={{ color: colors.textHighlight }} />
            </IconAction>

            <IconAction to={PATHS.customer.cart} label="Cart" title="Cart" highlight badge={cartCount}>
              <ShoppingCart size={18} style={{ color: '#9ff0d4' }} />
            </IconAction>

            <Link
              to={PATHS.customer.profile}
              className="flex flex-col items-center gap-[3px]"
              title={user?.fullName || user?.email || 'Account'}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-extrabold"
                style={{ background: colors.primaryBtn, color: colors.accentText }}
              >
                {getInitials(user?.fullName || user?.email) || <User size={18} />}
              </span>
              <span className="hidden text-[10px] font-bold tracking-wider sm:block" style={{ color: colors.textDim }}>
                Account
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden flex-col items-center gap-[3px] sm:flex"
              aria-label="Sign out"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'rgba(255,255,255,.06)', border: `1px solid ${colors.border}` }}
              >
                <LogOut size={17} style={{ color: colors.textHighlight }} />
              </span>
              <span className="text-[10px] font-bold tracking-wider" style={{ color: colors.textDim }}>
                Sign out
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full lg:hidden"
              style={{ background: 'rgba(255,255,255,.06)', border: `1px solid ${colors.border}` }}
              aria-expanded={menuOpen}
              aria-controls="home-mobile-nav"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </nav>
        </div>

        {/* Phone search sits on its own row rather than squeezing the icon cluster. */}
        <form onSubmit={submitSearch} className="flex items-center gap-2 pb-3 md:hidden">
          <div
            className="flex min-w-0 flex-1 items-center gap-2 rounded-[12px] px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,.07)', border: `1px solid ${colors.borderStrong}` }}
          >
            <Search size={15} style={{ color: colors.accentSoft }} aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
              style={{ color: colors.textBright }}
              placeholder="Search medicines, lab tests…"
              aria-label="Search products"
            />
          </div>
          <button
            type="submit"
            className="rounded-[10px] px-4 py-2.5 text-[13px] font-extrabold"
            style={{ background: colors.primaryBtn, color: colors.accentText }}
          >
            Go
          </button>
        </form>
      </div>

      <div className={`${SECTION_MAX} ${SECTION_X} hidden lg:block`} style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <nav className="flex items-center gap-0.5 text-[13px] font-semibold" aria-label="Categories">
          {HOME_NAV.map((item, i) => (
            <Link
              key={item.slug}
              to={categoryPath(item.slug)}
              className="px-4 py-2.5 transition-colors"
              style={
                i === 0
                  ? { color: colors.textBright, borderBottom: `2px solid ${colors.accent}` }
                  : { color: colors.textMuted }
              }
            >
              {item.label}
            </Link>
          ))}
          <Link
            to={PATHS.customer.search}
            className="ml-auto flex items-center gap-1.5 px-4 py-2.5"
            style={{ color: colors.gold }}
          >
            <Zap size={13} className="bolt-pulse" aria-hidden="true" />
            Offer Zone
          </Link>
          <span
            className="nav-shimmer cursor-pointer px-4 py-2.5"
            style={{
              background: 'linear-gradient(90deg,#d4bcff 0%,#d4bcff 40%,#ffffff 50%,#d4bcff 60%,#d4bcff 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Circle Membership
          </span>
        </nav>
      </div>

      {menuOpen && (
        <div
          id="home-mobile-nav"
          className={`${SECTION_MAX} ${SECTION_X} pb-4 lg:hidden`}
          style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}
        >
          <p className="flex items-center gap-2 py-3 text-[12px] font-bold" style={{ color: colors.textMuted }}>
            <MapPin size={14} style={{ color: colors.accent }} aria-hidden="true" />
            Deliver to <span style={{ color: colors.textBright }}>{pincode}</span>
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {HOME_NAV.map((item) => (
              <Link
                key={item.slug}
                to={categoryPath(item.slug)}
                onClick={() => setMenuOpen(false)}
                className="rounded-[10px] px-3 py-2.5 text-[13px] font-semibold"
                style={{ color: colors.textMuted, background: 'rgba(255,255,255,.05)' }}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] px-3 py-2.5 text-[13px] font-bold sm:hidden"
            style={{ color: colors.textHighlight, background: 'rgba(255,255,255,.05)' }}
          >
            <LogOut size={15} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </header>
  )
}

/** Icon + caption pair used by the Orders / Cart actions. */
function IconAction({ to, label, title, children, badge = 0, highlight = false }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-[3px]" title={title}>
      <span
        className="relative flex h-10 w-10 items-center justify-center"
        style={
          highlight
            ? { borderRadius: 12, background: 'rgba(64,222,170,.12)', border: '1px solid rgba(64,222,170,.35)' }
            : { borderRadius: '50%', background: 'rgba(255,255,255,.06)', border: `1px solid ${colors.border}` }
        }
      >
        {children}
        {badge > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 rounded-full px-1.5 py-[2px] text-[10px] font-extrabold"
            style={{ background: colors.accent, color: colors.accentText, boxShadow: '0 2px 8px rgba(64,222,170,.5)' }}
          >
            {badge}
          </span>
        )}
      </span>
      <span
        className="hidden text-[10px] font-bold tracking-wider sm:block"
        style={{ color: highlight ? '#9ff0d4' : colors.textDim }}
      >
        {label}
      </span>
    </Link>
  )
}
