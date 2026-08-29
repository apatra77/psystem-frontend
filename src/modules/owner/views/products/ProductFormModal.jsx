import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera, Info } from 'lucide-react'
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
  packType: '',
  stockPerPack: '',
  stockUnit: '',
  allowLoose: 'no',
  fullPackQty: '',
  looseQty: '',
  price: '',
  mrp: '',
  discountPercent: '',
  discountPrice: '',
}

function RequiredLabel({ children }) {
  return (
    <div className="text-[11px] font-bold mb-1" style={{ color: colors.textSecondary }}>
      {children}
      <span className="text-red-400"> *</span>
    </div>
  )
}

function FieldHint({ children }) {
  return (
    <p className="mt-1 text-[10px] leading-snug" style={{ color: colors.textDim }}>
      {children}
    </p>
  )
}

function LooseQuantityRadio({ value, onChange, disabled }) {
  return (
    <div
      className="flex items-center gap-5 mt-2"
      role="radiogroup"
      aria-label="Loose quantity"
    >
      {[
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ].map((option) => (
        <label
          key={option.id}
          className={`flex items-center gap-2 text-[12px] font-bold ${
            disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          }`}
          style={{ color: colors.textHighlight }}
        >
          <input
            type="radio"
            name="allowLoose"
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
            disabled={disabled}
            className="h-4 w-4 shrink-0 cursor-pointer disabled:cursor-not-allowed"
            style={{ accentColor: colors.accent }}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}

function FieldError({ message }) {
  if (!message) return null
  return (
    <p className="mt-1 text-[11px] font-bold text-red-400 leading-snug">{message}</p>
  )
}

function validateProductDraft(draft) {
  const errors = {}
  const productName = draft.name.trim()
  const packType = draft.packType.trim()
  const stockUnit = draft.stockUnit.trim()
  const sellingPrice = draft.price
  const allowsLoose = draft.allowLoose === 'yes'

  if (!productName) errors.name = 'Product name is required'
  if (!draft.purchaseTax) errors.purchaseTax = 'Please select purchase tax'
  if (!draft.salesTax) errors.salesTax = 'Please select sales tax'
  if (!packType) errors.packType = 'Pack type is required'
  if (draft.mrp === '' || Number.isNaN(Number(draft.mrp))) errors.mrp = 'MRP is required'
  if (sellingPrice === '' || Number.isNaN(Number(sellingPrice))) errors.price = 'Price is required'
  if (draft.stockPerPack === '' || Number.isNaN(Number(draft.stockPerPack))) {
    errors.stockPerPack = 'Stock quantity per pack is required'
  }
  if (!stockUnit) errors.stockUnit = 'Stock unit is required'
  if (draft.fullPackQty === '' || Number.isNaN(Number(draft.fullPackQty))) {
    errors.fullPackQty = 'Full pack quantity is required'
  }
  if (allowsLoose && (draft.looseQty === '' || Number.isNaN(Number(draft.looseQty)))) {
    errors.looseQty = 'Loose quantity is required when loose sale is enabled'
  }

  return errors
}

function normalizeLooseIntoFullPacks(stockPerPack, fullPackQty, looseQty) {
  const unitsPerPack = Number(stockPerPack)
  const loose = Number(looseQty)
  const fullPacks = Number(fullPackQty) || 0

  if (
    looseQty === '' ||
    Number.isNaN(loose) ||
    loose < 0 ||
    stockPerPack === '' ||
    Number.isNaN(unitsPerPack) ||
    unitsPerPack <= 0 ||
    loose < unitsPerPack
  ) {
    return null
  }

  const additionalFullPacks = Math.floor(loose / unitsPerPack)
  const remainingLoose = loose % unitsPerPack

  return {
    fullPackQty: String(fullPacks + additionalFullPacks),
    looseQty: String(remainingLoose),
  }
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
  const [fieldErrors, setFieldErrors] = useState({})
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
    setFieldErrors((prev) => {
      const keysToClear = [field]
      if (field === 'mrp' || field === 'discountPercent' || field === 'discountPrice') {
        keysToClear.push('price')
      }
      if (field === 'allowLoose' && value === 'no') {
        keysToClear.push('looseQty')
      }
      if (field === 'looseQty' || field === 'stockPerPack') {
        keysToClear.push('fullPackQty', 'looseQty')
      }
      if (!keysToClear.some((key) => prev[key])) return prev
      const next = { ...prev }
      keysToClear.forEach((key) => {
        delete next[key]
      })
      return next
    })
    setDraft((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'allowLoose' && value === 'no') {
        next.looseQty = ''
      }

      if (
        next.allowLoose === 'yes' &&
        (field === 'looseQty' || field === 'stockPerPack')
      ) {
        const normalized = normalizeLooseIntoFullPacks(
          field === 'stockPerPack' ? value : next.stockPerPack,
          next.fullPackQty,
          field === 'looseQty' ? value : next.looseQty,
        )
        if (normalized) {
          next.fullPackQty = normalized.fullPackQty
          next.looseQty = normalized.looseQty
        }
      }

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
    const productId = draft.id || routeId

    const productName = draft.name.trim()
    const genericName = draft.genericName.trim()
    const description = draft.description.trim()
    const categoryName =
      categories.find((c) => c.id === draft.cat)?.name ?? detail.categoryName ?? ''
    const stockUnit = draft.stockUnit.trim()
    const packType = draft.packType.trim()
    const sellingPrice = draft.price
    const allowsLoose = draft.allowLoose === 'yes'

    const errors = validateProductDraft(draft)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setSaveError(null)
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
      stockQty: draft.stockPerPack,
      stockUnit,
      packType,
      fullPackQty: draft.fullPackQty,
      looseQty: allowsLoose ? draft.looseQty : '',
      allowLoose: allowsLoose,
      discountPercent: draft.discountPercent,
    })

    setSaving(true)
    setFieldErrors({})
    setSaveError(null)

    try {
      if (isEdit) {
        if (!productId) {
          throw new Error('Product id is missing')
        }
        const payload = buildUpdateProductPayload(basePayload, { productId })
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

        <div className="flex-1 overflow-y-auto px-4 py-1 owner-scroll flex flex-col gap-3 min-h-0">
        <div
          className="w-full min-h-[92px] rounded-[12px] flex flex-col items-center justify-center gap-1.5 text-center px-4 py-5"
          style={{
            border: '1.5px dashed rgba(255,255,255,0.2)',
            color: colors.textDim,
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <Camera size={22} style={{ color: colors.accent }} />
          <div className="text-[12px] font-bold text-white">Drop a product photo</div>
          <div className="text-[10.5px] font-medium" style={{ color: colors.textDim }}>
            JPG, PNG up to 2MB
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <RequiredLabel>Product name</RequiredLabel>
            <ModalInput
              value={draft.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Amlokind 2.5 mg Tablet"
            />
            <FieldError message={fieldErrors.name} />
          </div>
          <div>
            <ModalFieldLabel>Generic name</ModalFieldLabel>
            <ModalInput
              value={draft.genericName}
              onChange={(e) => setField('genericName', e.target.value)}
              placeholder="e.g. Amlodipine"
            />
            <FieldError message={fieldErrors.genericName} />
          </div>
        </div>

        <div>
          <ModalFieldLabel>Product description</ModalFieldLabel>
          <ModalTextarea
            value={draft.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Short description of the product"
            rows={3}
          />
          <FieldError message={fieldErrors.description} />
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
            <FieldError message={fieldErrors.cat} />
          </div>
          <div>
            <RequiredLabel>Purchase tax</RequiredLabel>
            <ModalSelect
              value={draft.purchaseTax}
              onChange={(e) => setField('purchaseTax', e.target.value)}
              options={purchaseTaxOptions}
              placeholder={taxGroupsLoading ? 'Loading purchase tax…' : 'Select tax'}
            />
            <FieldError message={fieldErrors.purchaseTax} />
          </div>
          <div>
            <RequiredLabel>Sales tax</RequiredLabel>
            <ModalSelect
              value={draft.salesTax}
              onChange={(e) => setField('salesTax', e.target.value)}
              options={salesTaxOptions}
              placeholder={taxGroupsLoading ? 'Loading sales tax…' : 'Select tax'}
            />
            <FieldError message={fieldErrors.salesTax} />
          </div>
        </div>

        {taxGroupsError && (
          <div className="text-[12px] font-bold text-red-400">{taxGroupsError}</div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div>
            <RequiredLabel>SKU (Pack type)</RequiredLabel>
            <ModalInput
              value={draft.packType}
              onChange={(e) => setField('packType', e.target.value)}
              placeholder="e.g. Strip"
            />
            <FieldHint>Strip, Tube, Bottle, etc.</FieldHint>
            <FieldError message={fieldErrors.packType} />
          </div>
          <div>
            <RequiredLabel>Stock quantity per pack</RequiredLabel>
            <ModalInput
              type="number"
              min="0"
              value={draft.stockPerPack}
              onChange={(e) => setField('stockPerPack', e.target.value)}
              placeholder="e.g. 10"
            />
            <FieldHint>How many units in a single pack (e.g. 10 tablets in 1 strip, 30ml in 1 bottle)</FieldHint>
            <FieldError message={fieldErrors.stockPerPack} />
          </div>
          <div>
            <RequiredLabel>Stock unit</RequiredLabel>
            <ModalInput
              value={draft.stockUnit}
              onChange={(e) => setField('stockUnit', e.target.value)}
              placeholder="e.g. TAB"
            />
            <FieldHint>Pcs, TAB, Tube, Bottle, ml, gm, etc.</FieldHint>
            <FieldError message={fieldErrors.stockUnit} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <ModalFieldLabel>Loose quantity</ModalFieldLabel>
              <Info size={12} style={{ color: colors.textDim }} aria-hidden="true" />
            </div>
            <LooseQuantityRadio
              value={draft.allowLoose}
              onChange={(value) => setField('allowLoose', value)}
              disabled={saving}
            />
          </div>
          <div>
            <RequiredLabel>With full pack (Unit 3)</RequiredLabel>
            <ModalInput
              type="number"
              min="0"
              value={draft.fullPackQty}
              onChange={(e) => setField('fullPackQty', e.target.value)}
              placeholder="Enter quantity"
            />
            <FieldHint>How many complete packs are required</FieldHint>
            <FieldError message={fieldErrors.fullPackQty} />
          </div>
          <div>
            <ModalFieldLabel>Loose quantity (Unit 4)</ModalFieldLabel>
            <ModalInput
              type="number"
              min="0"
              value={draft.looseQty}
              onChange={(e) => setField('looseQty', e.target.value)}
              placeholder="Enter quantity"
              disabled={draft.allowLoose !== 'yes' || saving}
            />
            <FieldHint>Loose units required without pack</FieldHint>
            <FieldError message={fieldErrors.looseQty} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div>
            <RequiredLabel>MRP (₹)</RequiredLabel>
            <ModalInput
              type="number"
              min="0"
              step="0.01"
              value={draft.mrp}
              onChange={(e) => setField('mrp', e.target.value)}
              placeholder="0.00"
            />
            <FieldError message={fieldErrors.mrp} />
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
              placeholder="0.00"
            />
          </div>
          <div>
            <RequiredLabel>Price (₹)</RequiredLabel>
            <ModalInput
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              disabled
              placeholder="0.00"
            />
            <FieldError message={fieldErrors.price} />
          </div>
        </div>
        </div>

        {saveError && (
          <div className="flex-shrink-0 px-4 pb-1 text-[12px] font-bold text-red-400">{saveError}</div>
        )}

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
