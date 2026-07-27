import { Bell, ChevronDown } from 'lucide-react'
import { useOwnerPortal } from '../context/OwnerPortalContext'
import { useOwnerPage } from '../routes'
import { PAGE_META } from '../utils/helpers'
import { colors } from '../../theme/colors'

export default function TopBar() {
  const page = useOwnerPage()
  const {
    activeOutletName,
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
  } = useOwnerPortal()

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
        <div className="flex-1 min-w-0">
          <div className="text-[21px] font-extrabold tracking-tight text-white">{meta.title}</div>
          <div className="text-[12.5px] mt-0.5" style={{ color: colors.textSecondary }}>
            {subtitle}
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={toggleOutlet}
            className="flex items-center gap-2 text-[12.5px] font-bold px-[13px] py-[9px] rounded-xl cursor-pointer whitespace-nowrap"
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
            {activeOutletName}
            <ChevronDown size={13} strokeWidth={2.2} style={{ color: colors.textDim }} />
          </button>
          {outletMenuOpen && (
            <div
              className="absolute top-[calc(100%+8px)] left-0 w-[260px] z-[60] rounded-[14px] p-2 owner-dropdown"
              style={{
                background: 'rgba(10,28,22,0.97)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.13)',
                boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
              }}
            >
              <div className="text-[10px] font-extrabold tracking-[0.14em] px-2.5 py-1.5" style={{ color: '#5f7d73' }}>
                SWITCH OUTLET
              </div>
              {outlets.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => selectOutlet(o.id)}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-[10px] cursor-pointer text-left hover:bg-[rgba(64,222,170,0.1)]"
                  style={{ background: o.id === activeOutlet ? 'rgba(64,222,170,0.1)' : 'transparent' }}
                >
                  <span
                    className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                    style={{ background: o.status === 'open' ? colors.accent : o.status === 'paused' ? colors.gold : '#5f7d73' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-bold text-white">{o.name}</div>
                    <div className="text-[10.5px] mt-px" style={{ color: colors.textDim }}>
                      {o.pincode} · {o.status === 'open' ? 'Open' : o.status === 'paused' ? 'Paused' : 'Closed'}
                    </div>
                  </div>
                </button>
              ))}
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
      </header>

      {anyMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={closeMenus} aria-hidden="true" />
      )}
    </>
  )
}
