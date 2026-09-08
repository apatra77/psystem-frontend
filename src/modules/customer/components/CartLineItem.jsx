import { useState } from 'react'
import { Box, Minus, Pill, Plus, ShieldAlert, Trash2 } from 'lucide-react'
import { useCartStore } from '@/app/store/cartStore'
import {
  calcLooseLineAmounts,
  formatLooseCartSummary,
  formatLoosePackLine,
  formatLooseUnitLine,
  formatPackCartSummary,
  getCartLineSubtotal,
  getProductUnitsPerPack,
  isLooseCartLine,
} from '@/modules/customer/utils/looseQuantity'
import { fmtDecimalINR } from '@/app/utils/format'
import { colors } from '@/app/themes/colors'

function Stepper({ value, onDecrease, onIncrease, disabled, compact = false }) {
  const btnClass = compact ? 'h-7 w-7' : 'h-8 w-8'
  return (
    <div
      className="inline-flex items-center rounded-full"
      style={{ border: `1.5px solid ${colors.accent}`, background: 'rgba(64,222,170,0.08)' }}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled || value <= 0}
        className={`flex ${btnClass} items-center justify-center disabled:cursor-not-allowed disabled:opacity-35`}
        style={{ color: colors.accent }}
        aria-label="Decrease"
      >
        <Minus size={13} strokeWidth={2.5} />
      </button>
      <span className="min-w-[24px] text-center text-[13px] font-extrabold tabular-nums text-white">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        className={`flex ${btnClass} items-center justify-center disabled:cursor-not-allowed disabled:opacity-35`}
        style={{ color: colors.accent }}
        aria-label="Increase"
      >
        <Plus size={13} strokeWidth={2.5} />
      </button>
    </div>
  )
}

function LooseInlineRow({ icon: Icon, label, value, onDecrease, onIncrease, disabled }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <Icon size={15} className="text-white" strokeWidth={1.75} />
      </div>
      <span className="min-w-0 flex-1 text-[11.5px] font-semibold text-white">{label}</span>
      <Stepper value={value} onDecrease={onDecrease} onIncrease={onIncrease} disabled={disabled} compact />
    </div>
  )
}

function QuantityChip({ children }) {
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold"
      style={{
        color: colors.accent,
        background: 'rgba(64,222,170,0.12)',
        border: '1px solid rgba(64,222,170,0.28)',
      }}
    >
      {children}
    </span>
  )
}

function CartLineQuantity({ item, pending, onPackChange, onLooseChange }) {
  if (isLooseCartLine(item)) {
    const unitsPerPack = getProductUnitsPerPack(item)
    const fullPackQty = Number(item.fullPackQty) || 0
    const looseUnitQty = Number(item.looseUnitQty) || 0
    const totalUnits = fullPackQty * unitsPerPack + looseUnitQty

    return (
      <div
        className="rounded-[14px] px-3.5 py-3 min-w-[220px]"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <LooseInlineRow
          icon={Box}
          label={formatLoosePackLine(item)}
          value={fullPackQty}
          onDecrease={() => onLooseChange(fullPackQty - 1, looseUnitQty)}
          onIncrease={() => onLooseChange(fullPackQty + 1, looseUnitQty)}
          disabled={pending}
        />
        <div className="my-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
        <LooseInlineRow
          icon={Pill}
          label={formatLooseUnitLine(item)}
          value={looseUnitQty}
          onDecrease={() => onLooseChange(fullPackQty, looseUnitQty - 1)}
          onIncrease={() => onLooseChange(fullPackQty, looseUnitQty + 1)}
          disabled={pending}
        />
        <p className="text-[10.5px] mt-2.5 text-center" style={{ color: colors.textDim }}>
          Total: {totalUnits} {(item.unitLabel ?? 'unit').toLowerCase()}
          {totalUnits === 1 ? '' : 's'}
        </p>
      </div>
    )
  }

  const packSummary = formatPackCartSummary(item)

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
      <Stepper
        value={item.qty}
        onDecrease={() => onPackChange(item.qty - 1)}
        onIncrease={() => onPackChange(item.qty + 1)}
        disabled={pending}
      />
      {packSummary && (
        <p className="text-[10.5px] text-center" style={{ color: colors.textDim }}>
          {packSummary.detail}
        </p>
      )}
    </div>
  )
}

export default function CartLineItem({ item, onRemove }) {
  const setQty = useCartStore((s) => s.setQty)
  const setLooseQty = useCartStore((s) => s.setLooseQty)
  const [pending, setPending] = useState(false)

  const looseSummary = isLooseCartLine(item) ? formatLooseCartSummary(item) : null
  const packSummary = !isLooseCartLine(item) ? formatPackCartSummary(item) : null
  const lineTotal = item.lineTotal ?? getCartLineSubtotal(item)

  const run = async (action) => {
    if (pending) return
    setPending(true)
    try {
      await action()
    } finally {
      setPending(false)
    }
  }

  const commitLoose = (fullPackQty, looseUnitQty) => {
    const unitsPerPack = getProductUnitsPerPack(item)
    const totalUnits = Math.max(0, fullPackQty) * unitsPerPack + Math.max(0, looseUnitQty)
    run(() => setLooseQty(item.id, { fullPackQty: Math.max(0, fullPackQty), looseUnitQty: Math.max(0, looseUnitQty), totalUnits }))
  }

  return (
    <div
      className="rounded-[16px] p-4"
      style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[12px] text-xl font-extrabold overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.05)', color: colors.accent }}
          >
            {item.image ? (
              <img src={item.image} alt="" className="h-full w-full object-cover" />
            ) : (
              item.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold truncate" style={{ color: colors.textBright }}>
              {item.name}
            </p>
            {item.genericName && (
              <p className="text-[12px] mt-0.5 truncate" style={{ color: colors.textSecondary }}>
                {item.genericName}
              </p>
            )}
            {!item.genericName && item.pack && (
              <p className="text-[12px] mt-0.5 truncate" style={{ color: colors.textSecondary }}>
                {item.pack}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {(looseSummary || packSummary) && (
                <QuantityChip>{looseSummary?.short ?? packSummary?.short}</QuantityChip>
              )}
              {item.rx && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{
                    color: '#ffb4b4',
                    background: 'rgba(255,100,100,0.1)',
                    border: '1px solid rgba(255,100,100,0.28)',
                  }}
                >
                  <ShieldAlert size={11} />
                  Prescription required
                </span>
              )}
            </div>
          </div>
        </div>

        <CartLineQuantity
          item={item}
          pending={pending}
          onPackChange={(next) => run(() => setQty(item.id, next))}
          onLooseChange={commitLoose}
        />

        <div className="flex items-start gap-4 lg:shrink-0">
          <div className="text-right min-w-[88px]">
            <div className="text-[15px] font-extrabold tabular-nums" style={{ color: colors.textBright }}>
              {fmtDecimalINR(lineTotal)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item)}
            className="p-1.5 mt-0.5"
            style={{ color: colors.textDim }}
            aria-label="Remove"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}