import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import PortalModal, { ModalFieldLabel, ModalInput, ModalSelect, ToggleSwitch } from '../../components/PortalModal'
import { useOwnerPortal } from '../../context/OwnerPortalContext'
import { colors } from '../../../theme/colors'

const EMPTY_DRAFT = {
  name: '',
  cat: '',
  sku: '',
  price: '',
  mrp: '',
  stock: '',
  rx: false,
  status: 'active',
}

export default function ProductFormModal() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { products, categories, saveProduct } = useOwnerPortal()
  const product = isEdit ? products.find((p) => p.id === id) : null

  const [draft, setDraft] = useState(EMPTY_DRAFT)

  useEffect(() => {
    if (isEdit && product) {
      setDraft({
        id: product.id,
        name: product.name,
        cat: product.cat,
        sku: product.sku,
        price: String(product.price),
        mrp: String(product.mrp),
        stock: String(product.stock),
        rx: product.rx,
        status: product.status,
      })
    } else if (!isEdit) {
      setDraft({
        ...EMPTY_DRAFT,
        cat: categories[0]?.id ?? '',
      })
    }
  }, [isEdit, product, categories])

  if (isEdit && !product) {
    return <Navigate to="/owner/products" replace />
  }

  const close = () => navigate('/owner/products')

  const setField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    saveProduct({
      ...draft,
      id: draft.id || `p${Date.now()}`,
      price: Number(draft.price) || 0,
      mrp: Number(draft.mrp) || 0,
      stock: Number(draft.stock) || 0,
    })
    close()
  }

  return (
    <PortalModal onClose={close}>
      <div className="p-[26px_28px] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-[17px] font-extrabold text-white">
            {isEdit ? 'Edit product' : 'Add product'}
          </div>
          <button
            type="button"
            onClick={close}
            className="cursor-pointer text-lg leading-none p-2"
            style={{ color: colors.textDim }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div
          className="w-full h-[140px] rounded-[14px] flex items-center justify-center text-[12px] font-bold"
          style={{
            border: '1.5px dashed rgba(255,255,255,0.2)',
            color: colors.textDim,
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          Drop a product photo
        </div>

        <div>
          <ModalFieldLabel>Product name</ModalFieldLabel>
          <ModalInput
            value={draft.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="e.g. Multivitamin Daily, 60 tabs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <ModalFieldLabel>Category</ModalFieldLabel>
            <ModalSelect value={draft.cat} onChange={(e) => setField('cat', e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </ModalSelect>
          </div>
          <div>
            <ModalFieldLabel>SKU</ModalFieldLabel>
            <ModalInput
              value={draft.sku}
              onChange={(e) => setField('sku', e.target.value)}
              placeholder="MQ-XXX-0000"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <ModalFieldLabel>Price (₹)</ModalFieldLabel>
            <ModalInput
              type="number"
              value={draft.price}
              onChange={(e) => setField('price', e.target.value)}
            />
          </div>
          <div>
            <ModalFieldLabel>MRP (₹)</ModalFieldLabel>
            <ModalInput
              type="number"
              value={draft.mrp}
              onChange={(e) => setField('mrp', e.target.value)}
            />
          </div>
          <div>
            <ModalFieldLabel>Stock qty</ModalFieldLabel>
            <ModalInput
              type="number"
              value={draft.stock}
              onChange={(e) => setField('stock', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <span className="text-[12.5px] font-bold" style={{ color: colors.textHighlight }}>
              Requires prescription
            </span>
            <ToggleSwitch on={draft.rx} onToggle={() => setField('rx', !draft.rx)} />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[12.5px] font-bold" style={{ color: colors.textHighlight }}>
              Active
            </span>
            <ToggleSwitch
              on={draft.status === 'active'}
              onToggle={() => setField('status', draft.status === 'active' ? 'inactive' : 'active')}
            />
          </div>
        </div>

        <div
          className="flex justify-end gap-2.5 pt-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.09)' }}
        >
          <button
            type="button"
            onClick={close}
            className="text-[12.5px] font-bold px-[18px] py-2.5 rounded-[10px] cursor-pointer"
            style={{
              color: colors.textHighlight,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.16)',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="text-[12.5px] font-extrabold px-5 py-2.5 rounded-[10px] cursor-pointer"
            style={{
              color: colors.accentText,
              background: colors.primaryBtn,
              boxShadow: '0 6px 18px rgba(64,222,170,0.35)',
            }}
          >
            Save product
          </button>
        </div>
      </div>
    </PortalModal>
  )
}
