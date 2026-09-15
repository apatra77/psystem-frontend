import { colors } from '@/theme/colors'

export const DOCTORS_PAGE_SIZE = 5

export const DOCTOR_STATUS_FILTERS = [
  { id: 'active', label: 'Available' },
  { id: 'on_leave', label: 'On Leave' },
]

export function doctorInitials(name = '') {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function formatConsultationTimings(schedule) {
  if (!schedule) return []
  const slots = []
  Object.values(schedule).forEach((day) => {
    if (!day?.enabled) return
    day.slots?.forEach((slot) => {
      if (slot.start && slot.end) slots.push(`${slot.start} – ${slot.end}`)
    })
  })
  return [...new Set(slots)].slice(0, 4)
}

export function parseConsultationTimingsSummary(summary) {
  if (summary == null || summary === '') return []

  if (Array.isArray(summary)) {
    return summary.map((item) => String(item).trim()).filter(Boolean)
  }

  const text = String(summary).trim()
  if (!text) return []

  if (text.includes('\n')) {
    return text.split('\n').map((line) => line.trim()).filter(Boolean)
  }

  return [text]
}

export function getDoctorTimingRows(doctor) {
  const summaryRows = parseConsultationTimingsSummary(doctor?.consultationTimingsSummary)
  if (summaryRows.length) return summaryRows

  const schedule = doctor?.schedule ?? doctor
  const rows = []
  Object.values(schedule ?? {}).forEach((day) => {
    if (!day?.enabled) return
    day.slots?.forEach((slot) => {
      if (slot.start && slot.end) rows.push(`${slot.start} – ${slot.end}`)
    })
  })
  return rows.length ? rows : ['—']
}

export function statusMeta(status) {
  switch (status) {
    case 'active':
      return { label: 'Available', color: colors.accentText, bg: colors.accent, border: 'rgba(64,222,170,0.5)' }
    case 'on_leave':
      return { label: 'On Leave', color: '#2a1800', bg: colors.gold, border: 'rgba(255,213,143,0.5)' }
    default:
      return { label: 'Inactive', color: colors.textDim, bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' }
  }
}

export function buildPageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
  if (currentPage <= 3) return [1, 2, 3, '…', totalPages]
  if (currentPage >= totalPages - 2) return [1, '…', totalPages - 2, totalPages - 1, totalPages]
  return [1, '…', currentPage, '…', totalPages]
}

function formatTimeLabel(hour24, minute) {
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 || 12
  const mins = String(minute).padStart(2, '0')
  return `${String(hour12).padStart(2, '0')}:${mins} ${period}`
}

export const TIME_SLOT_OPTIONS = (() => {
  const options = []
  for (let hour = 6; hour <= 22; hour += 1) {
    for (const minute of [0, 30]) {
      options.push({
        value: formatTimeLabel(hour, minute),
        label: formatTimeLabel(hour, minute),
      })
    }
  }
  return options
})()

export const CONSULTATION_TYPE_OPTIONS = [
  { id: 'online', label: 'Online' },
  { id: 'in_clinic', label: 'In-clinic' },
  { id: 'both', label: 'Both' },
]

export function cloneSchedule(schedule) {
  if (!schedule) return {}
  return Object.fromEntries(
    Object.entries(schedule).map(([key, day]) => [
      key,
      {
        enabled: Boolean(day?.enabled),
        slots: (day?.slots ?? []).map((slot) => ({ ...slot })),
      },
    ]),
  )
}

export function filterDoctors(doctors, { search, specialtyId, status, storeId }) {
  const q = search.trim().toLowerCase()

  return doctors.filter((doctor) => {
    if (q) {
      const haystack = `${doctor.name} ${doctor.specialty} ${doctor.qualifications} ${doctor.store} ${doctor.email}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    if (specialtyId !== 'all' && String(doctor.specialtyId) !== String(specialtyId)) return false
    if (status !== 'all' && doctor.status !== status) return false
    if (storeId !== 'all' && doctor.storeId !== storeId) return false
    return true
  })
}
