import { WEEK_DAYS, createDefaultSchedule } from '../../data/doctorsData'

/** @typedef {'RECURRING' | 'CUSTOM_DATE'} ConsultationScheduleType */
/** @typedef {'WEEKLY' | 'MONTHLY'} RecurringPatternType */

/**
 * @typedef {Object} TimeSlotWindow
 * @property {string} start
 * @property {string} end
 * @property {number} slotDuration
 * @property {number} slotsPerDay
 */

export const SLOT_DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
]

export const SLOTS_PER_DAY_PRESETS = [10, 15, 20, 30, 40]

export const MONTH_WEEK_OPTIONS = [
  { id: '1', label: '1st' },
  { id: '2', label: '2nd' },
  { id: '3', label: '3rd' },
  { id: '4', label: '4th' },
  { id: 'last', label: 'Last' },
]

let slotIdCounter = 0
export function nextScheduleId(prefix = 'slot') {
  slotIdCounter += 1
  return `${prefix}-${Date.now()}-${slotIdCounter}`
}

export function createDefaultTimeWindow(overrides = {}) {
  return {
    id: nextScheduleId('win'),
    start: '09:00 AM',
    end: '01:00 PM',
    slotDuration: 30,
    slotsPerDay: 10,
    ...overrides,
  }
}

export function createDefaultWeeklyDay(enabled = false) {
  return {
    enabled,
    slots: enabled ? [createDefaultTimeWindow()] : [],
  }
}

export function createDefaultConsultationSchedule() {
  const legacy = createDefaultSchedule()
  const weekly = {}
  WEEK_DAYS.forEach(({ key }) => {
    const day = legacy[key] ?? { enabled: false, slots: [] }
    weekly[key] = {
      enabled: Boolean(day.enabled),
      slots: (day.slots ?? []).map((slot) =>
        createDefaultTimeWindow({
          start: slot.start,
          end: slot.end,
          slotDuration: 30,
          slotsPerDay: computeMaxSlots(slot.start, slot.end, 30) || 10,
        }),
      ),
    }
    if (weekly[key].enabled && !weekly[key].slots.length) {
      weekly[key].slots = [createDefaultTimeWindow()]
    }
  })

  return {
    scheduleType: 'RECURRING',
    recurring: {
      pattern: 'WEEKLY',
      weekly,
      monthlyRules: [],
      customPatternRules: [],
    },
    customDates: {
      specificDates: [],
      repeatingDayRules: [],
    },
  }
}

export function cloneConsultationSchedule(source) {
  if (!source) return createDefaultConsultationSchedule()
  return JSON.parse(JSON.stringify(source))
}

function parseTimeToMinutes(timeStr) {
  const trimmed = String(timeStr ?? '').trim()
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (match12) {
    let hour = Number(match12[1]) % 12
    if (match12[3].toUpperCase() === 'PM') hour += 12
    return hour * 60 + Number(match12[2])
  }
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})/)
  if (match24) return Number(match24[1]) * 60 + Number(match24[2])
  return NaN
}

export const SLOTS_CAP_WITHOUT_DURATION = 100

export function computeMaxSlots(start, end, slotDuration) {
  const startMin = parseTimeToMinutes(start)
  const endMin = parseTimeToMinutes(end)
  const duration = Number(slotDuration)
  if (!Number.isFinite(startMin) || !Number.isFinite(endMin) || !Number.isFinite(duration) || duration <= 0) {
    return 0
  }
  if (endMin <= startMin) return 0
  return Math.floor((endMin - startMin) / duration)
}

export function hasValidSlotDuration(slotDuration) {
  if (slotDuration === '' || slotDuration == null) return false
  const duration = Number(slotDuration)
  return Number.isFinite(duration) && duration > 0
}

/** Max allowed slots: computed from time + duration, or 100 when duration is blank. */
export function resolveSlotsCap(window = {}) {
  if (hasValidSlotDuration(window.slotDuration)) {
    const max = computeMaxSlots(window.start, window.end, Number(window.slotDuration))
    return max > 0 ? max : 0
  }
  return SLOTS_CAP_WITHOUT_DURATION
}

/**
 * Apply field edits with slot/duration rules:
 * - Duration optional; both duration and slots can be cleared while editing.
 * - With duration: auto-fill slots from time range when time/duration changes (if slots empty or over cap).
 * - Without duration: allow manual slots up to 100.
 */
