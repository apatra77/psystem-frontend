import PageHeader from '@/shared/ui/PageHeader'
import { Form, TextField, TextareaField, SubmitButton } from '@/shared/components/form'
import { customOrderSchema } from '@/app/validations/schemas/customer.schema'
import { toast } from '@/app/store/uiStore'
import { msg } from '@/shared/messages/messages'
import { colors } from '@/app/themes/colors'

/** "Out of list" order — the customer asks for something the catalogue doesn't have. */
export default function CustomOrderPage() {
  const onSubmit = (values, methods) => {
    toast.success(msg('customer.customOrderPlaced'))
    methods.reset({ itemName: '', quantity: 1, note: '', contactPhone: values.contactPhone })
  }

  return (
    <div className="max-w-[620px] mx-auto">
      <PageHeader title="Order something we don't list" subtitle="Tell us the item — the store confirms availability and price before charging you." />
      <div className="rounded-[18px] p-6" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <Form
          schema={customOrderSchema}
          defaultValues={{ itemName: '', quantity: 1, note: '', contactPhone: '' }}
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <TextField name="itemName" label="What do you need?" placeholder="Brand, strength, pack size" required />
          <TextField name="quantity" label="Quantity" type="number" min={1} required />
          <TextField name="contactPhone" label="Contact number" placeholder="9876543210" required />
          <TextareaField name="note" label="Notes for the pharmacist" placeholder="Substitutes allowed? Urgency? Prescription attached separately?" />
          <SubmitButton size="lg" className="w-full">Send request</SubmitButton>
        </Form>
      </div>
    </div>
  )
}
