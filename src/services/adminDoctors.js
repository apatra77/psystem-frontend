import { WEEK_DAYS, createDefaultSchedule } from '@/modules/owner/data/doctorsData'
import {
  clearMedicalSpecialtiesCache,
  createMedicalSpecialty,
  fetchMedicalSpecialties,
  mergeMedicalSpecialtiesFromItems,
} from './medicalSpecialties'
import {
  authFetch,
  authHeaders,
  DOCTOR_API_BASE,
  getErrorMessage,
  parseJsonResponse,
} from './api'
import { notifyUnauthorized } from '@/shared/api/tokenBridge'

const BASE = '/api/v1/admin/doctors'

const DAY_KEY_TO_API = {
  monday: 'MONDAY',
  tuesday: 'TUESDAY',
  wednesday: 'WEDNESDAY',
  thursday: 'THURSDAY',
  friday: 'FRIDAY',
  saturday: 'SATURDAY',
  sunday: 'SUNDAY',
}

const DAY_API_TO_KEY = Object.fromEntries(
  Object.entries(DAY_KEY_TO_API).map(([key, value]) => [value, key]),
)

const STATUS_TO_UI = {
  ACTIVE: 'active',
  AVAILABLE: 'active',
  ON_LEAVE: 'on_leave',
  INACTIVE: 'inactive',
}

const STATUS_TO_API = {
  active: 'ACTIVE',
  on_leave: 'ON_LEAVE',
  inactive: 'INACTIVE',
}

const CONSULTATION_TO_UI = {
  ONLINE: 'online',
  IN_CLINIC: 'in_clinic',
  INCLINIC: 'in_clinic',
  BOTH: 'both',
}

const CONSULTATION_TO_API = {
  online: 'ONLINE',
  in_clinic: 'IN_CLINIC',
  both: 'BOTH',
}

let inFlightSummaryRequest = null
const inFlightDoctorRequests = new Map()
const inFlightListRequests = new Map()

function pick(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key]
    if (value != null && value !== '') return value
  }
  return undefined
}

function normalizeStatus(value) {
  const raw = String(value ?? 'ACTIVE').trim().toUpperCase().replace(/\s+/g, '_')
  if (raw === 'ONLEAVE') return 'on_leave'
  return STATUS_TO_UI[raw] ?? 'inactive'
}

function normalizeConsultationType(value) {
  const raw = String(value ?? 'BOTH').trim().toUpperCase().replace(/-/g, '_')
  return CONSULTATION_TO_UI[raw] ?? 'both'
}

function parseTimeParts(timeStr) {
  const trimmed = String(timeStr ?? '').trim()
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (match12) {
    let hour = Number(match12[1]) % 12
    if (match12[3].toUpperCase() === 'PM') hour += 12
    return { hour, minute: Number(match12[2]) }
  }

  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (match24) {
    return { hour: Number(match24[1]), minute: Number(match24[2]) }
  }

  return null
}

function formatUiTime(timeStr) {
  const parts = parseTimeParts(timeStr)
  if (!parts) return String(timeStr ?? '')
  const period = parts.hour >= 12 ? 'PM' : 'AM'
  const hour12 = parts.hour % 12 || 12
  return `${String(hour12).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')} ${period}`
}

function formatApiTime(timeStr) {
  const parts = parseTimeParts(timeStr)
  if (!parts) return String(timeStr ?? '')
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:00`
}

function formatPhoneForApi(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  if (digits.length === 12 && digits.startsWith('91')) {
    const local = digits.slice(2)
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`
  }
  return String(value ?? '').trim()
}

function mapQualificationsFromApi(raw) {
  if (Array.isArray(raw) && raw.length) {
    return raw.map((item, index) => ({
      qualificationName: pick(item, 'qualificationName', 'name') ?? '',
      institutionName: pick(item, 'institutionName', 'institution') ?? '',
      yearCompleted:
        pick(item, 'yearCompleted', 'year') != null ? String(pick(item, 'yearCompleted', 'year')) : '',
      displayOrder: Number(pick(item, 'displayOrder')) || index + 1,
    }))
  }

  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map((part, index) => ({
      qualificationName: part.trim(),
      institutionName: '',
      yearCompleted: '',
      displayOrder: index + 1,
    }))
  }

  return []
}

