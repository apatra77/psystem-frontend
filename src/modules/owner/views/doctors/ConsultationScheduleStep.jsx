import { useState } from 'react'
import { Calendar, CalendarDays, Info, Plus, Trash2 } from 'lucide-react'
import { ModalFieldLabel, ModalInput, ModalSelect, ToggleSwitch } from '../../components/PortalModal'
import { WEEK_DAYS } from '../../data/doctorsData'
import { TIME_SLOT_OPTIONS } from './doctorUtils'
import {
  MONTH_WEEK_OPTIONS,
  SLOTS_CAP_WITHOUT_DURATION,
  applyTimeWindowPatch,
  buildMonthlyRuleSummary,
  buildScheduleSummaryLines,
  createDefaultTimeWindow,
  formatDisplayDate,
  hasValidSlotDuration,
  nextScheduleId,
  resolveSlotsCap,
  validateTimeWindow,
  weekdayFromIsoDate,
} from './consultationScheduleModel'
import { colors } from '@/theme/colors'

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-[10.5px] font-bold text-red-400">{message}</p>
}

const SCHEDULE_SELECT_WRAPPER = 'w-full min-w-0'
const SCHEDULE_CONTROL_INNER =
  '!h-[38px] !min-h-[38px] !max-h-[38px] !py-0 px-3 text-[12px] !leading-[38px] box-border'

function parseOptionalCount(raw) {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return ''
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits)
}

function SlotDurationInput({ value, onChange, className = '' }) {
  return (
    <div className={`relative min-w-0 w-full h-full ${className}`}>
      <ModalInput
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="—"
        value={value === '' || value == null ? '' : String(value)}
        onChange={(e) => onChange(parseOptionalCount(e.target.value))}
        className={`${SCHEDULE_CONTROL_INNER} w-full pr-9`}
        aria-label="Slot duration in minutes"
      />
      <span
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold pointer-events-none"
        style={{ color: colors.textDim }}
      >
        min
      </span>
    </div>
  )
}

function SlotsPerDayInput({ value, onChange, slotsCap, className = '' }) {
  return (
    <ModalInput
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="—"
      value={value === '' || value == null ? '' : String(value)}
      onChange={(e) => onChange(parseOptionalCount(e.target.value))}
      className={`${SCHEDULE_CONTROL_INNER} w-full ${className}`}
      aria-label={`Slots per day, maximum ${slotsCap}`}
    />
  )
}

function RadioScheduleCard({ selected, title, description, icon: Icon, iconTone, onSelect, name }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      name={name}
      onClick={onSelect}
      className="flex-1 min-w-[200px] text-left rounded-[14px] p-4 cursor-pointer transition-shadow"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: selected ? '1px solid rgba(64,222,170,0.75)' : `1px solid ${colors.borderSubtle}`,
        boxShadow: selected ? '0 0 0 1px rgba(64,222,170,0.25), 0 8px 24px rgba(64,222,170,0.12)' : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{
            background: iconTone === 'blue' ? 'rgba(59,130,246,0.18)' : 'rgba(64,222,170,0.16)',
            border: iconTone === 'blue' ? '1px solid rgba(96,165,250,0.35)' : '1px solid rgba(64,222,170,0.35)',
          }}
        >
          <Icon size={18} style={{ color: iconTone === 'blue' ? '#93c5fd' : colors.accent }} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: selected ? colors.accent : 'rgba(255,255,255,0.25)' }}
            >
              {selected ? <span className="w-2 h-2 rounded-full" style={{ background: colors.accent }} /> : null}
            </span>
            <span className="text-[13px] font-extrabold text-white">{title}</span>
          </div>
          <p className="text-[11px] mt-1.5 leading-snug pl-6" style={{ color: colors.textDim }}>
            {description}
          </p>
        </div>
      </div>
    </button>
  )
}

function PatternTab({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3.5 py-2 rounded-[9px] text-[11.5px] font-bold cursor-pointer whitespace-nowrap"
      style={{
        color: active ? colors.accentText : colors.textMuted,
        background: active ? colors.accent : 'rgba(255,255,255,0.04)',
        border: active ? '1px solid rgba(64,222,170,0.5)' : `1px solid ${colors.borderSubtle}`,
      }}
    >
      {label}
    </button>
  )
}

