import { useEffect, useState } from 'react'
import { Mail, MapPin, Phone, Star, X } from 'lucide-react'
import PortalModal from '@/shared/ui/PortalModal'
import { fmtINR } from '@/app/utils/format'
import { isDoctorBookable } from '@/services/doctors'
import { colors } from '@/app/themes/colors'

function doctorInitials(name = '') {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatDoctorStatus(status = '') {
  const raw = String(status).trim().toUpperCase()
  if (raw === 'ACTIVE') return 'Available'
  if (raw === 'ON_LEAVE') return 'On Leave'
  if (raw === 'INACTIVE') return 'Inactive'
  return status
}

function InfoTile({ label, value }) {
  if (!value) return null

  return (
    <div
      className="rounded-[10px] px-3 py-2.5"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.borderSubtle}` }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textDim }}>
        {label}
      </p>
      <p className="mt-1 text-[13px] font-bold" style={{ color: colors.textBright }}>
        {value}
      </p>
    </div>
  )
}

function ContactRow({ icon: Icon, value }) {
  if (!value) return null

  return (
    <div
      className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.borderSubtle}` }}
    >
      <Icon size={15} style={{ color: colors.accent, flexShrink: 0 }} />
      <span className="text-[12.5px] font-semibold break-all" style={{ color: colors.textBright }}>
        {value}
      </span>
    </div>
  )
}