function formatQualificationsLabel(raw) {
  const rows = mapQualificationsFromApi(raw)
  if (!rows.length) return ''
  return rows.map((row) => row.qualificationName).filter(Boolean).join(', ')
}

function resolveDayKey(value) {
  const raw = String(value ?? '').trim().toUpperCase()
  if (DAY_API_TO_KEY[raw]) return DAY_API_TO_KEY[raw]
  const lower = raw.toLowerCase()
  if (WEEK_DAYS.some((day) => day.key === lower)) return lower
  return null
}

export function mapScheduleFromApi(rawSchedule) {
  const schedule = createDefaultSchedule()
  Object.keys(schedule).forEach((key) => {
    schedule[key] = { enabled: false, slots: [] }
  })

  if (!rawSchedule) return schedule

  if (Array.isArray(rawSchedule)) {
    rawSchedule.forEach((dayItem) => {
      const dayKey = resolveDayKey(pick(dayItem, 'day', 'dayOfWeek', 'weekDay', 'weekday'))
      if (!dayKey) return

      const slotsRaw =
        dayItem.timeSlots ??
        dayItem.slots ??
        dayItem.consultationSlots ??
        dayItem.timings ??
        []

      const enabled =
        dayItem.enabled ??
        dayItem.available ??
        dayItem.isAvailable ??
        (Array.isArray(slotsRaw) && slotsRaw.length > 0)

      schedule[dayKey] = {
        enabled: Boolean(enabled),
        slots: (Array.isArray(slotsRaw) ? slotsRaw : []).map((slot) => ({
          start: formatUiTime(pick(slot, 'start', 'startTime', 'from', 'openTime')),
          end: formatUiTime(pick(slot, 'end', 'endTime', 'to', 'closeTime')),
        })).filter((slot) => slot.start && slot.end),
      }
    })
    return schedule
  }

  if (typeof rawSchedule === 'object') {
    Object.entries(rawSchedule).forEach(([key, dayValue]) => {
      const dayKey = resolveDayKey(key)
      if (!dayKey || !dayValue || typeof dayValue !== 'object') return
      const slotsRaw = dayValue.slots ?? dayValue.timeSlots ?? []
      schedule[dayKey] = {
        enabled: Boolean(dayValue.enabled ?? dayValue.available ?? slotsRaw.length),
        slots: (Array.isArray(slotsRaw) ? slotsRaw : []).map((slot) => ({
          start: formatUiTime(typeof slot === 'string' ? slot.split('-')[0] : pick(slot, 'start', 'startTime')),
          end: formatUiTime(typeof slot === 'string' ? slot.split('-')[1] : pick(slot, 'end', 'endTime')),
        })).filter((slot) => slot.start && slot.end),
      }
    })
  }

  return schedule
}

export function mapScheduleToApi(schedule) {
  return WEEK_DAYS.map(({ key }) => {
    const day = schedule?.[key] ?? { enabled: false, slots: [] }
    const isAvailable = Boolean(day.enabled)
    return {
      dayOfWeek: DAY_KEY_TO_API[key],
      isAvailable,
      consultationSlots: isAvailable
        ? (day.slots ?? []).map((slot, index) => ({
            startTime: formatApiTime(slot.start),
            endTime: formatApiTime(slot.end),
            slotOrder: index + 1,
          }))
        : [],
    }
  })
}

