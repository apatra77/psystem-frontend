import { useEffect, useState } from 'react'
import {
  Calendar,
  Camera,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Shield,
  Trash2,
  User,
} from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Spinner from '../../components/ui/Spinner'
import ProfileSetupModal from '../../components/modals/ProfileSetupModal'
import { useOwnerPortal } from '../context/OwnerPortalContext'
import { getUserInitials } from '../../services/auth'
import { fetchUserProfile } from '../../services/user'
import { colors } from '../../theme/colors'

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
        <div className="text-[13px] font-bold text-white mt-1 break-words">{value || '—'}</div>
      </div>
    </div>
  )
}

function SummaryRow({ icon: Icon, value }) {
  return (
    <div className="flex items-center gap-2.5 text-[12.5px]" style={{ color: colors.textSecondary }}>
      <Icon size={14} strokeWidth={1.8} style={{ color: colors.textDim, flexShrink: 0 }} />
      <span className="truncate">{value || '—'}</span>
    </div>
  )
}

export default function MyProfileView() {
  const { authUser, activeOutletName } = useOwnerPortal()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [reloadKey, setReloadKey] = useState(0)
  const [showAddAddress, setShowAddAddress] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      setLoading(true)
      setError(null)
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
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const displayName = profile?.fullName || authUser?.fullName?.trim() || authUser?.email || 'User'
  const displayRole = profile?.role || authUser?.role || '—'
  const initials = getUserInitials({ ...authUser, fullName: displayName, email: profile?.email || authUser?.email })
  const email = profile?.email || authUser?.email || '—'
  const phone = formatPhone(profile?.mobile || authUser?.mobile, profile?.countryCode || authUser?.countryCode)
  const location = profile?.location || activeOutletName || '—'
  const memberSince = profile?.memberSince || '—'

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-[13px]" style={{ color: colors.textSecondary }}>
        <Spinner />
        Loading profile…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="text-[13px] font-bold text-red-400">{error}</div>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="text-[12.5px] font-bold px-4 py-2 rounded-[10px] cursor-pointer"
          style={{ color: colors.accentText, background: colors.primaryBtn }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
    <div className="flex-1 min-h-0 overflow-hidden">
      <div className="grid grid-cols-[280px_minmax(0,1fr)_340px] gap-4 h-full items-stretch min-h-0">
      <GlassCard className="p-5 flex flex-col items-center text-center self-start">
        <div className="relative mb-4">
          <div
            className="w-[88px] h-[88px] rounded-full flex items-center justify-center font-extrabold text-[28px]"
            style={{
              background: 'linear-gradient(135deg,#d4bcff,#8f6fd1)',
              color: '#1c1030',
            }}
          >
            {initials}
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
            style={{
              background: colors.primaryBtn,
              color: colors.accentText,
              border: '2px solid #0a1712',
            }}
            aria-label="Change photo"
          >
            <Camera size={13} strokeWidth={2} />
          </button>
        </div>

        <div className="text-[18px] font-extrabold text-white">{displayName}</div>
        <span
          className="text-[10px] font-extrabold tracking-wide px-2 py-1 rounded-md mt-2 inline-block"
          style={{
            color: colors.accent,
            background: 'rgba(64,222,170,0.12)',
            border: '1px solid rgba(64,222,170,0.28)',
          }}
        >
          {displayRole}
        </span>

        <div className="w-full mt-5 flex flex-col gap-3 text-left">
          <SummaryRow icon={Mail} value={email} />
          <SummaryRow icon={Phone} value={phone} />
          <SummaryRow icon={MapPin} value={location} />
          <SummaryRow icon={Calendar} value={`Joined on ${memberSince}`} />
        </div>

        <button
          type="button"
          className="w-full mt-6 text-[12.5px] font-extrabold px-4 py-2.5 rounded-[10px] cursor-pointer flex items-center justify-center gap-2"
          style={{
            color: colors.accent,
            background: 'rgba(64,222,170,0.08)',
            border: '1px solid rgba(64,222,170,0.28)',
          }}
        >
          <Pencil size={14} strokeWidth={1.8} />
          Edit Profile
        </button>
      </GlassCard>

      <GlassCard className="overflow-hidden flex flex-col h-full min-h-0">
        <div className="px-5 py-4 border-b flex-shrink-0" style={{ borderColor: colors.borderSubtle }}>
          <div className="text-[15px] font-extrabold text-white">Profile Information</div>
        </div>
        <div className="flex-1 min-h-0">
        <InfoRow icon={User} label="Full Name" value={displayName} />
        <InfoRow icon={Mail} label="Email Address" value={email} />
        <InfoRow icon={Phone} label="Phone Number" value={phone} />
        <InfoRow icon={Shield} label="Role" value={displayRole} />
        <InfoRow icon={MapPin} label="Store Location" value={location} />
        <InfoRow icon={Calendar} label="Member Since" value={memberSince} />
        </div>
      </GlassCard>

      <div className="flex flex-col gap-4 h-full min-h-0">
        <GlassCard className="overflow-hidden flex-shrink-0">
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: colors.borderSubtle }}>
            <div className="text-[15px] font-extrabold text-white">Recent Orders</div>
            <button type="button" className="text-[12px] font-bold cursor-pointer" style={{ color: colors.accent }}>
              View all
            </button>
          </div>
          {profile?.recentOrders?.length ? (
            <div>
              {profile.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}
                >
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <Package size={15} strokeWidth={1.8} style={{ color: colors.textDim }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-bold text-white">{order.id}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: colors.textDim }}>
                      {order.date}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[12.5px] font-bold text-white tabular-nums">{order.amountFmt}</div>
                    <span
                      className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-1"
                      style={{
                        background: order.statusMeta.bg,
                        color: order.statusMeta.color,
                        border: `1px solid ${order.statusMeta.border}`,
                      }}
                    >
                      {order.statusMeta.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-[12.5px]" style={{ color: colors.textDim }}>
              No recent orders yet.
            </div>
          )}
        </GlassCard>

        <GlassCard className="overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: colors.borderSubtle }}>
            <div className="text-[15px] font-extrabold text-white">Saved Addresses</div>
            <button
              type="button"
              onClick={() => setShowAddAddress(true)}
              className="text-[12px] font-bold cursor-pointer"
              style={{ color: colors.accent }}
            >
              Add New
            </button>
          </div>
          {profile?.addresses?.length ? (
            <div className="p-4 flex flex-col gap-3 overflow-y-auto owner-scroll flex-1 min-h-0">
              {profile.addresses.map((address) => (
                <div
                  key={address.id}
                  className="rounded-[14px] p-4"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[12.5px] font-bold text-white">{address.label}</span>
                        {address.isDefault && (
                          <span
                            className="text-[9px] font-extrabold px-2 py-0.5 rounded-full"
                            style={{
                              color: colors.accent,
                              background: 'rgba(64,222,170,0.12)',
                              border: '1px solid rgba(64,222,170,0.28)',
                            }}
                          >
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] leading-relaxed" style={{ color: colors.textSecondary }}>
                        {address.lines || '—'}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/8"
                        style={{ color: colors.textDim }}
                        aria-label="Edit address"
                      >
                        <Pencil size={14} strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-red-500/10"
                        style={{ color: colors.textDim }}
                        aria-label="Delete address"
                      >
                        <Trash2 size={14} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <div className="text-[12.5px] mb-3" style={{ color: colors.textDim }}>
                No saved addresses yet.
              </div>
              <button
                type="button"
                onClick={() => setShowAddAddress(true)}
                className="text-[12px] font-bold cursor-pointer"
                style={{ color: colors.accent }}
              >
                Add New
              </button>
            </div>
          )}
        </GlassCard>
      </div>
      </div>
    </div>

    {showAddAddress && (
      <ProfileSetupModal
        mode="addAddress"
        initialFullName={profile?.fullName ?? authUser?.fullName ?? ''}
        initialEmail={profile?.email ?? authUser?.email ?? ''}
        initialMobile={profile?.mobile ?? authUser?.mobile ?? ''}
        initialCountryCode={profile?.countryCode ?? authUser?.countryCode ?? '+91'}
        onClose={() => setShowAddAddress(false)}
        onComplete={() => {
          setShowAddAddress(false)
          setReloadKey((k) => k + 1)
        }}
        onSkip={() => setShowAddAddress(false)}
      />
    )}
    </>
  )
}
