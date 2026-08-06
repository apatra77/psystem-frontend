import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PortalModal, { ModalFieldLabel, ModalInput, ModalSelect, ModalTextarea } from '../../components/PortalModal'
import Spinner from '@/components/ui/Spinner'
import { useOwnerPortal } from '../../context/OwnerPortalContext'
import {
  buildCreateProductPayload,
  buildUpdateProductPayload,
  createProduct,
  fetchProductById,
  fetchTaxGroups,
  mapProductDetailToFormDraft,
  toTaxSelectOptions,
  updateProduct,
} from '@/services/products'
import { colors } from '@/theme/colors'

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

function formatAmount(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  return String(Number(n.toFixed(2)))
}

function applyPricingFromPercent(mrp, discountPercent) {
  const m = Number(mrp) || 0
  const pct = Number(discountPercent) || 0
  if (m <= 0 || discountPercent === '') return { discountPrice: '', price: '' }
  const discountAmount = m * (pct / 100)
  return {
    discountPrice: formatAmount(discountAmount),
    price: formatAmount(m - discountAmount),
  }
}

function applyPricingFromDiscountAmount(mrp, discountAmount) {
  const m = Number(mrp) || 0
  const amount = Number(discountAmount) || 0
  if (m <= 0 || discountAmount === '') return { discountPercent: '', price: '' }
  return {
    discountPercent: formatAmount((amount / m) * 100),
    price: formatAmount(m - amount),
  }
}

function applyPricingFromSellingPrice(mrp, sellingPrice) {
  const m = Number(mrp) || 0
  const sell = Number(sellingPrice) || 0
  if (m <= 0 || sellingPrice === '') return { discountPercent: '', discountPrice: '' }
  const discountAmount = m - sell
  return {
    discountPercent: formatAmount((discountAmount / m) * 100),
    discountPrice: formatAmount(discountAmount),
  }
}

function recalcPricingOnMrpChange(mrp, prev) {
  if (mrp === '' || Number.isNaN(Number(mrp))) {
    return { discountPercent: '', discountPrice: '', price: '' }
  }
  if (prev.discountPercent !== '') {
    return applyPricingFromPercent(mrp, prev.discountPercent)
  }
  if (prev.discountPrice !== '') {
    return applyPricingFromDiscountAmount(mrp, prev.discountPrice)
  }
  if (prev.price !== '') {
    return applyPricingFromSellingPrice(mrp, prev.price)
  }
  return {}
}

export default function ProductFormModal() {
  const navigate = useNavigate()
  const { id: routeId } = useParams()
  const isEdit = Boolean(routeId)
  const { categories, categoriesLoading, reloadProducts } = useOwnerPortal()

  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [productDetail, setProductDetail] = useState(null)
  const [productLoading, setProductLoading] = useState(isEdit)
  const [productLoadError, setProductLoadError] = useState(null)
  const [purchaseTaxOptions, setPurchaseTaxOptions] = useState([])
  const [salesTaxOptions, setSalesTaxOptions] = useState([])
  const [taxGroupsLoading, setTaxGroupsLoading] = useState(true)
  const [taxGroupsError, setTaxGroupsError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

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
    if (!isEdit || !routeId) return undefined

    let cancelled = false

    const loadProduct = async () => {
      setProductLoading(true)
      setProductLoadError(null)
      setProductDetail(null)
      try {
        const data = await fetchProductById(routeId)
        if (cancelled) return
        setProductDetail(data)
      } catch (err) {
        if (!cancelled) {
          setProductLoadError(err?.message ?? 'Failed to load product')
        }
      } finally {
        if (!cancelled) setProductLoading(false)
      }
    }

    loadProduct()
    return () => {
      cancelled = true
    }
  }, [isEdit, routeId])

  useEffect(() => {
    if (!productDetail) return
    setDraft(mapProductDetailToFormDraft(productDetail, categories))
  }, [productDetail, categories])

  const close = () => navigate('/owner/products')

  const setField = (field, value) => {
    setDraft((prev) => {
      const next = { ...prev, [field]: value }
      const mrp = field === 'mrp' ? value : prev.mrp

      if (field === 'mrp') {
        Object.assign(next, recalcPricingOnMrpChange(value, prev))
      } else if (field === 'discountPercent') {
        Object.assign(next, applyPricingFromPercent(mrp, value))
      } else if (field === 'discountPrice') {
        Object.assign(next, applyPricingFromDiscountAmount(mrp, value))
      } else if (field === 'price') {
        Object.assign(next, applyPricingFromSellingPrice(mrp, value))
      }

      return next
    })
  }

  const handleSave = async () => {
    if (saving) return

    const detail = productDetail?.data ?? productDetail ?? {}
    const packings = Array.isArray(detail.packings) ? detail.packings : []
    const packingId = packings[0]?.packingId ?? packings[0]?.id ?? null
    const productId = draft.id || routeId

    const productName = draft.name.trim()
    const genericName = draft.genericName.trim()
    const description = draft.description.trim()
    const categoryName =
      categories.find((c) => c.id === draft.cat)?.name ?? detail.categoryName ?? ''
    const stockUnit = draft.stockUnit.trim()
    const sellingPrice = draft.price

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
    if (sellingPrice === '' || Number.isNaN(Number(sellingPrice))) {
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

    const basePayload = buildCreateProductPayload({
      productName,
      description,
      mrp: draft.mrp,
      price: sellingPrice,
      genericName,
      categoryName,
      purchTaxCode: draft.purchaseTax,
      salesTaxCode: draft.salesTax,
      stockQty: draft.stock,
      stockUnit,
    })

    setSaving(true)
    setSaveError(null)

    try {
      if (isEdit) {
        if (!productId) {
          throw new Error('Product id is missing')
        }
        const payload = buildUpdateProductPayload(basePayload, { packingId })
        await updateProduct(productId, payload)
        await reloadProducts()
        close()
        return
      }

      await createProduct(basePayload)
      await reloadProducts()
      close()
    } catch (err) {
      setSaveError(err?.message ?? `Failed to ${isEdit ? 'update' : 'add'} product`)
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && productLoading) {
    return (
      <PortalModal onClose={close} width={420} scrollable={false} closeOnBackdrop={false}>
        <div className="p-8 flex flex-col items-center justify-center gap-3">
          <Spinner />
          <div className="text-[13px] font-bold" style={{ color: colors.textSecondary }}>
            Loading product…
          </div>
        </div>
      </PortalModal>
    )
  }

  if (isEdit && productLoadError) {
    return (
      <PortalModal onClose={close} width={420} scrollable={false} closeOnBackdrop={false}>
        <div className="p-6 flex flex-col items-center gap-4 text-center">
          <div className="text-[13px] font-bold text-red-400">{productLoadError}</div>
          <button
            type="button"
            onClick={close}
            className="text-[12.5px] font-extrabold px-5 py-2.5 rounded-[10px] cursor-pointer"
            style={{
              color: colors.accentText,
              background: colors.primaryBtn,
            }}
          >
            Close
          </button>
        </div>
      </PortalModal>
    )
  }

  return (
    <PortalModal onClose={close} width={760} scrollable={false} closeOnBackdrop={false}>
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
          <div>
            <ModalFieldLabel>Price (₹)</ModalFieldLabel>
            <ModalInput
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              disabled
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
