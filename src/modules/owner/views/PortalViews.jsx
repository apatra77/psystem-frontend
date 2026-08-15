import GlassCard from '../components/GlassCard'
import { useOwnerPortal } from '../context/OwnerPortalContext'
import { INITIAL_CATEGORIES } from '../data/initialState'
import { stockMeta } from '../utils/helpers'
import { colors } from '@/theme/colors'

function TableShell({ children }) {
  return (
    <GlassCard className="overflow-hidden">
      <table className="w-full border-collapse">{children}</table>
    </GlassCard>
  )
}

function Th({ children }) {
  return (
    <th
      className="text-left text-[10.5px] font-extrabold tracking-[0.1em] uppercase px-4 py-3.5"
      style={{ color: colors.textDim, borderBottom: `1px solid ${colors.borderSubtle}` }}
    >
      {children}
    </th>
  )
}

export function CategoriesView() {
  const { categories } = useOwnerPortal()
  const displayCategories = categories.length > 0 ? categories : INITIAL_CATEGORIES

  return (
    <div className="grid grid-cols-4 gap-4">
      {displayCategories.map((c) => (
        <GlassCard key={c.id} className="p-5 flex flex-col gap-3.5">
          <div className="w-[52px] h-[52px] rounded-[14px]" style={{ background: 'rgba(64,222,170,0.12)' }} />
          <div>
            <div className="text-[14.5px] font-extrabold text-white">{c.name}</div>
            <div className="text-[11.5px] mt-0.5" style={{ color: colors.textSecondary }}>
              {c.count != null ? `${c.count} products` : 'Category'}
            </div>
          </div>
          <span
            className="text-[10px] font-extrabold px-2.5 py-1 rounded-full self-start"
            style={{
              background: 'rgba(64,222,170,0.14)',
              color: colors.accent,
              border: '1px solid rgba(64,222,170,0.34)',
            }}
          >
            Active
          </span>
        </GlassCard>
      ))}
    </div>
  )
}

export function InventoryView() {
  const { products, categories, lowStockCount } = useOwnerPortal()

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Tracked SKUs', value: products.length, color: '#fff' },
          { label: 'Low stock', value: lowStockCount, color: colors.gold },
          { label: 'Out of stock', value: products.filter((p) => p.stock === 0).length, color: '#ff8a80' },
          { label: 'Distributor sync', value: '12 min ago', color: colors.accent, small: true },
        ].map((k) => (
          <GlassCard key={k.label} className="px-[22px] py-5">
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: colors.textDim }}>
              {k.label}
            </div>
            <div
              className={`font-extrabold tracking-tight mt-2.5 ${k.small ? 'text-[15px]' : 'text-[27px]'}`}
              style={{ color: k.color }}
            >
              {k.value}
            </div>
          </GlassCard>
        ))}
      </div>
      <TableShell>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Category</Th>
            <Th>Stock</Th>
            <Th>Price</Th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const cat = categories.find((c) => c.id === p.cat)
            const sm = stockMeta(p.stock)
            return (
              <tr key={p.id} className="border-b border-white/6">
                <td className="px-4 py-2.5">
                  <div className="text-[12.5px] font-bold text-white">{p.name}</div>
                  <div className="text-[10.5px]" style={{ color: colors.textDim }}>
                    {p.sku}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs" style={{ color: '#cfe6dc' }}>
                  {cat?.name}
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-[12.5px] font-bold" style={{ color: '#cfe6dc' }}>
                    {p.stock}
                  </span>
                  <span
                    className="text-[9.5px] font-extrabold px-[7px] py-0.5 rounded-full ml-1.5"
                    style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}
                  >
                    {sm.label}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[12.5px] font-bold text-white tabular-nums">₹{p.price}</td>
              </tr>
            )
          })}
        </tbody>
      </TableShell>
    </div>
  )
}

export function DiscountsView() {
  const { promos } = useOwnerPortal()

  return (
    <div className="flex flex-col gap-3">
      {promos.map((p) => (
        <GlassCard key={p.id} className="p-5 flex items-center gap-4 flex-wrap">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-[15px] font-extrabold flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)', color: colors.accent }}
          >
            %
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="text-[14.5px] font-extrabold text-white">{p.name}</div>
            <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
              {p.desc}
            </div>
            <div className="text-[11px] mt-1.5" style={{ color: '#5f7d73' }}>
              Code: {p.code} · {p.validTill}
            </div>
          </div>
          <span
            className="text-[10.5px] font-extrabold px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(64,222,170,0.14)',
              color: colors.accent,
              border: '1px solid rgba(64,222,170,0.36)',
            }}
          >
            Active
          </span>
        </GlassCard>
      ))}
    </div>
  )
}

