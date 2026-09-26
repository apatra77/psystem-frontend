import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import PortalModal, { ModalFieldLabel, ModalInput } from '@/shared/ui/PortalModal'
import { useAuthStore } from '@/app/store/authStore'
import { fmtINR } from '@/app/utils/format'
import {
  formatDoctorNextAvailableShort,
  getDoctorConsultationDateParam,
} from '@/services/doctors'
import { fetchUserProfile } from '@/services/user'
import { colors } from '@/app/themes/colors'

function extractMobileDigits(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.length >= 10 ? digits.slice(-10) : digits
}

function resolveMobileFromSources(profile, authUser) {
  return extractMobileDigits(profile?.mobile ?? authUser?.mobile ?? authUser?.phone ?? '')
}

function resolveSlotDayLabel(consultationDateParam) {
  if (consultationDateParam === 'tomorrow') return 'Tomorrow'
  if (consultationDateParam === 'today') return 'Today'
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(consultationDateParam))) {
    return (
      formatDoctorNextAvailableShort({ consultationDate: consultationDateParam }) ||
      consultationDateParam
    )
  }
  return 'Selected date'
}

export default function DoctorBookingModal({ doctor, fetchSlots, onClose, onConfirm }) {
  const authUser = useAuthStore((s) => s.user)
  const consultationDateParam = doctor ? getDoctorConsultationDateParam(doctor) : 'today'
  const slotDayLabel = resolveSlotDayLabel(consultationDateParam)

  const [slots, setSlots] = useState([])
  const [consultationDate, setConsultationDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [patientPhone, setPatientPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!doctor?.id) return undefined

    setPatientPhone(resolveMobileFromSources(null, authUser))
    setSubmitError('')

    let cancelled = false

    ;(async () => {
      try {
        const profile = await fetchUserProfile()
        if (!cancelled) {
          setPatientPhone(resolveMobileFromSources(profile, authUser))
        }
      } catch {
        if (!cancelled) {
          setPatientPhone(resolveMobileFromSources(null, authUser))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authUser, doctor?.id])

  useEffect(() => {
    if (!doctor?.id) return undefined

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const result = await fetchSlots(doctor.id, consultationDateParam)
        const nextSlots = Array.isArray(result) ? result : (result?.slots ?? [])
        const nextDate = Array.isArray(result) ? '' : (result?.consultationDate ?? '')

        if (!cancelled) {
          const slotsWithTimes = nextSlots.filter((slot) => slot.time)
          const resolvedDate =
            nextDate ||
            (/^\d{4}-\d{2}-\d{2}$/.test(String(consultationDateParam))
              ? consultationDateParam
              : '')
          setConsultationDate(resolvedDate)
          setSlots(slotsWithTimes)
          setSelectedSlot(slotsWithTimes[0] ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          setSlots([])
          setConsultationDate('')
          setError(err?.message ?? 'Could not load available slots')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [doctor?.id, fetchSlots, consultationDateParam])

  if (!doctor) return null

  const handleConfirm = () => {
    const phone = patientPhone.replace(/\D/g, '')
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setSubmitError('Please enter a valid 10-digit mobile number.')
      return
    }
    setSubmitError('')
    onConfirm?.({ doctor, slot: selectedSlot, consultationDate, patientPhone: phone })
  }

  return (
    <PortalModal onClose={onClose} width={480} accentBorder>
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-extrabold" style={{ color: colors.textBright }}>
              Book consultation
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>
              {doctor.name} · {doctor.specialty}
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

        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textDim }}>
          Available slots · {slotDayLabel}
        </p>

        {loading ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-9 animate-pulse rounded-[8px]"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              />
            ))}
          </div>
        ) : error ? (
          <p className="mt-3 text-[13px]" style={{ color: '#ff9f9f' }}>
            {error}
          </p>
        ) : slots.length === 0 ? (
          <p className="mt-3 text-[13px]" style={{ color: colors.textMuted }}>
            No slots available {slotDayLabel.toLowerCase()}. Please try another doctor.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {slots.map((slot) => {
              const active = selectedSlot?.id === slot.id
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className="rounded-[8px] px-3 py-2 text-[12px] font-bold"
                  style={
                    active
                      ? {
                          color: colors.accentText,
                          background: colors.primaryBtn,
                          border: '1px solid rgba(64,222,170,0.45)',
                        }
                      : {
                          color: colors.textHighlight,
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${colors.borderSubtle}`,
                        }
                  }
                >
                  {slot.time}
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-5">
          <ModalFieldLabel>Mobile number</ModalFieldLabel>
          <ModalInput
            value={patientPhone}
            onChange={(event) => {
              setPatientPhone(event.target.value.replace(/\D/g, '').slice(0, 10))
              setSubmitError('')
            }}
            placeholder="Enter 10-digit mobile number"
            inputMode="numeric"
          />
        </div>

        <div
          className="mt-5 flex items-center justify-between gap-3 rounded-[12px] px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.borderSubtle}` }}
        >
          <span className="text-[12px]" style={{ color: colors.textMuted }}>
            Consultation fee
          </span>
          <span className="text-[15px] font-extrabold" style={{ color: colors.textBright }}>
            {doctor.fee > 0 ? fmtINR(doctor.fee) : '—'}
          </span>
        </div>

        {submitError ? (
          <p className="mt-3 text-[12px]" style={{ color: '#ff9f9f' }}>
            {submitError}
          </p>
        ) : null}

        <button
          type="button"
          disabled={!selectedSlot || loading}
          onClick={handleConfirm}
          className="mt-4 w-full rounded-[12px] py-3 text-[13px] font-extrabold disabled:cursor-not-allowed disabled:opacity-45"
          style={{ background: colors.primaryBtn, color: colors.accentText }}
        >
          Confirm booking
        </button>
      </div>
    </PortalModal>
  )
}
