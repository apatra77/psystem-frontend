import { useEffect, useState } from 'react'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import Button from '@/shared/ui/Button'
import Badge from '@/shared/ui/Badge'
import EmptyState from '@/shared/ui/EmptyState'
import Spinner from '@/shared/ui/Spinner'
import ProfileSetupModal from '@/components/modals/ProfileSetupModal'
import { useAuthStore } from '@/app/store/authStore'
import { useOrderStore } from '@/app/store/orderStore'
import { useUiStore, toast } from '@/app/store/uiStore'
import { deleteUserAddress, fetchUserProfile } from '@/services/user'
import { msg } from '@/shared/messages/messages'
import { colors } from '@/app/themes/colors'

function toModalAddress(address) {
  if (!address) return null
  return {
    line1: address.line1 ?? '',
    line2: address.line2 ?? '',
    landmark: address.landmark ?? address.raw?.landmark ?? '',
    city: address.city ?? '',
    state: address.state ?? '',
    pincode: address.pincode ?? '',
  }
}

export default function AddressesPage() {
  const authUser = useAuthStore((s) => s.user)
  const [profile, setProfile] = useState(null)
  const [addressModal, setAddressModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const addresses = useOrderStore((s) => s.addresses)
  const setAddressesFromApi = useOrderStore((s) => s.setAddressesFromApi)
  const deleteAddress = useOrderStore((s) => s.deleteAddress)
  const askConfirm = useUiStore((s) => s.askConfirm)

  const reloadAddresses = async () => {
    const data = await fetchUserProfile({ force: true })
    setProfile(data)
    setAddressesFromApi(data?.addresses ?? [])
  }

  useEffect(() => {
    if (useOrderStore.getState().addressesLoadedFromApi) {
      setLoading(false)
      return undefined
    }

    let cancelled = false

    ;(async () => {
      try {
        const data = await fetchUserProfile()
        if (!cancelled) {
          setProfile(data)
          setAddressesFromApi(data?.addresses ?? [])
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

  const handleDeleteAddress = (address) => {
    askConfirm({
      title: 'Delete address',
      message: msg('common.confirmDelete', { name: address.label }),
      tone: 'danger',
      confirmLabel: 'Delete',
      loadingLabel: 'Removing address…',
      onConfirm: async () => {
        try {
          await deleteUserAddress(address.id)
          deleteAddress(address.id)
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Could not delete address')
          throw error
        }
      },
    })
  }

  const closeAddressModal = () => setAddressModal(null)

  const handleAddressSaved = async () => {
    try {
      await reloadAddresses()
      closeAddressModal()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not refresh addresses')
    }
  }

  const modalDefaults = {
    initialEmail: profile?.email || authUser?.email || '',
    initialCountryCode: profile?.countryCode || authUser?.countryCode || '+91',
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
        actions={<Button icon={Plus} onClick={() => setAddressModal({ mode: 'add' })}>Add address</Button>}
      />

      {addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No addresses saved"
          action={<Button onClick={() => setAddressModal({ mode: 'add' })}>Add your first address</Button>}
        />
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
                <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setAddressModal({ mode: 'edit', address: a })}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  onClick={() => handleDeleteAddress(a)}
                >
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {addressModal?.mode === 'add' && (
        <ProfileSetupModal
          mode="addAddress"
          initialFullName={profile?.fullName || authUser?.fullName || ''}
          initialEmail={modalDefaults.initialEmail}
          initialMobile={profile?.mobile || authUser?.mobile || ''}
          initialCountryCode={modalDefaults.initialCountryCode}
          onClose={closeAddressModal}
          onComplete={handleAddressSaved}
          onSkip={closeAddressModal}
        />
      )}

      {addressModal?.mode === 'edit' && (
        <ProfileSetupModal
          mode="editAddress"
          addressId={addressModal.address.id}
          initialFullName={addressModal.address.name || profile?.fullName || authUser?.fullName || ''}
          initialEmail={modalDefaults.initialEmail}
          initialMobile={addressModal.address.phone || profile?.mobile || authUser?.mobile || ''}
          initialCountryCode={modalDefaults.initialCountryCode}
          initialAddress={toModalAddress(addressModal.address)}
          onClose={closeAddressModal}
          onComplete={handleAddressSaved}
          onSkip={closeAddressModal}
        />
      )}
    </div>
  )
}
