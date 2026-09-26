import { authFetch, DOCTOR_API_BASE } from './api'
import { resolveDoctorImageUrl } from './doctorImages'

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

export function isDoctorAvailableTomorrow(doctor = {}) {
  const status = String(doctor.availabilityStatus ?? '').toUpperCase()
  if (status === 'AVAILABLE_TOMORROW') return true

  const label = String(doctor.availabilityLabel ?? doctor.availability ?? '').toLowerCase()
  return /available tomorrow/.test(label)
}

const MONTH_NAME_TO_INDEX = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

function parseIsoDateFromAvailabilityLabel(label) {
  const text = String(label ?? '').trim()
  const match = text.match(/\b([A-Za-z]{3}),?\s+(\d{1,2})\s+([A-Za-z]{3})(?:\s+(\d{4}))?/i)
  if (!match) return ''

  const monthIndex = MONTH_NAME_TO_INDEX[match[3].slice(0, 3).toLowerCase()]
  if (monthIndex == null) return ''

  const day = Number(match[2])
  const year = match[4] ? Number(match[4]) : new Date().getFullYear()
  if (!day || !year) return ''

  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`
}

/** Next bookable calendar day from list API (slot object or "Next: …" label). */
export function getDoctorNextConsultationDateIso(doctor = {}) {
  const fromSlot = doctor.nextAvailableSlot?.consultationDate
  if (fromSlot && /^\d{4}-\d{2}-\d{2}$/.test(String(fromSlot))) {
    return String(fromSlot)
  }

  return parseIsoDateFromAvailabilityLabel(doctor.availabilityLabelRaw)
}

function isSameLocalCalendarDay(isoDate, dayOffset = 0) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(String(isoDate))) return false

  const [year, month, day] = String(isoDate).split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const ref = new Date()
  ref.setHours(0, 0, 0, 0)
  ref.setDate(ref.getDate() + dayOffset)

  return (
    target.getFullYear() === ref.getFullYear() &&
    target.getMonth() === ref.getMonth() &&
    target.getDate() === ref.getDate()
  )
}

export function hasDoctorFutureBookableSlot(doctor = {}) {
  if (doctor.nextAvailableSlot?.isBookable === false) return false

  const iso = getDoctorNextConsultationDateIso(doctor)
  if (iso) return true

  const raw = String(doctor.availabilityLabelRaw ?? '').trim()
  if (!raw || /^not available$/i.test(raw)) return false

  return Boolean(parseAvailabilityLabelToShortDate(raw))
}

/** Consult is allowed for today, tomorrow, or the next listed slot day. */
export function isDoctorBookable(doctor = {}) {
  const status = String(doctor.availabilityStatus ?? '').toUpperCase()
  if (status === 'ON_LEAVE' || status === 'INACTIVE') return false
  if (status === 'NOT_AVAILABLE') return hasDoctorFutureBookableSlot(doctor)
  if (
    status === 'AVAILABLE_NOW' ||
    status === 'AVAILABLE_TODAY' ||
    status === 'AVAILABLE_TOMORROW'
  ) {
    return true
  }

  const label = String(
    doctor.availabilityLabelRaw ?? doctor.availabilityLabel ?? doctor.availability ?? '',
  ).toLowerCase()
  if (/not available|on leave|unavailable/.test(label)) return false
  if (/available now|available today|available tomorrow/.test(label)) return true

  return isDoctorAvailableToday(doctor) || isDoctorAvailableTomorrow(doctor)
}

export function getDoctorConsultationDateParam(doctor = {}) {
  if (isDoctorAvailableToday(doctor)) return 'today'
  if (isDoctorAvailableTomorrow(doctor)) return 'tomorrow'

  const iso = getDoctorNextConsultationDateIso(doctor)
  if (iso) {
    if (isSameLocalCalendarDay(iso, 0)) return 'today'
    if (isSameLocalCalendarDay(iso, 1)) return 'tomorrow'
    return iso
  }

  return 'today'
}

function capitalizeWord(word = '') {
  const raw = String(word).trim()
  if (!raw) return ''
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

/** "28 Sep, Mon" — date + weekday only (no time). */
export function formatDoctorNextAvailableShort(slot) {
  if (!slot || typeof slot !== 'object') return ''

  const iso = pick(slot, 'consultationDate', 'date')
  if (iso && /^\d{4}-\d{2}-\d{2}$/.test(String(iso))) {
    const [year, monthIndex, day] = String(iso).split('-').map(Number)
    const date = new Date(year, monthIndex - 1, day)
    if (!Number.isNaN(date.getTime())) {
      const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' })
      const month = date.toLocaleDateString('en-GB', { month: 'short' })
      return `${day} ${month}, ${weekday}`
    }
  }

  const formatted = String(pick(slot, 'formattedDateLabel') ?? '').trim()
  const match = formatted.match(/\b([A-Za-z]{3}),?\s+(\d{1,2})\s+([A-Za-z]{3})/i)
  if (match) {
    return `${match[2]} ${capitalizeWord(match[3])}, ${capitalizeWord(match[1])}`
  }

  return ''
}

function parseAvailabilityLabelToShortDate(label) {
  const text = String(label ?? '').trim()
  if (!text) return ''

  const match = text.match(/\b([A-Za-z]{3}),?\s+(\d{1,2})\s+([A-Za-z]{3})(?:\s+\d{4})?/i)
  if (!match) return ''

  return `${match[2]} ${capitalizeWord(match[3])}, ${capitalizeWord(match[1])}`
}

/** User-facing availability line for list cards (no slot times). */
export function buildDoctorAvailabilityDisplay(availabilityStatus, nextAvailableSlot, rawLabel = '') {
  const status = String(availabilityStatus ?? '').toUpperCase()
  const raw = String(rawLabel ?? '').trim()
  const shortDate = formatDoctorNextAvailableShort(nextAvailableSlot) || parseAvailabilityLabelToShortDate(raw)

  if (status === 'ON_LEAVE') return raw || 'On leave'
  if (status === 'INACTIVE') return raw || 'Inactive'

  if (status === 'AVAILABLE_NOW') return 'Available now'
  if (status === 'AVAILABLE_TODAY') return 'Available today'
  if (status === 'AVAILABLE_TOMORROW') return 'Available tomorrow'

  if (/^not available$/i.test(raw) && !shortDate) return 'Not available'

  if (shortDate) return `Available on ${shortDate}`

  if (/available tomorrow/i.test(raw)) return 'Available tomorrow'
  if (/available now|available today/i.test(raw)) return 'Available today'
  if (/^not available$/i.test(raw)) return 'Not available'

  return raw || 'Not available'
}

function mapNextAvailableSlotFromApi(raw) {
  if (!raw || typeof raw !== 'object') return null

  return {
    consultationDate: pick(raw, 'consultationDate', 'date') ?? '',
    formattedDateLabel: pick(raw, 'formattedDateLabel') ?? '',
    startTime: normalizeApiTime(pick(raw, 'startTime', 'start')),
    endTime: normalizeApiTime(pick(raw, 'endTime', 'end')),
    slotLabel: pick(raw, 'slotLabel', 'label') ?? '',
    isBookable: raw.isBookable !== false,
  }
}

export function getDoctorBookButtonLabel(doctor = {}) {
  if (!isDoctorBookable(doctor)) return 'Not available'

  if (isDoctorAvailableToday(doctor)) return 'Book for today'
  if (isDoctorAvailableTomorrow(doctor)) return 'Book for tomorrow'

  const iso = getDoctorNextConsultationDateIso(doctor)
  if (iso) {
    if (isSameLocalCalendarDay(iso, 0)) return 'Book for today'
    if (isSameLocalCalendarDay(iso, 1)) return 'Book for tomorrow'
    const shortDate = formatDoctorNextAvailableShort({ consultationDate: iso })
    const compact = shortDate.split(',')[0]?.trim()
    if (compact) return `Book for ${compact}`
  }

  const shortDate = formatDoctorNextAvailableShort(doctor.nextAvailableSlot)
  if (shortDate) {
    const compact = shortDate.split(',')[0]?.trim()
    return compact ? `Book for ${compact}` : 'Book consultation'
  }

  return 'Book consultation'
}

function deriveAvailableToday(item, availabilityStatus, availabilityLabelRaw) {
  return isDoctorAvailableToday({
    availabilityStatus,
    availabilityLabel: availabilityLabelRaw,
    availability: availabilityLabelRaw,
    availableToday: item.availableToday ?? item.isAvailableToday,
  })
}

export function mapDoctorFromApi(item = {}) {
  const reviewCount = Number(pick(item, 'reviewCount', 'totalReviews', 'reviews', 'ratingCount')) || 0
  const rating = Number(pick(item, 'rating', 'averageRating', 'avgRating')) || 0
  const fee = Number(pick(item, 'consultationFee', 'fee', 'price', 'consultationPrice')) || 0
  const availabilityStatus = pick(item, 'availabilityStatus') ?? ''
  const availabilityLabelRaw =
    pick(item, 'availabilityLabel', 'availability') ??
    availabilityStatus ??
    pick(item, 'status') ??
    ''
  const nextAvailableSlot = mapNextAvailableSlotFromApi(item.nextAvailableSlot)
  const availabilityDisplay = buildDoctorAvailabilityDisplay(
    availabilityStatus,
    nextAvailableSlot,
    availabilityLabelRaw,
  )
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
    availabilityLabelRaw: availabilityLabelRaw ?? '',
    availability: availabilityDisplay,
    availabilityLabel: availabilityDisplay,
    nextAvailableSlot,
    availableToday: deriveAvailableToday(item, availabilityStatus, availabilityLabelRaw),
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
