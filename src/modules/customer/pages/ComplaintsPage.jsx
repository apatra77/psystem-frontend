import PageHeader from '@/shared/ui/PageHeader'
import Badge from '@/shared/ui/Badge'
import { Form, SelectField, TextareaField, TextField, SubmitButton } from '@/shared/components/form'
import { complaintSchema } from '@/app/validations/schemas/customer.schema'
import { useOrderStore } from '@/app/store/orderStore'
import { fmtDate } from '@/app/utils/format'
import { colors } from '@/app/themes/colors'

const TYPES = [
  { value: 'refund', label: 'Refund request' },
  { value: 'delivery', label: 'Delivery issue' },
  { value: 'quality', label: 'Product quality' },
  { value: 'billing', label: 'Billing / payment' },
  { value: 'other', label: 'Something else' },
]

export default function ComplaintsPage() {
  const orders = useOrderStore((s) => s.orders)
  const complaints = useOrderStore((s) => s.complaints)
  const raiseComplaint = useOrderStore((s) => s.raiseComplaint)

  const onSubmit = (values, methods) => {
    raiseComplaint(values)
    methods.reset({ orderId: '', type: '', subject: '', description: '' })
  }

  return (
    <div>
      <PageHeader title="Complaints &amp; refunds" subtitle="We respond within 24 hours." />

      <div className="grid gap-6" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)' }}>
        <div className="rounded-[18px] p-6" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <Form
            schema={complaintSchema}
            defaultValues={{ orderId: '', type: '', subject: '', description: '' }}
            onSubmit={onSubmit}
            className="space-y-4"
          >
            <SelectField name="orderId" label="Which order?" options={orders.map((o) => ({ value: o.id, label: `${o.id} · ${fmtDate(o.placedAt)}` }))} required />
            <SelectField name="type" label="Issue type" options={TYPES} required />
            <TextField name="subject" label="Subject" placeholder="Short summary" required />
            <TextareaField name="description" label="What happened?" rows={5} placeholder="Tell us the details — at least 20 characters." required />
            <SubmitButton>Submit complaint</SubmitButton>
          </Form>
        </div>

        <aside>
          <p className="text-[13px] font-extrabold mb-3" style={{ color: colors.textBright }}>Past complaints</p>
          <div className="space-y-2.5">
            {complaints.map((c) => (
              <div key={c.id} className="p-4 rounded-[16px]" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-extrabold" style={{ color: colors.textBright }}>{c.id}</p>
                  <Badge tone={c.status === 'resolved' ? 'success' : 'warn'}>{c.status}</Badge>
                </div>
                <p className="text-[12.5px] mt-1" style={{ color: colors.textMuted }}>{c.subject} · {c.orderId}</p>
                <p className="text-[11.5px] mt-1" style={{ color: colors.textDim }}>{fmtDate(c.createdAt)}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
