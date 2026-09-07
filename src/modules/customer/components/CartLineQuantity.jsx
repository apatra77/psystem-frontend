import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useCartStore } from '@/app/store/cartStore'
import { useCatalogStore } from '@/app/store/catalogStore'
import LooseQuantityModal from '@/modules/customer/components/LooseQuantityModal'
import { formatLooseCartSummary } from '@/modules/customer/utils/looseQuantity'
import { colors } from '@/app/themes/colors'

function cartItemToProduct(item, catalogProduct) {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    mrp: item.mrp,
    pack: item.pack,
    stock: catalogProduct?.stock ?? 999,
    unitsPerPack: item.unitsPerPack ?? catalogProduct?.unitsPerPack,
    packLabel: item.packLabel ?? catalogProduct?.packLabel,
    unitLabel: item.unitLabel ?? catalogProduct?.unitLabel,
    looseQuantity: true,
  }
}

export default function CartLineQuantity({ item }) {
  const setQty = useCartStore((s) => s.setQty)
  const addItem = useCartStore((s) => s.addItem)
  const catalogProduct = useCatalogStore((s) => s.getProduct(item.id))
  const [pending, setPending] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const run = async (action) => {
    if (pending) return
    setPending(true)
    try {
      await action()
    } finally {
      setPending(false)
    }
  }

  if (item.looseQuantity) {
    const summary = formatLooseCartSummary(item)

    return (
      <>
        <button
          type="button"
          disabled={pending}
          onClick={() => setModalOpen(true)}
          className="rounded-full px-3.5 py-2 text-[11px] font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
          style={{
            color: colors.accent,
            background: 'rgba(64,222,170,0.10)',
            border: `1.5px solid ${colors.accent}`,
          }}
        >
          {summary?.short ?? 'Edit quantity'}
        </button>

        {modalOpen && (
          <LooseQuantityModal
            product={cartItemToProduct(item, catalogProduct)}
            onClose={() => setModalOpen(false)}
            onConfirm={({ fullPackQty, looseUnitQty, totalUnits }) =>
              run(async () => {
                await addItem(cartItemToProduct(item, catalogProduct), {
                  loose: true,
                  fullPackQty,
                  looseUnitQty,
                  totalUnits,
                })
                setModalOpen(false)
              })
            }
            initialFullPackQty={item.fullPackQty ?? 0}
            initialLooseUnitQty={item.looseUnitQty ?? 0}
            saving={pending}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex items-center rounded-[11px]" style={{ border: `1px solid ${colors.border}` }}>
      <button
        type="button"
        className="px-2.5 py-2 disabled:opacity-45"
        disabled={pending}
        onClick={() => run(() => setQty(item.id, item.qty - 1))}
        aria-label="Decrease"
      >
        <Minus size={13} />
      </button>
      <span className="px-3 text-[13px] font-extrabold" style={{ color: colors.textBright }}>
        {item.qty}
      </span>
      <button
        type="button"
        className="px-2.5 py-2 disabled:opacity-45"
        disabled={pending}
        onClick={() => run(() => setQty(item.id, item.qty + 1))}
        aria-label="Increase"
      >
        <Plus size={13} />
      </button>
    </div>
  )
}
