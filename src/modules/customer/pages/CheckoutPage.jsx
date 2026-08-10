import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormContext } from 'react-hook-form'
import { Bike, MapPin, QrCode } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import EmptyState from '@/shared/ui/EmptyState'
import Button from '@/shared/ui/Button'
import Spinner from '@/shared/ui/Spinner'
import { Form, RadioCardGroup, TextField, CheckboxField, SubmitButton } from '@/shared/components/form'
import { checkoutSchema } from '@/app/validations/schemas/customer.schema'
import { useAuthStore } from '@/app/store/authStore'
import { useCartStore } from '@/app/store/cartStore'
import { useOrderStore } from '@/app/store/orderStore'
import { toast } from '@/app/store/uiStore'
import { fetchUserProfile } from '@/services/user'
import { createCodPayment } from '@/services/payments'
import { getStoredAuthUser } from '@/services/auth'
import { jwtSubject } from '@/shared/api/jwt'
import { getAccessToken } from '@/shared/api/tokenBridge'
import { PATHS, buildPath } from '@/app/router/paths'
import { fmtINR } from '@/app/utils/format'
import { msg } from '@/shared/messages/messages'
import { colors } from '@/app/themes/colors'

/** Shown below the payment method cards. */
function PaymentDetails() {
  return (
    <p className="text-[12.5px]" style={{ color: colors.textMuted }}>
      Pay the delivery partner in cash or by scanning the QR code on arrival.
    </p>
  )
}

/** Checkout payment options — card & wallet entries commented out below. */
const CHECKOUT_PAYMENT_OPTIONS = [
  {
    value: 'upi',
    label: 'Generate QR',
    hint: 'Scan and pay using any UPI app',
    icon: QrCode,
    badge: 'Instant payment',
  },
  {
    value: 'cod',
    label: 'Cash on delivery',
    hint: 'Pay the rider',
    icon: Bike,
  },
]

// Commented out payment methods (from PAYMENT_METHODS in @/shared/mocks/pricing):
// { id: 'upi', label: 'UPI', hint: 'GPay, PhonePe, Paytm' },
// { id: 'card', label: 'Credit / Debit card', hint: 'Visa, Mastercard, RuPay' },
// { id: 'wallet', label: 'MEDIQ wallet', hint: 'Balance ₹340' },

function ScheduleFields() {
  const { watch } = useFormContext()
  if (!watch('scheduleLater')) return null
  return <TextField name="scheduledFor" label="Deliver at" type="datetime-local" required />
}

function resolveUserId() {
  const fromStore = useAuthStore.getState().user?.id
  if (fromStore != null && fromStore !== '') return String(fromStore)

  const stored = getStoredAuthUser()
  if (stored?.userId != null && stored.userId !== '') return String(stored.userId)

  const subject = jwtSubject(getAccessToken())
  if (subject) return String(subject)

  return null
}

