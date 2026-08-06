import PageHeader from '@/shared/ui/PageHeader'
import { Form, TextField, SelectField, SubmitButton } from '@/shared/components/form'
import { profileSchema } from '@/app/validations/schemas/customer.schema'
import { useAuthStore } from '@/app/store/authStore'
import { toast } from '@/app/store/uiStore'
import { msg } from '@/shared/messages/messages'
import { colors } from '@/app/themes/colors'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)

  const onSubmit = (values) => {
    updateUser(values)
    toast.success(msg('customer.profileUpdated'))
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Keep your contact details up to date." />
      <div className="rounded-[18px] p-6 max-w-[560px]" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <Form
          schema={profileSchema}
          defaultValues={{
            fullName: user?.fullName ?? '',
            email: user?.email ?? '',
            phone: user?.phone ?? '',
            dob: user?.dob ?? '',
            gender: user?.gender ?? '',
          }}
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <TextField name="fullName" label="Full name" required />
          <TextField name="email" label="Email" type="email" required />
          <TextField name="phone" label="Mobile number" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="dob" label="Date of birth" type="date" />
            <SelectField
              name="gender"
              label="Gender"
              options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Prefer not to say' }]}
            />
          </div>
          <SubmitButton>Save changes</SubmitButton>
        </Form>
      </div>
    </div>
  )
}