export function applyTimeWindowPatch(window = {}, field, value) {
  const next = { ...window, [field]: value }

  if ((field === 'slotDuration' || field === 'slotsPerDay') && (value === '' || value == null)) {
    if (field === 'slotDuration') {
      const slots = Number(next.slotsPerDay)
      if (Number.isFinite(slots) && slots > SLOTS_CAP_WITHOUT_DURATION) {
        next.slotsPerDay = SLOTS_CAP_WITHOUT_DURATION
      }
    }
    return next
  }

  const hasDuration = hasValidSlotDuration(next.slotDuration)
  const cap = resolveSlotsCap(next)

  if (hasDuration && cap > 0 && (field === 'start' || field === 'end' || field === 'slotDuration')) {
    const slots = next.slotsPerDay
    if (slots === '' || slots == null || Number(slots) > cap) {
      next.slotsPerDay = cap
    }
  }

  if (next.slotsPerDay !== '' && next.slotsPerDay != null) {
    const slots = Number(next.slotsPerDay)
    if (Number.isFinite(slots) && slots > 0) {
      const limit = hasDuration && cap > 0 ? cap : SLOTS_CAP_WITHOUT_DURATION
      if (slots > limit) next.slotsPerDay = limit
    }
  }

  return next
}

/** Clamp slots to cap and align with duration rules before persisting a rule. */
export function normalizeTimeWindow(window = {}) {
  let next = { ...window }
  for (const field of ['start', 'end', 'slotDuration']) {
    next = applyTimeWindowPatch(next, field, next[field])
  }
  return applyTimeWindowPatch(next, 'slotsPerDay', next.slotsPerDay)
}

export function validateTimeWindow(window, labelPrefix = '') {
  const errors = {}
  const startMin = parseTimeToMinutes(window.start)
  const endMin = parseTimeToMinutes(window.end)
  const hasDuration = hasValidSlotDuration(window.slotDuration)
  const max = hasDuration ? computeMaxSlots(window.start, window.end, Number(window.slotDuration)) : 0

  if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) {
    errors[`${labelPrefix}time`] = 'Select valid start and end times.'
    return errors
  }
  if (endMin <= startMin) {
    errors[`${labelPrefix}time`] = 'End time must be later than start time.'
  }

  if (hasDuration && max <= 0 && endMin > startMin) {
    errors[`${labelPrefix}duration`] = 'Slot duration does not fit in the selected time range.'
  }

  const duration = Number(window.slotDuration)
  if (window.slotDuration !== '' && window.slotDuration != null && (!Number.isFinite(duration) || duration <= 0)) {
    errors[`${labelPrefix}duration`] = 'Enter a valid duration in minutes, or leave blank.'
  }

  const slots = Number(window.slotsPerDay)
  if (window.slotsPerDay === '' || window.slotsPerDay == null || !Number.isFinite(slots) || slots <= 0) {
    errors[`${labelPrefix}slots`] = 'Enter a positive number of slots.'
  } else if (hasDuration && max > 0 && slots > max) {
    errors[`${labelPrefix}slots`] = `Maximum ${max} slots for this time range and duration.`
  } else if (!hasDuration && slots > SLOTS_CAP_WITHOUT_DURATION) {
    errors[`${labelPrefix}slots`] = `Maximum ${SLOTS_CAP_WITHOUT_DURATION} slots when duration is not set.`
  }

  return errors
}

function windowsOverlap(a, b) {
  const aStart = parseTimeToMinutes(a.start)
  const aEnd = parseTimeToMinutes(a.end)
  const bStart = parseTimeToMinutes(b.start)
  const bEnd = parseTimeToMinutes(b.end)
  if ([aStart, aEnd, bStart, bEnd].some((v) => !Number.isFinite(v))) return false
  return aStart < bEnd && bStart < aEnd
}

export function validateWeeklyDay(dayKey, day) {
  const errors = {}
  if (!day?.enabled) return errors

  const slots = day.slots ?? []
  if (!slots.length) {
    errors[`${dayKey}-general`] = 'Add at least one time slot or mark the day unavailable.'
    return errors
  }

  slots.forEach((slot, index) => {
    Object.assign(errors, validateTimeWindow(slot, `${dayKey}-${index}-`))
    for (let j = 0; j < index; j += 1) {
      if (windowsOverlap(slots[j], slot)) {
        errors[`${dayKey}-${index}-overlap`] = 'Time slots overlap with another schedule.'
        break
      }
    }
  })
  return errors
}

