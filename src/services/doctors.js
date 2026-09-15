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

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

function formatDayLabel(day) {
  const raw = String(day ?? '').trim()
  if (!raw) return ''
  const lower = raw.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

function resolveDoctorImageUrl(url) {
  if (!url) return ''
  const value = String(url).trim()
  if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }
  return `${DOCTOR_API_BASE}${value.startsWith('/') ? value : `/${value}`}`
}

function mapQualificationsList(raw) {
  if (!Array.isArray(raw)) return []

  return raw
    .map((item, index) => ({
      id: String(pick(item, 'qualificationId', 'id') ?? index),
      name: pick(item, 'qualificationName', 'name') ?? '',
      institution: pick(item, 'institutionName', 'institution') ?? '',
      year: pick(item, 'yearCompleted', 'year'),
      displayOrder: Number(pick(item, 'displayOrder')) || index + 1,
    }))
    .filter((item) => item.name)
    .sort((a, b) => a.displayOrder - b.displayOrder)
}

function formatSlotTimeRange(slot = {}) {
  const formatted = pick(slot, 'formattedTimeRange', 'timeRange', 'label')
  if (formatted) return formatted

  const start = pick(slot, 'startTime', 'start')
  const end = pick(slot, 'endTime', 'end')
  if (start && end) return `${start} – ${end}`
  return pick(slot, 'time', 'slotTime') ?? ''
}

function mapWeeklySchedulesFromApi(raw) {
  if (!Array.isArray(raw)) return []

  return raw
    .map((day) => {
      const dayOfWeek = pick(day, 'dayOfWeek', 'day') ?? ''
      const slotsRaw = day.consultationSlots ?? day.slots ?? day.timeSlots ?? []

      return {
        dayOfWeek,
        dayLabel: formatDayLabel(dayOfWeek),
        isAvailable: Boolean(day.isAvailable ?? day.enabled ?? slotsRaw.length),
        slots: (Array.isArray(slotsRaw) ? slotsRaw : [])
          .map((slot, index) => ({
            id: String(pick(slot, 'consultationSlotId', 'slotId', 'id') ?? `${dayOfWeek}-${index}`),
            time: formatSlotTimeRange(slot),
          }))
          .filter((slot) => slot.time),
      }
    })
    .sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek))
}

