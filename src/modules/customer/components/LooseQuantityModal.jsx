import { useEffect, useMemo, useState } from 'react'
import { Box, Minus, Pill, Plus, ShoppingCart, X } from 'lucide-react'
import PortalModal from '@/shared/ui/PortalModal'
import Spinner from '@/shared/ui/Spinner'
import {
  calcLooseLineAmounts,
  formatLoosePackLine,
  formatLooseUnitLine,
} from '@/modules/customer/utils/looseQuantity'
import { fmtDecimalINR } from '@/app/utils/format'
import { colors } from '@/app/themes/colors'

function QuantityRow({ icon: Icon, title, subtitle, value, onDecrease, onIncrease, disabled }) {
  return (
    <div
      className="flex items-center gap-3 rounded-[14px] px-4 py-3.5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(64,222,170,0.22)',
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <Icon size={18} className="text-white" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold text-white">{title}</div>
        <div className="text-[11.5px] mt-0.5" style={{ color: colors.textSecondary }}>
          {subtitle}
        </div>
      </div>
      <div
        className="inline-flex shrink-0 items-center rounded-full"
        style={{
          border: `1.5px solid ${colors.accent}`,
          background: 'rgba(64,222,170,0.08)',
        }}
      >
        <button
          type="button"
          onClick={onDecrease}
          disabled={disabled || value <= 0}
          className="flex h-8 w-8 items-center justify-center disabled:cursor-not-allowed disabled:opacity-35"
          style={{ color: colors.accent }}
          aria-label={`Decrease ${title}`}
        >
          <Minus size={14} strokeWidth={2.5} />
        </button>
        <span className="min-w-[28px] text-center text-[14px] font-extrabold tabular-nums text-white">
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center disabled:cursor-not-allowed disabled:opacity-35"
          style={{ color: colors.accent }}
          aria-label={`Increase ${title}`}
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

export default function LooseQuantityModal({
  product,
  onClose,
  onConfirm,
  initialFullPackQty = 0,
  initialLooseUnitQty = 0,
  saving = false,
}) {
  const [fullPackQty, setFullPackQty] = useState(initialFullPackQty)
  const [looseUnitQty, setLooseUnitQty] = useState(initialLooseUnitQty)

  useEffect(() => {
    setFullPackQty(initialFullPackQty)
    setLooseUnitQty(initialLooseUnitQty)
  }, [initialFullPackQty, initialLooseUnitQty, product?.id])

  const amounts = useMemo(
    () => calcLooseLineAmounts(product, fullPackQty, looseUnitQty),
    [product, fullPackQty, looseUnitQty],
  )

  const savings = Math.max(0, amounts.mrpTotal - amounts.subtotal)
  const off =
    product?.mrp > product?.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0
  const unitPlural =
    amounts.totalUnits === 1
      ? (product?.unitLabel ?? 'Unit').toLowerCase()
      : `${(product?.unitLabel ?? 'Unit').toLowerCase()}s`
  const canSubmit = amounts.totalUnits > 0 && !saving

  const submit = () => {
    if (!canSubmit) return
    onConfirm?.({ fullPackQty, looseUnitQty, ...amounts })
  }

  return (
    <PortalModal onClose={onClose} width={440} accentBorder>
      <div className="p-5 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-[17px] font-extrabold text-white tracking-tight">Add to cart</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.07)', color: colors.textHighlight }}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Product summary */}
        <div
          className="rounded-[14px] p-3.5 mb-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[12px] text-lg font-extrabold overflow-hidden"
              style={{ background: 'rgba(64,222,170,0.12)', color: colors.accent }}
            >
              {product.image || product.imageUrl ? (
                <img src={product.image ?? product.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                product.name.charAt(0)
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[15px] font-extrabold text-white leading-tight truncate">
                    {product.name}
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: colors.textSecondary }}>
                    {product.pack}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-baseline justify-end gap-1.5">
                    <span className="text-[16px] font-extrabold tabular-nums text-white">
                      {fmtDecimalINR(product.price)}
                    </span>
                    {off > 0 && (
                      <span className="text-[11px] line-through" style={{ color: colors.textDim }}>
                        {fmtDecimalINR(product.mrp)}
                      </span>
                    )}
                  </div>
                  {off > 0 && (
                    <span
                      className="inline-flex mt-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold"
                      style={{ color: colors.accentText, background: colors.primaryBtn }}
                    >
                      -{off}%
                    </span>
                  )}
                </div>
              </div>

              <span
                className="inline-flex items-center gap-1 mt-2 rounded-full px-2.5 py-1 text-[10px] font-bold"
                style={{
                  color: colors.accent,
                  background: 'rgba(64,222,170,0.1)',
                  border: '1px solid rgba(64,222,170,0.28)',
                }}
              >
                <Pill size={10} strokeWidth={2.5} />
                Loose quantity available
              </span>
            </div>
          </div>
        </div>

        {/* Quantity selectors */}
        <div className="mb-1">
          <div
            className="text-[11px] font-extrabold tracking-[0.1em] uppercase mb-3"
            style={{ color: colors.textDim }}
          >
            Select quantity
          </div>
          <div className="space-y-2.5">
            <QuantityRow
              icon={Box}
              title="Full Pack"
              subtitle={formatLoosePackLine(product)}
              value={fullPackQty}
              onDecrease={() => setFullPackQty((value) => Math.max(0, value - 1))}
              onIncrease={() => setFullPackQty((value) => value + 1)}
              disabled={saving}
            />
            <QuantityRow
              icon={Pill}
              title="Loose Quantity"
              subtitle={formatLooseUnitLine(product)}
              value={looseUnitQty}
              onDecrease={() => setLooseUnitQty((value) => Math.max(0, value - 1))}
              onIncrease={() => setLooseUnitQty((value) => value + 1)}
              disabled={saving}
            />
          </div>
        </div>

        {/* Total + CTA */}
        <div
          className="pt-4 mt-4 mb-4"
          style={{ borderTop: '1px dashed rgba(64,222,170,0.3)' }}
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="text-[13px] font-semibold text-white pt-0.5">
              Total ({amounts.totalUnits} {unitPlural})
            </div>
            <div className="text-right">
              <div className="text-[20px] font-extrabold tabular-nums text-white leading-none">
                {fmtDecimalINR(amounts.subtotal)}
              </div>
              {amounts.mrpTotal > amounts.subtotal && (
                <div className="flex items-center justify-end gap-2 mt-1.5 flex-wrap">
                  <span className="text-[12px] line-through" style={{ color: colors.textDim }}>
                    {fmtDecimalINR(amounts.mrpTotal)}
                  </span>
                  <span
                    className="text-[10px] font-extrabold rounded-full px-2 py-0.5"
                    style={{
                      color: colors.accentText,
                      background: colors.primaryBtn,
                    }}
                  >
                    You save {fmtDecimalINR(savings)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 rounded-[14px] py-3.5 text-[14px] font-extrabold transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: colors.primaryBtn,
              color: colors.accentText,
              boxShadow: '0 8px 28px rgba(64,222,170,0.35)',
            }}
          >
            {saving ? (
              <>
                <Spinner />
                Adding…
              </>
            ) : (
              <>
                <ShoppingCart size={16} strokeWidth={2.5} />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </PortalModal>
  )
}
