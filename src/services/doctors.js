import { authFetch, DOCTOR_API_BASE } from './api'

const BASE = '/api/v1/public/doctors'

/** Collapse duplicate in-flight GETs (e.g. React Strict Mode double-mount). */
const inFlightGets = new Map()

function pick(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key]
    if (value != null && value !== '') return value
  }
  return undefined
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload
  const data = payload?.data ?? payload
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.doctors)) return data.doctors
  return []
}

function parseTimingsSummaryToSlots(summary) {
  if (summary == null || summary === '') return []

  if (Array.isArray(summary)) {
    return summary
      .map((entry, index) => ({
        id: `summary-${index}`,
        time: String(entry).trim(),
        available: true,
      }))
      .filter((slot) => slot.time)
      .slice(0, 4)
  }

  const text = String(summary).trim()
  if (!text) return []

  const segments = text.includes('\n')
    ? text.split('\n')
    : text.split(/\s*\|\s*|[,;]\s*/)

  const items = segments.map((part) => part.trim()).filter(Boolean)
  const normalized = items.length ? items : [text]

  return normalized.slice(0, 4).map((time, index) => ({
    id: `summary-${index}-${time}`,
    time,
    available: true,
  }))
}

export function mapDoctorSlotsFromApi(item = {}) {
  const rawSlots = pick(item, 'slots', 'availableSlots', 'consultationSlots', 'todaySlots')

  if (Array.isArray(rawSlots) && rawSlots.length) {
    return rawSlots
      .map(mapSlotFromApi)
      .filter((slot) => slot.time && slot.available !== false)
      .slice(0, 4)
  }

  return parseTimingsSummaryToSlots(
    pick(item, 'consultationTimingsSummary', 'consultationTimingSummary', 'timingsSummary'),
  )
}

export function mapDoctorFromApi(item = {}) {
  const reviewCount = Number(pick(item, 'reviewCount', 'totalReviews', 'reviews', 'ratingCount')) || 0
  const rating = Number(pick(item, 'rating', 'averageRating', 'avgRating')) || 0
  const fee = Number(pick(item, 'consultationFee', 'fee', 'price', 'consultationPrice')) || 0
  const availabilityLabel = pick(item, 'availabilityLabel', 'availability', 'availabilityStatus', 'status')

  return {
    id: String(pick(item, 'id', 'doctorId') ?? ''),
    name: pick(item, 'name', 'doctorName', 'fullName') ?? 'Doctor',
    specialty: pick(item, 'specialty', 'specialization', 'specialtyName', 'speciality') ?? '',
    specialtyId: pick(item, 'specialtyId', 'specializationId'),
    qualifications:
      pick(item, 'qualifications', 'qualificationsSummary', 'degree', 'credentials', 'qualification') ?? '',
    rating,
    reviewCount,
    experienceYears: pick(item, 'yearsOfExperience', 'experienceYears', 'experience', 'experienceInYears'),
    location: pick(item, 'location', 'clinicName', 'storeName', 'clinic', 'address', 'city') ?? '',
    fee,
    imageUrl:
      pick(item, 'imageUrl', 'photoUrl', 'profileImage', 'profileImageUrl', 'avatar', 'profilePhoto') ?? '',
    availability: availabilityLabel ?? '',
    availabilityLabel: availabilityLabel ?? '',
    availableToday: item.availableToday ?? item.isAvailableToday ?? true,
    bio: pick(item, 'bio', 'about', 'description', 'profileSummary') ?? '',
    languages: Array.isArray(item.languages) ? item.languages : [],
    consultationTimingsSummary:
      pick(item, 'consultationTimingsSummary', 'consultationTimingSummary', 'timingsSummary') ?? '',
    slots: mapDoctorSlotsFromApi(item),
  }
}

export function mapSlotFromApi(item = {}) {
  return {
    id: String(pick(item, 'id', 'slotId') ?? pick(item, 'time', 'startTime', 'slotTime') ?? ''),
    time: pick(item, 'time', 'startTime', 'slotTime', 'label') ?? '',
    available: item.available !== false && item.isAvailable !== false,
  }
}

function buildQuery(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return
    search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

async function doctorGet(path) {
  const existing = inFlightGets.get(path)
  if (existing) return existing

  const request = authFetch(path, {}, DOCTOR_API_BASE).finally(() => {
    inFlightGets.delete(path)
  })

  inFlightGets.set(path, request)
  return request
}

export async function fetchDoctors({ searchKeyword, specialtyId, city, page, size } = {}) {
  const payload = await doctorGet(
    `${BASE}${buildQuery({
      searchKeyword,
      specialtyId,
      city,
      page,
      size,
    })}`,
  )
  return extractList(payload).map(mapDoctorFromApi).filter((doctor) => doctor.id)
}

export async function fetchTopDoctorsNearYou({ limit = 50 } = {}) {
  const payload = await doctorGet(`${BASE}/top-near-you${buildQuery({ limit })}`)
  return extractList(payload).map(mapDoctorFromApi).filter((doctor) => doctor.id)
}

export async function fetchPopularDoctors({ limit = 50 } = {}) {
  const payload = await doctorGet(`${BASE}/popular${buildQuery({ limit })}`)
  return extractList(payload).map(mapDoctorFromApi).filter((doctor) => doctor.id)
}

export async function fetchDoctorById(id) {
  const payload = await doctorGet(`${BASE}/${encodeURIComponent(id)}`)
  const raw = payload?.data ?? payload?.doctor ?? payload
  return mapDoctorFromApi(raw)
}

export async function fetchDoctorAvailableSlots(id, consultationDate = 'today') {
  const payload = await doctorGet(
    `${BASE}/${encodeURIComponent(id)}/available-slots${buildQuery({ consultationDate })}`,
  )
  const data = payload?.data ?? payload
  const rawSlots = data?.slots ?? payload?.slots

  if (Array.isArray(rawSlots)) {
    return rawSlots.map(mapSlotFromApi).filter((slot) => slot.time)
  }

  const list = extractList(payload)
  return list.map(mapSlotFromApi).filter((slot) => slot.time)
}
