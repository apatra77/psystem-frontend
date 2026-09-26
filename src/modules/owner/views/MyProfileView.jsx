import { useEffect, useMemo, useState } from 'react'
import { Camera, Mail, MapPin, Package, Pencil, Phone, Shield, User } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Spinner from '@/components/ui/Spinner'
import ProfileSetupModal from '@/components/modals/ProfileSetupModal'
import { useOwnerPortal } from '../context/OwnerPortalContext'
import { INITIATED_ORDERS_URL_STATUS } from '../utils/orderFilters'
import { formatOrderDisplayId, mapOrder } from '../utils/helpers'
import { getUserInitials } from '@/services/auth'
import { fetchAdminOrders, mapUiSortToApi, parseAdminOrdersPage } from '@/services/orders'
import { fetchUserProfile } from '@/services/user'
import { toast } from '@/app/store/uiStore'
import { colors } from '@/theme/colors'

const PROFILE_INITIATED_ORDERS_LIMIT = 5

function formatPhone(mobile, countryCode = '+91') {
  const digits = String(mobile ?? '').replace(/\D/g, '')
  if (!digits) return '—'
  const local = digits.length >= 10 ? digits.slice(-10) : digits
  const spaced = local.replace(/(\d{5})(\d{5})/, '$1 $2')
  return `${countryCode} ${spaced}`.trim()
}