export function mapAdminDoctorFromApi(item = {}) {
  const specialtyId = pick(item, 'specialtyId', 'specializationId')
  const storeLocationId = pick(item, 'storeLocationId', 'storeId', 'outletId', 'clinicId')
  const store = pick(item, 'store', 'storeName', 'outletName', 'clinicName', 'location')
  const firstName = pick(item, 'firstName')
  const lastName = pick(item, 'lastName')
  const rawQualifications = pick(item, 'qualifications', 'qualification', 'degree', 'credentials')
  const qualificationRows = mapQualificationsFromApi(rawQualifications)

  return {
    id: String(pick(item, 'id', 'doctorId') ?? ''),
    doctorCode: pick(item, 'doctorCode', 'code') ?? '',
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    name:
      pick(item, 'name', 'doctorName', 'fullName') ??
      [firstName, lastName].filter(Boolean).join(' ').trim(),
    email: pick(item, 'email', 'emailAddress') ?? '',
    mobile: String(pick(item, 'mobile', 'mobileNumber', 'phone', 'phoneNumber') ?? '').replace(/\D/g, ''),
    phoneNumber: pick(item, 'phoneNumber', 'mobileNumber', 'phone', 'mobile') ?? '',
    qualifications: formatQualificationsLabel(rawQualifications),
    qualificationRows,
    profileSummary: pick(item, 'profileSummary', 'summary', 'bio') ?? '',
    specialty: pick(item, 'specialty', 'specialization', 'specialtyName', 'speciality') ?? '',
    specialtyId: specialtyId != null ? Number(specialtyId) : null,
    store: store ?? '',
    storeLocationId: storeLocationId != null ? Number(storeLocationId) : null,
    storeId: storeLocationId != null ? String(storeLocationId) : '',
    experienceYears: pick(item, 'yearsOfExperience', 'experienceYears', 'experience'),
    consultationFee: pick(item, 'consultationFee', 'consultationFees', 'fee'),
    consultationType: normalizeConsultationType(
      pick(item, 'consultationType', 'consultationMode', 'mode'),
    ),
    status: normalizeStatus(pick(item, 'status', 'doctorStatus')),
    imageUrl:
      pick(item, 'imageUrl', 'profileImageUrl', 'profileImage', 'photoUrl', 'avatarUrl') ?? '',
    consultationTimingsSummary:
      pick(item, 'consultationTimingsSummary', 'consultationTimingSummary', 'timingsSummary') ?? '',
    schedule: mapScheduleFromApi(
      pick(
        item,
        'weeklySchedules',
        'schedule',
        'consultationSchedule',
        'weeklySchedule',
        'availabilitySchedule',
        'consultationTimings',
      ),
    ),
    createdAt: pick(item, 'createdAt', 'createdOn') ?? null,
  }
}

function buildDoctorWritePayload(payload = {}) {
  const body = {
    doctorCode: payload.doctorCode?.trim(),
    firstName: payload.firstName?.trim(),
    lastName: payload.lastName?.trim(),
    email: payload.email?.trim(),
    phoneNumber: formatPhoneForApi(payload.phoneNumber ?? payload.mobile),
    yearsOfExperience:
      payload.yearsOfExperience == null || payload.yearsOfExperience === ''
        ? undefined
        : Number(payload.yearsOfExperience),
    profileSummary: payload.profileSummary?.trim(),
    consultationFee:
      payload.consultationFee == null || payload.consultationFee === ''
        ? undefined
        : Number(payload.consultationFee),
    specialtyId: payload.specialtyId != null ? Number(payload.specialtyId) : undefined,
    storeLocationId:
      payload.storeLocationId != null && payload.storeLocationId !== ''
        ? Number(payload.storeLocationId)
        : undefined,
    doctorStatus: STATUS_TO_API[payload.doctorStatus] ?? payload.doctorStatus ?? 'ACTIVE',
    qualifications: (payload.qualifications ?? []).map((row, index) => ({
      qualificationName: row.qualificationName?.trim(),
      institutionName: row.institutionName?.trim(),
      yearCompleted:
        row.yearCompleted == null || row.yearCompleted === ''
          ? undefined
          : Number(row.yearCompleted),
      displayOrder: Number(row.displayOrder) || index + 1,
    })),
    weeklySchedules: mapScheduleToApi(payload.schedule),
  }

  Object.keys(body).forEach((key) => {
    if (body[key] === undefined) delete body[key]
  })

  return body
}