export default function DoctorProfileModal({ doctorId, fetchProfile, onClose, onBook }) {
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!doctorId) return undefined

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const profile = await fetchProfile(doctorId)
        if (!cancelled) setDoctor(profile)
      } catch (err) {
        if (!cancelled) {
          setDoctor(null)
          setError(err?.message ?? 'Could not load doctor profile')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [doctorId, fetchProfile])

  if (!doctorId) return null

  const feeLabel =
    doctor?.consultationFeeLabel ||
    (doctor?.fee > 0 ? fmtINR(doctor.fee) : '')
  const experienceText =
    doctor?.experienceLabel ||
    (doctor?.experienceYears ? `${doctor.experienceYears}+ years experience` : '')

  return (
    <PortalModal onClose={onClose} width={680} accentBorder scrollable={false}>
      <div className="flex max-h-[90vh] flex-col">
      <div
        className="flex shrink-0 items-start justify-between gap-3 border-b px-5 pb-3 pt-5 sm:px-6"
        style={{ borderColor: 'rgba(255,255,255,0.09)', background: '#0d211a' }}
      >
        <div>
          <h2 className="text-[18px] font-extrabold" style={{ color: colors.textBright }}>
            Doctor profile
          </h2>
          <p className="mt-1 text-[12px]" style={{ color: colors.textDim }}>
            Full doctor details, clinic information and weekly schedule.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 hover:bg-white/5"
          aria-label="Close"
        >
          <X size={18} style={{ color: colors.textDim }} />
        </button>
      </div>

      <div className="owner-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {loading ? (
          <div className="space-y-3">
            <div className="h-28 animate-pulse rounded-[14px]" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="h-24 animate-pulse rounded-[14px]" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="h-36 animate-pulse rounded-[14px]" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
        ) : error ? (
          <p className="text-[13px]" style={{ color: '#ff9f9f' }}>
            {error}
          </p>
        ) : doctor ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {doctor.imageUrl ? (
                <img
                  src={doctor.imageUrl}
                  alt={doctor.name}
                  className="h-28 w-28 shrink-0 rounded-[18px] object-cover"
                  style={{ border: '2px solid rgba(64,222,170,0.28)' }}
                />
              ) : (
                <div
                  className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[18px] text-[24px] font-extrabold"
                  style={{
                    background: 'linear-gradient(145deg, rgba(64,222,170,0.18), rgba(255,255,255,0.04))',
                    border: '2px solid rgba(64,222,170,0.28)',
                    color: colors.accent,
                  }}
                >
                  {doctorInitials(doctor.name)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="text-[20px] font-extrabold leading-tight" style={{ color: colors.textBright }}>
                  {doctor.name}
                </h3>
                <p className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>
                  {[doctor.specialty, doctor.qualifications].filter(Boolean).join(' · ')}
                </p>
                {doctor.specialtyDescription ? (
                  <p className="mt-1 text-[12px]" style={{ color: colors.textDim }}>
                    {doctor.specialtyDescription}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {doctor.doctorCode ? (
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide"
                      style={{ color: colors.accent, background: 'rgba(64,222,170,0.12)', border: '1px solid rgba(64,222,170,0.28)' }}
                    >
                      {doctor.doctorCode}
                    </span>
                  ) : null}
                  {doctor.doctorStatus ? (
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-extrabold"
                      style={{ color: colors.textBright, background: 'rgba(255,255,255,0.06)', border: `1px solid ${colors.borderSubtle}` }}
                    >
                      {formatDoctorStatus(doctor.doctorStatus)}
                    </span>
                  ) : null}
                  {doctor.rating > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: colors.textDim }}>
                      <Star size={13} fill="#ffd58f" style={{ color: '#ffd58f' }} />
                      {doctor.rating.toFixed(1)}
                      {doctor.reviewCount > 0 && ` (${doctor.reviewCount} reviews)`}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <InfoTile label="Experience" value={experienceText} />
              <InfoTile label="Consultation fee" value={feeLabel} />
              <InfoTile label="Availability" value={doctor.availabilityLabel || doctor.availability} />
              <InfoTile
                label="Clinic"
                value={doctor.storeLocation?.name || doctor.location}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <ContactRow icon={Mail} value={doctor.email} />
              <ContactRow icon={Phone} value={doctor.phoneNumber} />
            </div>

            {doctor.bio ? (
              <section>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textDim }}>
                  About
                </p>
                <p className="mt-2 text-[13px] leading-relaxed" style={{ color: colors.textMuted }}>
                  {doctor.bio}
                </p>
              </section>
            ) : null}

            {doctor.qualificationList?.length > 0 ? (
              <section>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textDim }}>
                  Qualifications
                </p>
                <div className="space-y-2">
                  {doctor.qualificationList.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[12px] px-3.5 py-3"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.borderSubtle}` }}
                    >
                      <p className="text-[13px] font-extrabold" style={{ color: colors.textBright }}>
                        {item.name}
                      </p>
                      <p className="mt-1 text-[12px]" style={{ color: colors.textMuted }}>
                        {[item.institution, item.year ? `Completed ${item.year}` : ''].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {doctor.storeLocation ? (
              <section>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textDim }}>
                  Clinic location
                </p>
                <div
                  className="rounded-[12px] px-3.5 py-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.borderSubtle}` }}
                >
                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: colors.accent }} />
                    <div>
                      <p className="text-[13px] font-extrabold" style={{ color: colors.textBright }}>
                        {doctor.storeLocation.name}
                      </p>
                      {doctor.storeLocation.fullAddress ? (
                        <p className="mt-1 text-[12px] leading-relaxed" style={{ color: colors.textMuted }}>
                          {doctor.storeLocation.fullAddress}
                        </p>
                      ) : null}
                      {doctor.storeLocation.phone ? (
                        <p className="mt-2 text-[12px] font-semibold" style={{ color: colors.textDim }}>
                          {doctor.storeLocation.phone}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {doctor.weeklySchedules?.length > 0 ? (
              <section>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textDim }}>
                  Weekly consultation schedule
                </p>
                <div
                  className="overflow-hidden rounded-[14px]"
                  style={{ border: `1px solid ${colors.borderSubtle}` }}
                >
                  {doctor.weeklySchedules.map((day, index) => (
                    <div
                      key={day.dayOfWeek || day.dayLabel}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                      style={{ borderTop: index ? `1px solid ${colors.borderSubtle}` : undefined }}
                    >
                      <span className="min-w-[100px] text-[12.5px] font-bold" style={{ color: colors.textBright }}>
                        {day.dayLabel}
                      </span>
                      {day.isAvailable && day.slots?.length ? (
                        <div className="flex flex-wrap gap-1.5 sm:justify-end">
                          {day.slots.map((slot) => (
                            <span
                              key={slot.id}
                              className="rounded-[8px] px-2.5 py-1 text-[11px] font-bold"
                              style={{
                                color: colors.textHighlight,
                                background: 'rgba(255,255,255,0.04)',
                                border: `1px solid ${colors.borderSubtle}`,
                              }}
                            >
                              {slot.time}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[12px] font-semibold sm:text-right" style={{ color: colors.textDim }}>
                          Not available
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ) : doctor.consultationTimingsSummary ? (
              <section>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textDim }}>
                  Consultation timings
                </p>
                <p className="text-[13px] font-semibold" style={{ color: colors.textMuted }}>
                  {doctor.consultationTimingsSummary}
                </p>
              </section>
            ) : null}

            {doctor.languages?.length > 0 ? (
              <section>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textDim }}>
                  Languages
                </p>
                <p className="mt-2 text-[13px]" style={{ color: colors.textMuted }}>
                  {doctor.languages.join(', ')}
                </p>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>

      {doctor && !loading && !error ? (
        <div
          className="flex shrink-0 justify-end gap-2.5 border-t px-5 py-3 sm:px-6"
          style={{ borderColor: 'rgba(255,255,255,0.09)', background: '#0d211a' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-[10px] px-[18px] py-2 text-[12.5px] font-bold"
            style={{
              color: colors.textHighlight,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.16)',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isDoctorBookable(doctor)}
            onClick={() => onBook?.(doctor)}
            className="cursor-pointer rounded-[10px] px-5 py-2 text-[12.5px] font-extrabold disabled:cursor-not-allowed disabled:opacity-45"
            style={
              isDoctorBookable(doctor)
                ? {
                    color: colors.accentText,
                    background: colors.primaryBtn,
                    boxShadow: '0 6px 18px rgba(64,222,170,0.35)',
                  }
                : {
                    color: colors.textDim,
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${colors.borderSubtle}`,
                  }
            }
          >
            Book consultation
          </button>
        </div>
      ) : null}
      </div>
    </PortalModal>
  )
}
