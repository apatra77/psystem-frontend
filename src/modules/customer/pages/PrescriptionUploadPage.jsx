import { useNavigate } from 'react-router-dom'
import PageHeader from '@/shared/ui/PageHeader'
import { Form, FileField, TextField, TextareaField, SubmitButton } from '@/shared/components/form'
import { prescriptionSchema } from '@/app/validations/schemas/customer.schema'
import { useOrderStore } from '@/app/store/orderStore'
import { useCartStore } from '@/app/store/cartStore'
import { PATHS } from '@/app/router/paths'
import { colors } from '@/app/themes/colors'

export default function PrescriptionUploadPage() {
  const navigate = useNavigate()
  const addPrescription = useOrderStore((s) => s.addPrescription)
  const setPrescription = useCartStore((s) => s.setPrescription)

  const onSubmit = (values) => {
    const record = addPrescription({ fileName: values.file?.name ?? 'prescription', note: values.note })
    setPrescription(record.id)
    navigate(PATHS.customer.prescriptions)
  }

  return (
    <div className="max-w-[620px] mx-auto">
      <PageHeader title="Upload prescription" subtitle="A pharmacist reviews every prescription before dispatch." />
      <div className="rounded-[18px] p-6" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <Form
          schema={prescriptionSchema}
          defaultValues={{ file: null, patientName: '', doctorName: '', note: '' }}
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <FileField name="file" label="Prescription image or PDF" required />
          <TextField name="patientName" label="Patient name" required />
          <TextField name="doctorName" label="Prescribing doctor" />
          <TextareaField name="note" label="Anything we should know?" placeholder="Dosage preference, substitutions allowed, etc." />
          <SubmitButton size="lg" className="w-full">Upload for review</SubmitButton>
        </Form>
      </div>
    </div>
  )
}
