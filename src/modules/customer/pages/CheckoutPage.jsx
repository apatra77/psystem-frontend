import { useNavigate } from 'react-router-dom'
import { useFormContext } from 'react-hook-form'
import PageHeader from '@/shared/ui/PageHeader'
import EmptyState from '@/shared/ui/EmptyState'
import Button from '@/shared/ui/Button'
import { Form, RadioCardGroup, TextField, CheckboxField, SubmitButton } from '@/shared/components/form'
import { checkoutSchema } from '@/app/validations/schemas/customer.schema'
import { useCartStore } from '@/app/store/cartStore'
import { useOrderStore } from '@/app/store/orderStore'
import { PATHS, buildPath } from '@/app/router/paths'
import { PAYMENT_METHODS } from '@/shared/mocks/pricing'
import { fmtINR } from '@/app/utils/format'
import { msg } from '@/shared/messages/messages'
import { colors } from '@/app/themes/colors'

/** Payment fields depend on the selected method — this watches the radio group. */
function PaymentDetails() {
  const { watch } = useFormContext()
  const method = watch('paymentMethod')
  if (method === 'upi') return <TextField name="upiId" label="UPI ID" placeholder="name@bank" required />
  if (method === 'card') {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField name="cardNumber" label="Card number" placeholder="4111111111111111" className="sm:col-span-3" required />
        <TextField name="cardExpiry" label="Expiry (MM/YY)" placeholder="08/28" required />
        <TextField name="cardCvv" label="CVV" type="password" maxLength={3} required />
      </div>
    )
  }
  if (method === 'wallet') return <p className="text-[12.5px]" style={{ color: colors.textMuted }}>Wallet balance will be applied at payment.</p>
  return <p className="text-[12.5px]" style={{ color: colors.textMuted }}>Pay the delivery partner in cash or UPI on arrival.</p>
}

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
              <RadioCardGroup name="paymentMethod" options={PAYMENT_METHODS.map((p) => ({ value: p.id, label: p.label, hint: p.hint }))} columns={2} />
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
