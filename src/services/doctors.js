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

export function mapDoctorFromApi(item = {}) {
  const reviewCount = Number(pick(item, 'reviewCount', 'totalReviews', 'reviews', 'ratingCount')) || 0
  const rating = Number(pick(item, 'rating', 'averageRating', 'avgRating')) || 0
  const fee = Number(pick(item, 'consultationFee', 'fee', 'price', 'consultationPrice')) || 0

  return {
    id: String(pick(item, 'id', 'doctorId') ?? ''),
    name: pick(item, 'name', 'doctorName', 'fullName') ?? 'Doctor',
    specialty: pick(item, 'specialty', 'specialization', 'specialtyName', 'speciality') ?? '',
    specialtyId: pick(item, 'specialtyId', 'specializationId'),
    qualifications: pick(item, 'qualifications', 'degree', 'credentials', 'qualification') ?? '',
    rating,
    reviewCount,
    experienceYears: pick(item, 'experienceYears', 'experience', 'yearsOfExperience', 'experienceInYears'),
    location: pick(item, 'location', 'clinicName', 'storeName', 'clinic', 'address') ?? '',
    fee,
    imageUrl: pick(item, 'imageUrl', 'photoUrl', 'profileImage', 'avatar', 'profilePhoto') ?? '',
    availability: pick(item, 'availability', 'availabilityStatus', 'availabilityLabel', 'status') ?? '',
    availableToday: item.availableToday ?? item.isAvailableToday ?? true,
    bio: pick(item, 'bio', 'about', 'description') ?? '',
    languages: Array.isArray(item.languages) ? item.languages : [],
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

export async function fetchTopDoctorsNearYou({ city, limit = 50 } = {}) {
  const payload = await doctorGet(`${BASE}/top-near-you${buildQuery({ city, limit })}`)
  return extractList(payload).map(mapDoctorFromApi).filter((doctor) => doctor.id)
}

export async function fetchPopularDoctors({ city, limit = 3 } = {}) {
  const payload = await doctorGet(`${BASE}/popular${buildQuery({ city, limit })}`)
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
  const list = extractList(payload)
  if (list.length === 0 && payload?.slots) {
    return extractList(payload.slots).map(mapSlotFromApi)
  }
  return list.map(mapSlotFromApi).filter((slot) => slot.time)
}
