import { Star } from 'lucide-react'
import {
  getDoctorBookButtonLabel,
  isDoctorAvailableTomorrow,
  isDoctorBookable,
} from '@/services/doctors'
import { colors } from '@/app/themes/colors'

function DoctorAvatar({ doctor, size = 56 }) {
  if (doctor.imageUrl) {
    return (
      <img
        src={doctor.imageUrl}
        alt=""
        className="rounded-full object-cover"
        style={{ width: size, height: size, border: '2px solid rgba(64,222,170,0.22)' }}
      />
    )
  }

  const initials = doctor.name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className="flex items-center justify-center rounded-full text-[14px] font-extrabold"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(145deg, rgba(64,222,170,0.16), rgba(255,255,255,0.04))',
        border: '2px solid rgba(64,222,170,0.22)',
        color: colors.accent,
      }}
    >
      {initials || 'DR'}
    </div>
  )
}

export default function PopularDoctorCard({ doctor, slots = [], onConsult, onViewProfile }) {
  const canConsult = isDoctorBookable(doctor)
  const slotHeading = isDoctorAvailableTomorrow(doctor) ? 'Available Tomorrow' : 'Available Today'
  const visibleSlots = canConsult ? slots : []

  return (
    <article
      className="rounded-[16px] p-4"
      style={{ background: colors.cardBg, border: `1px solid ${colors.borderSubtle}` }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <DoctorAvatar doctor={doctor} />
          <div className="min-w-0 flex-1">
            <div className="min-w-0">
              <h3 className="truncate text-[14px] font-extrabold" style={{ color: colors.textBright }}>
                {doctor.name}
              </h3>
              <p className="mt-0.5 text-[11.5px]" style={{ color: colors.textMuted }}>
                {[doctor.specialty, doctor.qualifications].filter(Boolean).join(' · ')}
              </p>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: colors.textDim }}>
              {doctor.rating > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star size={12} fill="#ffd58f" style={{ color: '#ffd58f' }} />
                  <span style={{ color: colors.textBright }}>{doctor.rating.toFixed(1)}</span>
                  {doctor.reviewCount > 0 && <span>({doctor.reviewCount} reviews)</span>}
                </span>
              )}
              {doctor.experienceYears && <span>{doctor.experienceYears}+ years experience</span>}
              {doctor.location && <span>{doctor.location}</span>}
            </div>
          </div>
        </div>

        <div className="lg:w-[280px]">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textDim }}>
            {slotHeading}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {visibleSlots.length > 0 ? (
              visibleSlots.map((slot) => (
                <span
                  key={slot.id}
                  className="rounded-[8px] px-2.5 py-1.5 text-[11px] font-bold"
                  style={{
                    color: colors.textHighlight,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${colors.borderSubtle}`,
                  }}
                >
                  {slot.time}
                </span>
              ))
            ) : (
              <span className="text-[11px]" style={{ color: colors.textDim }}>
                No slots today
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:self-center">
          <button
            type="button"
            onClick={() => onViewProfile?.(doctor)}
            className="rounded-[10px] px-4 py-2 text-[12px] font-bold"
            style={{
              color: colors.textHighlight,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${colors.border}`,
            }}
          >
            View Profile
          </button>
          <button
            type="button"
            disabled={!canConsult}
            onClick={() => onConsult?.(doctor)}
            className="rounded-[10px] px-4 py-2 text-[12px] font-extrabold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            style={
              canConsult
                ? { background: colors.primaryBtn, color: colors.accentText }
                : {
                    background: 'rgba(255,255,255,0.06)',
                    color: colors.textDim,
                    border: `1px solid ${colors.borderSubtle}`,
                  }
            }
          >
            {getDoctorBookButtonLabel(doctor)}
          </button>
        </div>
      </div>
    </article>
  )
}