function TimeWindowFields({
  window,
  onChange,
  onRemove,
  showRemove,
  errors = {},
  errorPrefix = '',
  compact = false,
}) {
  const slotsCap = resolveSlotsCap(window)
  const patch = (field, value) => onChange(applyTimeWindowPatch(window, field, value))
  const slotsHint = hasValidSlotDuration(window.slotDuration) && slotsCap > 0
    ? `${slotsCap} slot${slotsCap === 1 ? '' : 's'} fit this time range`
    : `Up to ${SLOTS_CAP_WITHOUT_DURATION} slots without duration`

  const gridClass = showRemove
    ? 'grid-cols-2 md:[grid-template-columns:minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(72px,0.7fr)_minmax(64px,0.55fr)_36px]'
    : 'grid-cols-2 md:[grid-template-columns:minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(72px,0.7fr)_minmax(64px,0.55fr)]'

  return (
    <div className={`${compact ? '' : 'w-full min-w-0'}`}>
      <div className={`grid w-full min-w-0 gap-x-2 gap-y-2 items-end ${gridClass}`}>
        <div className="min-w-0">
          {!compact ? <ModalFieldLabel>Start Time</ModalFieldLabel> : null}
          <div className="h-[38px] flex items-center">
            <ModalSelect
              value={window.start}
              onChange={(e) => patch('start', e.target.value)}
              options={TIME_SLOT_OPTIONS}
              className={SCHEDULE_SELECT_WRAPPER}
              inputClassName={SCHEDULE_CONTROL_INNER}
            />
          </div>
        </div>
        <div className="min-w-0">
          {!compact ? <ModalFieldLabel>End Time</ModalFieldLabel> : null}
          <div className="h-[38px] flex items-center">
            <ModalSelect
              value={window.end}
              onChange={(e) => patch('end', e.target.value)}
              options={TIME_SLOT_OPTIONS}
              className={SCHEDULE_SELECT_WRAPPER}
              inputClassName={SCHEDULE_CONTROL_INNER}
            />
          </div>
        </div>
        <div className="min-w-0">
          {!compact ? <ModalFieldLabel>Duration</ModalFieldLabel> : null}
          <div className="h-[38px] flex items-center">
            <SlotDurationInput value={window.slotDuration} onChange={(slotDuration) => patch('slotDuration', slotDuration)} />
          </div>
        </div>
        <div className="min-w-0">
          {!compact ? <ModalFieldLabel>Slots</ModalFieldLabel> : null}
          <div className="h-[38px] flex items-center">
            <SlotsPerDayInput
              value={window.slotsPerDay}
              slotsCap={slotsCap}
              onChange={(slotsPerDay) => patch('slotsPerDay', slotsPerDay)}
            />
          </div>
        </div>
        {showRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="w-9 h-9 mb-0.5 rounded-lg flex items-center justify-center cursor-pointer md:justify-self-end"
            style={{ border: `1px solid ${colors.borderSubtle}` }}
            aria-label="Remove time slot"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        ) : null}
      </div>
      {!compact ? (
        <p className="text-[10px] mt-1.5 font-semibold" style={{ color: colors.textDim }}>
          {slotsHint}
        </p>
      ) : null}
      <FieldError message={errors[`${errorPrefix}time`] || errors[`${errorPrefix}duration`] || errors[`${errorPrefix}slots`] || errors[`${errorPrefix}overlap`]} />
    </div>
  )
}

