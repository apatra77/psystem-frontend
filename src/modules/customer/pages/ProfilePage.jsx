import { useEffect, useState } from 'react'
import { Calendar, Mail, MapPin, Phone, Shield, User } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import Spinner from '@/shared/ui/Spinner'
import { Form, TextField, SelectField, SubmitButton } from '@/shared/components/form'
import { profileSchema } from '@/app/validations/schemas/customer.schema'
import { useAuthStore } from '@/app/store/authStore'
import { getUserInitials } from '@/services/auth'
import { fetchUserProfile } from '@/services/user'
import { toast } from '@/app/store/uiStore'
import { msg } from '@/shared/messages/messages'
import { colors } from '@/app/themes/colors'

function formatRole(role) {
  const value = String(role ?? 'Customer').replace(/_/g, ' ').toLowerCase()
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatPhone(mobile, countryCode = '+91') {
  const digits = String(mobile ?? '').replace(/\D/g, '')
  if (!digits) return '—'
  const local = digits.length >= 10 ? digits.slice(-10) : digits
  const spaced = local.replace(/(\d{5})(\d{5})/, '$1 $2')
  return `${countryCode} ${spaced}`.trim()
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5"
      style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}
    >
      <Icon size={16} strokeWidth={1.8} style={{ color: colors.textDim, flexShrink: 0, marginTop: 2 }} />
      <div className="min-w-0 flex-1">
        <div className="text-[10.5px] font-bold tracking-[0.08em] uppercase" style={{ color: colors.textDim }}>
          {label}
        </div>
        <div className="mt-1 break-words text-[13px] font-bold" style={{ color: colors.textBright }}>
          {value || '—'}
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const authUser = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const data = await fetchUserProfile()
        if (!cancelled) setProfile(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load profile')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const displayName = profile?.fullName || authUser?.fullName?.trim() || authUser?.email || 'User'
  const displayRole = formatRole(profile?.role || authUser?.role || 'Customer')
  const email = profile?.email || authUser?.email || '—'
  const phone = formatPhone(profile?.mobile || authUser?.mobile, profile?.countryCode || authUser?.countryCode)
  const location = profile?.location || '—'
  const memberSince = profile?.memberSince || '—'
  const initials = getUserInitials({ ...authUser, fullName: displayName, email: profile?.email || authUser?.email })

  const onSubmit = (values) => {
    updateUser(values)
    toast.success(msg('customer.profileUpdated'))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-[13px]" style={{ color: colors.textMuted }}>
        <Spinner />
        Loading profile…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="Your account details and contact information." />

      {error && (
        <div className="rounded-[12px] px-4 py-3 text-[12px] font-bold text-red-400" style={{ background: 'rgba(255,138,128,0.08)', border: '1px solid rgba(255,138,128,0.24)' }}>
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div
          className="rounded-[18px] p-5 flex flex-col items-center text-center h-fit"
          style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
        >
          <div
            className="mb-4 flex h-[88px] w-[88px] items-center justify-center rounded-full text-[28px] font-extrabold"
            style={{ background: colors.primaryBtn, color: colors.accentText }}
          >
            {initials}
          </div>

          <div className="text-[18px] font-extrabold" style={{ color: colors.textBright }}>{displayName}</div>
          <span
            className="mt-2 inline-block rounded-md px-2 py-1 text-[10px] font-extrabold tracking-wide"
            style={{
              color: colors.accent,
              background: 'rgba(64,222,170,0.12)',
              border: '1px solid rgba(64,222,170,0.28)',
            }}
          >
            {displayRole}
          </span>

          <div className="mt-5 w-full space-y-3 text-left text-[12.5px]" style={{ color: colors.textMuted }}>
            <div className="flex items-center gap-2.5">
              <Mail size={14} style={{ color: colors.textDim }} />
              <span className="truncate">{email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone size={14} style={{ color: colors.textDim }} />
              <span>{phone}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin size={14} style={{ color: colors.textDim }} />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar size={14} style={{ color: colors.textDim }} />
              <span>Joined on {memberSince}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[18px]" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="border-b px-5 py-4" style={{ borderColor: colors.borderSubtle }}>
              <div className="text-[15px] font-extrabold" style={{ color: colors.textBright }}>Profile Information</div>
            </div>
            <InfoRow icon={User} label="Full Name" value={displayName} />
            <InfoRow icon={Mail} label="Email Address" value={email} />
            <InfoRow icon={Phone} label="Phone Number" value={phone} />
            <InfoRow icon={Shield} label="Role" value={displayRole} />
            <InfoRow icon={MapPin} label="Location" value={location} />
            <InfoRow icon={Calendar} label="Member Since" value={memberSince} />
          </div>

          <div className="rounded-[18px] p-6" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="mb-4 text-[15px] font-extrabold" style={{ color: colors.textBright }}>Edit contact details</div>
            <Form
              schema={profileSchema}
              defaultValues={{
                fullName: profile?.fullName || authUser?.fullName || '',
                email: profile?.email || authUser?.email || '',
                phone: profile?.mobile || authUser?.mobile || authUser?.phone || '',
                dob: authUser?.dob ?? '',
                gender: authUser?.gender ?? '',
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
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Prefer not to say' },
                  ]}
                />
              </div>
              <SubmitButton>Save changes</SubmitButton>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}
