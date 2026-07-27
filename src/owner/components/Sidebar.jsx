import { ChevronLeft, ChevronDown, LayoutGrid, Package, Percent, Store, Truck, Users, ClipboardList, BarChart3, Archive } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useOwnerPortal } from '../context/OwnerPortalContext'
import { useOwnerPage } from '../routes'
import { clearAuthSession, getEmailInitials } from '../../services/auth'
import { colors } from '../../theme/colors'

const NAV = [
  { section: 'OVERVIEW', items: [{ id: 'dashboard', label: 'Dashboard', icon: BarChart3 }] },
  {
    section: 'OPERATIONS',
    items: [
      { id: 'orders', label: 'Orders', icon: ClipboardList, badgeKey: 'incomingCount', badgeStyle: 'mint' },
      { id: 'logistics', label: 'Logistics', icon: Truck },
    ],
  },
  {
    section: 'CATALOG',
    items: [
      { id: 'products', label: 'Products', icon: Package },
      { id: 'categories', label: 'Categories', icon: LayoutGrid },
      { id: 'inventory', label: 'Inventory', icon: Archive, badgeKey: 'lowStockCount', badgeStyle: 'gold' },
    ],
  },
  {
    section: 'GROWTH',
    items: [{ id: 'discounts', label: 'Discounts', icon: Percent }],
  },
  {
    section: 'ORGANIZATION',
    items: [
      { id: 'staff', label: 'Staff & Roles', icon: Users },
      { id: 'store', label: 'Store Profile', icon: Store },
    ],
  },
]

function NavItem({ id, label, icon: Icon, badgeKey, badgeStyle, expanded, active, onClick, badgeCount }) {
  const isActive = active === id
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      title={label}
      className="w-full flex items-center gap-[11px] px-3 py-2.5 rounded-[11px] text-[13px] font-bold transition-all cursor-pointer"
      style={{
        justifyContent: expanded ? 'flex-start' : 'center',
        background: isActive
          ? 'linear-gradient(135deg,rgba(64,222,170,.16),rgba(13,138,100,.08))'
          : 'transparent',
        color: isActive ? '#fff' : colors.textMuted,
        border: isActive ? '1px solid rgba(64,222,170,.3)' : '1px solid transparent',
      }}
    >
      <Icon size={18} strokeWidth={1.8} style={{ color: isActive ? colors.accent : colors.textDim, flexShrink: 0 }} />
      {expanded && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {badgeKey && badgeCount > 0 && (
            <span
              className="text-[10.5px] font-extrabold rounded-full px-[7px] py-0.5 min-w-[8px] text-center"
              style={{
                background: badgeStyle === 'gold' ? colors.gold : colors.accent,
                color: colors.accentText,
              }}
            >
              {badgeCount}
            </span>
          )}
        </>
      )}
    </button>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const page = useOwnerPage()
  const {
    goToPage,
    sidebarCollapsed,
    setSidebarCollapsed,
    profileMenuOpen,
    setProfileMenuOpen,
    incomingCount,
    lowStockCount,
    authUser,
  } = useOwnerPortal()

  const expanded = !sidebarCollapsed
  const badges = { incomingCount, lowStockCount }
  const displayEmail = authUser?.email ?? ''
  const displayRole = authUser?.role ?? 'USER'
  const initials = getEmailInitials(displayEmail)

  const handleLogout = (e) => {
    e.preventDefault()
    e.stopPropagation()
    clearAuthSession()
    setProfileMenuOpen(false)
    navigate('/', { replace: true })
  }

  return (
    <aside
      className={`flex-shrink-0 h-full overflow-y-auto overflow-x-hidden flex flex-col transition-[width] duration-200${profileMenuOpen ? ' relative z-50' : ''}`}
      style={{
        width: expanded ? 260 : 84,
        background: 'linear-gradient(180deg,#071008,#0a1712)',
        borderRight: `1px solid ${colors.borderSubtle}`,
      }}
      // padding: expanded ? '20px 14px' : '20px 12px',
    >
      <div className="flex items-center gap-2 px-2 pb-[18px]">
        <span
          className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center font-extrabold text-[17px] flex-shrink-0"
          style={{
            background: colors.primaryBtn,
            color: colors.accentText,
            boxShadow: '0 6px 18px rgba(64,222,170,0.45), inset 0 1px 2px rgba(255,255,255,0.5)',
          }}
        >
          ＋
        </span>
        {expanded && (
          <>
            <span className="font-extrabold text-lg tracking-tight text-white whitespace-nowrap">MEDIQ</span>
            <span
              className="text-[9.5px] font-extrabold tracking-wide px-[7px] py-[3px] rounded-[7px] whitespace-nowrap"
              style={{
                color: colors.purpleLight,
                background: 'rgba(178,135,255,0.15)',
                border: '1px solid rgba(178,135,255,0.32)',
              }}
            >
              ADMIN
            </span>
          </>
        )}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title="Collapse sidebar"
          className="ml-auto w-6 h-6 rounded-[7px] flex items-center justify-center flex-shrink-0 transition-colors hover:bg-white/8"
          style={{ color: colors.textDim }}
        >
          <ChevronLeft
            size={13}
            strokeWidth={2.2}
            style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          />
        </button>
      </div>

      {NAV.map(({ section, items }) => (
        <div key={section}>
          {expanded && (
            <div
              className="text-[10.5px] font-extrabold tracking-[0.16em] px-2.5 pt-4 pb-1.5 whitespace-nowrap"
              style={{ color: '#5f7d73' }}
            >
              {section}
            </div>
          )}
          {items.map((item) => (
            <NavItem
              key={item.id}
              {...item}
              expanded={expanded}
              active={page}
              onClick={goToPage}
              badgeCount={item.badgeKey ? badges[item.badgeKey] : 0}
            />
          ))}
        </div>
      ))}

      <div className="flex-1" />

      <div
        className="relative border-t mt-3 pt-3.5 px-2 pb-10 flex items-center gap-3 flex-shrink-0 sticky bottom-0"
        style={{
          borderColor: colors.borderSubtle,
          background: colors.bgElevated,
          justifyContent: expanded ? 'flex-start' : 'center',
        }}
      >
        <button
          type="button"
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center font-extrabold text-sm flex-shrink-0 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg,#d4bcff,#8f6fd1)',
            color: '#1c1030',
          }}
        >
          {initials}
        </button>
        {expanded && (
          <>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-bold text-white truncate">{displayEmail}</div>
              <div className="text-[11.5px] font-bold mt-0.5" style={{ color: colors.purpleLight }}>
                {displayRole}
              </div>
            </div>
            <button type="button" onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="p-1.5 flex-shrink-0" style={{ color: colors.textDim }}>
              <ChevronDown size={14} />
            </button>
          </>
        )}
        {profileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-[55]"
              onClick={() => setProfileMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              className="absolute bottom-[calc(100%+8px)] left-0 w-[220px] z-[60] rounded-[14px] p-2"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(10,28,22,0.97)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.13)',
                boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
                animation: 'dropIn 0.18s ease',
              }}
            >
              <div className="px-3 py-2 text-xs font-bold rounded-[9px] cursor-pointer hover:bg-white/6" style={{ color: colors.textHighlight }}>
                My profile
              </div>
              <div className="border-t my-1.5" style={{ borderColor: colors.borderSubtle }} />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-xs font-bold rounded-[9px] cursor-pointer hover:bg-white/6"
                style={{ color: colors.textHighlight }}
              >
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