function WeeklyScheduleTable({ weekly, onChange, errors }) {
  const updateDay = (dayKey, patch) => {
    onChange({ ...weekly, [dayKey]: { ...weekly[dayKey], ...patch } })
  }

  const patchSlot = (dayKey, slotIndex, field, value) => {
    const day = weekly[dayKey]
    const slots = day.slots.map((slot, index) => {
      if (index !== slotIndex) return slot
      return applyTimeWindowPatch(slot, field, value)
    })
    updateDay(dayKey, { slots })
  }

  const setDayEnabled = (dayKey, enabled) => {
    const current = weekly[dayKey] ?? { enabled: false, slots: [] }
    updateDay(dayKey, {
      enabled,
      slots: enabled ? (current.slots?.length ? current.slots : [createDefaultTimeWindow()]) : [],
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-[13px] font-extrabold text-white">Set Weekly Schedule</h4>
        <p className="text-[11px] mt-1" style={{ color: colors.textDim }}>
          Select the days, time slots and number of slots per day.
        </p>
      </div>

      <div className="overflow-x-auto owner-scroll rounded-[12px]" style={{ border: `1px solid ${colors.borderSubtle}` }}>
        <table className="w-full table-fixed text-[11.5px]">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
              {['Day', 'Available', 'Start Time', 'End Time', 'Slot Duration', 'Slots per Day', 'Actions'].map((h) => (
                <th key={h} className="text-left font-extrabold px-3 py-2.5" style={{ color: colors.textDim }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEK_DAYS.map(({ key, label }) => {
              const day = weekly[key] ?? { enabled: false, slots: [] }
              const disabled = !day.enabled
              return day.enabled && day.slots?.length
                ? day.slots.map((slot, slotIndex) => (
                    <tr key={`${key}-${slot.id ?? slotIndex}`} style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
                      {slotIndex === 0 ? (
                        <td className="px-3 py-3 align-top font-bold text-white" rowSpan={day.slots.length}>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={day.enabled}
                              onChange={(e) => setDayEnabled(key, e.target.checked)}
                              className="h-3.5 w-3.5 cursor-pointer"
                              style={{ accentColor: colors.accent }}
                              aria-label={`${label} selected`}
                            />
                            {label}
                          </div>
                        </td>
                      ) : null}
                      {slotIndex === 0 ? (
                        <td className="px-3 py-3 align-top" rowSpan={day.slots.length}>
                          <div className="flex items-center gap-2">
                            <ToggleSwitch on={day.enabled} onToggle={() => setDayEnabled(key, !day.enabled)} />
                            <span className="font-semibold" style={{ color: day.enabled ? colors.accent : colors.textDim }}>
                              {day.enabled ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </td>
                      ) : null}
                      {disabled ? (
                        slotIndex === 0 ? (
                          <td colSpan={5} className="px-3 py-3 text-[12px] font-semibold" style={{ color: colors.textDim }}>
                            Not available
                          </td>
                        ) : null
                      ) : (
                        <>
                          <td className="px-2 py-2 align-middle">
                            <div className="h-[38px] flex items-center">
                              <ModalSelect
                                value={slot.start}
                                onChange={(e) => patchSlot(key, slotIndex, 'start', e.target.value)}
                                options={TIME_SLOT_OPTIONS}
                                className={SCHEDULE_SELECT_WRAPPER}
                                inputClassName={SCHEDULE_CONTROL_INNER}
                              />
                            </div>
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <div className="h-[38px] flex items-center">
                              <ModalSelect
                                value={slot.end}
                                onChange={(e) => patchSlot(key, slotIndex, 'end', e.target.value)}
                                options={TIME_SLOT_OPTIONS}
                                className={SCHEDULE_SELECT_WRAPPER}
                                inputClassName={SCHEDULE_CONTROL_INNER}
                              />
                            </div>
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <div className="h-[38px] flex items-center">
                              <SlotDurationInput
                                value={slot.slotDuration}
                                onChange={(slotDuration) => patchSlot(key, slotIndex, 'slotDuration', slotDuration)}
                              />
                            </div>
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <div className="h-[38px] flex items-center">
                              <SlotsPerDayInput
                                value={slot.slotsPerDay}
                                slotsCap={resolveSlotsCap(slot)}
                                onChange={(slotsPerDay) => patchSlot(key, slotIndex, 'slotsPerDay', slotsPerDay)}
                              />
                            </div>
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <div className="flex items-center gap-1 h-[38px]">
                              {slotIndex === day.slots.length - 1 ? (
                                <button
                                  type="button"
                                  onClick={() => updateDay(key, { slots: [...day.slots, createDefaultTimeWindow({ start: '02:00 PM', end: '05:00 PM' })] })}
                                  className="text-[10px] font-bold px-2 py-1 rounded-md cursor-pointer whitespace-nowrap"
                                  style={{ color: colors.accent, border: '1px solid rgba(64,222,170,0.35)' }}
                                >
                                  + Add time slot
                                </button>
                              ) : null}
                              {day.slots.length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => updateDay(key, { slots: day.slots.filter((_, i) => i !== slotIndex) })}
                                  className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer"
                                  style={{ border: `1px solid ${colors.borderSubtle}` }}
                                  aria-label="Remove slot"
                                >
                                  <Trash2 size={13} className="text-red-400" />
                                </button>
                              ) : null}
                            </div>
                            <FieldError message={errors[`${key}-${slotIndex}-time`] || errors[`${key}-${slotIndex}-overlap`] || errors[`${key}-${slotIndex}-slots`]} />
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                : (
                    <tr key={key} style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
                      <td className="px-3 py-3 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => setDayEnabled(key, true)}
                            className="h-3.5 w-3.5 cursor-pointer"
                            style={{ accentColor: colors.accent }}
                          />
                          {label}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <ToggleSwitch on={false} onToggle={() => setDayEnabled(key, true)} />
                      </td>
                      <td colSpan={5} className="px-3 py-3 text-[12px] font-semibold" style={{ color: colors.textDim }}>
                        Not available
                      </td>
                    </tr>
                  )
            })}
          </tbody>
        </table>
      </div>

      <div
        className="flex gap-2 rounded-[10px] px-3 py-2.5 text-[11px] leading-snug"
        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(96,165,250,0.28)', color: colors.textSecondary }}
      >
        <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#93c5fd' }} />
        Each time slot will be divided into the selected slot duration. For example, 09:00 AM – 01:00 PM with 30 minutes duration creates 8 possible slots.
      </div>
      <FieldError message={errors.scheduleGeneral} />
    </div>
  )
}

function MonthlySchedulePanel({ rules, onChange, errors }) {
  const [draft, setDraft] = useState({
    weeks: ['2', '4'],
    dayKey: 'thursday',
    start: '09:00 AM',
    end: '05:00 PM',
    slotDuration: 30,
    slotsPerDay: 20,
  })

  const toggleWeek = (weekId) => {
    setDraft((prev) => ({
      ...prev,
      weeks: prev.weeks.includes(weekId) ? prev.weeks.filter((w) => w !== weekId) : [...prev.weeks, weekId],
    }))
  }

  const addRule = () => {
    onChange([
      ...rules,
      { id: nextScheduleId('monthly'), ...draft, weeks: [...draft.weeks].sort() },
    ])
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[12px] p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}>
        <ModalFieldLabel>Select Week(s) of Month</ModalFieldLabel>
        <div className="flex flex-wrap gap-3">
          {MONTH_WEEK_OPTIONS.map((w) => (
            <label key={w.id} className="flex items-center gap-1.5 text-[12px] font-semibold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={draft.weeks.includes(w.id)}
                onChange={() => toggleWeek(w.id)}
                className="h-3.5 w-3.5"
                style={{ accentColor: colors.accent }}
              />
              {w.label}
            </label>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <ModalFieldLabel>Day</ModalFieldLabel>
            <ModalSelect
              value={draft.dayKey}
              onChange={(e) => setDraft((p) => ({ ...p, dayKey: e.target.value }))}
              options={WEEK_DAYS.map((d) => ({ value: d.key, label: d.label }))}
            />
          </div>
        </div>
        <TimeWindowFields window={draft} onChange={setDraft} errorPrefix="monthly-draft-" errors={errors} />
        <button
          type="button"
          onClick={addRule}
          className="inline-flex items-center gap-1 text-[11.5px] font-extrabold px-3 py-2 rounded-[9px] cursor-pointer"
          style={{ color: colors.accent, border: '1px solid rgba(64,222,170,0.4)' }}
        >
          <Plus size={14} />
          Add Rule
        </button>
      </div>

      {rules.length ? (
        <div className="overflow-x-auto rounded-[12px]" style={{ border: `1px solid ${colors.borderSubtle}` }}>
          <table className="w-full min-w-[520px] text-[11.5px]">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                {['Week(s)', 'Day', 'Time', 'Slots', 'Actions'].map((h) => (
                  <th key={h} className="text-left font-extrabold px-3 py-2" style={{ color: colors.textDim }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, index) => (
                <tr key={rule.id} style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
                  <td className="px-3 py-2.5 text-white font-semibold">
                    {rule.weeks.map((w) => MONTH_WEEK_OPTIONS.find((o) => o.id === w)?.label ?? w).join(', ')}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: colors.textMuted }}>
                    {WEEK_DAYS.find((d) => d.key === rule.dayKey)?.label}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: colors.textMuted }}>
                    {rule.start} – {rule.end} · {rule.slotDuration} min
                  </td>
                  <td className="px-3 py-2.5 text-white">{rule.slotsPerDay}</td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => onChange(rules.filter((r) => r.id !== rule.id))}
                      className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer"
                      style={{ border: `1px solid ${colors.borderSubtle}` }}
                      aria-label="Delete rule"
                    >
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                    <FieldError message={errors[`monthly-${index}-dup`] || errors[`monthly-${index}-time`]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {rules[0] ? (
        <div className="rounded-[10px] px-3 py-2.5 text-[11.5px] font-semibold" style={{ background: 'rgba(64,222,170,0.08)', border: '1px solid rgba(64,222,170,0.28)', color: colors.textSecondary }}>
          {buildMonthlyRuleSummary(rules[0])}
        </div>
      ) : null}
      <FieldError message={errors.scheduleGeneral} />
    </div>
  )
}

function CustomPatternPanel({ rules, onChange, errors }) {
  const [draft, setDraft] = useState({
    every: 2,
    days: ['monday', 'wednesday', 'friday'],
    start: '09:00 AM',
    end: '01:00 PM',
    slotDuration: 30,
    slotsPerDay: 10,
  })

  const toggleDay = (dayKey) => {
    setDraft((prev) => ({
      ...prev,
      days: prev.days.includes(dayKey) ? prev.days.filter((d) => d !== dayKey) : [...prev.days, dayKey],
    }))
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[12px] p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}>
        <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3">
          <div>
            <ModalFieldLabel>Every</ModalFieldLabel>
            <ModalInput type="number" min="1" max="12" value={draft.every} onChange={(e) => setDraft((p) => ({ ...p, every: Number(e.target.value) || 1 }))} />
            <span className="text-[10px] mt-1 block" style={{ color: colors.textDim }}>
              weeks
            </span>
          </div>
        </div>
        <ModalFieldLabel>Days</ModalFieldLabel>
        <div className="flex flex-wrap gap-2">
          {WEEK_DAYS.map(({ key, label }) => {
            const active = draft.days.includes(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleDay(key)}
                className="px-2.5 py-1.5 rounded-[8px] text-[11px] font-bold cursor-pointer"
                style={{
                  color: active ? colors.accentText : colors.textMuted,
                  background: active ? colors.accent : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? 'rgba(64,222,170,0.45)' : colors.borderSubtle}`,
                }}
              >
                {label.slice(0, 3)}
              </button>
            )
          })}
        </div>
        <TimeWindowFields window={draft} onChange={setDraft} errorPrefix="custom-draft-" errors={errors} />
        <button
          type="button"
          onClick={() => onChange([...rules, { id: nextScheduleId('custom'), ...draft }])}
          className="inline-flex items-center gap-1 text-[11.5px] font-extrabold px-3 py-2 rounded-[9px] cursor-pointer"
          style={{ color: colors.accent, border: '1px solid rgba(64,222,170,0.4)' }}
        >
          <Plus size={14} />
          Add Rule
        </button>
      </div>
      {rules.map((rule, index) => (
        <div key={rule.id} className="flex items-center justify-between rounded-[10px] px-3 py-2 text-[11.5px]" style={{ border: `1px solid ${colors.borderSubtle}` }}>
          <span style={{ color: colors.textMuted }}>
            Every {rule.every} week(s): {(rule.days ?? []).map((d) => WEEK_DAYS.find((w) => w.key === d)?.label).join(', ')} · {rule.start}–{rule.end}
          </span>
          <button type="button" onClick={() => onChange(rules.filter((r) => r.id !== rule.id))} className="cursor-pointer" aria-label="Remove">
            <Trash2 size={14} className="text-red-400" />
          </button>
          <FieldError message={errors[`custom-${index}-days`]} />
        </div>
      ))}
      <FieldError message={errors.scheduleGeneral} />
    </div>
  )
}

function CustomDatesPanel({ customDates, onChange, errors }) {
  const [dateDraft, setDateDraft] = useState({
    date: '',
    start: '09:00 AM',
    end: '01:00 PM',
    slotDuration: 30,
    slotsPerDay: 10,
  })
  const [dateDraftError, setDateDraftError] = useState('')

  const [repeatDraft, setRepeatDraft] = useState({
    weekOfMonth: '2',
    dayKey: 'thursday',
    start: '09:00 AM',
    end: '05:00 PM',
    slotDuration: 30,
    slotsPerDay: 20,
  })

  const addSpecificDate = () => {
    if (!dateDraft.date) {
      setDateDraftError('Select a date.')
      return
    }
    const windowErrors = validateTimeWindow(dateDraft, 'date-draft-')
    if (Object.keys(windowErrors).length) {
      setDateDraftError(windowErrors['date-draft-time'] || windowErrors['date-draft-duration'] || windowErrors['date-draft-slots'] || 'Fix the time slot details.')
      return
    }
    setDateDraftError('')
    onChange({
      ...customDates,
      specificDates: [
        ...customDates.specificDates,
        {
          id: nextScheduleId('date'),
          date: dateDraft.date,
          slots: [
            createDefaultTimeWindow({
              start: dateDraft.start,
              end: dateDraft.end,
              slotDuration: dateDraft.slotDuration,
              slotsPerDay: dateDraft.slotsPerDay,
            }),
          ],
        },
      ],
    })
    setDateDraft((prev) => ({ ...prev, date: '' }))
  }

  const removeSpecificDate = (entryId) => {
    onChange({
      ...customDates,
      specificDates: customDates.specificDates.filter((entry) => entry.id !== entryId),
    })
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h4 className="text-[13px] font-extrabold text-white">Add Specific Dates</h4>
          <p className="text-[11px] mt-1" style={{ color: colors.textDim }}>
            Select the dates, time slots and number of slots for consultation.
          </p>
        </div>
        <div className="rounded-[12px] p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}>
          <div className="max-w-[220px]">
            <ModalFieldLabel>Date</ModalFieldLabel>
            <ModalInput
              type="date"
              value={dateDraft.date}
              onChange={(e) => {
                setDateDraftError('')
                setDateDraft((prev) => ({ ...prev, date: e.target.value }))
              }}
            />
          </div>
          <TimeWindowFields
            window={dateDraft}
            onChange={(next) => {
              setDateDraftError('')
              setDateDraft(next)
            }}
            errorPrefix="date-draft-"
            errors={errors}
          />
          {dateDraftError ? <FieldError message={dateDraftError} /> : null}
          <button
            type="button"
            onClick={addSpecificDate}
            className="inline-flex items-center gap-1 text-[11.5px] font-extrabold px-3 py-2 rounded-[9px] cursor-pointer"
            style={{ color: colors.accent, border: '1px solid rgba(64,222,170,0.4)' }}
          >
            <Plus size={14} />
            Add Date
          </button>
        </div>

        {customDates.specificDates.length ? (
          <div className="overflow-x-auto rounded-[12px]" style={{ border: `1px solid ${colors.borderSubtle}` }}>
            <table className="w-full min-w-[560px] text-[11.5px]">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['Date', 'Day', 'Time', 'Duration', 'Slots', 'Actions'].map((h) => (
                    <th key={h} className="text-left font-extrabold px-3 py-2" style={{ color: colors.textDim }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customDates.specificDates.map((entry, dateIndex) => {
                  const slot = entry.slots?.[0] ?? createDefaultTimeWindow()
                  return (
                    <tr key={entry.id} style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
                      <td className="px-3 py-2.5 text-white font-semibold">{formatDisplayDate(entry.date)}</td>
                      <td className="px-3 py-2.5" style={{ color: colors.textMuted }}>
                        {weekdayFromIsoDate(entry.date)}
                      </td>
                      <td className="px-3 py-2.5" style={{ color: colors.textMuted }}>
                        {slot.start} – {slot.end}
                      </td>
                      <td className="px-3 py-2.5">{slot.slotDuration} min</td>
                      <td className="px-3 py-2.5">{slot.slotsPerDay}</td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => removeSpecificDate(entry.id)}
                          className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer"
                          style={{ border: `1px solid ${colors.borderSubtle}` }}
                          aria-label="Remove date"
                        >
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                        <FieldError
                          message={
                            errors[`date-${dateIndex}-0-time`]
                            || errors[`date-${dateIndex}-0-slots`]
                            || errors[`date-${dateIndex}-0-overlap`]
                          }
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
        <FieldError message={errors.scheduleGeneral} />
      </section>

      <section className="space-y-3 pt-2 border-t" style={{ borderColor: colors.borderSubtle }}>
        <div>
          <h4 className="text-[13px] font-extrabold text-white">Add Repeating Specific Day</h4>
          <p className="text-[11px] mt-1" style={{ color: colors.textDim }}>
            Useful for doctors who visit on specific weekdays of a month.
          </p>
        </div>
        <div className="rounded-[12px] p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <ModalFieldLabel>Week of Month</ModalFieldLabel>
              <ModalSelect
                value={repeatDraft.weekOfMonth}
                onChange={(e) => setRepeatDraft((p) => ({ ...p, weekOfMonth: e.target.value }))}
                options={MONTH_WEEK_OPTIONS.map((w) => ({ value: w.id, label: w.label }))}
              />
            </div>
            <div>
              <ModalFieldLabel>Day</ModalFieldLabel>
              <ModalSelect
                value={repeatDraft.dayKey}
                onChange={(e) => setRepeatDraft((p) => ({ ...p, dayKey: e.target.value }))}
                options={WEEK_DAYS.map((d) => ({ value: d.key, label: d.label }))}
              />
            </div>
          </div>
          <TimeWindowFields window={repeatDraft} onChange={setRepeatDraft} errorPrefix="repeat-draft-" errors={errors} />
          <button
            type="button"
            onClick={() =>
              onChange({
                ...customDates,
                repeatingDayRules: [
                  ...customDates.repeatingDayRules,
                  { id: nextScheduleId('repeat'), ...repeatDraft },
                ],
              })
            }
            className="inline-flex items-center gap-1 text-[11.5px] font-extrabold px-3 py-2 rounded-[9px] cursor-pointer"
            style={{ color: colors.accent, border: '1px solid rgba(64,222,170,0.4)' }}
          >
            <Plus size={14} />
            Add Rule
          </button>
        </div>

        {customDates.repeatingDayRules.length ? (
          <div className="overflow-x-auto rounded-[12px]" style={{ border: `1px solid ${colors.borderSubtle}` }}>
            <table className="w-full min-w-[480px] text-[11.5px]">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['Week', 'Day', 'Time', 'Slots', 'Actions'].map((h) => (
                    <th key={h} className="text-left font-extrabold px-3 py-2" style={{ color: colors.textDim }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customDates.repeatingDayRules.map((rule) => (
                  <tr key={rule.id} style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
                    <td className="px-3 py-2.5 text-white font-semibold">
                      {MONTH_WEEK_OPTIONS.find((w) => w.id === rule.weekOfMonth)?.label}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: colors.textMuted }}>
                      {WEEK_DAYS.find((d) => d.key === rule.dayKey)?.label}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: colors.textMuted }}>
                      {rule.start} – {rule.end}
                    </td>
                    <td className="px-3 py-2.5">{rule.slotsPerDay}</td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...customDates,
                            repeatingDayRules: customDates.repeatingDayRules.filter((r) => r.id !== rule.id),
                          })
                        }
                        className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer"
                        style={{ border: `1px solid ${colors.borderSubtle}` }}
                      >
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
      <FieldError message={errors.scheduleGeneral} />
    </div>
  )
}

function ScheduleSummaryCard({ schedule }) {
  const lines = buildScheduleSummaryLines(schedule)
  if (!lines.length) return null

  return (
    <div
      className="rounded-[12px] px-4 py-3 mt-4"
      style={{ background: 'rgba(64,222,170,0.06)', border: '1px solid rgba(64,222,170,0.22)' }}
    >
      <p className="text-[11px] font-extrabold uppercase tracking-wide mb-2" style={{ color: colors.accent }}>
        Consultation availability
      </p>
      <div className="space-y-2">
        {lines.slice(0, 6).map((line, index) => (
          <div key={`summary-${index}`}>
            <p className="text-[12.5px] font-bold text-white">{line.title}</p>
            <p className="text-[11.5px]" style={{ color: colors.textMuted }}>
              {line.time}
            </p>
            <p className="text-[10.5px]" style={{ color: colors.textDim }}>
              {line.meta}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ConsultationScheduleStep({ value, onChange, errors = {} }) {
  const schedule = value
  const setScheduleType = (scheduleType) => onChange({ ...schedule, scheduleType })
  const setPattern = (pattern) =>
    onChange({
      ...schedule,
      recurring: { ...schedule.recurring, pattern },
    })

  return (
    <div className="space-y-4 pb-2">
      <div>
        <p className="text-[12px] leading-relaxed" style={{ color: colors.textDim }}>
          Define when the doctor is available for consultation. Choose a recurring schedule or specific dates.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3" role="radiogroup" aria-label="Schedule type">
        <RadioScheduleCard
          name="schedule-type"
          selected={schedule.scheduleType === 'RECURRING'}
          title="Recurring Schedule"
          description="Set a regular pattern (weekly or monthly)"
          icon={Calendar}
          onSelect={() => setScheduleType('RECURRING')}
        />
        <RadioScheduleCard
          name="schedule-type"
          selected={schedule.scheduleType === 'CUSTOM_DATE'}
          title="Custom Dates"
          description="Select specific dates for consultation (e.g. once or twice a month)"
          icon={CalendarDays}
          iconTone="blue"
          onSelect={() => setScheduleType('CUSTOM_DATE')}
        />
      </div>

      {schedule.scheduleType === 'RECURRING' ? (
        <>
          <div className="flex flex-wrap gap-2 pt-1" role="tablist" aria-label="Recurring pattern">
            <PatternTab active={schedule.recurring.pattern === 'WEEKLY'} label="Weekly" onClick={() => setPattern('WEEKLY')} />
            <PatternTab active={schedule.recurring.pattern === 'MONTHLY'} label="Monthly" onClick={() => setPattern('MONTHLY')} />
            <PatternTab active={schedule.recurring.pattern === 'CUSTOM'} label="Custom Pattern" onClick={() => setPattern('CUSTOM')} />
          </div>

          {schedule.recurring.pattern === 'WEEKLY' ? (
            <WeeklyScheduleTable
              weekly={schedule.recurring.weekly}
              errors={errors}
              onChange={(weekly) =>
                onChange({
                  ...schedule,
                  recurring: { ...schedule.recurring, weekly },
                })
              }
            />
          ) : null}

          {schedule.recurring.pattern === 'MONTHLY' ? (
            <MonthlySchedulePanel
              rules={schedule.recurring.monthlyRules}
              errors={errors}
              onChange={(monthlyRules) =>
                onChange({
                  ...schedule,
                  recurring: { ...schedule.recurring, monthlyRules },
                })
              }
            />
          ) : null}

          {schedule.recurring.pattern === 'CUSTOM' ? (
            <CustomPatternPanel
              rules={schedule.recurring.customPatternRules}
              errors={errors}
              onChange={(customPatternRules) =>
                onChange({
                  ...schedule,
                  recurring: { ...schedule.recurring, customPatternRules },
                })
              }
            />
          ) : null}
        </>
      ) : (
        <CustomDatesPanel
          customDates={schedule.customDates}
          errors={errors}
          onChange={(customDates) => onChange({ ...schedule, customDates })}
        />
      )}

      <ScheduleSummaryCard schedule={schedule} />
    </div>
  )
}