export function LogisticsView() {
  const { riders, ordersMapped } = useOwnerPortal()
  const outCount = ordersMapped.filter((o) => o.status === 'out').length

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active riders', value: riders.filter((r) => r.status !== 'offline').length },
          { label: 'Out for delivery', value: outCount, color: colors.purpleLight },
          { label: 'Avg delivery time', value: '27 min' },
          { label: 'On-time rate', value: '94%', color: colors.accent },
        ].map((k) => (
          <GlassCard key={k.label} className="px-[22px] py-5">
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: colors.textDim }}>
              {k.label}
            </div>
            <div className="text-[27px] font-extrabold tracking-tight mt-2.5" style={{ color: k.color ?? '#fff' }}>
              {k.value}
            </div>
          </GlassCard>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {riders.map((r) => (
          <GlassCard key={r.id} className="p-3 flex items-center gap-2.5">
            <span
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-extrabold text-[11.5px]"
              style={{ background: colors.primaryBtn, color: colors.accentText }}
            >
              {r.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </span>
            <div className="flex-1">
              <div className="text-xs font-bold text-white">{r.name}</div>
              <div className="text-[10px]" style={{ color: colors.textSecondary }}>
                {r.vehicle} · ★{r.rating}
              </div>
            </div>
            <span
              className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full"
              style={{
                background: r.status === 'busy' ? 'rgba(255,181,71,0.15)' : 'rgba(64,222,170,0.14)',
                color: r.status === 'busy' ? colors.gold : colors.accent,
                border: r.status === 'busy' ? '1px solid rgba(255,181,71,0.34)' : '1px solid rgba(64,222,170,0.36)',
              }}
            >
              {r.status === 'busy' ? 'On delivery' : r.status === 'available' ? 'Available' : 'Offline'}
            </span>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

export function StaffView() {
  const { staff } = useOwnerPortal()

  return (
    <TableShell>
      <thead>
        <tr>
          <Th>Team member</Th>
          <Th>Role</Th>
          <Th>Status</Th>
          <Th>Last active</Th>
        </tr>
      </thead>
      <tbody>
        {staff.map((s) => (
          <tr key={s.id} className="border-b border-white/6">
            <td className="px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-extrabold text-[11.5px]"
                  style={{
                    background: 'rgba(178,135,255,0.15)',
                    color: colors.purpleLight,
                    border: '1px solid rgba(178,135,255,0.34)',
                  }}
                >
                  {s.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </span>
                <div>
                  <div className="text-[12.5px] font-bold text-white">{s.name}</div>
                  <div className="text-[10.5px]" style={{ color: colors.textDim }}>
                    {s.email}
                  </div>
                </div>
              </div>
            </td>
            <td className="px-4 py-2.5 text-xs" style={{ color: '#cfe6dc' }}>
              {s.role}
            </td>
            <td className="px-4 py-2.5">
              <span
                className="text-[10px] font-extrabold px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(64,222,170,0.14)',
                  color: colors.accent,
                  border: '1px solid rgba(64,222,170,0.36)',
                }}
              >
                {s.status === 'active' ? 'Active' : s.status}
              </span>
            </td>
            <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: colors.textSecondary }}>
              {s.lastActive}
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}

export function StoreView() {
  const { storeProfile, outlets, activeOutlet, selectOutlet } = useOwnerPortal()

  return (
    <div className="grid grid-cols-2 gap-4">
      <GlassCard className="p-6">
        <div className="text-[15px] font-extrabold text-white mb-4">Store details</div>
        <div className="text-[11px] font-bold mb-1.5" style={{ color: colors.textSecondary }}>
          Store name
        </div>
        <div className="text-[13px] text-white mb-3">{storeProfile.name}</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-[11px] font-bold mb-1" style={{ color: colors.textSecondary }}>
              Phone
            </div>
            <div className="text-white">{storeProfile.phone}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold mb-1" style={{ color: colors.textSecondary }}>
              Email
            </div>
            <div className="text-white">{storeProfile.email}</div>
          </div>
        </div>
      </GlassCard>
      <GlassCard className="p-6">
        <div className="text-[15px] font-extrabold text-white mb-3">Location & delivery radius</div>
        <div className="text-[13px] text-white">{storeProfile.address}</div>
        <div className="mt-4 flex justify-between">
          <span className="text-[11px] font-bold" style={{ color: colors.textSecondary }}>
            Delivery radius
          </span>
          <span className="font-extrabold" style={{ color: colors.accent }}>
            {storeProfile.radiusKm} km
          </span>
        </div>
        <div className="mt-6">
          <div className="text-[15px] font-extrabold text-white mb-3">Saved addresses</div>
          {outlets.map((o) => (
            <div
              key={o.id}
              className="flex items-center gap-3 p-3 rounded-xl mb-2"
              style={{ border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: o.status === 'open' ? colors.accent : colors.gold }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
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
                <div className="text-[11px] leading-relaxed" style={{ color: colors.textSecondary }}>
                  {o.lines || '—'}
                </div>
              </div>
              {o.id !== activeOutlet && (
                <button
                  type="button"
                  onClick={() => selectOutlet(o.id)}
                  className="text-[11.5px] font-bold px-3.5 py-2 rounded-[9px] cursor-pointer"
                  style={{
                    color: '#cfe6dc',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.16)',
                  }}
                >
                  Switch →
                </button>
              )}
              {o.id === activeOutlet && (
                <span className="text-[11px] font-extrabold px-3.5 py-2" style={{ color: colors.accent }}>
                  Current outlet
                </span>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
