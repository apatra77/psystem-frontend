import { authFetch, DOCTOR_API_BASE } from './api'

const BASE = '/api/v1/public/appointments'

function normalizeApiTime(time) {
  if (time == null || time === '') return ''
  const value = String(time).trim()
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value
  if (/^\d{2}:\d{2}$/.test(value)) return `${value}:00`
  return value
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
    patientPhone: String(patientPhone ?? '').replace(/\D/g, ''),
    patientEmail: patientEmail.trim(),
    consultationMode,
    bookingNotes: bookingNotes.trim() || undefined,
  }
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