function toModalAddressFromProfile(profile, authUser) {
  const primary =
    profile?.addresses?.find((address) => address.isDefault) ?? profile?.addresses?.[0] ?? null

  if (primary) {
    return {
      line1: primary.line1 ?? '',
      line2: primary.line2 ?? '',
      landmark: primary.landmark ?? primary.raw?.landmark ?? '',
      city: primary.city ?? '',
      state: primary.state ?? '',
      pincode: primary.pincode ?? '',
    }
  }

  const stored = authUser?.address
  if (!stored) return null
  if (typeof stored === 'string') {
    return { line1: stored, line2: '', landmark: '', city: '', state: '', pincode: '' }
  }

  return {
    line1: stored.line1 ?? '',
    line2: stored.line2 ?? '',
    landmark: stored.landmark ?? '',
    city: stored.city ?? '',
    state: stored.state ?? '',
    pincode: stored.pincode ?? '',
  }
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
  const { authUser, activeOutletName, reloadOutletAddresses, updateAuthUser, goToPage } = useOwnerPortal()
  const [profile, setProfile] = useState(null)
  const [initiatedOrders, setInitiatedOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showEditProfile, setShowEditProfile] = useState(false)

  const loadProfile = async ({ force = false } = {}) => {
    const data = await fetchUserProfile({ force })
    setProfile(data)
    return data
  }

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setOrdersLoading(true)
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

      try {
        const ordersPayload = await fetchAdminOrders({
          status: 'I',
          sort: mapUiSortToApi('newest'),
          page: 0,
          size: PROFILE_INITIATED_ORDERS_LIMIT,
        })
        if (!cancelled) {
          const page = parseAdminOrdersPage(ordersPayload)
          setInitiatedOrders(page.orders.map(mapOrder))
        }
      } catch {
        if (!cancelled) setInitiatedOrders([])
      } finally {
        if (!cancelled) setOrdersLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const primaryStoreAddress = useMemo(
    () => profile?.addresses?.find((address) => address.isDefault) ?? profile?.addresses?.[0] ?? null,
    [profile],
  )

  const displayName = profile?.fullName || authUser?.fullName?.trim() || authUser?.email || 'User'
  const displayRole = profile?.role || authUser?.role || '—'
  const initials = getUserInitials({ ...authUser, fullName: displayName, email: profile?.email || authUser?.email })
  const email = profile?.email || authUser?.email || '—'
  const phone = formatPhone(profile?.mobile || authUser?.mobile, profile?.countryCode || authUser?.countryCode)
  const location = profile?.location || activeOutletName || primaryStoreAddress?.lines || '—'
  const handleProfileSaved = async () => {
    try {
      const data = await loadProfile({ force: true })
      updateAuthUser({
        fullName: data?.fullName ?? authUser?.fullName,
        email: data?.email ?? authUser?.email,
        mobile: data?.mobile ?? authUser?.mobile,
        countryCode: data?.countryCode ?? authUser?.countryCode,
      })
      await reloadOutletAddresses({ force: true })
      setShowEditProfile(false)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not refresh profile')
    }
  }

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
          onClick={() => window.location.reload()}
          className="text-[12.5px] font-bold px-4 py-2 rounded-[10px] cursor-pointer"
          style={{ color: colors.accentText, background: colors.primaryBtn }}
        >
          Retry
        </button>
      </div>
    )
  }

  const modalDefaults = {
    initialEmail: profile?.email ?? authUser?.email ?? '',
    initialCountryCode: profile?.countryCode ?? authUser?.countryCode ?? '+91',
  }

  const openInitiatedOrdersPage = () => {
    goToPage('orders', { search: { status: INITIATED_ORDERS_URL_STATUS } })
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
            </div>

            <button
              type="button"
              onClick={() => setShowEditProfile(true)}
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
              <InfoRow icon={User} label="Store Name" value={displayName} />
              <InfoRow icon={Mail} label="Email Address" value={email} />
              <InfoRow icon={Phone} label="Phone Number" value={phone} />
              <InfoRow icon={Shield} label="Role" value={displayRole} />
              <InfoRow icon={MapPin} label="Store Location" value={location} />
            </div>
          </GlassCard>

          <GlassCard className="overflow-hidden flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: colors.borderSubtle }}>
              <div>
                <div className="text-[15px] font-extrabold text-white">Recent Orders</div>
                <p className="text-[11px] mt-0.5" style={{ color: colors.textDim }}>
                  Initiated orders awaiting action
                </p>
              </div>
              <button
                type="button"
                onClick={openInitiatedOrdersPage}
                className="text-[12px] font-bold cursor-pointer hover:underline"
                style={{ color: colors.accent }}
              >
                View all
              </button>
            </div>
            {ordersLoading ? (
              <div className="flex flex-1 items-center justify-center gap-2 py-12 text-[12.5px]" style={{ color: colors.textSecondary }}>
                <Spinner />
                Loading orders…
              </div>
            ) : initiatedOrders.length ? (
              <div className="flex-1 min-h-0 overflow-y-auto owner-scroll p-4 flex flex-col gap-3">
                {initiatedOrders.map((order) => {
                  const statusMeta = order.statusDisplayMeta ?? order.statusMeta
                  return (
                    <div
                      key={order.id}
                      className="rounded-[14px] p-4"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${colors.borderSubtle}`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <Package size={16} strokeWidth={1.8} style={{ color: colors.textDim }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-extrabold text-white">
                              {formatOrderDisplayId(order.id)}
                            </span>
                            <span
                              className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full"
                              style={{
                                background: statusMeta.bg,
                                color: statusMeta.color,
                                border: `1px solid ${statusMeta.border}`,
                              }}
                            >
                              {statusMeta.label}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                            <div>
                              <span style={{ color: colors.textDim }}>Placed</span>
                              <div className="font-semibold text-white mt-0.5">{order.placedLabel || order.orderedOn}</div>
                            </div>
                            <div className="text-right">
                              <span style={{ color: colors.textDim }}>Amount</span>
                              <div className="font-extrabold text-white mt-0.5 tabular-nums">{order.totalFmt}</div>
                            </div>
                          </div>
                          {order.customerName || order.phone ? (
                            <div className="mt-2 text-[11px]" style={{ color: colors.textSecondary }}>
                              {[order.customerName, order.phone !== '—' ? order.phone : ''].filter(Boolean).join(' · ')}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-5 py-12 text-center">
                <Package size={28} strokeWidth={1.6} style={{ color: colors.textDim }} />
                <p className="mt-3 text-[12.5px]" style={{ color: colors.textDim }}>
                  No initiated orders right now.
                </p>
                <button
                  type="button"
                  onClick={openInitiatedOrdersPage}
                  className="mt-3 text-[12px] font-bold cursor-pointer hover:underline"
                  style={{ color: colors.accent }}
                >
                  View all orders
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {showEditProfile && (
        <ProfileSetupModal
          portalVariant="admin"
          mode="editProfile"
          initialFullName={profile?.fullName ?? authUser?.fullName ?? ''}
          initialEmail={modalDefaults.initialEmail}
          initialMobile={profile?.mobile ?? authUser?.mobile ?? ''}
          initialCountryCode={modalDefaults.initialCountryCode}
          initialAddress={toModalAddressFromProfile(profile, authUser)}
          onClose={() => setShowEditProfile(false)}
          onComplete={handleProfileSaved}
          onSkip={() => setShowEditProfile(false)}
        />
      )}

    </>
  )
}
