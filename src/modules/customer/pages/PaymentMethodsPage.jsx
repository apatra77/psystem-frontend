import { useState } from 'react'
import { CreditCard, Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import Button from '@/shared/ui/Button'
import Modal from '@/shared/ui/Modal'
import EmptyState from '@/shared/ui/EmptyState'
import Tabs from '@/shared/ui/Tabs'
import { Form, TextField, SubmitButton } from '@/shared/components/form'
import { cardSchema, upiSchema } from '@/app/validations/schemas/customer.schema'
import { useOrderStore } from '@/app/store/orderStore'
import { colors } from '@/app/themes/colors'

const TABS = [{ id: 'upi', label: 'UPI' }, { id: 'card', label: 'Card' }]

export default function PaymentMethodsPage() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('upi')
  const methods = useOrderStore((s) => s.paymentMethods)
  const save = useOrderStore((s) => s.savePaymentMethod)
  const remove = useOrderStore((s) => s.deletePaymentMethod)

  const submitUpi = ({ upiId }) => { save({ type: 'upi', label: upiId }); setOpen(false) }
  const submitCard = ({ number, expiry, holder }) => {
    save({ type: 'card', label: `${holder} •••• ${number.slice(-4)}`, expiry })
    setOpen(false)
  }

  return (
    <div>
      <PageHeader title="Payment methods" subtitle="Saved UPI IDs and cards." actions={<Button icon={Plus} onClick={() => setOpen(true)}>Add method</Button>} />

      {methods.length === 0 ? (
        <EmptyState icon={CreditCard} title="No saved payment methods" action={<Button onClick={() => setOpen(true)}>Add one</Button>} />
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div key={m.id} className="flex items-center gap-4 p-4 rounded-[16px]" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <CreditCard size={18} style={{ color: colors.accent }} />
              <div className="flex-1">
                <p className="text-[13.5px] font-extrabold" style={{ color: colors.textBright }}>{m.label}</p>
                <p className="text-[12px] uppercase" style={{ color: colors.textDim }}>{m.type}{m.expiry ? ` · exp ${m.expiry}` : ''}</p>
              </div>
              <Button size="sm" variant="danger" icon={Trash2} onClick={() => remove(m.id)}>Remove</Button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add payment method">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
        {tab === 'upi' ? (
          <Form schema={upiSchema} defaultValues={{ upiId: '' }} onSubmit={submitUpi} className="space-y-4">
            <TextField name="upiId" label="UPI ID" placeholder="name@bank" required />
            <SubmitButton>Save UPI</SubmitButton>
          </Form>
        ) : (
          <Form schema={cardSchema} defaultValues={{ holder: '', number: '', expiry: '', cvv: '' }} onSubmit={submitCard} className="space-y-4">
            <TextField name="holder" label="Name on card" required />
            <TextField name="number" label="Card number" placeholder="4111111111111111" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField name="expiry" label="Expiry (MM/YY)" required />
              <TextField name="cvv" label="CVV" type="password" maxLength={3} required />
            </div>
            <SubmitButton>Save card</SubmitButton>
          </Form>
        )}
      </Modal>
    </div>
  )
}
