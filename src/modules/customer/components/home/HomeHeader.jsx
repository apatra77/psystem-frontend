import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, MapPin, Menu, RotateCcw, Search, ShoppingCart, X, Zap } from 'lucide-react'
import Logo from '@/shared/ui/Logo'
import CustomerProfileMenu from '@/modules/customer/components/CustomerProfileMenu'
import { PATHS, buildPath } from '@/app/router/paths'
import { useCartStore } from '@/app/store/cartStore'
import { useCatalogStore } from '@/app/store/catalogStore'
import { useOrderStore } from '@/app/store/orderStore'
import { fetchUserProfile } from '@/services/user'
import { HOME_NAV } from '@/shared/mocks/customerHome'
import { colors } from '@/app/themes/colors'
import { SECTION_MAX, SECTION_X } from './layout'

function getAddressLines(address) {
  if (!address) return ''
  if (address.lines) return address.lines
  return [address.line1, address.line2, address.landmark, address.city, address.state, address.pincode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')
}

/**
 * Sticky storefront header for the signed-in landing page.
 *
 * Desktop keeps the reference layout (pincode chip, wide search, icon cluster,
 * category strip). Below `lg` the pincode chip and category strip collapse into
 * a disclosure panel so the row never wraps on a phone.
 */
export default function HomeHeader() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [addressMenuOpen, setAddressMenuOpen] = useState(false)

  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.qty, 0))
  const setFilter = useCatalogStore((s) => s.setFilter)
  const addresses = useOrderStore((s) => s.addresses)
  const addressesLoadedFromApi = useOrderStore((s) => s.addressesLoadedFromApi)
  const selectedAddressId = useOrderStore((s) => s.selectedAddressId)
  const setAddressesFromApi = useOrderStore((s) => s.setAddressesFromApi)
  const selectDeliveryAddress = useOrderStore((s) => s.selectDeliveryAddress)
  const selectedAddress = useOrderStore((s) => {
    if (s.selectedAddressId) {
      return s.addresses.find((address) => address.id === s.selectedAddressId) ?? null
    }
    return s.addresses.find((address) => address.isDefault) ?? s.addresses[0] ?? null
  })

  useEffect(() => {
    if (addressesLoadedFromApi) return undefined

    let cancelled = false

    ;(async () => {
      try {
        const profile = await fetchUserProfile()
        if (!cancelled) {
          setAddressesFromApi(profile?.addresses ?? [])
        }
      } catch {
        if (!cancelled) setAddressesFromApi([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [addressesLoadedFromApi, setAddressesFromApi])

  const activePincode = selectedAddress?.pincode || '—'

  const submitSearch = (e) => {
    e.preventDefault()
    setFilter({ query })
    setMenuOpen(false)
    navigate(PATHS.customer.search)
  }

  const categoryPath = (slug) => buildPath(PATHS.customer.category, { slug })

  const toggleAddressMenu = () => {
    setAddressMenuOpen((open) => !open)
    setMenuOpen(false)
  }

  const handleSelectAddress = (addressId) => {
    selectDeliveryAddress(addressId)
    setAddressMenuOpen(false)
  }

  return (
    <>
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

          <div className="relative hidden xl:block">
            <button
              type="button"
              onClick={toggleAddressMenu}
              className="flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-[13px] font-bold cursor-pointer"
              style={{
                color: colors.textHighlight,
                background: 'rgba(255,255,255,.06)',
                border: `1px solid ${colors.border}`,
              }}
            >
              <span
                className="h-[7px] w-[7px] rounded-full flex-shrink-0"
                style={{ background: colors.accent, boxShadow: `0 0 10px ${colors.accent}` }}
              />
              Deliver to <span style={{ color: colors.textBright }}>{activePincode}</span>
              <ChevronDown size={13} strokeWidth={2.2} style={{ color: colors.textDim }} />
            </button>
            {addressMenuOpen && (
              <div
                className="absolute top-[calc(100%+8px)] left-0 w-[320px] z-[60] rounded-[14px] p-2"
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
                {addresses.length > 0 ? (
                  addresses.map((address) => {
                    const lines = getAddressLines(address)
                    const isActive = address.id === (selectedAddressId ?? selectedAddress?.id)
                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => handleSelectAddress(address.id)}
                        className="w-full flex items-start gap-2.5 p-2.5 rounded-[10px] cursor-pointer text-left hover:bg-[rgba(64,222,170,0.1)]"
                        style={{ background: isActive ? 'rgba(64,222,170,0.1)' : 'transparent' }}
                      >
                        <span
                          className="h-[7px] w-[7px] rounded-full flex-shrink-0 mt-1.5"
                          style={{ background: colors.accent, boxShadow: `0 0 8px ${colors.accent}` }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[12.5px] font-bold text-white">{address.label}</span>
                            {address.isDefault && (
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
                            {lines || '—'}
                          </div>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="px-2.5 py-3 text-[11.5px] leading-relaxed" style={{ color: colors.textDim }}>
                    No saved addresses yet.{' '}
                    <Link to={PATHS.customer.addresses} className="font-bold" style={{ color: colors.accent }}>
                      Add one
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

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

            <CustomerProfileMenu variant="landing" onNavigate={() => setMenuOpen(false)} />

            <button
              type="button"
              onClick={() => {
                setMenuOpen((open) => !open)
                setAddressMenuOpen(false)
              }}
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
          <div className="relative py-3">
            <button
              type="button"
              onClick={toggleAddressMenu}
              className="flex items-center gap-2 text-[12px] font-bold cursor-pointer"
              style={{ color: colors.textMuted }}
            >
              <MapPin size={14} style={{ color: colors.accent }} aria-hidden="true" />
              Deliver to <span style={{ color: colors.textBright }}>{activePincode}</span>
              <ChevronDown size={13} strokeWidth={2.2} style={{ color: colors.textDim }} />
            </button>
            {addressMenuOpen && (
              <div
                className="absolute top-[calc(100%-4px)] left-0 right-0 z-[60] rounded-[14px] p-2 mt-1"
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
                {addresses.length > 0 ? (
                  addresses.map((address) => {
                    const lines = getAddressLines(address)
                    const isActive = address.id === (selectedAddressId ?? selectedAddress?.id)
                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => handleSelectAddress(address.id)}
                        className="w-full flex items-start gap-2.5 p-2.5 rounded-[10px] cursor-pointer text-left hover:bg-[rgba(64,222,170,0.1)]"
                        style={{ background: isActive ? 'rgba(64,222,170,0.1)' : 'transparent' }}
                      >
                        <span
                          className="h-[7px] w-[7px] rounded-full flex-shrink-0 mt-1.5"
                          style={{ background: colors.accent, boxShadow: `0 0 8px ${colors.accent}` }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[12.5px] font-bold text-white">{address.label}</span>
                            {address.isDefault && (
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
                            {lines || '—'}
                          </div>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="px-2.5 py-3 text-[11.5px] leading-relaxed" style={{ color: colors.textDim }}>
                    No saved addresses yet.{' '}
                    <Link to={PATHS.customer.addresses} className="font-bold" style={{ color: colors.accent }}>
                      Add one
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
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
        </div>
      )}
    </header>

    {(addressMenuOpen || menuOpen) && (
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default"
        aria-label="Close menu"
        onClick={() => {
          setAddressMenuOpen(false)
          setMenuOpen(false)
        }}
      />
    )}
    </>
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
