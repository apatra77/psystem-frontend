import GlassCard from '../components/GlassCard'
import { useOwnerPortal } from '../context/OwnerPortalContext'
import { colors } from '../../theme/colors'

export default function OrdersView() {
  const { ordersMapped } = useOwnerPortal()
  const live = ordersMapped.filter((o) => ['new', 'preparing', 'ready', 'out'].includes(o.status))

  return (
    <div className="flex flex-col gap-3">
      {live.map((o) => (
        <GlassCard key={o.id} className="p-4 flex items-center gap-3.5 flex-wrap">
          <span
            className="w-[9px] h-[9px] rounded-full flex-shrink-0"
            style={{ background: o.statusMeta.color, boxShadow: `0 0 8px ${o.statusMeta.color}` }}
          />
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13.5px] font-extrabold text-white">{o.id}</span>
              <span className="text-[12.5px] font-bold" style={{ color: '#cfe6dc' }}>
                {o.customer}
              </span>
              {o.rx && (
                <span
                  className="text-[9.5px] font-extrabold px-[7px] py-0.5 rounded-md"
                  style={{
                    color: colors.purpleLight,
                    background: 'rgba(178,135,255,0.15)',
                    border: '1px solid rgba(178,135,255,0.32)',
                  }}
                >
                  RX
                </span>
              )}
            </div>
            <div className="text-[11.5px] mt-1" style={{ color: colors.textSecondary }}>
              {o.itemsCount} items · {o.totalFmt} · {o.payment} · {o.placedLabel} · {o.address}
            </div>
          </div>
          <span
            className="text-[11px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{
              background: o.statusMeta.bg,
              color: o.statusMeta.color,
              border: `1px solid ${o.statusMeta.border}`,
            }}
          >
            {o.statusMeta.label}
          </span>
        </GlassCard>
      ))}
    </div>
  )
}
