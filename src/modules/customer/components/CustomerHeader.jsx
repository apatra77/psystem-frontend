import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, FileUp, LogOut, Search, ShoppingCart, User } from 'lucide-react'
import Logo from '@/shared/ui/Logo'
import Button from '@/shared/ui/Button'
import { PATHS } from '@/app/router/paths'
import { useAuthStore } from '@/app/store/authStore'
import { useCartStore } from '@/app/store/cartStore'
import { useCatalogStore } from '@/app/store/catalogStore'
import { useOrderStore } from '@/app/store/orderStore'
import { toast } from '@/app/store/uiStore'
import { msg } from '@/shared/messages/messages'
import { getInitials } from '@/app/utils/format'
import { colors } from '@/app/themes/colors'

const NAV = [
  { to: PATHS.customer.home, label: 'Home' },
  { to: PATHS.customer.search, label: 'Shop' },
  { to: PATHS.customer.categories, label: 'Categories' },
  { to: PATHS.customer.offers, label: 'Offers' },
  { to: PATHS.customer.prescription, label: 'Upload Rx' },
  { to: PATHS.customer.customOrder, label: 'Custom order' },
  { to: PATHS.customer.support, label: 'Support' },
]

export default function CustomerHeader() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const logout = useAuthStore((s) => s.logout)
  const cartCount = useCartStore((s) => s.count())
  const setFilter = useCatalogStore((s) => s.setFilter)
  const unread = useOrderStore((s) => s.unreadCount())

  const submitSearch = (e) => {
    e.preventDefault()
    setFilter({ query })
    navigate(PATHS.customer.search)
  }

  /* Signing out is the one deliberate way to end a session: clear it, then land
     the user on the public landing page rather than the sign-in form. */
  const handleLogout = async () => {
    await logout()
    toast.success(msg('auth.logoutSuccess'))
    navigate(PATHS.customer.home, { replace: true })
  }

  return (
    <header className="sticky top-0 z-40" style={{ background: colors.headerBg, backdropFilter: 'blur(14px)', borderBottom: `1px solid ${colors.borderSubtle}` }}>
      <div className="max-w-[1180px] mx-auto px-5 h-[68px] flex items-center gap-5">
        <Link to={PATHS.customer.home}><Logo /></Link>

        <form onSubmit={submitSearch} className="flex-1 max-w-[420px] relative hidden md:block">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: colors.textDim }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medicines, devices, lab tests…"
            className="w-full rounded-[12px] pl-10 pr-3 py-2.5 text-[13px] outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.borderSubtle}`, color: colors.textBright }}
          />
        </form>

        <nav className="hidden lg:flex items-center gap-1 ml-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === PATHS.customer.home}
              className="text-[13px] font-bold px-3 py-2 rounded-[10px]"
              style={({ isActive }) => ({ color: isActive ? colors.accent : colors.textMuted })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-auto lg:ml-0">
          <Link to={PATHS.customer.prescription} className="lg:hidden p-2" style={{ color: colors.textMuted }} aria-label="Upload prescription">
            <FileUp size={18} />
          </Link>
          <Link to={PATHS.customer.notifications} className="relative p-2" style={{ color: colors.textMuted }} aria-label="Notifications">
            <Bell size={18} />
            {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: colors.accent }} />}
          </Link>
          <Link to={PATHS.customer.cart} className="relative p-2" style={{ color: colors.textMuted }} aria-label="Cart">
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 text-[10px] font-extrabold rounded-full px-1.5" style={{ background: colors.accent, color: colors.accentText }}>
                {cartCount}
              </span>
            )}
          </Link>

          {token ? (
            <div className="flex items-center gap-2">
              <Link to={PATHS.customer.profile} className="flex items-center gap-2 pl-1">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold" style={{ background: colors.primaryBtn, color: colors.accentText }}>
                  {getInitials(user?.fullName || user?.email)}
                </span>
              </Link>
              <button type="button" onClick={handleLogout} className="p-2" style={{ color: colors.textDim }} aria-label="Sign out">
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <Button as={Link} to="/" size="sm" icon={User}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
