import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  CalendarCheck,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Power,
  Stethoscope,
  X,
} from 'lucide-react'
import PortalModal from '../../components/PortalModal'
import Spinner from '@/components/ui/Spinner'
import { WEEK_DAYS } from '../../data/doctorsData'
import {
  CONSULTATION_TYPE_OPTIONS,
  doctorInitials,
  statusMeta,
} from './doctorUtils'
import ConsultationBookingsModal from './ConsultationBookingsModal'
import { fetchAdminDoctorById, setAdminDoctorStatus } from '@/services/adminDoctors'
import { toast } from '@/app/store/uiStore'
import { colors } from '@/theme/colors'

const PROFILE_TABS = [
  // { id: 'overview', label: 'Overview' },
  { id: 'qualifications', label: 'Qualifications' },
  { id: 'consultation', label: 'Consultation Details' },
  { id: 'schedule', label: 'Schedule' },
]

function consultationTypeLabel(value) {
  return CONSULTATION_TYPE_OPTIONS.find((opt) => opt.id === value)?.label ?? value
}

function displayDoctorName(name = '') {
  const trimmed = String(name).trim()
  if (!trimmed) return 'Doctor'
  return /^dr\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`
}

function StatCard({ label, value, hint }) {
  return (
    <div
      className="rounded-[12px] px-4 py-3.5"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}
    >
      <p className="text-[11px] font-bold" style={{ color: colors.textDim }}>
        {label}
      </p>
      <p className="text-[22px] font-extrabold text-white tabular-nums mt-1">{value}</p>
      {hint ? (
        <p className="text-[10.5px] font-semibold mt-1" style={{ color: colors.accent }}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function ContactRow({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2.5 text-[12px]" style={{ color: colors.textSecondary }}>
      <Icon size={14} style={{ color: colors.accent, flexShrink: 0 }} />
      <span className="truncate">{children || '—'}</span>
    </div>
  )
}

export default function DoctorProfileModal() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('qualifications')
  const [bookingsOpen, setBookingsOpen] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const returnTo = useMemo(() => {
    const candidate = location.state?.returnTo
    return typeof candidate === 'string' && candidate.startsWith('/owner') ? candidate : '/owner/doctors'
  }, [location.state?.returnTo])

  const close = () => navigate(returnTo)

  const reloadDoctor = async () => {
    if (!id) return
    const data = await fetchAdminDoctorById(id)
    setDoctor(data)
  }

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
  const qualificationRows = doctor?.qualificationRows?.length
    ? doctor.qualificationRows
    : doctor?.qualifications
      ? [{ qualificationName: doctor.qualifications, institutionName: '', yearCompleted: '' }]
      : []

  const handleDeactivate = async () => {
    if (!doctor?.id || doctor.status === 'inactive') return
    setStatusUpdating(true)
    try {
      await setAdminDoctorStatus(doctor.id, 'inactive')
      toast.success('Doctor deactivated')
      await reloadDoctor()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update status')
    } finally {
      setStatusUpdating(false)
    }
  }

  return (
    <>
      <PortalModal onClose={close} width={1040} scrollable={false} maxHeight="92vh" closeOnBackdrop={false}>
        <div className="flex flex-col flex-1 min-h-0">
          <div
            className="flex-shrink-0 flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.09)', background: '#0d211a' }}
          >
            <div>
              <h2 className="text-[17px] font-extrabold text-white">Doctor Profile</h2>
              <p className="text-[12px] mt-1" style={{ color: colors.textDim }}>
                View doctor details, consultation information and schedule.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {doctor ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/owner/doctors/${doctor.id}/edit`, { state: { returnTo: `/owner/doctors/${doctor.id}` } })}
                    className="inline-flex items-center justify-center gap-1.5 text-[12px] font-extrabold px-3.5 py-2 rounded-[10px] cursor-pointer"
                    style={{ color: colors.accentText, background: colors.primaryBtn }}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  {doctor.status !== 'inactive' ? (
                    <button
                      type="button"
                      onClick={handleDeactivate}
                      disabled={statusUpdating}
                      className="inline-flex items-center justify-center gap-1.5 text-[12px] font-extrabold px-3.5 py-2 rounded-[10px] cursor-pointer disabled:opacity-60"
                      style={{ color: '#fecaca', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.35)' }}
                    >
                      <Power size={14} />
                      Deactivate
                    </button>
                  ) : null}
                </>
              ) : null}
              <button type="button" onClick={close} className="p-1.5 rounded-lg hover:bg-white/8 cursor-pointer" aria-label="Close">
                <X size={18} style={{ color: colors.textMuted }} />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {loading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 min-h-0">
                <Spinner />
                <p className="text-[12.5px] font-bold" style={{ color: colors.textSecondary }}>Loading profile…</p>
              </div>
            ) : error ? (
              <div className="flex flex-1 items-center justify-center px-5 py-10 text-center min-h-0">
                <div>
                  <p className="text-[13px] font-bold text-red-400 mb-3">{error}</p>
                  <button type="button" onClick={close} className="px-4 py-2 rounded-[10px] text-[12.5px] font-extrabold cursor-pointer" style={{ background: colors.primaryBtn, color: colors.accentText }}>
                    Back to doctors
                  </button>
                </div>
              </div>
            ) : doctor ? (
              <div className="flex flex-1 min-h-0 px-5 py-4 gap-4 flex-col lg:flex-row">
                  <aside
                    className="rounded-[14px] p-4 space-y-4 flex-shrink-0 lg:w-[260px] lg:max-h-full lg:overflow-y-auto owner-scroll"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}
                  >
                    <div className="flex flex-col items-center text-center">
                      {doctor.imageUrl ? (
                        <img src={doctor.imageUrl} alt="" className="w-[96px] h-[96px] rounded-full object-cover" style={{ border: '2px solid rgba(64,222,170,0.35)' }} />
                      ) : (
                        <span
                          className="w-[96px] h-[96px] rounded-full flex items-center justify-center font-extrabold text-[18px]"
                          style={{ background: 'rgba(64,222,170,0.14)', color: colors.accent, border: '1px solid rgba(64,222,170,0.36)' }}
                        >
                          {doctorInitials(doctor.name)}
                        </span>
                      )}
                      <h3 className="text-[16px] font-extrabold text-white mt-3">{displayDoctorName(doctor.name)}</h3>
                      {badge ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full mt-2" style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
                          {badge.label}
                        </span>
                      ) : null}
                      <p className="text-[11.5px] mt-2 leading-snug" style={{ color: colors.textMuted }}>
                        {doctor.qualifications || '—'}
                      </p>
                      <p className="text-[11px] mt-1" style={{ color: colors.textDim }}>
                        {doctor.specialty}
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <ContactRow icon={Phone}>{doctor.mobile}</ContactRow>
                      <ContactRow icon={Mail}>{doctor.email}</ContactRow>
                      <ContactRow icon={MapPin}>{doctor.store}</ContactRow>
                      <ContactRow icon={Stethoscope}>
                        {doctor.experienceYears != null ? `${doctor.experienceYears} years experience` : '—'}
                      </ContactRow>
                    </div>

                    <button
                      type="button"
                      onClick={() => setBookingsOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-1.5 text-[12.5px] font-extrabold px-4 py-2.5 rounded-[10px] cursor-pointer"
                      style={{ color: colors.accentText, background: colors.primaryBtn, boxShadow: '0 6px 18px rgba(64,222,170,0.28)' }}
                    >
                      <CalendarCheck size={15} />
                      View Bookings
                    </button>
                  </aside>

                  <div className="flex-1 min-w-0 min-h-0 overflow-y-auto owner-scroll">
                    <div
                      className="flex flex-wrap gap-1 p-1 rounded-[12px] mb-4"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.borderSubtle}` }}
                    >
                      {PROFILE_TABS.map((item) => {
                        const active = tab === item.id
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setTab(item.id)}
                            className="px-3.5 py-2 rounded-[9px] text-[12px] font-bold cursor-pointer transition-colors"
                            style={{
                              color: active ? colors.accentText : colors.textMuted,
                              background: active ? colors.accent : 'transparent',
                            }}
                          >
                            {item.label}
                          </button>
                        )
                      })}
                    </div>

                    {/* Overview tab — hidden for now
                    {tab === 'overview' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                          <StatCard label="Total Bookings" value="—" />
                          <StatCard label="Completed" value="—" />
                          <StatCard label="Cancelled" value="—" />
                          <StatCard label="Upcoming" value="—" />
                        </div>
                        <section
                          className="rounded-[14px] p-4"
                          style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}
                        >
                          <h4 className="text-[13px] font-extrabold text-white mb-2">About Doctor</h4>
                          <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: colors.textMuted }}>
                            {doctor.profileSummary?.trim() || 'No profile summary added yet.'}
                          </p>
                        </section>
                      </div>
                    ) : null}
                    */}

                    {tab === 'qualifications' ? (
                      <div className="space-y-2.5">
                        {qualificationRows.filter((row) => row.qualificationName?.trim()).length ? (
                          qualificationRows
                            .filter((row) => row.qualificationName?.trim())
                            .map((row, index) => (
                              <div
                                key={`qual-${index}`}
                                className="rounded-[12px] px-4 py-3"
                                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}
                              >
                                <p className="text-[13px] font-extrabold text-white">{row.qualificationName}</p>
                                {row.institutionName ? (
                                  <p className="text-[12px] mt-1" style={{ color: colors.textMuted }}>
                                    {row.institutionName}
                                  </p>
                                ) : null}
                                {row.yearCompleted ? (
                                  <p className="text-[11px] mt-0.5" style={{ color: colors.textDim }}>
                                    Year: {row.yearCompleted}
                                  </p>
                                ) : null}
                              </div>
                            ))
                        ) : (
                          <p className="text-[12.5px]" style={{ color: colors.textDim }}>No qualifications listed.</p>
                        )}
                      </div>
                    ) : null}

                    {tab === 'consultation' ? (
                      <div
                        className="rounded-[14px] p-4 space-y-3 max-w-lg"
                        style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}
                      >
                        <p className="text-[12.5px]">
                          <span className="font-extrabold text-white">Specialty: </span>
                          <span style={{ color: colors.textMuted }}>{doctor.specialty || '—'}</span>
                        </p>
                        <p className="text-[12.5px]">
                          <span className="font-extrabold text-white">Consultation mode: </span>
                          <span style={{ color: colors.textMuted }}>{consultationTypeLabel(doctor.consultationType)}</span>
                        </p>
                        <p className="text-[12.5px]">
                          <span className="font-extrabold text-white">Consultation fee: </span>
                          <span style={{ color: colors.textMuted }}>
                            {doctor.consultationFee != null ? `₹${doctor.consultationFee}` : '—'}
                          </span>
                        </p>
                        <p className="text-[12.5px]">
                          <span className="font-extrabold text-white">Experience: </span>
                          <span style={{ color: colors.textMuted }}>
                            {doctor.experienceYears != null ? `${doctor.experienceYears} years` : '—'}
                          </span>
                        </p>
                      </div>
                    ) : null}

                    {tab === 'schedule' ? (
                      <div className="space-y-3">
                        <p className="text-[12px] font-semibold" style={{ color: colors.textSecondary }}>
                          Weekly consultation schedule
                        </p>
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
                                  <span className="text-[12px] font-semibold sm:text-right" style={{ color: colors.textDim }}>
                                    Not available
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
              </div>
            ) : null}
          </div>
        </div>
      </PortalModal>

      {bookingsOpen ? <ConsultationBookingsModal onClose={() => setBookingsOpen(false)} /> : null}
    </>
  )
}
