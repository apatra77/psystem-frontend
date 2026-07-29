import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import PortalModal, { ModalFieldLabel, ModalInput, ModalSelect, ModalTextarea } from '../../components/PortalModal'
import { useOwnerPortal } from '../../context/OwnerPortalContext'
import { buildCreateProductPayload, createProduct, fetchTaxGroups, toTaxSelectOptions } from '../../../services/products'
import { colors } from '../../../theme/colors'

const EMPTY_DRAFT = {
  name: '',
  genericName: '',
  description: '',
  cat: '',
  purchaseTax: '',
  salesTax: '',
  sku: '',
  price: '',
  mrp: '',
  discountPercent: '',
  discountPrice: '',
  stock: '',
  stockUnit: '',
}

function calcDiscountPrice(mrp, discountPercent) {
  const m = Number(mrp) || 0
  const pct = Number(discountPercent) || 0
  if (m <= 0) return ''
  return String(Number((m * (1 - pct / 100)).toFixed(2)))
}

export default function ProductFormModal() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { products, categories, categoriesLoading, saveProduct, reloadProducts } = useOwnerPortal()
  const product = isEdit ? products.find((p) => p.id === id) : null

  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [purchaseTaxOptions, setPurchaseTaxOptions] = useState([])
  const [salesTaxOptions, setSalesTaxOptions] = useState([])
  const [taxGroupsLoading, setTaxGroupsLoading] = useState(true)
  const [taxGroupsError, setTaxGroupsError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories],
  )

  useEffect(() => {
    let cancelled = false

    const loadTaxGroups = async () => {
      setTaxGroupsLoading(true)
      setTaxGroupsError(null)
      try {
        const { salesTaxGroups, purchaseTaxGroups } = await fetchTaxGroups()
        if (cancelled) return

        const salesOptions = toTaxSelectOptions(salesTaxGroups)
        const purchaseOptions = toTaxSelectOptions(purchaseTaxGroups)
        setSalesTaxOptions(salesOptions)
        setPurchaseTaxOptions(purchaseOptions)
      } catch (err) {
        if (!cancelled) {
          setTaxGroupsError(err?.message ?? 'Failed to load tax groups')
          setSalesTaxOptions([])
          setPurchaseTaxOptions([])
        }
      } finally {
        if (!cancelled) setTaxGroupsLoading(false)
      }
    }

    loadTaxGroups()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isEdit && product) {
      setDraft({
        id: product.id,
        name: product.name ?? '',
        genericName: product.genericName ?? '',
        description: product.description ?? '',
        cat: product.cat ?? '',
        purchaseTax: product.purchaseTax != null ? String(product.purchaseTax) : '',
        salesTax: product.salesTax != null ? String(product.salesTax) : '',
        sku: product.sku ?? '',
        price: product.price != null ? String(product.price) : '',
        mrp: product.mrp != null ? String(product.mrp) : '',
        discountPercent: product.discountPercent != null ? String(product.discountPercent) : '',
        discountPrice: product.discountPrice != null ? String(product.discountPrice) : '',
        stock: product.stock != null ? String(product.stock) : '',
        stockUnit: product.stockUnit ?? '',
      })
    }
  }, [isEdit, product])

  if (isEdit && !product) {
    return <Navigate to="/owner/products" replace />
  }

  const close = () => navigate('/owner/products')

  const setField = (field, value) => {
    setDraft((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'mrp' || field === 'discountPercent') {
        next.discountPrice = calcDiscountPrice(
          field === 'mrp' ? value : prev.mrp,
          field === 'discountPercent' ? value : prev.discountPercent,
        )
      }
      return next
    })
  }

  const handleSave = async () => {
    if (saving) return

    const productName = draft.name.trim()
    const genericName = draft.genericName.trim()
    const description = draft.description.trim()
    const categoryName = categories.find((c) => c.id === draft.cat)?.name ?? ''
    const stockUnit = draft.stockUnit.trim()

    if (!productName) {
      setSaveError('Product name is required')
      return
    }
    if (!genericName) {
      setSaveError('Generic name is required')
      return
    }
    if (!description) {
      setSaveError('Product description is required')
      return
    }
    if (!categoryName) {
      setSaveError('Please select a category')
      return
    }
    if (!draft.purchaseTax) {
      setSaveError('Please select purchase tax')
      return
    }
    if (!draft.salesTax) {
      setSaveError('Please select sales tax')
      return
    }
    if (draft.mrp === '' || Number.isNaN(Number(draft.mrp))) {
      setSaveError('MRP is required')
      return
    }
    if (draft.price === '' || Number.isNaN(Number(draft.price))) {
      setSaveError('Price is required')
      return
    }
    if (draft.stock === '' || Number.isNaN(Number(draft.stock))) {
      setSaveError('Stock qty is required')
      return
    }
    if (!stockUnit) {
      setSaveError('Stock unit is required')
      return
    }

    if (isEdit) {
      saveProduct({
        ...draft,
        name: productName,
        genericName,
        description,
        id: draft.id || `p${Date.now()}`,
        price: Number(draft.price),
        mrp: Number(draft.mrp),
        stock: Number(draft.stock),
        stockUnit,
        discountPercent: Number(draft.discountPercent) || 0,
        discountPrice: Number(draft.discountPrice) || 0,
        purchaseTax: draft.purchaseTax,
        salesTax: draft.salesTax,
      })
      close()
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      await createProduct(
        buildCreateProductPayload({
          productName,
          description,
          mrp: draft.mrp,
          price: draft.price,
          genericName,
          categoryName,
          purchTaxCode: draft.purchaseTax,
          salesTaxCode: draft.salesTax,
          stockQty: draft.stock,
          stockUnit,
        }),
      )

      await reloadProducts()
      setSuccessMessage(`Product ${productName} added successfully`)
    } catch (err) {
      setSaveError(err?.message ?? 'Failed to add product')
    } finally {
      setSaving(false)
    }
  }

  if (successMessage) {
    return (
      <PortalModal onClose={close} width={420} scrollable={false}>
        <div className="p-6 flex flex-col items-center gap-4 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ background: 'rgba(64,222,170,0.15)', color: colors.accent }}
          >
            ✓
          </div>
          <div className="text-[15px] font-extrabold text-white">{successMessage}</div>
          <button
            type="button"
            onClick={close}
            className="text-[12.5px] font-extrabold px-5 py-2.5 rounded-[10px] cursor-pointer"
            style={{
              color: colors.accentText,
              background: colors.primaryBtn,
              boxShadow: '0 6px 18px rgba(64,222,170,0.35)',
            }}
          >
            OK
          </button>
        </div>
      </PortalModal>
    )
  }

  return (
    <PortalModal onClose={close} width={760} scrollable={false}>
      <div className="flex flex-col max-h-[88vh]">
        <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-2">
          <div className="text-[16px] font-extrabold text-white">
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

        <div className="flex-1 overflow-y-auto px-4 py-1 owner-scroll flex flex-col gap-2 min-h-0">
        <div
          className="w-full h-[72px] rounded-[12px] flex items-center justify-center text-[11px] font-bold"
          style={{
            border: '1.5px dashed rgba(255,255,255,0.2)',
            color: colors.textDim,
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          Drop a product photo
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <ModalFieldLabel>Product name</ModalFieldLabel>
            <ModalInput
              value={draft.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Aspirin 500mg"
            />
          </div>
          <div>
            <ModalFieldLabel>Generic name</ModalFieldLabel>
            <ModalInput
              value={draft.genericName}
              onChange={(e) => setField('genericName', e.target.value)}
              placeholder="e.g. Ashwagandha"
            />
          </div>
        </div>

        <div>
          <ModalFieldLabel>Product description</ModalFieldLabel>
          <ModalTextarea
            value={draft.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Short description of the product"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <ModalFieldLabel>Category</ModalFieldLabel>
            <ModalSelect
              value={draft.cat}
              onChange={(e) => setField('cat', e.target.value)}
              options={categoryOptions}
              placeholder={categoriesLoading ? 'Loading categories…' : 'Select category'}
            />
          </div>
          <div>
            <ModalFieldLabel>Purchase tax</ModalFieldLabel>
            <ModalSelect
              value={draft.purchaseTax}
              onChange={(e) => setField('purchaseTax', e.target.value)}
              options={purchaseTaxOptions}
              placeholder={taxGroupsLoading ? 'Loading purchase tax…' : 'Select tax'}
            />
          </div>
          <div>
            <ModalFieldLabel>Sales tax</ModalFieldLabel>
            <ModalSelect
              value={draft.salesTax}
              onChange={(e) => setField('salesTax', e.target.value)}
              options={salesTaxOptions}
              placeholder={taxGroupsLoading ? 'Loading sales tax…' : 'Select tax'}
            />
          </div>
        </div>

        {taxGroupsError && (
          <div className="text-[12px] font-bold text-red-400">{taxGroupsError}</div>
        )}

        {saveError && (
          <div className="text-[12px] font-bold text-red-400">{saveError}</div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div>
            <ModalFieldLabel>SKU</ModalFieldLabel>
            <ModalInput
              value={draft.sku}
              onChange={(e) => setField('sku', e.target.value)}
              placeholder="MQ-XXX-0000"
            />
          </div>
          <div>
            <ModalFieldLabel>Stock qty</ModalFieldLabel>
            <ModalInput
              type="number"
              min="0"
              value={draft.stock}
              onChange={(e) => setField('stock', e.target.value)}
              placeholder="Enter quantity"
            />
          </div>
          <div>
            <ModalFieldLabel>Stock unit</ModalFieldLabel>
            <ModalInput
              value={draft.stockUnit}
              onChange={(e) => setField('stockUnit', e.target.value)}
              placeholder="e.g. Pcs, TAB"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div>
            <ModalFieldLabel>Price (₹)</ModalFieldLabel>
            <ModalInput
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={(e) => setField('price', e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <ModalFieldLabel>MRP (₹)</ModalFieldLabel>
            <ModalInput
              type="number"
              min="0"
              step="0.01"
              value={draft.mrp}
              onChange={(e) => setField('mrp', e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <ModalFieldLabel>Discount %</ModalFieldLabel>
            <ModalInput
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={draft.discountPercent}
              onChange={(e) => setField('discountPercent', e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <ModalFieldLabel>Discount price (₹)</ModalFieldLabel>
            <ModalInput
              type="number"
              min="0"
              step="0.01"
              value={draft.discountPrice}
              onChange={(e) => setField('discountPrice', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        </div>

        <div
          className="flex-shrink-0 flex justify-end gap-2.5 px-4 py-3 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.09)' }}
        >
          <button
            type="button"
            onClick={close}
            className="text-[12.5px] font-bold px-[18px] py-2 rounded-[10px] cursor-pointer"
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
            disabled={saving}
            className="text-[12.5px] font-extrabold px-5 py-2 rounded-[10px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              color: colors.accentText,
              background: colors.primaryBtn,
              boxShadow: '0 6px 18px rgba(64,222,170,0.35)',
            }}
          >
            {saving ? 'Saving…' : 'Save product'}
          </button>
        </div>
      </div>
    </PortalModal>
  )
}