function CheckoutForm({ addresses, items, totals, scheduledFor, prescriptionId, clear, placeOrder }) {
  const navigate = useNavigate()

  const addressOptions = addresses.map((a) => ({
    value: a.id,
    label: `${a.label} · ${a.name}`,
    hint: `${a.line1}, ${a.city} ${a.pincode}`,
  }))

  const defaultAddressId = addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? ''

  const onSubmit = async (values) => {
    const address = addresses.find((a) => a.id === values.addressId)

    try {
      let apiOrderId = null
      let apiOrderTotal = null

      if (values.paymentMethod === 'cod') {
        const userId = resolveUserId()
        if (!userId) {
          throw new Error('Could not resolve user id for payment')
        }

        const payment = await createCodPayment({
          amount: Number(totals.total.toFixed(2)),
          transactionNote: 'Cash On Delivery',
          transactionRefId: `ORD-${userId}`,
        })

        if (!payment.orderId) {
          throw new Error('Order id missing from payment response')
        }

        apiOrderId = payment.orderId
        apiOrderTotal = payment.amount || totals.total
      }

      const order = placeOrder({
        items,
        totals,
        address: `${address.label} · ${address.line1}, ${address.city}`,
        addressDetails: address,
        paymentMethod: values.paymentMethod,
        scheduledFor: values.scheduleLater ? values.scheduledFor : scheduledFor,
        prescriptionId,
        orderId: apiOrderId ?? undefined,
        total: apiOrderTotal ?? undefined,
      })
      clear()
      navigate(buildPath(PATHS.customer.orderSuccess, { id: order.id }), { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not place order')
    }
  }

  if (addresses.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No delivery address saved"
        action={<Button onClick={() => navigate(PATHS.customer.addresses)}>Add address</Button>}
      />
    )
  }

  return (
    <Form
      key={defaultAddressId}
      schema={checkoutSchema}
      defaultValues={{
        addressId: defaultAddressId,
        paymentMethod: 'upi',
        scheduleLater: false,
        scheduledFor: '',
        upiId: '',
        cardNumber: '',
        cardExpiry: '',
        cardCvv: '',
      }}
      onSubmit={onSubmit}
    >
      <div className="grid gap-6" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)' }}>
        <div className="space-y-6">
          <section className="rounded-[18px] p-5" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-extrabold" style={{ color: colors.textBright }}>Delivery address</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate(PATHS.customer.addresses)} type="button">Manage</Button>
            </div>
            <RadioCardGroup name="addressId" options={addressOptions} />
          </section>

          <section className="rounded-[18px] p-5 space-y-4" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <h2 className="text-[14px] font-extrabold" style={{ color: colors.textBright }}>Delivery time</h2>
            <CheckboxField name="scheduleLater" label="Schedule for later" hint="Otherwise we deliver as soon as possible." />
            <ScheduleFields />
          </section>

          <section className="rounded-[18px] p-5 space-y-4" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <h2 className="text-[14px] font-extrabold" style={{ color: colors.textBright }}>Payment</h2>
            <RadioCardGroup name="paymentMethod" options={CHECKOUT_PAYMENT_OPTIONS} columns={2} />
            <PaymentDetails />
          </section>
        </div>

        <aside className="rounded-[18px] p-5 h-fit sticky top-[84px]" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <p className="text-[14px] font-extrabold mb-4" style={{ color: colors.textBright }}>Order summary</p>
          <ul className="space-y-2 text-[12.5px] mb-4" style={{ color: colors.textMuted }}>
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="truncate">{i.name} × {i.qty}</span>
                <span>{fmtINR(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-[16px] font-extrabold pt-3" style={{ borderTop: `1px solid ${colors.borderSubtle}`, color: colors.textBright }}>
            <span>To pay</span><span>{fmtINR(totals.total)}</span>
          </div>
          <SubmitButton className="w-full mt-5" size="lg">Place order</SubmitButton>
        </aside>
      </div>
    </Form>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, scheduledFor, prescriptionId, clear } = useCartStore()
  const totals = useCartStore((s) => s.totals())
  const addresses = useOrderStore((s) => s.addresses)
  const addressesLoadedFromApi = useOrderStore((s) => s.addressesLoadedFromApi)
  const setAddressesFromApi = useOrderStore((s) => s.setAddressesFromApi)
  const placeOrder = useOrderStore((s) => s.placeOrder)
  const [cartReady, setCartReady] = useState(() => useCartStore.getState().items.length > 0)
  const [addressesLoading, setAddressesLoading] = useState(() => !useOrderStore.getState().addressesLoadedFromApi)

  useEffect(() => {
    if (useCartStore.getState().items.length > 0) {
      setCartReady(true)
      return undefined
    }

    let cancelled = false

    useCartStore
      .getState()
      .loadCart({ silent: true })
      .finally(() => {
        if (!cancelled) setCartReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (addressesLoadedFromApi) {
      setAddressesLoading(false)
      return undefined
    }

    let cancelled = false

    ;(async () => {
      try {
        const profile = await fetchUserProfile()
        if (!cancelled) {
          setAddressesFromApi(profile?.addresses ?? [])
        }
      } catch {
        if (!cancelled) setAddressesFromApi([])
      } finally {
        if (!cancelled) setAddressesLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [addressesLoadedFromApi, setAddressesFromApi])

  if (!cartReady) {
    return (
      <div>
        <PageHeader title="Checkout" subtitle="Confirm address, delivery time and payment." />
        <div className="flex items-center justify-center gap-3 py-24 text-[13px]" style={{ color: colors.textMuted }}>
          <Spinner />
          Loading your cart…
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return <EmptyState title={msg('customer.cartEmpty')} action={<Button onClick={() => navigate(PATHS.customer.search)}>Browse products</Button>} />
  }

  return (
    <div>
      <PageHeader title="Checkout" subtitle="Confirm address, delivery time and payment." />

      {addressesLoading ? (
        <div className="flex items-center justify-center gap-3 py-24 text-[13px]" style={{ color: colors.textMuted }}>
          <Spinner />
          Loading delivery addresses…
        </div>
      ) : (
        <CheckoutForm
          addresses={addresses}
          items={items}
          totals={totals}
          scheduledFor={scheduledFor}
          prescriptionId={prescriptionId}
          clear={clear}
          placeOrder={placeOrder}
        />
      )}
    </div>
  )
}
