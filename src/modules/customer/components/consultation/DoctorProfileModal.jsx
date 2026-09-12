import { useEffect, useState } from 'react'
import { Star, X } from 'lucide-react'
import PortalModal from '@/shared/ui/PortalModal'
import { fmtINR } from '@/app/utils/format'
import { colors } from '@/app/themes/colors'

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

  return (
    <PortalModal onClose={onClose} width={560} accentBorder>
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-[18px] font-extrabold" style={{ color: colors.textBright }}>
            Doctor profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-white/5"
            aria-label="Close"
          >
            <X size={18} style={{ color: colors.textDim }} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-[12px]" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="h-24 animate-pulse rounded-[12px]" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
        ) : error ? (
          <p className="text-[13px]" style={{ color: '#ff9f9f' }}>
            {error}
          </p>
        ) : doctor ? (
          <>
            <div className="flex items-start gap-4">
              {doctor.imageUrl ? (
                <img
                  src={doctor.imageUrl}
                  alt=""
                  className="h-20 w-20 rounded-full object-cover"
                  style={{ border: '2px solid rgba(64,222,170,0.25)' }}
                />
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full text-[20px] font-extrabold"
                  style={{
                    background: 'linear-gradient(145deg, rgba(64,222,170,0.18), rgba(255,255,255,0.04))',
                    border: '2px solid rgba(64,222,170,0.25)',
                    color: colors.accent,
                  }}
                >
                  DR
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-[16px] font-extrabold" style={{ color: colors.textBright }}>
                  {doctor.name}
                </h3>
                <p className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>
                  {[doctor.specialty, doctor.qualifications].filter(Boolean).join(' · ')}
                </p>
                {doctor.rating > 0 && (
                  <p className="mt-2 inline-flex items-center gap-1 text-[12px]" style={{ color: colors.textDim }}>
                    <Star size={13} fill="#ffd58f" style={{ color: '#ffd58f' }} />
                    {doctor.rating.toFixed(1)}
                    {doctor.reviewCount > 0 && ` (${doctor.reviewCount} reviews)`}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {doctor.experienceYears && (
                <InfoTile label="Experience" value={`${doctor.experienceYears}+ years`} />
              )}
              {doctor.location && <InfoTile label="Clinic" value={doctor.location} />}
              {doctor.fee > 0 && <InfoTile label="Consultation fee" value={fmtINR(doctor.fee)} />}
              {doctor.availability && <InfoTile label="Availability" value={doctor.availability} />}
            </div>

            {doctor.bio && (
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textDim }}>
                  About
                </p>
                <p className="mt-2 text-[13px] leading-relaxed" style={{ color: colors.textMuted }}>
                  {doctor.bio}
                </p>
              </div>
            )}

            {doctor.languages?.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textDim }}>
                  Languages
                </p>
                <p className="mt-2 text-[13px]" style={{ color: colors.textMuted }}>
                  {doctor.languages.join(', ')}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => onBook?.(doctor)}
              className="mt-5 w-full rounded-[12px] py-3 text-[13px] font-extrabold"
              style={{ background: colors.primaryBtn, color: colors.accentText }}
            >
              Book consultation
            </button>
          </>
        ) : null}
      </div>
    </PortalModal>
  )
}

function InfoTile({ label, value }) {
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
