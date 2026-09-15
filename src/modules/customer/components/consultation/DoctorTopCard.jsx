import { Star } from 'lucide-react'
import { fmtINR } from '@/app/utils/format'
import { getDoctorBookButtonLabel, isDoctorBookable } from '@/services/doctors'
import { colors } from '@/app/themes/colors'

function DoctorAvatar({ doctor }) {
  if (doctor.imageUrl) {
    return (
      <img
        src={doctor.imageUrl}
        alt=""
        className="h-[72px] w-[72px] rounded-full object-cover"
        style={{ border: '2px solid rgba(64,222,170,0.25)' }}
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
      className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-[18px] font-extrabold"
      style={{
        background: 'linear-gradient(145deg, rgba(64,222,170,0.18), rgba(255,255,255,0.04))',
        border: '2px solid rgba(64,222,170,0.25)',
        color: colors.accent,
      }}
    >
      {initials || 'DR'}
    </div>
  )
}

function availabilityBadge(availability, availableToday) {
  const label = availability || (availableToday ? 'Available Now' : 'Available Tomorrow')
  const isNow = /now|today|available/i.test(label) && !/tomorrow|next|not available|unavailable/i.test(label)

  return {
    label,
    style: isNow
      ? { color: '#40deaa', background: 'rgba(64,222,170,0.12)', border: '1px solid rgba(64,222,170,0.28)' }
      : { color: colors.textMuted, background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.borderSubtle}` },
  }
}

export default function DoctorTopCard({ doctor, onConsult }) {
  const canConsult = isDoctorBookable(doctor)
  const badge = availabilityBadge(doctor.availability, doctor.availableToday)
  const reviewsLabel =
    doctor.reviewCount >= 1000
      ? `${(doctor.reviewCount / 1000).toFixed(1)}k reviews`
      : `${doctor.reviewCount} reviews`

  return (
    <article
      className="flex h-full flex-col rounded-[16px] p-4"
      style={{ background: colors.cardBg, border: `1px solid ${colors.borderSubtle}` }}
    >
      <DoctorAvatar doctor={doctor} />

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-extrabold" style={{ color: colors.textBright }}>
            {doctor.name}
          </h3>
          <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: colors.textMuted }}>
            {[doctor.specialty, doctor.qualifications].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold" style={badge.style}>
          {badge.label}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: colors.textDim }}>
        {doctor.rating > 0 && (
          <span className="inline-flex items-center gap-1">
            <Star size={12} fill="#ffd58f" style={{ color: '#ffd58f' }} />
            <span style={{ color: colors.textBright }}>{doctor.rating.toFixed(1)}</span>
            {doctor.reviewCount > 0 && <span>({reviewsLabel})</span>}
          </span>
        )}
        {doctor.experienceYears && <span>{doctor.experienceYears}+ years experience</span>}
        {doctor.location && <span>{doctor.location}</span>}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <p className="text-[15px] font-extrabold" style={{ color: colors.textBright }}>
          {doctor.fee > 0 ? fmtINR(doctor.fee) : '—'}
        </p>
        <button
          type="button"
          disabled={!canConsult}
          onClick={() => onConsult?.(doctor)}
          className="rounded-[10px] px-3.5 py-2 text-[12px] font-extrabold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
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
    </article>
  )
}
