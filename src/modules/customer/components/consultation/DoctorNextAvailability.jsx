import { isDoctorBookable } from '@/services/doctors'
import { colors } from '@/app/themes/colors'

/** "Next availability" chips — same as Popular Doctors on the consultation page. */
export default function DoctorNextAvailability({ doctor, slots = [], className = '' }) {
  if (!doctor) return null

  const canConsult = isDoctorBookable(doctor)
  const availabilityLine = doctor.availabilityLabel || doctor.availability || 'Not available'
  const showNextDateOnly = Boolean(doctor.nextAvailableSlot?.consultationDate)
  const visibleSlots = canConsult && !showNextDateOnly ? slots : []

  return (
    <div className={className}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textDim }}>
        Next availability
      </p>
      <div className="flex flex-wrap gap-1.5">
        {showNextDateOnly || visibleSlots.length === 0 ? (
          <span
            className="rounded-[8px] px-2.5 py-1.5 text-[11px] font-bold leading-snug"
            style={{
              color: colors.textHighlight,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${colors.borderSubtle}`,
            }}
          >
            {availabilityLine}
          </span>
        ) : (
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
        )}
      </div>
    </div>
  )
}
