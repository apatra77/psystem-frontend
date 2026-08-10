import { useEffect, useState } from 'react'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import Button from '@/shared/ui/Button'
import Badge from '@/shared/ui/Badge'
import Modal from '@/shared/ui/Modal'
import EmptyState from '@/shared/ui/EmptyState'
import Spinner from '@/shared/ui/Spinner'
import { Form, TextField, CheckboxField, SubmitButton } from '@/shared/components/form'
import { addressSchema } from '@/app/validations/schemas/customer.schema'
import { useOrderStore } from '@/app/store/orderStore'
import { useUiStore } from '@/app/store/uiStore'
import { fetchUserProfile } from '@/services/user'
import { msg } from '@/shared/messages/messages'
import { colors } from '@/app/themes/colors'

const EMPTY = { label: '', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false }

export default function AddressesPage() {
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const addresses = useOrderStore((s) => s.addresses)
  const saveAddress = useOrderStore((s) => s.saveAddress)
  const setAddressesFromApi = useOrderStore((s) => s.setAddressesFromApi)
  const deleteAddress = useOrderStore((s) => s.deleteAddress)
  const askConfirm = useUiStore((s) => s.askConfirm)

  useEffect(() => {
    if (useOrderStore.getState().addressesLoadedFromApi) {
      setLoading(false)
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
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [setAddressesFromApi])

  const onSubmit = (values) => {
    saveAddress({ ...values, id: editing?.id })
    setEditing(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-[13px]" style={{ color: colors.textMuted }}>
        <Spinner />
        Loading addresses…
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Saved addresses"
        subtitle="Where should we deliver?"
        actions={<Button icon={Plus} onClick={() => setEditing(EMPTY)}>Add address</Button>}
      />

      {addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="No addresses saved" action={<Button onClick={() => setEditing(EMPTY)}>Add your first address</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <article key={a.id} className="p-5 rounded-[18px]" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[14px] font-extrabold" style={{ color: colors.textBright }}>{a.label}</p>
                {a.isDefault && <Badge tone="success">Default</Badge>}
              </div>
              <p className="text-[13px]" style={{ color: colors.textMuted }}>{a.name} · {a.phone}</p>
              <p className="text-[13px] mt-1.5" style={{ color: colors.textMuted }}>
                {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}
              </p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(a)}>Edit</Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  onClick={() => askConfirm({
                    title: 'Delete address',
                    message: msg('common.confirmDelete', { name: a.label }),
                    tone: 'danger',
                    confirmLabel: 'Delete',
                    onConfirm: () => deleteAddress(a.id),
                  })}
                >
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit address' : 'Add address'}>
        {editing && (
          <Form schema={addressSchema} defaultValues={{ ...EMPTY, ...editing }} onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField name="label" label="Label" placeholder="Home / Work" required />
              <TextField name="phone" label="Contact number" required />
            </div>
            <TextField name="name" label="Receiver's name" required />
            <TextField name="line1" label="Address line 1" required />
            <TextField name="line2" label="Address line 2" />
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField name="city" label="City" required />
              <TextField name="state" label="State" required />
              <TextField name="pincode" label="PIN code" required />
            </div>
            <CheckboxField name="isDefault" label="Make this my default address" />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <SubmitButton>Save address</SubmitButton>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  )
}
