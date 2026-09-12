import { useState } from 'react'
import {
  Activity,
  ArrowRight,
  Baby,
  ChevronDown,
  HeartPulse,
  MapPin,
  Search,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import DoctorTopCard from '@/modules/customer/components/consultation/DoctorTopCard'
import PopularDoctorCard from '@/modules/customer/components/consultation/PopularDoctorCard'
import ConsultationSidebar from '@/modules/customer/components/consultation/ConsultationSidebar'
import DoctorBookingModal from '@/modules/customer/components/consultation/DoctorBookingModal'
import DoctorProfileModal from '@/modules/customer/components/consultation/DoctorProfileModal'
import { useDoctorConsultation } from '@/modules/customer/hooks/useDoctorConsultation'
import { useOrderStore } from '@/app/store/orderStore'
import { toast } from '@/app/store/uiStore'
import {
  CONSULTATION_MORE_SPECIALTIES,
  CONSULTATION_SPECIALTIES,
  CONSULTATION_SPECIALTY_AISLES,
  DEFAULT_CONSULTATION_CITY,
} from '@/shared/mocks/doctorConsultation'
import { colors } from '@/app/themes/colors'

const SPECIALTY_ICONS = {
  1: Stethoscope,
  2: Sparkles,
  3: HeartPulse,
  4: Baby,
  5: Activity,
  6: Activity,
}

function SectionHeader({ title, actionLabel, onAction, hideAction = false }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[16px] font-extrabold sm:text-[17px]" style={{ color: colors.textBright }}>
        {title}
      </h2>
      {!hideAction && actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1 text-[12px] font-bold"
          style={{ color: colors.accent }}
        >
          {actionLabel}
          <ArrowRight size={14} />
        </button>
      ) : null}
    </div>
  )
}

function DoctorGridSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-[230px] animate-pulse rounded-[16px]"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />
      ))}
    </div>
  )
}

