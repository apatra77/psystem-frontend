import { Minus, Plus } from 'lucide-react'
import { useCartStore } from '@/app/store/cartStore'
import { fmtINR } from '@/app/utils/format'
import { colors } from '@/app/themes/colors'

/**
 * Add-to-cart control: ADD pill before the item is in cart,
 * then a − qty + stepper once added.
 */
export default function CartAddControl({
  product,
  size = 'md',
  showPrice = false,
  fullWidth = false,
  className = '',
  onInteract,
}) {
  const addItem = useCartStore((s) => s.addItem)
  const setQty = useCartStore((s) => s.setQty)
  const cartQty = useCartStore((s) => s.items.find((i) => i.id === product.id)?.qty ?? 0)

  const stock = product.stock ?? 999
  const disabled = stock <= 0
  const off = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0
  const isLarge = size === 'lg'

  const stepperHeight = isLarge ? 44 : 36
  const stepperMinWidth = fullWidth ? undefined : isLarge ? 132 : 108
  const btnSize = isLarge ? 36 : 30
  const iconSize = isLarge ? 16 : 14
  const qtyText = isLarge ? '15px' : '13px'
  const addPadding = isLarge ? 'px-10 py-2.5 text-[14px]' : 'px-4 py-2 text-[11px]'

  const stop = (e) => {
    e.stopPropagation()
    onInteract?.(e)
  }

  const decrease = (e) => {
    stop(e)
    setQty(product.id, cartQty - 1)
  }

  const increase = (e) => {
    stop(e)
    setQty(product.id, cartQty + 1)
  }

  const add = (e) => {
    stop(e)
    addItem(product, 1)
  }

  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <div className={`flex flex-col gap-2.5 ${widthClass} ${className}`} onClick={stop} onKeyDown={stop}>
      {showPrice && (
        <div className="flex items-end gap-2.5">
          <span
            className={`font-extrabold tabular-nums ${isLarge ? 'text-[30px]' : 'text-[16px]'}`}
            style={{ color: colors.textBright }}
          >
            {fmtINR(product.price)}
          </span>
          {off > 0 && (
            <span
              className={`line-through ${isLarge ? 'text-[15px] mb-1' : 'text-[12px] mb-0.5'}`}
              style={{ color: colors.textDim }}
            >
              {fmtINR(product.mrp)}
            </span>
          )}
        </div>
      )}

      {cartQty === 0 ? (
        <button
          type="button"
          disabled={disabled}
          onClick={add}
          className={`rounded-full font-extrabold tracking-[0.08em] transition-opacity disabled:cursor-not-allowed disabled:opacity-45 ${fullWidth ? 'w-full' : 'self-start'} ${addPadding}`}
          style={{ background: colors.primaryBtn, color: colors.accentText }}
          aria-label={`Add ${product.name} to cart`}
        >
          ADD
        </button>
      ) : (
        <div
          className={`inline-flex items-center justify-between rounded-full ${fullWidth ? 'w-full' : ''}`}
          style={{
            minWidth: stepperMinWidth,
            height: stepperHeight,
            border: `1.5px solid ${colors.accent}`,
            background: 'rgba(64,222,170,0.10)',
          }}
          role="group"
          aria-label={`Quantity for ${product.name}`}
        >
          <button
            type="button"
            onClick={decrease}
            className="flex shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
            style={{ width: btnSize, height: btnSize, marginLeft: 3, color: colors.accent }}
            aria-label="Decrease quantity"
          >
            <Minus size={iconSize} strokeWidth={2.5} />
          </button>

          <span
            className="min-w-[28px] flex-1 text-center font-extrabold tabular-nums"
            style={{ color: colors.textBright, fontSize: qtyText }}
          >
            {cartQty}
          </span>

          <button
            type="button"
            onClick={increase}
            disabled={cartQty >= stock}
            className="flex shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-45"
            style={{ width: btnSize, height: btnSize, marginRight: 3, color: colors.accent }}
            aria-label="Increase quantity"
          >
            <Plus size={iconSize} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  )
}
