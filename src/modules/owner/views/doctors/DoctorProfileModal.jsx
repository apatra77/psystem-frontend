import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Mail, MapPin, Phone, Pencil, X } from 'lucide-react'
import PortalModal from '../../components/PortalModal'
import Spinner from '@/components/ui/Spinner'
import { WEEK_DAYS } from '../../data/doctorsData'
import { CONSULTATION_TYPE_OPTIONS, doctorInitials, statusMeta } from './doctorUtils'
import { fetchAdminDoctorById } from '@/services/adminDoctors'
import { colors } from '@/theme/colors'

function consultationTypeLabel(value) {
  return CONSULTATION_TYPE_OPTIONS.find((opt) => opt.id === value)?.label ?? value
}

export default function DoctorProfileModal() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const returnTo = useMemo(() => {
    const candidate = location.state?.returnTo
    return typeof candidate === 'string' && candidate.startsWith('/owner') ? candidate : '/owner/doctors'
  }, [location.state?.returnTo])

  const close = () => navigate(returnTo)

  useEffect(() => {
    if (!id) return undefined
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchAdminDoctorById(id)
        if (!cancelled) setDoctor(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load doctor profile')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (location.pathname.endsWith('/edit') || location.pathname.endsWith('/add')) return null

  const badge = doctor ? statusMeta(doctor.status) : null

  return (
    <PortalModal onClose={close} width={680} scrollable={false}>
      <div className="flex flex-col max-h-[92vh]">
        <div
          className="flex-shrink-0 flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.09)', background: '#0d211a' }}
        >
          <div>
            <h2 className="text-[17px] font-extrabold text-white">Doctor Profile</h2>
            <p className="text-[12px] mt-1" style={{ color: colors.textDim }}>
              View doctor details, contact information and weekly schedule.
            </p>
          </div>
          <button type="button" onClick={close} className="p-1.5 rounded-lg hover:bg-white/8 cursor-pointer" aria-label="Close">
            <X size={18} style={{ color: colors.textMuted }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto owner-scroll min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Spinner />
              <p className="text-[12.5px] font-bold" style={{ color: colors.textSecondary }}>Loading profile…</p>
            </div>
          ) : error ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] font-bold text-red-400 mb-3">{error}</p>
              <button type="button" onClick={close} className="px-4 py-2 rounded-[10px] text-[12.5px] font-extrabold cursor-pointer" style={{ background: colors.primaryBtn, color: colors.accentText }}>
                Back to doctors
              </button>
            </div>
          ) : doctor ? (
            <div className="px-5 py-4 space-y-5">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {doctor.imageUrl ? (
              <img src={doctor.imageUrl} alt="" className="w-[88px] h-[88px] rounded-full object-cover" style={{ border: '2px solid rgba(64,222,170,0.35)' }} />
            ) : (
              <span
                className="w-[88px] h-[88px] rounded-full flex items-center justify-center font-extrabold text-[18px]"
                style={{ background: 'rgba(64,222,170,0.14)', color: colors.accent, border: '1px solid rgba(64,222,170,0.36)' }}
              >
                {doctorInitials(doctor.name)}
              </span>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[18px] font-extrabold text-white">{doctor.name}</h3>
                {badge && (
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full" style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
                    {badge.label}
                  </span>
                )}
              </div>
              <p className="text-[12.5px] mt-1" style={{ color: colors.textMuted }}>{doctor.qualifications}</p>
              <p className="text-[12px] mt-2" style={{ color: colors.textSecondary }}>
                {doctor.specialty}
                {doctor.experienceYears ? ` · ${doctor.experienceYears} years experience` : ''}
              </p>
              <p className="text-[12px] mt-1" style={{ color: colors.textDim }}>
                Consultation: {consultationTypeLabel(doctor.consultationType)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-[12px] px-4 py-3 flex items-center gap-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}>
              <Phone size={15} style={{ color: colors.accent }} />
              <span className="text-[12.5px] text-white">{doctor.mobile}</span>
            </div>
            <div className="rounded-[12px] px-4 py-3 flex items-center gap-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}>
              <Mail size={15} style={{ color: colors.accent }} />
              <span className="text-[12.5px] text-white truncate">{doctor.email}</span>
            </div>
            <div className="rounded-[12px] px-4 py-3 flex items-center gap-2.5 sm:col-span-2" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}>
              <MapPin size={15} style={{ color: colors.accent }} />
              <span className="text-[12.5px] text-white">{doctor.store}</span>
            </div>
          </div>

          <section>
            <h4 className="text-[13px] font-extrabold text-white mb-3">Weekly Consultation Schedule</h4>
            <div className="rounded-[14px] overflow-hidden" style={{ border: `1px solid ${colors.borderSubtle}` }}>
              {WEEK_DAYS.map(({ key, label }, index) => {
                const day = doctor.schedule?.[key]
                const enabled = day?.enabled && day.slots?.length
                return (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3"
                    style={{ borderTop: index ? `1px solid ${colors.borderSubtle}` : undefined }}
                  >
                    <span className="text-[12.5px] font-bold text-white min-w-[100px]">{label}</span>
                    {enabled ? (
                      <div className="space-y-0.5 sm:text-right">
                        {day.slots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="text-[12px]" style={{ color: colors.textMuted }}>
                            {slot.start} – {slot.end}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[12px] font-semibold sm:text-right" style={{ color: colors.textDim }}>Not available</span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.09)' }}>
            <button
              type="button"
              onClick={() => navigate(`/owner/doctors/${doctor.id}/edit`, { state: { returnTo: `/owner/doctors/${doctor.id}` } })}
              className="inline-flex items-center justify-center gap-1.5 text-[12.5px] font-extrabold px-5 py-2 rounded-[10px] cursor-pointer"
              style={{ color: colors.accentText, background: colors.primaryBtn }}
            >
              <Pencil size={14} />
              Edit Doctor
            </button>
          </div>
            </div>
          ) : null}
        </div>
      </div>
    </PortalModal>
  )
}
