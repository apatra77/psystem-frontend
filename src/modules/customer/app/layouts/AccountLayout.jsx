import { NavLink, Outlet } from 'react-router-dom'
import { Bell, CreditCard, FileText, Heart, MapPin, Package, User } from 'lucide-react'
import { PATHS } from '@/app/router/paths'
import { colors } from '@/app/themes/colors'

const LINKS = [
  { to: PATHS.customer.orders, label: 'My orders', icon: Package, matchChildren: true },
  { to: PATHS.customer.profile, label: 'Profile', icon: User },
  { to: PATHS.customer.addresses, label: 'Addresses', icon: MapPin },
  { to: PATHS.customer.paymentMethods, label: 'Payment methods', icon: CreditCard },
  { to: PATHS.customer.prescriptions, label: 'Prescriptions', icon: FileText },
  { to: PATHS.customer.wishlist, label: 'Wishlist', icon: Heart },
  { to: PATHS.customer.notifications, label: 'Notifications', icon: Bell },
]

export default function AccountLayout() {
  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: 'minmax(0,220px) minmax(0,1fr)' }}>
      <aside className="rounded-[18px] p-2 h-fit" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
        {LINKS.map(({ to, label, icon: Icon, matchChildren = false }) => (
          <NavLink
            key={to}
            to={to}
            end={!matchChildren}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-[11px] text-[13px] font-bold transition-all"
            style={({ isActive }) => ({
              background: isActive ? 'rgba(64,222,170,.13)' : 'transparent',
              color: isActive ? colors.textBright : colors.textMuted,
              border: `1px solid ${isActive ? 'rgba(64,222,170,.3)' : 'transparent'}`,
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </aside>
      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  )
}