function ruleSignature(rule) {
  return JSON.stringify({
    weeks: (rule.weeks ?? []).slice().sort(),
    day: rule.dayKey,
    start: rule.start,
    end: rule.end,
  })
}

export function validateConsultationSchedule(schedule) {
  /** @type {Record<string, string>} */
  const errors = {}

  if (schedule.scheduleType === 'RECURRING') {
    const { pattern, weekly, monthlyRules } = schedule.recurring ?? {}

    if (pattern === 'WEEKLY') {
      let anyEnabled = false
      WEEK_DAYS.forEach(({ key }) => {
        const day = weekly?.[key]
        if (day?.enabled) anyEnabled = true
        Object.assign(errors, validateWeeklyDay(key, day))
      })
      if (!anyEnabled) errors.scheduleGeneral = 'Enable at least one day in the weekly schedule.'
    }

    if (pattern === 'MONTHLY') {
      if (!monthlyRules?.length) {
        errors.scheduleGeneral = 'Add at least one monthly availability rule.'
      }
      const seen = new Set()
      monthlyRules?.forEach((rule, index) => {
        if (!rule.weeks?.length) errors[`monthly-${index}-weeks`] = 'Select at least one week of the month.'
        if (!rule.dayKey) errors[`monthly-${index}-day`] = 'Select a day.'
        Object.assign(errors, validateTimeWindow(rule, `monthly-${index}-`))
        const sig = ruleSignature(rule)
        if (seen.has(sig)) errors[`monthly-${index}-dup`] = 'Duplicate schedule rule.'
        seen.add(sig)
      })
    }

  }

  if (schedule.scheduleType === 'CUSTOM_DATE') {
    const { specificDates, repeatingDayRules } = schedule.customDates ?? {}
    const hasDates = specificDates?.length > 0
    const hasRepeat = repeatingDayRules?.length > 0
    if (!hasDates && !hasRepeat) {
      errors.scheduleGeneral = 'Add specific dates or a repeating day rule.'
    }

    specificDates?.forEach((entry, dateIndex) => {
      if (!entry.date) errors[`date-${dateIndex}-date`] = 'Select a date.'
      const slots = entry.slots ?? []
      if (!slots.length) errors[`date-${dateIndex}-slots`] = 'Add at least one time window.'
      slots.forEach((slot, slotIndex) => {
        Object.assign(errors, validateTimeWindow(slot, `date-${dateIndex}-${slotIndex}-`))
        for (let j = 0; j < slotIndex; j += 1) {
          if (windowsOverlap(slots[j], slot)) {
            errors[`date-${dateIndex}-${slotIndex}-overlap`] = 'Time slots overlap with another schedule.'
          }
        }
      })
    })

    const seenRepeat = new Set()
    repeatingDayRules?.forEach((rule, index) => {
      if (!rule.weekOfMonth) errors[`repeat-${index}-week`] = 'Select week of month.'
      if (!rule.dayKey) errors[`repeat-${index}-day`] = 'Select a day.'
      Object.assign(errors, validateTimeWindow(rule, `repeat-${index}-`))
      const sig = `${rule.weekOfMonth}-${rule.dayKey}-${rule.start}-${rule.end}`
      if (seenRepeat.has(sig)) errors[`repeat-${index}-dup`] = 'Duplicate schedule rule.'
      seenRepeat.add(sig)
    })
  }

  return errors
}

export function syncLegacyScheduleFromConsultation(consultationSchedule) {
  const legacy = createDefaultSchedule()
  Object.keys(legacy).forEach((key) => {
    legacy[key] = { enabled: false, slots: [] }
  })

  const cs = consultationSchedule ?? createDefaultConsultationSchedule()

  if (cs.scheduleType === 'RECURRING' && cs.recurring?.pattern === 'WEEKLY') {
    WEEK_DAYS.forEach(({ key }) => {
      const day = cs.recurring.weekly?.[key]
      legacy[key] = {
        enabled: Boolean(day?.enabled),
        slots: (day?.slots ?? []).map(({ start, end }) => ({ start, end })),
      }
    })
    return legacy
  }

  if (cs.scheduleType === 'RECURRING' && cs.recurring?.pattern === 'MONTHLY' && cs.recurring.monthlyRules?.length) {
    const rule = cs.recurring.monthlyRules[0]
    if (rule.dayKey && legacy[rule.dayKey]) {
      legacy[rule.dayKey] = {
        enabled: true,
        slots: [{ start: rule.start, end: rule.end }],
      }
    }
    return legacy
  }

  if (cs.scheduleType === 'CUSTOM_DATE' && cs.customDates?.specificDates?.length) {
    const first = cs.customDates.specificDates[0]
    const date = new Date(`${first.date}T12:00:00`)
    const dayIndex = date.getDay()
    const map = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const key = map[dayIndex]
    if (key && legacy[key]) {
      legacy[key] = {
        enabled: true,
        slots: (first.slots ?? []).map(({ start, end }) => ({ start, end })),
      }
    }
  }

  return legacy
}