async function submitDoctorWrite(method, path, payload, profileImage) {
  const formData = new FormData()
  const body = buildDoctorWritePayload(payload)
  formData.append('doctor', new Blob([JSON.stringify(body)], { type: 'application/json' }))
  if (profileImage) formData.append('profileImage', profileImage)

  const res = await fetch(`${DOCTOR_API_BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: formData,
  })

  const data = await parseJsonResponse(res)
  if (res.status === 401) notifyUnauthorized()
  if (!res.ok) throw new Error(getErrorMessage(data, res.status))

  clearMedicalSpecialtiesCache()
  return data
}

function unwrapEntity(payload) {
  return payload?.data ?? payload?.doctor ?? payload
}

function parseAdminDoctorsList(payload) {
  const data = payload?.data ?? payload

  if (Array.isArray(data)) {
    return {
      doctors: data.map(mapAdminDoctorFromApi).filter((doctor) => doctor.id),
      totalElements: data.length,
      totalPages: 1,
      page: 0,
      size: data.length,
    }
  }

  const rawList =
    data?.content ??
    data?.items ??
    data?.doctors ??
    data?.results ??
    []

  const doctors = (Array.isArray(rawList) ? rawList : [])
    .map(mapAdminDoctorFromApi)
    .filter((doctor) => doctor.id)

  return {
    doctors,
    totalElements: Number(data?.totalElements ?? data?.total ?? doctors.length) || 0,
    totalPages: Math.max(1, Number(data?.totalPages ?? data?.pages) || 1),
    page: Number(data?.page ?? data?.number ?? 0) || 0,
    size: Number(data?.size ?? data?.pageSize ?? doctors.length) || doctors.length,
  }
}

function buildAdminDoctorsQuery({
  search = '',
  specialtyId = 'all',
  status = 'all',
  storeId = 'all',
  page = 0,
  size = 5,
} = {}) {
  const params = new URLSearchParams()
  const keyword = String(search ?? '').trim()
  if (keyword) {
    params.set('searchKeyword', keyword)
    params.set('search', keyword)
  }
  if (specialtyId && specialtyId !== 'all') params.set('specialtyId', String(specialtyId))
  if (status && status !== 'all') params.set('status', STATUS_TO_API[status] ?? String(status).toUpperCase())
  if (storeId && storeId !== 'all') params.set('storeId', String(storeId))
  params.set('page', String(page))
  params.set('size', String(size))
  return `${BASE}?${params.toString()}`
}

export async function fetchAdminDoctorsDashboardSummary() {
  if (inFlightSummaryRequest) return inFlightSummaryRequest

  inFlightSummaryRequest = authFetch(`${BASE}/dashboard-summary`, {}, DOCTOR_API_BASE)
    .then((payload) => {
      const data = payload?.data ?? payload ?? {}
      const totalDoctors = Number(pick(data, 'totalDoctors', 'total', 'doctorCount')) || 0
      const activeDoctors = Number(pick(data, 'activeDoctors', 'active', 'activeCount')) || 0
      const availableToday = Number(pick(data, 'availableToday', 'availableNow', 'availableCount')) || 0
      const totalSpecialties = Number(pick(data, 'totalSpecialties', 'specialties', 'specialtyCount')) || 0
      const addedThisMonth = Number(pick(data, 'addedThisMonth', 'newThisMonth', 'doctorsAddedThisMonth')) || 0
      const consultationBookings =
        Number(
          pick(
            data,
            'consultationBookings',
            'totalConsultationBookings',
            'totalBookings',
            'appointmentCount',
            'appointmentsCount',
            'bookingCount',
          ),
        ) || 0
      const bookingsToday =
        Number(
          pick(
            data,
            'bookingsToday',
            'consultationBookingsToday',
            'appointmentsToday',
            'todayBookings',
          ),
        ) || 0
      const activePercent =
        Number(pick(data, 'activePercent', 'activePercentage')) ||
        (totalDoctors ? Math.round((activeDoctors / totalDoctors) * 100) : 0)

      return {
        totalDoctors,
        activeDoctors,
        activePercent,
        availableToday,
        totalSpecialties,
        addedThisMonth,
        consultationBookings,
        bookingsToday,
      }
    })
    .finally(() => {
      inFlightSummaryRequest = null
    })

  return inFlightSummaryRequest
}

export async function fetchAdminDoctors(filters = {}) {
  const path = buildAdminDoctorsQuery(filters)
  const existing = inFlightListRequests.get(path)
  if (existing) return existing

  const request = authFetch(path, {}, DOCTOR_API_BASE)
    .then(parseAdminDoctorsList)
    .finally(() => {
      inFlightListRequests.delete(path)
    })

  inFlightListRequests.set(path, request)
  return request
}

export async function fetchAdminDoctorById(id) {
  const key = String(id)
  const existing = inFlightDoctorRequests.get(key)
  if (existing) return existing

  const request = authFetch(`${BASE}/${encodeURIComponent(key)}`, {}, DOCTOR_API_BASE)
    .then((payload) => mapAdminDoctorFromApi(unwrapEntity(payload)))
    .finally(() => {
      inFlightDoctorRequests.delete(key)
    })

  inFlightDoctorRequests.set(key, request)
  return request
}

export async function createAdminDoctor(payload, profileImage) {
  const response = await submitDoctorWrite('POST', BASE, payload, profileImage)
  return mapAdminDoctorFromApi(unwrapEntity(response))
}

export async function updateAdminDoctor(id, payload, profileImage) {
  const response = await submitDoctorWrite(
    'PUT',
    `${BASE}/${encodeURIComponent(id)}`,
    payload,
    profileImage,
  )
  inFlightDoctorRequests.delete(String(id))
  return mapAdminDoctorFromApi(unwrapEntity(response))
}

export async function setAdminDoctorStatus(id, status) {
  const response = await authFetch(
    `${BASE}/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status: STATUS_TO_API[status] ?? String(status).toUpperCase(),
      }),
    },
    DOCTOR_API_BASE,
  )
  inFlightDoctorRequests.delete(String(id))
  const entity = unwrapEntity(response)
  return entity?.status ? mapAdminDoctorFromApi(entity) : { id: String(id), status }
}

