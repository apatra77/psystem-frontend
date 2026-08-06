import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import { Form, TextField, TextareaField, SubmitButton } from '@/shared/components/form'
import { contactSchema } from '@/app/validations/schemas/customer.schema'
import { toast } from '@/app/store/uiStore'
import { colors } from '@/app/themes/colors'

const CHANNELS = [
  { icon: Phone, label: 'Phone', value: '1800 200 4567', hint: 'Toll free, 8am – 11pm' },
  { icon: Mail, label: 'Email', value: 'care@mediq.example', hint: 'Replies within one working day' },
  { icon: Clock, label: 'Pharmacist desk', value: 'Open 24 × 7', hint: 'For prescription queries' },
  { icon: MapPin, label: 'Registered office', value: 'Bengaluru, Karnataka', hint: 'Drug licence KA-B01-123456' },
]

/**
 * Contact Us — reachable channels plus a message form.
 *
 * The form goes through the shared `Form` wrapper and yup schema like every
 * other form in the app. Submission is optimistic against a placeholder until
 * the support endpoint exists; the toast is the user-visible contract.
 */
export default function ContactPage() {
  const onSubmit = async (values, methods) => {
    // TODO: POST to ENDPOINTS.support.tickets once the endpoint is live.
    toast.success(`Thanks ${values.name.split(' ')[0]} — our team will reply to ${values.email}.`)
    methods.reset()
  }

  return (
    <div>
      <PageHeader title="Contact us" subtitle="Reach a human — pharmacist, order help or a complaint." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <section
          className="rounded-[18px] p-6"
          style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
        >
          <h2 className="text-[15px] font-extrabold" style={{ color: colors.textBright }}>Send us a message</h2>

          <Form
            schema={contactSchema}
            defaultValues={{ name: '', email: '', subject: '', message: '' }}
            onSubmit={onSubmit}
            className="mt-5 space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField name="name" label="Your name" placeholder="Asha Menon" required />
              <TextField name="email" label="Email" placeholder="you@example.com" required />
            </div>
            <TextField name="subject" label="Subject" placeholder="Order #MQ-1042 delivery" required />
            <TextareaField name="message" label="Message" rows={5} placeholder="Tell us what happened…" required />
            <SubmitButton size="lg">Send message</SubmitButton>
          </Form>
        </section>

        <aside className="space-y-3">
          {CHANNELS.map(({ icon: Icon, label, value, hint }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-[18px] p-5"
              style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
            >
              <span
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]"
                style={{ background: 'rgba(64,222,170,.12)', border: '1px solid rgba(64,222,170,.3)' }}
                aria-hidden="true"
              >
                <Icon size={17} style={{ color: colors.accent }} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: colors.textDim }}>
                  {label}
                </p>
                <p className="mt-1 text-[14px] font-bold" style={{ color: colors.textBright }}>{value}</p>
                <p className="mt-0.5 text-[12px]" style={{ color: colors.textMuted }}>{hint}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