export function consultationScheduleFromLegacySchedule(schedule) {
  const base = createDefaultConsultationSchedule()
  WEEK_DAYS.forEach(({ key }) => {
    const day = schedule?.[key] ?? { enabled: false, slots: [] }
    base.recurring.weekly[key] = {
      enabled: Boolean(day.enabled),
      slots: (day.slots ?? []).map((slot) =>
        createDefaultTimeWindow({
          start: slot.start,
          end: slot.end,
          slotsPerDay: computeMaxSlots(slot.start, slot.end, 30) || 10,
        }),
      ),
    }
    if (base.recurring.weekly[key].enabled && !base.recurring.weekly[key].slots.length) {
      base.recurring.weekly[key].slots = [createDefaultTimeWindow()]
    }
  })
  return base
}

function dayLabel(key) {
  return WEEK_DAYS.find((d) => d.key === key)?.label ?? key
}

function formatWeeksList(weeks = []) {
  const labels = weeks
    .map((w) => MONTH_WEEK_OPTIONS.find((o) => o.id === w)?.label ?? w)
    .filter(Boolean)
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  if (labels.length > 2) return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
  return ''
}

export function buildScheduleSummaryLines(schedule) {
  const lines = []
  const cs = schedule ?? createDefaultConsultationSchedule()

  if (cs.scheduleType === 'RECURRING') {
    const { pattern, weekly, monthlyRules } = cs.recurring ?? {}

    if (pattern === 'WEEKLY') {
      WEEK_DAYS.forEach(({ key, label }) => {
        const day = weekly?.[key]
        if (!day?.enabled) return
        day.slots?.forEach((slot) => {
          lines.push({
            title: label,
            time: `${slot.start} – ${slot.end}`,
            meta: `${slot.slotDuration} min · ${slot.slotsPerDay} slots`,
          })
        })
      })
    }

    if (pattern === 'MONTHLY') {
      monthlyRules?.forEach((rule) => {
        const weeks = formatWeeksList(rule.weeks)
        lines.push({
          title: `${weeks} ${dayLabel(rule.dayKey)}`.trim(),
          time: `${rule.start} – ${rule.end}`,
          meta: `${rule.slotDuration} min · ${rule.slotsPerDay} slots per day`,
        })
      })
    }

  }

  if (cs.scheduleType === 'CUSTOM_DATE') {
    cs.customDates?.specificDates?.forEach((entry) => {
      entry.slots?.forEach((slot) => {
        lines.push({
          title: entry.date,
          time: `${slot.start} – ${slot.end}`,
          meta: `${slot.slotDuration} min · ${slot.slotsPerDay} slots`,
        })
      })
    })
    cs.customDates?.repeatingDayRules?.forEach((rule) => {
      const week = MONTH_WEEK_OPTIONS.find((w) => w.id === rule.weekOfMonth)?.label ?? rule.weekOfMonth
      lines.push({
        title: `${week} ${dayLabel(rule.dayKey)}`,
        time: `${rule.start} – ${rule.end}`,
        meta: `${rule.slotDuration} min · ${rule.slotsPerDay} slots`,
      })
    })
  }

  return lines
}

export function buildMonthlyRuleSummary(rule) {
  const weeks = formatWeeksList(rule.weeks)
  const day = dayLabel(rule.dayKey)
  return `This doctor will be available on the ${weeks} ${day} of every month from ${rule.start} to ${rule.end} with ${rule.slotsPerDay} slots per day.`
}

export function formatDisplayDate(isoDate) {
  if (!isoDate) return '—'
  const parsed = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function weekdayFromIsoDate(isoDate) {
  if (!isoDate) return '—'
  const parsed = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-IN', { weekday: 'short' })
}