export async function uploadAdminDoctorProfileImage(id, file) {
  if (!file) throw new Error('Profile image file is required')

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${DOCTOR_API_BASE}${BASE}/${encodeURIComponent(id)}/profile-image`, {
    method: 'POST',
    headers: authHeaders({ Accept: 'application/json' }),
    body: formData,
  })

  const data = await parseJsonResponse(res)
  if (res.status === 401) notifyUnauthorized()
  if (!res.ok) throw new Error(getErrorMessage(data, res.status))

  inFlightDoctorRequests.delete(String(id))
  const entity = unwrapEntity(data)
  if (entity && typeof entity === 'object' && (entity.id || entity.doctorId)) {
    return mapAdminDoctorFromApi(entity)
  }

  const imageUrl = pick(data, 'imageUrl', 'profileImageUrl', 'profileImage', 'url') ??
    pick(entity, 'imageUrl', 'profileImageUrl', 'profileImage', 'url')

  return { id: String(id), imageUrl: imageUrl ?? '' }
}

export function mergeSpecialtiesFromDoctors(doctors = []) {
  return mergeMedicalSpecialtiesFromItems(
    doctors.map((doctor) => ({
      specialtyId: doctor.specialtyId,
      specialtyName: doctor.specialty,
    })),
  )
}

export async function fetchAdminSpecialties(options = {}) {
  return fetchMedicalSpecialties(options)
}

export function clearAdminDoctorsCache({ invalidateLists = false } = {}) {
  clearMedicalSpecialtiesCache()
  inFlightDoctorRequests.clear()
  if (invalidateLists) {
    inFlightListRequests.clear()
    inFlightSummaryRequest = null
  }
}

export async function createAdminSpecialty(payload) {
  return createMedicalSpecialty(payload)
}

export async function deleteAdminSpecialty() {
  throw new Error('Specialty deletion is not available through the doctor API')
}

/** @deprecated Use fetchAdminDoctorsDashboardSummary */
export function getDoctorSummary() {
  return {
    totalDoctors: 0,
    activeDoctors: 0,
    activePercent: 0,
    availableToday: 0,
    totalSpecialties: 0,
    addedThisMonth: 0,
    consultationBookings: 0,
    bookingsToday: 0,
  }
}
