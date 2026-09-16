import { authFetch, DOCTOR_API_BASE } from './api'
import { mapAppointmentFromApi } from './appointments'

const BASE = '/api/v1/admin/appointments/bookings'

export function formatApiDateInput(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayApiDate() {
  return formatApiDateInput(new Date())
}

function extractBookingPage(payload) {
  const data = payload?.data ?? payload

  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: 1,
      page: 0,
    }
  }

  const content = Array.isArray(data?.content)
    ? data.content
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.bookings)
        ? data.bookings
        : Array.isArray(data?.appointments)
          ? data.appointments
          : []

  return {
    content,
    totalElements: Number(data?.totalElements ?? data?.total ?? content.length) || 0,
    totalPages: Math.max(1, Number(data?.totalPages ?? data?.pages) || 1),
    page: Number(data?.number ?? data?.page) || 0,
  }
}

export async function fetchAdminConsultationBookings({
  fromDate = todayApiDate(),
  toDate = fromDate,
  page = 0,
  size = 10,
} = {}) {
  const params = new URLSearchParams()
  params.set('fromDate', fromDate)
  params.set('toDate', toDate)
  params.set('page', String(page))
  params.set('size', String(size))

  const payload = await authFetch(`${BASE}?${params.toString()}`, {}, DOCTOR_API_BASE)
  const parsed = extractBookingPage(payload)

  return {
    bookings: parsed.content
      .map(mapAppointmentFromApi)
      .filter((booking) => booking.id || booking.code),
    totalElements: parsed.totalElements,
    totalPages: parsed.totalPages,
    page: parsed.page,
  }
}