export default function DoctorConsultationPage() {
  const selectedAddress = useOrderStore((s) => {
    if (s.selectedAddressId) {
      return s.addresses.find((address) => address.id === s.selectedAddressId) ?? null
    }
    return s.addresses.find((address) => address.isDefault) ?? s.addresses[0] ?? null
  })

  const city = selectedAddress?.city?.trim() || DEFAULT_CONSULTATION_CITY
  const locationLabel = selectedAddress
    ? [selectedAddress.city, selectedAddress.state].filter(Boolean).join(', ')
    : `${DEFAULT_CONSULTATION_CITY}, Odisha`

  const {
    searchKeyword,
    setSearchKeyword,
    specialtyId,
    setSpecialtyId,
    topDoctors,
    popularDoctors,
    popularSlots,
    isFiltering,
    loadingTop,
    loadingPopular,
    error,
    showAllTopDoctors,
    showAllPopularDoctors,
    topLimit,
    popularLimit,
    fetchProfile,
    fetchSlots,
  } = useDoctorConsultation(city)

  const [favorites, setFavorites] = useState(() => new Set())
  const [moreOpen, setMoreOpen] = useState(false)
  const [bookingDoctor, setBookingDoctor] = useState(null)
  const [profileDoctorId, setProfileDoctorId] = useState(null)

  const toggleFavorite = (doctorId) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(doctorId)) next.delete(doctorId)
      else next.add(doctorId)
      return next
    })
  }

  const openBooking = (doctor) => setBookingDoctor(doctor)
  const openProfile = (doctor) => setProfileDoctorId(doctor.id)

  const handleConfirmBooking = ({ doctor, slot }) => {
    setBookingDoctor(null)
    toast.success(`Consultation booked with ${doctor.name} at ${slot.time}`)
  }

  const handleSpecialtySelect = (id) => {
    setSpecialtyId(id)
    setMoreOpen(false)
  }

  const moreSpecialtyLabel =
    CONSULTATION_MORE_SPECIALTIES.find((item) => item.id === specialtyId)?.label ?? 'More'

  return (
    <div className="pb-2">
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_304px] xl:gap-6">
        <div className="min-w-0">
          <div className="mb-5">
            <h1 className="text-[24px] font-extrabold sm:text-[28px]" style={{ color: colors.textBright }}>
              Doctor Consultation
            </h1>
            <p className="mt-1 text-[13px] sm:text-[14px]" style={{ color: colors.textMuted }}>
              Find and consult with experienced doctors across specialties.
            </p>
          </div>

          <div
            className="mb-4 flex flex-col overflow-hidden rounded-[12px] sm:flex-row"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.borderSubtle}` }}
          >
            <div className="relative flex min-w-0 flex-1 items-center">
              <Search size={16} className="absolute left-3.5" style={{ color: colors.textDim }} />
              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Search doctor by name, specialty, or condition…"
                className="w-full bg-transparent py-3 pl-10 pr-3 text-[13px] outline-none"
                style={{ color: colors.textBright }}
              />
            </div>

            <div
              className="inline-flex items-center gap-2 border-t px-3.5 py-3 text-[13px] font-semibold sm:border-l sm:border-t-0"
              style={{ borderColor: colors.borderSubtle, color: colors.textMuted }}
            >
              <MapPin size={15} style={{ color: colors.accent }} />
              <span className="whitespace-nowrap">{locationLabel}</span>
              <ChevronDown size={14} style={{ color: colors.textDim }} />
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            {CONSULTATION_SPECIALTIES.map((chip) => {
              const active = specialtyId === chip.id
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleSpecialtySelect(chip.id)}
                  className="rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors"
                  style={
                    active
                      ? {
                          color: colors.accent,
                          background: 'rgba(64,222,170,0.1)',
                          border: '1px solid rgba(64,222,170,0.35)',
                        }
                      : {
                          color: colors.textMuted,
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${colors.borderSubtle}`,
                        }
                  }
                >
                  {chip.label}
                </button>
              )
            })}

            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((open) => !open)}
                className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[12px] font-bold"
                style={{
                  color: CONSULTATION_MORE_SPECIALTIES.some((item) => item.id === specialtyId)
                    ? colors.accent
                    : colors.textMuted,
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${colors.borderSubtle}`,
                }}
              >
                {CONSULTATION_MORE_SPECIALTIES.some((item) => item.id === specialtyId)
                  ? moreSpecialtyLabel
                  : 'More'}
                <ChevronDown size={14} />
              </button>
              {moreOpen && (
                <>
                  <div
                    className="absolute left-0 top-[calc(100%+6px)] z-20 min-w-[180px] rounded-[12px] p-1.5"
                    style={{
                      background: 'rgba(10,28,22,0.98)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
                    }}
                  >
                    {CONSULTATION_MORE_SPECIALTIES.map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => handleSpecialtySelect(chip.id)}
                        className="block w-full rounded-[8px] px-3 py-2 text-left text-[12px] font-semibold hover:bg-white/5"
                        style={{
                          color: specialtyId === chip.id ? colors.accent : colors.textMuted,
                        }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close specialty menu"
                    onClick={() => setMoreOpen(false)}
                  />
                </>
              )}
            </div>
          </div>

          {error ? (
            <p className="mb-5 rounded-[10px] px-3 py-2 text-[12px]" style={{ color: '#ffb4b4', background: 'rgba(255,80,80,0.08)' }}>
              {error}
            </p>
          ) : null}

          <div className="space-y-8">
          <section>
            <SectionHeader
              title={isFiltering ? 'Matching doctors' : 'Top Doctors Near You'}
              actionLabel={topLimit < 50 ? 'View all' : undefined}
              onAction={showAllTopDoctors}
              hideAction={topLimit >= 50}
            />
            {loadingTop ? (
              <DoctorGridSkeleton count={topLimit > 4 ? 8 : 4} />
            ) : topDoctors.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {topDoctors.map((doctor) => (
                  <DoctorTopCard
                    key={doctor.id}
                    doctor={doctor}
                    isFavorite={favorites.has(doctor.id)}
                    onToggleFavorite={toggleFavorite}
                    onConsult={openBooking}
                  />
                ))}
              </div>
            ) : (
              <EmptyPanel message="No doctors found for this search. Try another specialty or keyword." />
            )}
          </section>

          <section>
            <SectionHeader title="Available Specialties" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CONSULTATION_SPECIALTY_AISLES.map((aisle) => {
                const Icon = SPECIALTY_ICONS[aisle.id] ?? Stethoscope
                return (
                  <button
                    key={aisle.id}
                    type="button"
                    onClick={() => handleSpecialtySelect(aisle.id)}
                    className="flex items-center gap-3 rounded-[14px] px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
                    style={{ background: colors.cardBg, border: `1px solid ${colors.borderSubtle}` }}
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: `${aisle.accent}18`,
                        border: `1px solid ${aisle.accent}33`,
                        color: aisle.accent,
                      }}
                    >
                      <Icon size={18} />
                    </span>
                    <span>
                      <span className="block text-[13px] font-extrabold" style={{ color: colors.textBright }}>
                        {aisle.name}
                      </span>
                      <span className="mt-0.5 block text-[11px]" style={{ color: colors.textDim }}>
                        {aisle.count}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <SectionHeader
              title="Popular Doctors"
              actionLabel={popularLimit < 50 ? 'View all' : undefined}
              onAction={showAllPopularDoctors}
              hideAction={popularLimit >= 50}
            />
            {loadingPopular ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[120px] animate-pulse rounded-[16px]"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  />
                ))}
              </div>
            ) : popularDoctors.length > 0 ? (
              <div className="space-y-3">
                {popularDoctors.map((doctor) => (
                  <PopularDoctorCard
                    key={doctor.id}
                    doctor={doctor}
                    slots={popularSlots[doctor.id] ?? []}
                    isFavorite={favorites.has(doctor.id)}
                    onToggleFavorite={toggleFavorite}
                    onBook={(doc, slot) => {
                      if (slot) {
                        handleConfirmBooking({ doctor: doc, slot })
                        return
                      }
                      openBooking(doc)
                    }}
                    onViewProfile={openProfile}
                  />
                ))}
              </div>
            ) : (
              <EmptyPanel message="Popular doctors will appear here once available." />
            )}
          </section>
          </div>
        </div>

        <ConsultationSidebar />
      </div>

      {bookingDoctor ? (
        <DoctorBookingModal
          doctor={bookingDoctor}
          fetchSlots={fetchSlots}
          onClose={() => setBookingDoctor(null)}
          onConfirm={handleConfirmBooking}
        />
      ) : null}

      {profileDoctorId ? (
        <DoctorProfileModal
          doctorId={profileDoctorId}
          fetchProfile={fetchProfile}
          onClose={() => setProfileDoctorId(null)}
          onBook={(doctor) => {
            setProfileDoctorId(null)
            openBooking(doctor)
          }}
        />
      ) : null}
    </div>
  )
}

function EmptyPanel({ message }) {
  return (
    <div
      className="rounded-[14px] px-4 py-8 text-center text-[13px]"
      style={{ color: colors.textMuted, background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}
    >
      {message}
    </div>
  )
}
