import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Stethoscope } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import OrdersShimmer from '@/shared/components/shimmer/pages/OrdersShimmer'
import CancelAppointmentModal from '@/modules/customer/components/consultation/CancelAppointmentModal'
import { useAuthStore } from '@/app/store/authStore'
import { PATHS } from '@/app/router/paths'
import { toast } from '@/app/store/uiStore'
import { fetchUserProfile } from '@/services/user'
import {
  cancelAppointment,
  fetchPatientAppointments,
  isAppointmentCancellable,
  resolvePatientPhoneDigits,
} from '@/services/appointments'
import { colors } from '@/app/themes/colors'

function formatAppointmentDate(dateValue) {
  if (!dateValue) return '—'
  const parsed = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateValue
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatConsultationMode(mode = '') {
  const value = String(mode).toUpperCase()
  if (value === 'IN_CLINIC') return 'In clinic'
  if (value === 'ONLINE') return 'Online'
  return mode || '—'
}

function statusTone(status = '') {
  const value = String(status).toUpperCase()
  if (value === 'CONFIRMED' || value === 'BOOKED' || value === 'SCHEDULED') return 'success'
  if (value === 'CANCELLED' || value === 'CANCELED') return 'danger'
  if (value === 'COMPLETED') return 'info'
  return 'neutral'
}

function AppointmentAvatar({ name }) {
  const initials = String(name ?? '')
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[12px] text-[16px] font-extrabold"
      style={{
        background: 'linear-gradient(145deg, rgba(64,222,170,0.16), rgba(255,255,255,0.04))',
        border: '1px solid rgba(64,222,170,0.22)',
        color: colors.accent,
      }}
    >
      {initials || <Stethoscope size={24} />}
    </div>
  )
}

export default function AppointmentsPage() {
  const authUser = useAuthStore((s) => s.user)

  const [appointments, setAppointments] = useState([])
  const [patientPhone, setPatientPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelTarget, setCancelTarget] = useState(null)

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      let phone = resolvePatientPhoneDigits(null, authUser)

      try {
        const profile = await fetchUserProfile()
        phone = resolvePatientPhoneDigits(profile, authUser)
      } catch {
        phone = resolvePatientPhoneDigits(null, authUser)
      }

      setPatientPhone(phone)

      if (!phone) {
        setAppointments([])
        return
      }

      const list = await fetchPatientAppointments(phone)
      setAppointments(list)
    } catch (err) {
      setAppointments([])
      setError(err instanceof Error ? err.message : 'Could not load appointments')
    } finally {
      setLoading(false)
    }
  }, [authUser])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  const handleCancelConfirm = async ({ appointment, cancellationReason }) => {
    await cancelAppointment(appointment.code, {
      patientPhone,
      cancellationReason,
    })
    toast.error('Appointment cancelled successfully')
    setCancelTarget(null)
    await loadAppointments()
  }

  if (loading) {
    return <OrdersShimmer rows={3} />
  }

  return (
    <div>
      <PageHeader
        title="My Appointments"
        subtitle="View and manage your doctor consultation bookings."
      />

      {error ? (
        <div
          className="mb-4 rounded-[12px] px-4 py-3 text-[12px] font-bold text-red-400"
          style={{ background: 'rgba(255,138,128,0.08)', border: '1px solid rgba(255,138,128,0.24)' }}
        >
          {error}
        </div>
      ) : null}

      {appointments.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No appointments yet"
          description={
            patientPhone
              ? 'Book a consultation to see your appointments here.'
              : 'Add a mobile number to your profile to view appointments.'
          }
          action={
            <Button as={Link} to={PATHS.customer.consultation}>
              Book consultation
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const canCancel = isAppointmentCancellable(appointment)

            return (
              <article
                key={appointment.code || appointment.id}
                className="rounded-[16px] p-4"
                style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
              >
                <div className="flex gap-3.5">
                  <AppointmentAvatar name={appointment.doctorName} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[14px] font-extrabold" style={{ color: colors.textBright }}>
                          {appointment.doctorName}
                        </h3>
                        <p className="mt-0.5 text-[12px]" style={{ color: colors.textMuted }}>
                          {appointment.specialty}
                        </p>
                        <p className="mt-1.5 text-[12px] font-semibold" style={{ color: colors.textBright }}>
                          {formatAppointmentDate(appointment.date)}
                          {appointment.timeRange ? (
                            <span style={{ color: colors.textMuted }}> · {appointment.timeRange}</span>
                          ) : null}
                        </p>
                        {appointment.consultationMode ? (
                          <p className="mt-0.5 text-[11px]" style={{ color: colors.textDim }}>
                            {formatConsultationMode(appointment.consultationMode)}
                          </p>
                        ) : null}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-[16px] font-extrabold tabular-nums" style={{ color: colors.textBright }}>
                          {appointment.feeLabel || '—'}
                        </p>
                        <div className="mt-1.5 flex justify-end">
                          <Badge tone={statusTone(appointment.status)}>
                            {appointment.statusLabel || appointment.status || '—'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]" style={{ color: colors.textDim }}>
                      <span>Booking ID: {appointment.code || appointment.id}</span>
                      {appointment.patientName ? <span>Patient: {appointment.patientName}</span> : null}
                    </div>

                    {canCancel ? (
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setCancelTarget(appointment)}
                          className="rounded-[10px] px-5 py-2 text-[12.5px] font-extrabold transition-opacity hover:opacity-90"
                          style={{
                            color: '#fff',
                            background: '#c0392b',
                            boxShadow: '0 6px 18px rgba(192,57,43,0.35)',
                          }}
                        >
                          Cancel booking
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {cancelTarget ? (
        <CancelAppointmentModal
          appointment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
        />
      ) : null}
    </div>
  )
}
