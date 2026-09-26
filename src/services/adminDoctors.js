import { WEEK_DAYS, createDefaultSchedule } from '@/modules/owner/data/doctorsData'
import {
  computeMaxSlots,
  createDefaultConsultationSchedule,
  createDefaultTimeWindow,
  nextScheduleId,
} from '@/modules/owner/views/doctors/consultationScheduleModel'
import {
  clearMedicalSpecialtiesCache,
  createMedicalSpecialty,
  fetchAdminMedicalSpecialties,
  fetchMedicalSpecialties,
  mergeMedicalSpecialtiesFromItems,
} from './medicalSpecialties'
import { resolveDoctorImageUrl } from './doctorImages'
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
let cachedDashboardSummary = null
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

function normalizeAdminPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.length >= 10 ? digits.slice(-10) : digits
}

function formatPhoneForApi(value) {
  const digits = normalizeAdminPhone(value)
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
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
    if (Array.isArray(rawSchedule.weeklyRules)) {
      rawSchedule.weeklyRules.forEach((dayItem) => {
        const dayKey = resolveDayKey(dayItem.dayOfWeek)
        if (!dayKey) return
        const windows = dayItem.timeWindows ?? dayItem.consultationSlots ?? []
        schedule[dayKey] = {
          enabled: dayItem.isAvailable !== false && windows.length > 0,
          slots: windows
            .map((slot) => ({
              start: formatUiTime(pick(slot, 'startTime', 'start')),
              end: formatUiTime(pick(slot, 'endTime', 'end')),
            }))
            .filter((slot) => slot.start && slot.end),
        }
      })
      return schedule
    }

    Object.entries(rawSchedule).forEach(([key, dayValue]) => {
      if (key === 'weeklyRules' || key === 'monthlyRules') return
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

function mapMonthWeekTokenToApi(weekId) {
  if (String(weekId).toLowerCase() === 'last') return 'LAST'
  return String(weekId)
}

function mapMonthWeekTokenFromApi(token) {
  const normalized = String(token ?? '').trim().toUpperCase()
  if (normalized === 'LAST') return 'last'
  return normalized.toLowerCase()
}

function mapSlotToApiTimeWindow(slot) {
  const slotDurationMinutes = Number(slot.slotDuration) > 0 ? Number(slot.slotDuration) : 30
  const maxCapacity =
    Number(slot.slotsPerDay) > 0
      ? Number(slot.slotsPerDay)
      : computeMaxSlots(slot.start, slot.end, slotDurationMinutes) || 1

  return {
    startTime: formatApiTime(slot.start),
    endTime: formatApiTime(slot.end),
    slotDurationMinutes,
    maxCapacity,
  }
}

function buildApiScheduleShell(partial = {}) {
  return {
    weeklyRules: partial.weeklyRules ?? [],
    monthlyRules: partial.monthlyRules ?? [],
    customDates: partial.customDates ?? [],
    customPatternRules: partial.customPatternRules ?? [],
  }
}

/** Maps wizard consultation schedule → POST/PUT `schedule`. */
export function mapConsultationScheduleToApiSchedule(consultationSchedule) {
  const cs = consultationSchedule
  if (!cs) return undefined

  if (cs.scheduleType === 'CUSTOM_DATE') {
    const { specificDates, repeatingDayRules } = cs.customDates ?? {}

    const customDates = (specificDates ?? []).flatMap((entry) =>
      (entry.slots ?? [])
        .map((slot) => {
          const window = mapSlotToApiTimeWindow(slot)
          if (!entry.date || !window.startTime || !window.endTime) return null
          return {
            consultationDate: entry.date,
            isAvailable: true,
            ...window,
          }
        })
        .filter(Boolean),
    )

    const customPatternRules = (repeatingDayRules ?? [])
      .map((rule) => {
        const window = mapSlotToApiTimeWindow(rule)
        if (!window.startTime || !window.endTime || !rule.dayKey) return null
        return {
          everyWeeks: 1,
          daysOfWeek: [DAY_KEY_TO_API[rule.dayKey] ?? String(rule.dayKey).toUpperCase()],
          isAvailable: true,
          timeWindows: [window],
        }
      })
      .filter(Boolean)

    if (!customDates.length && !customPatternRules.length) return undefined

    return buildApiScheduleShell({ customDates, customPatternRules })
  }

  if (cs.scheduleType !== 'RECURRING') return undefined

  const { pattern, weekly, monthlyRules } = cs.recurring ?? {}

  if (pattern === 'WEEKLY') {
    const weeklyRules = []
    WEEK_DAYS.forEach(({ key }) => {
      const day = weekly?.[key]
      if (!day?.enabled) return

      const timeWindows = (day.slots ?? [])
        .map((slot) => mapSlotToApiTimeWindow(slot))
        .filter((window) => window.startTime && window.endTime)

      if (!timeWindows.length) return

      weeklyRules.push({
        dayOfWeek: DAY_KEY_TO_API[key],
        isAvailable: true,
        timeWindows,
      })
    })

    return weeklyRules.length ? buildApiScheduleShell({ weeklyRules }) : undefined
  }

  if (pattern === 'MONTHLY') {
    const mappedMonthlyRules = (monthlyRules ?? [])
      .map((rule) => {
        const weeksOfMonth = (rule.weeks ?? []).map(mapMonthWeekTokenToApi).filter(Boolean).join(',')
        const dayKey = rule.dayKey
        const window = mapSlotToApiTimeWindow(rule)
        return {
          weeksOfMonth,
          dayOfWeek: DAY_KEY_TO_API[dayKey] ?? String(dayKey ?? '').toUpperCase(),
          startTime: window.startTime,
          endTime: window.endTime,
          isAvailable: true,
          slotDurationMinutes: window.slotDurationMinutes,
          maxCapacity: window.maxCapacity,
        }
      })
      .filter((rule) => rule.weeksOfMonth && rule.dayOfWeek && rule.startTime && rule.endTime)

    return mappedMonthlyRules.length ? buildApiScheduleShell({ monthlyRules: mappedMonthlyRules }) : undefined
  }

  return undefined
}

/** GET edit API may nest times under `timeWindows` or flatten on the row (POST shape). */
function resolveApiScheduleTimeWindows(row) {
  if (Array.isArray(row?.timeWindows) && row.timeWindows.length) {
    return row.timeWindows
  }
  if (row?.startTime && row?.endTime) {
    return [
      {
        startTime: row.startTime,
        endTime: row.endTime,
        slotDurationMinutes: row.slotDurationMinutes,
        maxCapacity: row.maxCapacity,
      },
    ]
  }
  return []
}

function mapApiCustomPatternRuleToUi(rule) {
  const window = Array.isArray(rule.timeWindows) ? rule.timeWindows[0] : rule
  const start = formatUiTime(window?.startTime)
  const end = formatUiTime(window?.endTime)
  const slotDuration = Number(window?.slotDurationMinutes) || 30

  return {
    id: nextScheduleId('custom'),
    every: Number(rule.everyWeeks) > 0 ? Number(rule.everyWeeks) : 1,
    days: (rule.daysOfWeek ?? [])
      .map((day) => resolveDayKey(day))
      .filter(Boolean),
    start,
    end,
    slotDuration,
    slotsPerDay:
      Number(window?.maxCapacity) > 0
        ? Number(window.maxCapacity)
        : computeMaxSlots(start, end, slotDuration) || 8,
  }
}

export function consultationScheduleFromApiSchedule(rawSchedule) {
  const base = createDefaultConsultationSchedule()
  if (!rawSchedule || typeof rawSchedule !== 'object') return base

  const hasCustomDates = Array.isArray(rawSchedule.customDates) && rawSchedule.customDates.length > 0
  const hasCustomPatternRules =
    Array.isArray(rawSchedule.customPatternRules) && rawSchedule.customPatternRules.length > 0

  if (hasCustomDates || (hasCustomPatternRules && !rawSchedule.weeklyRules?.length && !rawSchedule.monthlyRules?.length)) {
    base.scheduleType = 'CUSTOM_DATE'
    base.customDates = { specificDates: [], repeatingDayRules: [] }

    if (hasCustomDates) {
      const grouped = new Map()
      rawSchedule.customDates.forEach((row) => {
        const date = row.consultationDate
        if (!date) return

        resolveApiScheduleTimeWindows(row).forEach((window) => {
          const start = formatUiTime(window.startTime)
          const end = formatUiTime(window.endTime)
          if (!start || !end) return

          const slotDuration = Number(window.slotDurationMinutes) || 30
          const slot = createDefaultTimeWindow({
            start,
            end,
            slotDuration,
            slotsPerDay:
              Number(window.maxCapacity) > 0
                ? Number(window.maxCapacity)
                : computeMaxSlots(start, end, slotDuration) || 8,
          })

          if (!grouped.has(date)) {
            grouped.set(date, { id: nextScheduleId('date'), date, slots: [] })
          }
          grouped.get(date).slots.push(slot)
        })
      })
      base.customDates.specificDates = [...grouped.values()]
    }

    if (hasCustomPatternRules) {
      const looksLikeRecurringCustom = rawSchedule.customPatternRules.some(
        (rule) => (rule.daysOfWeek?.length ?? 0) > 1 || Number(rule.everyWeeks) > 1,
      )

      if (looksLikeRecurringCustom && !hasCustomDates) {
        base.scheduleType = 'RECURRING'
        base.recurring.pattern = 'CUSTOM'
        base.recurring.customPatternRules = rawSchedule.customPatternRules.map(mapApiCustomPatternRuleToUi)
        return base
      }

      base.customDates.repeatingDayRules = rawSchedule.customPatternRules.map((rule) => {
        const window = Array.isArray(rule.timeWindows) ? rule.timeWindows[0] : rule
        const start = formatUiTime(window?.startTime)
        const end = formatUiTime(window?.endTime)
        const slotDuration = Number(window?.slotDurationMinutes) || 30
        return {
          id: nextScheduleId('repeat'),
          weekOfMonth: '1',
          dayKey: resolveDayKey(rule.daysOfWeek?.[0]) ?? 'monday',
          start,
          end,
          slotDuration,
          slotsPerDay:
            Number(window?.maxCapacity) > 0
              ? Number(window.maxCapacity)
              : computeMaxSlots(start, end, slotDuration) || 8,
        }
      })
    }

    return base
  }

  if (Array.isArray(rawSchedule.weeklyRules) && rawSchedule.weeklyRules.length) {
    base.scheduleType = 'RECURRING'
    base.recurring.pattern = 'WEEKLY'
    WEEK_DAYS.forEach(({ key }) => {
      base.recurring.weekly[key] = { enabled: false, slots: [] }
    })

    rawSchedule.weeklyRules.forEach((rule) => {
      const dayKey = resolveDayKey(rule.dayOfWeek)
      if (!dayKey) return

      const slots = (rule.timeWindows ?? []).map((window) => {
        const start = formatUiTime(window.startTime)
        const end = formatUiTime(window.endTime)
        const slotDuration = Number(window.slotDurationMinutes) || 30
        return createDefaultTimeWindow({
          start,
          end,
          slotDuration,
          slotsPerDay:
            Number(window.maxCapacity) > 0
              ? Number(window.maxCapacity)
              : computeMaxSlots(start, end, slotDuration) || 10,
        })
      })

      base.recurring.weekly[dayKey] = {
        enabled: rule.isAvailable !== false && slots.length > 0,
        slots: slots.length ? slots : [],
      }
    })

    return base
  }

  if (hasCustomPatternRules) {
    base.scheduleType = 'RECURRING'
    base.recurring.pattern = 'CUSTOM'
    base.recurring.customPatternRules = rawSchedule.customPatternRules.map(mapApiCustomPatternRuleToUi)
    return base
  }

  if (Array.isArray(rawSchedule.monthlyRules) && rawSchedule.monthlyRules.length) {
    base.scheduleType = 'RECURRING'
    base.recurring.pattern = 'MONTHLY'
    base.recurring.monthlyRules = rawSchedule.monthlyRules.map((rule) => {
      const start = formatUiTime(rule.startTime)
      const end = formatUiTime(rule.endTime)
      const slotDuration = Number(rule.slotDurationMinutes) || 30
      return {
        id: nextScheduleId('monthly'),
        weeks: String(rule.weeksOfMonth ?? '')
          .split(',')
          .map((part) => mapMonthWeekTokenFromApi(part.trim()))
          .filter(Boolean),
        dayKey: resolveDayKey(rule.dayOfWeek) ?? 'monday',
        start,
        end,
        slotDuration,
        slotsPerDay: Number(rule.maxCapacity) > 0 ? Number(rule.maxCapacity) : 20,
      }
    })
    return base
  }

  return base
}

function applyScheduleToWriteBody(body, payload) {
  const apiSchedule = mapConsultationScheduleToApiSchedule(payload.consultationSchedule)
  if (apiSchedule) {
    body.schedule = apiSchedule
    return
  }
  body.weeklySchedules = mapScheduleToApi(payload.schedule)
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
  const specialtyObj = item.medicalSpecialty ?? item.specialty
  const specialtyName =
    typeof specialtyObj === 'object' && specialtyObj != null
      ? pick(specialtyObj, 'specialtyName', 'name', 'label')
      : pick(item, 'specialty', 'specialization', 'specialtyName', 'speciality')
  const specialtyIdRaw =
    typeof specialtyObj === 'object' && specialtyObj != null
      ? pick(specialtyObj, 'specialtyId', 'id')
      : pick(item, 'specialtyId', 'specializationId')
  const specialtyId = specialtyIdRaw != null && specialtyIdRaw !== '' ? Number(specialtyIdRaw) : null

  const storeLocationObj = item.storeLocation ?? item.store
  const storeLocationIdRaw =
    typeof storeLocationObj === 'object' && storeLocationObj != null
      ? pick(storeLocationObj, 'storeLocationId', 'id', 'storeId')
      : pick(item, 'storeLocationId', 'storeId', 'outletId', 'clinicId')
  const storeLocationId =
    storeLocationIdRaw != null && storeLocationIdRaw !== '' ? Number(storeLocationIdRaw) : null
  const store =
    typeof storeLocationObj === 'object' && storeLocationObj != null
      ? pick(storeLocationObj, 'storeName', 'name', 'label')
      : pick(item, 'store', 'storeName', 'outletName', 'clinicName', 'location')

  const firstName = pick(item, 'firstName')
  const lastName = pick(item, 'lastName')
  const rawPhone = pick(item, 'phoneNumber', 'mobileNumber', 'phone', 'mobile')
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
    mobile: normalizeAdminPhone(rawPhone),
    phoneNumber: rawPhone ?? '',
    qualifications: formatQualificationsLabel(rawQualifications),
    qualificationRows,
    profileSummary: pick(item, 'profileSummary', 'summary', 'bio') ?? '',
    specialty: specialtyName ?? '',
    specialtyId,
    store: store ?? '',
    storeLocationId: storeLocationId != null ? Number(storeLocationId) : null,
    storeId: storeLocationId != null ? String(storeLocationId) : '',
    experienceYears: pick(item, 'yearsOfExperience', 'experienceYears', 'experience'),
    consultationFee: pick(item, 'consultationFee', 'consultationFees', 'fee'),
    consultationType: normalizeConsultationType(
      pick(item, 'consultationType', 'consultationMode', 'mode'),
    ),
    status: normalizeStatus(pick(item, 'status', 'doctorStatus')),
    imageUrl: resolveDoctorImageUrl(
      pick(item, 'profileImageUrl', 'imageUrl', 'profileImage', 'photoUrl', 'avatarUrl') ?? '',
    ),
    consultationTimingsSummary:
      pick(item, 'consultationTimingsSummary', 'consultationTimingSummary', 'timingsSummary') ?? '',
    schedule: mapScheduleFromApi(
      pick(item, 'schedule') ??
        pick(
          item,
          'weeklySchedules',
          'consultationSchedule',
          'weeklySchedule',
          'availabilitySchedule',
          'consultationTimings',
        ),
    ),
    consultationSchedule: (() => {
      const scheduleObj = pick(item, 'schedule')
      if (
        scheduleObj?.weeklyRules?.length
        || scheduleObj?.monthlyRules?.length
        || scheduleObj?.customDates?.length
        || scheduleObj?.customPatternRules?.length
      ) {
        return consultationScheduleFromApiSchedule(scheduleObj)
      }
      return undefined
    })(),
    createdAt: pick(item, 'createdAt', 'createdOn') ?? null,
  }
}

/** Normalize add/edit doctor form draft into one shared write shape for POST and PUT. */
export function buildAdminDoctorFormPayload(draft = {}) {
  return {
    doctorCode: String(draft.doctorCode ?? '').trim(),
    firstName: String(draft.firstName ?? '').trim(),
    lastName: String(draft.lastName ?? '').trim(),
    email: String(draft.email ?? '').trim(),
    phoneNumber: String(draft.mobile ?? draft.phoneNumber ?? '').replace(/\D/g, ''),
    profileSummary: String(draft.profileSummary ?? '').trim(),
    specialtyId: Number(draft.specialtyId),
    storeLocationId:
      draft.storeLocationId != null && draft.storeLocationId !== ''
        ? Number(draft.storeLocationId)
        : undefined,
    yearsOfExperience: Number(draft.yearsOfExperience),
    consultationFee: Number(draft.consultationFee),
    doctorStatus: draft.doctorStatus ?? 'active',
    qualifications: (draft.qualifications ?? [])
      .filter((row) => String(row?.qualificationName ?? '').trim())
      .map((row, index) => ({
        qualificationName: String(row.qualificationName).trim(),
        institutionName: String(row.institutionName ?? '').trim(),
        yearCompleted:
          row.yearCompleted === '' || row.yearCompleted == null
            ? undefined
            : Number(row.yearCompleted),
        displayOrder: index + 1,
      })),
    schedule: draft.schedule,
    consultationSchedule: draft.consultationSchedule ?? undefined,
  }
}

function buildDoctorWritePayload(payload = {}) {
  const body = {
    doctorCode: payload.doctorCode?.trim(),
    firstName: payload.firstName?.trim(),
    lastName: payload.lastName?.trim(),
    email: payload.email?.trim() || undefined,
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
    doctorStatus: STATUS_TO_API[payload.doctorStatus] ?? payload.doctorStatus ?? 'ACTIVE',
    qualifications: (payload.qualifications ?? [])
      .filter((row) => row.qualificationName?.trim())
      .map((row, index) => {
        const item = {
          qualificationName: row.qualificationName?.trim(),
          institutionName: row.institutionName?.trim() || undefined,
          yearCompleted:
            row.yearCompleted == null || row.yearCompleted === ''
              ? undefined
              : Number(row.yearCompleted),
          displayOrder: Number(row.displayOrder) || index + 1,
        }
        Object.keys(item).forEach((key) => {
          if (item[key] === undefined) delete item[key]
        })
        return item
      }),
  }

  applyScheduleToWriteBody(body, payload)

  Object.keys(body).forEach((key) => {
    if (body[key] === undefined || body[key] === null) delete body[key]
  })

  return body
}

function buildDoctorPutPayload(draft = {}) {
  const formPayload = buildAdminDoctorFormPayload(draft)
  const body = {
    firstName: formPayload.firstName,
    lastName: formPayload.lastName,
    email: formPayload.email?.trim() || undefined,
    phoneNumber: normalizeAdminPhone(formPayload.phoneNumber),
    yearsOfExperience: Number(formPayload.yearsOfExperience),
    consultationFee: Number(formPayload.consultationFee),
    profileSummary: formPayload.profileSummary,
    specialtyId: Number(formPayload.specialtyId),
    storeLocationId: formPayload.storeLocationId,
    doctorStatus: STATUS_TO_API[formPayload.doctorStatus] ?? formPayload.doctorStatus ?? 'ACTIVE',
    qualifications: (formPayload.qualifications ?? [])
      .filter((row) => row.qualificationName?.trim())
      .map((row, index) => {
        const item = {
          qualificationName: row.qualificationName?.trim(),
          institutionName: row.institutionName?.trim() || undefined,
          yearCompleted:
            row.yearCompleted == null || row.yearCompleted === ''
              ? undefined
              : Number(row.yearCompleted),
          displayOrder: Number(row.displayOrder) || index + 1,
        }
        Object.keys(item).forEach((key) => {
          if (item[key] === undefined) delete item[key]
        })
        return item
      }),
  }

  applyScheduleToWriteBody(body, formPayload)

  Object.keys(body).forEach((key) => {
    if (body[key] === undefined || body[key] === null) delete body[key]
  })

  return body
}

/** POST form-data: doctor (full JSON) + optional profileImage file. */
function buildDoctorPostFormData(draft, profileImage) {
  const formData = new FormData()
  const doctorJson = JSON.stringify(buildDoctorWritePayload(buildAdminDoctorFormPayload(draft)))

  formData.append('doctor', new Blob([doctorJson], { type: 'application/json' }))

  if (profileImage instanceof File) {
    formData.append('profileImage', profileImage)
  }

  return formData
}

/**
 * PUT form-data — matches Postman:
 * | KEY          | TYPE | VALUE            |
 * | doctor       | Text | full doctor JSON |
 * | profileImage | File | optional new photo |
 */
function buildDoctorPutFormData(draft, profileImage) {
  const formData = new FormData()
  const doctorJson = JSON.stringify(buildDoctorPutPayload(draft))

  formData.append('doctor', doctorJson)

  if (profileImage instanceof File) {
    formData.append('profileImage', profileImage)
  }

  return formData
}

async function submitDoctorPost(draft, profileImage) {
  const formData = buildDoctorPostFormData(draft, profileImage)

  const res = await fetch(`${DOCTOR_API_BASE}${BASE}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })

  const data = await parseJsonResponse(res)
  if (res.status === 401) notifyUnauthorized()
  if (!res.ok) throw new Error(getErrorMessage(data, res.status))

  clearMedicalSpecialtiesCache()
  return data
}

async function submitDoctorPut(id, draft, profileImage) {
  const formData = buildDoctorPutFormData(draft, profileImage)

  const res = await fetch(`${DOCTOR_API_BASE}${BASE}/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
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
  if (status && status !== 'all') {
    params.set('doctorStatus', STATUS_TO_API[status] ?? String(status).toUpperCase())
  }
  if (storeId && storeId !== 'all') params.set('storeId', String(storeId))
  params.set('page', String(page))
  params.set('size', String(size))
  return `${BASE}?${params.toString()}`
}

export async function fetchAdminDoctorsDashboardSummary({ force = false } = {}) {
  if (!force && cachedDashboardSummary) return cachedDashboardSummary
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
            'todayBookingsCount',
            'bookingsToday',
            'consultationBookingsToday',
            'appointmentsToday',
            'todayBookings',
          ),
        ) || 0
      const activePercent =
        Number(pick(data, 'activePercent', 'activePercentage')) ||
        (totalDoctors ? Math.round((activeDoctors / totalDoctors) * 100) : 0)

      const summary = {
        totalDoctors,
        activeDoctors,
        activePercent,
        availableToday,
        totalSpecialties,
        addedThisMonth,
        consultationBookings,
        bookingsToday,
      }
      cachedDashboardSummary = summary
      return summary
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

export async function createAdminDoctor(draft, profileImage) {
  const response = await submitDoctorPost(draft, profileImage)
  return mapAdminDoctorFromApi(unwrapEntity(response))
}

export async function updateAdminDoctor(id, draft, profileImage) {
  const response = await submitDoctorPut(id, draft, profileImage)
  inFlightDoctorRequests.delete(String(id))
  return mapAdminDoctorFromApi(unwrapEntity(response))
}

export async function setAdminDoctorStatus(id, status) {
  const response = await authFetch(
    `${BASE}/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        doctorStatus: STATUS_TO_API[status] ?? String(status).toUpperCase(),
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

  const imageUrl = resolveDoctorImageUrl(
    pick(data, 'profileImageUrl', 'imageUrl', 'profileImage', 'url') ??
      pick(entity, 'profileImageUrl', 'imageUrl', 'profileImage', 'url') ??
      '',
  )

  return { id: String(id), imageUrl }
}

export function mergeSpecialtiesFromDoctors(doctors = []) {
  return mergeMedicalSpecialtiesFromItems(
    doctors.map((doctor) => ({
      specialtyId: doctor.specialtyId,
      specialtyName: doctor.specialty,
    })),
  )
}

export async function fetchAdminSpecialties({ force = true } = {}) {
  return fetchAdminMedicalSpecialties({ force })
}

export function clearAdminDoctorsCache({ invalidateLists = false } = {}) {
  clearMedicalSpecialtiesCache()
  inFlightDoctorRequests.clear()
  if (invalidateLists) {
    inFlightListRequests.clear()
    inFlightSummaryRequest = null
    cachedDashboardSummary = null
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
