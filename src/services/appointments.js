import { authFetch, DOCTOR_API_BASE } from './api'

const BASE = '/api/v1/public/appointments'

function pick(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key]
    if (value != null && value !== '') return value
  }
  return undefined
}

function normalizeApiTime(time) {
  if (time == null || time === '') return ''
  const value = String(time).trim()
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value
  if (/^\d{2}:\d{2}$/.test(value)) return `${value}:00`
  return value
}

export function normalizePatientPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.length >= 10 ? digits.slice(-10) : digits
}

export function resolvePatientPhoneDigits(profile, authUser) {
  return normalizePatientPhone(profile?.mobile ?? authUser?.mobile ?? authUser?.phone ?? '')
}

export function mapAppointmentFromApi(item = {}) {
  const fee = Number(pick(item, 'consultationFee', 'fee')) || 0

  return {
    id: String(pick(item, 'appointmentId', 'id') ?? ''),
    code: pick(item, 'appointmentCode', 'code') ?? '',
    doctorName: pick(item, 'doctorFullName', 'doctorName', 'fullName') ?? '',
    specialty: pick(item, 'specialtyName', 'specialty') ?? '',
    date: pick(item, 'appointmentDate', 'consultationDate') ?? '',
    startTime: pick(item, 'startTime') ?? '',
    endTime: pick(item, 'endTime') ?? '',
    timeRange: pick(item, 'formattedTimeRange', 'timeRange') ?? '',
    patientName: pick(item, 'patientName') ?? '',
    patientPhone: pick(item, 'patientPhone') ?? '',
    consultationMode: pick(item, 'consultationMode') ?? '',
    fee,
    feeLabel: pick(item, 'consultationFeeLabel') ?? (fee > 0 ? `₹${fee}` : ''),
    status: String(pick(item, 'appointmentStatus', 'status') ?? '').toUpperCase(),
    statusLabel: pick(item, 'appointmentStatusLabel', 'statusLabel') ?? '',
    cancellationReason: pick(item, 'cancellationReason') ?? '',
  }
}

export function isAppointmentCancellable(appointment = {}) {
  const status = String(appointment.status ?? '').toUpperCase()
  return ['CONFIRMED', 'SCHEDULED', 'PENDING', 'BOOKED'].includes(status)
}

export function buildAppointmentPayload({
  doctorId,
  consultationDate,
  slot,
  patientName,
  patientPhone,
  patientEmail,
  consultationMode = 'IN_CLINIC',
  bookingNotes = '',
}) {
  return {
    doctorId: Number(doctorId),
    consultationDate,
    startTime: normalizeApiTime(slot?.startTime),
    endTime: normalizeApiTime(slot?.endTime),
    patientName: patientName.trim(),
    patientPhone: normalizePatientPhone(patientPhone),
    patientEmail: patientEmail.trim(),
    consultationMode,
    bookingNotes: bookingNotes.trim() || undefined,
  }
}

function extractAppointmentList(payload) {
  const data = payload?.data ?? payload
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.appointments)) return data.appointments
  return []
}

export async function fetchPatientAppointments(patientPhone) {
  const phone = normalizePatientPhone(patientPhone)
  if (!phone) return []

  const payload = await authFetch(
    `${BASE}?patientPhone=${encodeURIComponent(phone)}`,
    {},
    DOCTOR_API_BASE,
  )

  return extractAppointmentList(payload)
    .map(mapAppointmentFromApi)
    .filter((appointment) => appointment.id || appointment.code)
}

export async function bookAppointment(payload) {
  return authFetch(
    BASE,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    DOCTOR_API_BASE,
  )
}

export async function cancelAppointment(appointmentCode, { patientPhone, cancellationReason }) {
  return authFetch(
    `${BASE}/${encodeURIComponent(appointmentCode)}/cancel`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        patientPhone: normalizePatientPhone(patientPhone),
        cancellationReason: String(cancellationReason ?? '').trim(),
      }),
    },
    DOCTOR_API_BASE,
  )
}
