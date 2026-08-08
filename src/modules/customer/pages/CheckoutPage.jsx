import { useNavigate } from 'react-router-dom'
import { useFormContext } from 'react-hook-form'
import { Bike, QrCode } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import EmptyState from '@/shared/ui/EmptyState'
import Button from '@/shared/ui/Button'
import { Form, RadioCardGroup, TextField, CheckboxField, SubmitButton } from '@/shared/components/form'
import { checkoutSchema } from '@/app/validations/schemas/customer.schema'
import { useCartStore } from '@/app/store/cartStore'
import { useOrderStore } from '@/app/store/orderStore'
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

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, scheduledFor, prescriptionId, clear } = useCartStore()
  const totals = useCartStore((s) => s.totals())
  const addresses = useOrderStore((s) => s.addresses)
  const placeOrder = useOrderStore((s) => s.placeOrder)

  if (items.length === 0) {
    return <EmptyState title={msg('customer.cartEmpty')} action={<Button onClick={() => navigate(PATHS.customer.search)}>Browse products</Button>} />
  }

  const addressOptions = addresses.map((a) => ({
    value: a.id,
    label: `${a.label} · ${a.name}`,
    hint: `${a.line1}, ${a.city} ${a.pincode}`,
  }))

  const onSubmit = (values) => {
    const address = addresses.find((a) => a.id === values.addressId)
    const order = placeOrder({
      items,
      totals,
      address: `${address.label} · ${address.line1}, ${address.city}`,
      paymentMethod: values.paymentMethod,
      scheduledFor: values.scheduleLater ? values.scheduledFor : scheduledFor,
      prescriptionId,
    })
    clear()
    navigate(buildPath(PATHS.customer.orderSuccess, { id: order.id }), { replace: true })
  }

  return (
    <div>
      <PageHeader title="Checkout" subtitle="Confirm address, delivery time and payment." />

      <Form
        schema={checkoutSchema}
        defaultValues={{
          addressId: addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? '',
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
    </div>
  )
}