function mapStoreLocationFromApi(store) {
  if (!store || typeof store !== 'object') return null

  const addressParts = [
    pick(store, 'addressLine', 'address'),
    store.city,
    store.state,
    pick(store, 'pinCode', 'pincode', 'zip'),
  ].filter(Boolean)

  return {
    id: pick(store, 'storeLocationId', 'id'),
    name: pick(store, 'storeName', 'name') ?? '',
    code: pick(store, 'storeCode', 'code') ?? '',
    addressLine: pick(store, 'addressLine', 'address') ?? '',
    city: store.city ?? '',
    state: store.state ?? '',
    pinCode: pick(store, 'pinCode', 'pincode', 'zip') ?? '',
    phone: pick(store, 'phoneNumber', 'phone') ?? '',
    isOpen: store.isStoreOpen ?? store.isOpen,
    fullAddress: addressParts.join(', '),
  }
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

export function isDoctorAvailableToday(doctor = {}) {
  const status = String(doctor.availabilityStatus ?? '').toUpperCase()
  if (status === 'AVAILABLE_NOW' || status === 'AVAILABLE_TODAY') return true
  if (
    status === 'NOT_AVAILABLE' ||
    status === 'AVAILABLE_TOMORROW' ||
    status === 'ON_LEAVE' ||
    status === 'INACTIVE'
  ) {
    return false
  }

  const label = String(doctor.availabilityLabel ?? doctor.availability ?? '').toLowerCase()
  if (/not available|on leave|tomorrow|unavailable/.test(label)) return false
  if (/available now|available today/.test(label)) return true

  if (doctor.availableToday === true) return true
  if (doctor.availableToday === false) return false

  return false
}

function deriveAvailableToday(item, availabilityStatus, availabilityLabel) {
  return isDoctorAvailableToday({
    availabilityStatus,
    availabilityLabel,
    availability: availabilityLabel,
    availableToday: item.availableToday ?? item.isAvailableToday,
  })
}

export function mapDoctorFromApi(item = {}) {
  const reviewCount = Number(pick(item, 'reviewCount', 'totalReviews', 'reviews', 'ratingCount')) || 0
  const rating = Number(pick(item, 'rating', 'averageRating', 'avgRating')) || 0
  const fee = Number(pick(item, 'consultationFee', 'fee', 'price', 'consultationPrice')) || 0
  const availabilityStatus = pick(item, 'availabilityStatus') ?? ''
  const availabilityLabel =
    pick(item, 'availabilityLabel', 'availability') ??
    availabilityStatus ??
    pick(item, 'status') ??
    ''
  const specialtyObj = item.medicalSpecialty ?? item.specialty
  const specialtyName =
    typeof specialtyObj === 'object' && specialtyObj != null
      ? pick(specialtyObj, 'specialtyName', 'name', 'label')
      : pick(item, 'specialty', 'specialization', 'specialtyName', 'speciality')
  const specialtyId =
    typeof specialtyObj === 'object' && specialtyObj != null
      ? pick(specialtyObj, 'specialtyId', 'id')
      : pick(item, 'specialtyId', 'specializationId')
  const storeLocation = mapStoreLocationFromApi(item.storeLocation ?? item.store)
  const qualificationList = mapQualificationsList(item.qualifications)
  const qualificationsSummary = pick(
    item,
    'qualificationsSummary',
    'qualification',
    'degree',
    'credentials',
  )
  const qualificationsText =
    qualificationList.length > 0
      ? qualificationList.map((entry) => entry.name).join(', ')
      : typeof item.qualifications === 'string'
        ? item.qualifications
        : (qualificationsSummary ?? '')
  const weeklySchedules = mapWeeklySchedulesFromApi(
    item.weeklySchedules ?? item.weeklySchedule ?? item.schedule,
  )
  const rawImage =
    pick(item, 'profileImageUrl', 'imageUrl', 'photoUrl', 'profileImage', 'avatar', 'profilePhoto') ??
    (item.profileImage && item.profileImageContentType
      ? `data:${item.profileImageContentType};base64,${item.profileImage}`
      : '')

  return {
    id: String(pick(item, 'id', 'doctorId') ?? ''),
    doctorCode: pick(item, 'doctorCode', 'code') ?? '',
    firstName: pick(item, 'firstName') ?? '',
    lastName: pick(item, 'lastName') ?? '',
    name:
      pick(item, 'name', 'doctorName', 'fullName') ??
      ([pick(item, 'firstName'), pick(item, 'lastName')].filter(Boolean).join(' ').trim() || 'Doctor'),
    email: pick(item, 'email', 'emailAddress') ?? '',
    phoneNumber: pick(item, 'phoneNumber', 'mobileNumber', 'phone', 'mobile') ?? '',
    specialty: specialtyName ?? '',
    specialtyId,
    specialtyDescription:
      typeof specialtyObj === 'object' && specialtyObj != null ? pick(specialtyObj, 'description') ?? '' : '',
    qualifications: qualificationsText,
    qualificationList,
    rating,
    reviewCount,
    experienceYears: pick(item, 'yearsOfExperience', 'experienceYears', 'experience', 'experienceInYears'),
    experienceLabel: pick(item, 'experienceLabel') ?? '',
    location:
      storeLocation?.name ??
      pick(item, 'location', 'clinicName', 'storeName', 'clinic', 'address', 'city') ??
      '',
    storeLocation,
    fee,
    consultationFeeLabel: pick(item, 'consultationFeeLabel') ?? '',
    imageUrl: resolveDoctorImageUrl(rawImage),
    doctorStatus: pick(item, 'doctorStatus', 'status') ?? '',
    availabilityStatus,
    availability: availabilityLabel ?? '',
    availabilityLabel: availabilityLabel ?? '',
    availableToday: deriveAvailableToday(item, availabilityStatus, availabilityLabel),
    bio: pick(item, 'profileSummary', 'bio', 'about', 'description') ?? '',
    languages: Array.isArray(item.languages) ? item.languages : [],
    consultationTimingsSummary:
      pick(item, 'consultationTimingsSummary', 'consultationTimingSummary', 'timingsSummary') ?? '',
    weeklySchedules,
    slots: mapDoctorSlotsFromApi(item),
    createdAt: pick(item, 'createdAt') ?? null,
    updatedAt: pick(item, 'updatedAt') ?? null,
  }
}

function normalizeApiTime(time) {
  if (time == null || time === '') return ''
  const value = String(time).trim()
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value
  if (/^\d{2}:\d{2}$/.test(value)) return `${value}:00`
  return value
}

export function mapSlotFromApi(item = {}) {
  const startTime = normalizeApiTime(pick(item, 'startTime', 'start'))
  const endTime = normalizeApiTime(pick(item, 'endTime', 'end'))
  const slotLabel = pick(item, 'slotLabel', 'label')

  return {
    id: String(
      pick(item, 'consultationSlotId', 'id', 'slotId') ??
        (startTime && endTime ? `${startTime}-${endTime}` : pick(item, 'time', 'slotTime')) ??
        '',
    ),
    time: slotLabel || formatSlotTimeRange(item),
    startTime,
    endTime,
    available:
      item.isBookable !== false && item.available !== false && item.isAvailable !== false,
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

export async function fetchDoctors({ searchKeyword, specialtyId, page, size } = {}) {
  const payload = await doctorGet(
    `${BASE}${buildQuery({
      searchKeyword,
      specialtyId,
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

  const slots = Array.isArray(rawSlots)
    ? rawSlots.map(mapSlotFromApi).filter((slot) => slot.time)
    : extractList(payload).map(mapSlotFromApi).filter((slot) => slot.time)

  return {
    consultationDate: pick(data, 'consultationDate') ?? consultationDate,
    slots,
  }
}
