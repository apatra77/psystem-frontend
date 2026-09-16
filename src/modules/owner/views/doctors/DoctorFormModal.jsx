import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Camera, Minus, Plus, X } from 'lucide-react'
import PortalModal, { ModalFieldLabel, ModalInput, ModalSelect, ToggleSwitch } from '../../components/PortalModal'
import SpecialtyAutocomplete from '../../components/SpecialtyAutocomplete'
import Spinner from '@/components/ui/Spinner'
import { WEEK_DAYS, createDefaultSchedule } from '../../data/doctorsData'
import { cloneSchedule, TIME_SLOT_OPTIONS } from './doctorUtils'
import {
  createAdminDoctor,
  fetchAdminDoctorById,
  updateAdminDoctor,
} from '@/services/adminDoctors'
import { fetchMedicalSpecialties } from '@/services/medicalSpecialties'
import { toast } from '@/app/store/uiStore'
import { colors } from '@/theme/colors'

const EMPTY_QUALIFICATION = {
  qualificationName: '',
  institutionName: '',
  yearCompleted: '',
}

const EMPTY_DRAFT = {
  doctorCode: '',
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  profileSummary: '',
  specialtyId: '',
  specialtyName: '',
  storeLocationId: '',
  yearsOfExperience: '',
  consultationFee: '',
  doctorStatus: 'active',
  imageUrl: '',
  qualifications: [{ ...EMPTY_QUALIFICATION }],
  schedule: createDefaultSchedule(),
}

function RequiredLabel({ children }) {
  return (
    <div className="text-[11px] font-bold mb-1" style={{ color: colors.textSecondary }}>
      {children}
      <span className="text-red-400"> *</span>
    </div>
  )
}

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-[11px] font-bold text-red-400">{message}</p>
}

function validateDraft(draft) {
  const errors = {}
  if (!draft.doctorCode.trim()) errors.doctorCode = 'Doctor code is required'
  if (!draft.firstName.trim()) errors.firstName = 'First name is required'
  if (!draft.lastName.trim()) errors.lastName = 'Last name is required'
  if (!draft.email.trim()) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = 'Enter a valid email'
  if (!draft.mobile.trim()) errors.mobile = 'Mobile number is required'
  else if (!/^\d{10}$/.test(draft.mobile.replace(/\D/g, ''))) errors.mobile = 'Enter a valid 10-digit mobile number'
  if (!draft.specialtyId) errors.specialtyId = 'Select a specialty'

  if (draft.yearsOfExperience === '' || draft.yearsOfExperience == null) {
    errors.yearsOfExperience = 'Years of experience is required'
  } else {
    const years = Number(draft.yearsOfExperience)
    if (!Number.isFinite(years) || years < 0) errors.yearsOfExperience = 'Enter a valid non-negative number of years'
  }

  const hasQualification = draft.qualifications.some((row) => row.qualificationName.trim())
  if (!hasQualification) errors.qualifications = 'Add at least one qualification'

  if (draft.consultationFee === '' || draft.consultationFee == null) {
    errors.consultationFee = 'Consultation fee is required'
  } else {
    const fee = Number(draft.consultationFee)
    if (!Number.isFinite(fee) || fee < 0) errors.consultationFee = 'Enter a valid non-negative fee'
  }

  return errors
}

function mapDoctorToDraft(doctor) {
  const qualificationRows =
    doctor.qualificationRows?.length > 0
      ? doctor.qualificationRows.map(({ qualificationName, institutionName, yearCompleted }) => ({
          qualificationName: qualificationName ?? '',
          institutionName: institutionName ?? '',
          yearCompleted: yearCompleted ?? '',
        }))
      : doctor.qualifications
        ? [{ qualificationName: String(doctor.qualifications), institutionName: '', yearCompleted: '' }]
        : [{ ...EMPTY_QUALIFICATION }]

  const nameParts = String(doctor.name ?? '').replace(/^Dr\.?\s*/i, '').trim().split(/\s+/).filter(Boolean)

  return {
    doctorCode: doctor.doctorCode ?? '',
    firstName: doctor.firstName || nameParts[0] || '',
    lastName: doctor.lastName || nameParts.slice(1).join(' ') || '',
    email: doctor.email ?? '',
    mobile: String(doctor.mobile ?? '').replace(/\D/g, '').slice(-10),
    profileSummary: doctor.profileSummary ?? '',
    specialtyId: String(doctor.specialtyId ?? ''),
    specialtyName: doctor.specialty ?? '',
    storeLocationId: String(doctor.storeLocationId ?? doctor.storeId ?? ''),
    yearsOfExperience: doctor.experienceYears != null ? String(doctor.experienceYears) : '',
    consultationFee: doctor.consultationFee != null ? String(doctor.consultationFee) : '',
    doctorStatus: doctor.status ?? 'active',
    imageUrl: doctor.imageUrl ?? '',
    qualifications: qualificationRows,
    schedule: cloneSchedule(doctor.schedule ?? createDefaultSchedule()),
  }
}

function QualificationsEditor({ rows, onChange, disabled, error }) {
  const updateRow = (index, field, value) => {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)))
  }

  const addRow = () => {
    onChange([...rows, { ...EMPTY_QUALIFICATION }])
  }

  const removeRow = (index) => {
    if (rows.length <= 1) return
    onChange(rows.filter((_, rowIndex) => rowIndex !== index))
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          key={`qualification-${index}`}
          className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_auto] gap-2.5 items-end p-3 rounded-[12px]"
          style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}
        >
          <div>
            <ModalFieldLabel>Qualification</ModalFieldLabel>
            <ModalInput
              value={row.qualificationName}
              onChange={(e) => updateRow(index, 'qualificationName', e.target.value)}
              placeholder="e.g. MBBS"
              disabled={disabled}
              className="py-2"
            />
          </div>
          <div>
            <ModalFieldLabel>Institution</ModalFieldLabel>
            <ModalInput
              value={row.institutionName}
              onChange={(e) => updateRow(index, 'institutionName', e.target.value)}
              placeholder="e.g. AIIMS Delhi"
              disabled={disabled}
              className="py-2"
            />
          </div>
          <div>
            <ModalFieldLabel>Year</ModalFieldLabel>
            <ModalInput
              type="number"
              min="1950"
              max="2100"
              value={row.yearCompleted}
              onChange={(e) => updateRow(index, 'yearCompleted', e.target.value)}
              placeholder="2012"
              disabled={disabled}
              className="py-2"
            />
          </div>
          <div className="flex items-center gap-1.5 pb-0.5">
            {index === rows.length - 1 ? (
              <button
                type="button"
                onClick={addRow}
                disabled={disabled}
                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer disabled:opacity-40"
                style={{ border: `1px solid ${colors.borderSubtle}` }}
                aria-label="Add qualification"
              >
                <Plus size={14} style={{ color: colors.accent }} />
              </button>
            ) : null}
            {rows.length > 1 ? (
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={disabled}
                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer disabled:opacity-40"
                style={{ border: `1px solid ${colors.borderSubtle}` }}
                aria-label="Remove qualification"
              >
                <Minus size={14} style={{ color: colors.textDim }} />
              </button>
            ) : null}
          </div>
        </div>
      ))}
      {error ? <FieldError message={error} /> : null}
    </div>
  )
}

function ScheduleEditor({ schedule, onChange }) {
  const updateDay = (dayKey, patch) => {
    onChange({
      ...schedule,
      [dayKey]: { ...schedule[dayKey], ...patch },
    })
  }

  const toggleDay = (dayKey) => {
    const day = schedule[dayKey]
    const enabled = !day.enabled
    updateDay(dayKey, {
      enabled,
      slots: enabled && !day.slots?.length ? [{ start: '09:00 AM', end: '01:00 PM' }] : day.slots,
    })
  }

  const updateSlot = (dayKey, slotIndex, field, value) => {
    const slots = schedule[dayKey].slots.map((slot, index) =>
      index === slotIndex ? { ...slot, [field]: value } : slot,
    )
    updateDay(dayKey, { slots })
  }

  const addSlot = (dayKey) => {
    const slots = [...(schedule[dayKey].slots ?? []), { start: '02:00 PM', end: '05:00 PM' }]
    updateDay(dayKey, { slots })
  }

  const removeSlot = (dayKey, slotIndex) => {
    const slots = schedule[dayKey].slots.filter((_, index) => index !== slotIndex)
    updateDay(dayKey, { slots })
  }

  return (
    <div className="rounded-[14px] p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}>
      {WEEK_DAYS.map(({ key, label }) => {
        const day = schedule[key] ?? { enabled: false, slots: [] }
        return (
          <div key={key} className="grid grid-cols-1 lg:grid-cols-[120px_auto_1fr] gap-2.5 items-start py-2 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={day.enabled}
                onChange={() => toggleDay(key)}
                className="h-4 w-4 cursor-pointer"
                style={{ accentColor: colors.accent }}
              />
              <span className="text-[12.5px] font-bold text-white min-w-[72px]">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <ToggleSwitch on={day.enabled} onToggle={() => toggleDay(key)} />
              <span className="text-[11px] font-semibold" style={{ color: day.enabled ? colors.accent : colors.textDim }}>
                {day.enabled ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div className="space-y-2">
              {!day.enabled ? (
                <span className="text-[12px] font-semibold" style={{ color: colors.textDim }}>Not available</span>
              ) : (
                day.slots.map((slot, slotIndex) => (
                  <div key={`${key}-${slotIndex}`} className="flex flex-wrap items-center gap-2">
                    <ModalSelect
                      value={slot.start}
                      onChange={(e) => updateSlot(key, slotIndex, 'start', e.target.value)}
                      options={TIME_SLOT_OPTIONS}
                      className="min-w-[130px]"
                    />
                    <span className="text-[11px]" style={{ color: colors.textDim }}>–</span>
                    <ModalSelect
                      value={slot.end}
                      onChange={(e) => updateSlot(key, slotIndex, 'end', e.target.value)}
                      options={TIME_SLOT_OPTIONS}
                      className="min-w-[130px]"
                    />
                    {slotIndex === day.slots.length - 1 ? (
                      <button type="button" onClick={() => addSlot(key)} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer" style={{ border: `1px solid ${colors.borderSubtle}` }} aria-label="Add time slot">
                        <Plus size={14} style={{ color: colors.accent }} />
                      </button>
                    ) : null}
                    {day.slots.length > 1 ? (
                      <button type="button" onClick={() => removeSlot(key, slotIndex)} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer" style={{ border: `1px solid ${colors.borderSubtle}` }} aria-label="Remove time slot">
                        <Minus size={14} style={{ color: colors.textDim }} />
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function DoctorFormModal() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: routeId } = useParams()
  const isEdit = location.pathname.endsWith('/edit')
  const isAdd = location.pathname.endsWith('/add')

  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [specialties, setSpecialties] = useState([])
  const [loadingSpecialties, setLoadingSpecialties] = useState(true)
  const [specialtiesError, setSpecialtiesError] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const [doctorStatus, setDoctorStatus] = useState('active')
  const [photoFile, setPhotoFile] = useState(null)

  const returnTo = useMemo(() => {
    const candidate = location.state?.returnTo
    return typeof candidate === 'string' && candidate.startsWith('/owner') ? candidate : '/owner/doctors'
  }, [location.state?.returnTo])

  const close = () => navigate(returnTo)

  useEffect(() => {
    if (!isAdd && !isEdit) return undefined

    let cancelled = false

    const loadSpecialties = async () => {
      setLoadingSpecialties(true)
      setSpecialtiesError('')
      try {
        const list = await fetchMedicalSpecialties({ force: true })
        if (!cancelled) setSpecialties(list)
      } catch (err) {
        if (!cancelled) {
          setSpecialties([])
          setSpecialtiesError(err instanceof Error ? err.message : 'Could not load specialties')
        }
      } finally {
        if (!cancelled) setLoadingSpecialties(false)
      }
    }

    loadSpecialties()
    return () => {
      cancelled = true
    }
  }, [isAdd, isEdit])

  useEffect(() => {
    if (!isEdit || !routeId) return undefined
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const doctor = await fetchAdminDoctorById(routeId)
        if (cancelled) return
        setDraft(mapDoctorToDraft(doctor))
        setDoctorStatus(doctor.status ?? 'active')
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load doctor')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [isEdit, routeId])

  if (!isAdd && !isEdit) return null

  const setField = (field, value) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setField('imageUrl', URL.createObjectURL(file))
  }

  const handleSave = async () => {
    const errors = validateDraft(draft)
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }

    setSaving(true)
    setSaveError('')
    try {
      const saveDraft = {
        ...draft,
        doctorStatus: isEdit ? doctorStatus : 'active',
        schedule: cloneSchedule(draft.schedule),
      }

      if (isEdit) {
        await updateAdminDoctor(routeId, saveDraft, photoFile)
        toast.success('Doctor updated successfully')
      } else {
        await createAdminDoctor(saveDraft, photoFile)
        toast.success('Doctor added successfully')
      }
      close()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save doctor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PortalModal onClose={close} width={760} scrollable={false}>
      <div className="flex flex-col max-h-[92vh]">
        <div
          className="flex-shrink-0 flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.09)', background: '#0d211a' }}
        >
          <div>
            <h2 className="text-[17px] font-extrabold text-white">{isEdit ? 'Edit Doctor' : 'Add Doctor'}</h2>
            <p className="text-[12px] mt-1" style={{ color: colors.textDim }}>
              {isEdit
                ? 'Update doctor information, availability and consultation schedule.'
                : 'Add a doctor and configure their consultation availability.'}
            </p>
          </div>
          <button type="button" onClick={close} className="p-1.5 rounded-lg hover:bg-white/8 cursor-pointer" aria-label="Close">
            <X size={18} style={{ color: colors.textMuted }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto owner-scroll min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Spinner />
              <p className="text-[12.5px] font-bold" style={{ color: colors.textSecondary }}>Loading doctor…</p>
            </div>
          ) : loadError ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] font-bold text-red-400 mb-3">{loadError}</p>
              <button type="button" onClick={close} className="px-4 py-2 rounded-[10px] text-[12.5px] font-extrabold cursor-pointer" style={{ background: colors.primaryBtn, color: colors.accentText }}>
                Back to doctors
              </button>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-5">
          <section>
            <h3 className="text-[13px] font-extrabold text-white mb-3">Doctor Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 mb-4">
              <div>
                <ModalFieldLabel>Doctor Photo</ModalFieldLabel>
                <label className="block cursor-pointer">
                  {draft.imageUrl ? (
                    <img src={draft.imageUrl} alt="" className="w-[96px] h-[96px] rounded-full object-cover" style={{ border: '2px solid rgba(64,222,170,0.35)' }} />
                  ) : (
                    <span className="w-[96px] h-[96px] rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: `1px dashed ${colors.border}` }}>
                      <Camera size={22} style={{ color: colors.textDim }} />
                    </span>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  <span className="block mt-2 text-[11px] font-bold" style={{ color: colors.accent }}>Upload photo</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <RequiredLabel>Doctor Code</RequiredLabel>
                  <ModalInput
                    value={draft.doctorCode}
                    onChange={(e) => setField('doctorCode', e.target.value.toUpperCase())}
                    placeholder="e.g. DOC-008"
                    disabled={isEdit}
                    className="uppercase"
                  />
                  <FieldError message={fieldErrors.doctorCode} />
                </div>
                <div>
                  <RequiredLabel>First Name</RequiredLabel>
                  <ModalInput value={draft.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder="Enter first name" />
                  <FieldError message={fieldErrors.firstName} />
                </div>
                <div>
                  <RequiredLabel>Last Name</RequiredLabel>
                  <ModalInput value={draft.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder="Enter last name" />
                  <FieldError message={fieldErrors.lastName} />
                </div>
                <div>
                  <RequiredLabel>Email</RequiredLabel>
                  <ModalInput type="email" value={draft.email} onChange={(e) => setField('email', e.target.value)} placeholder="Enter email" />
                  <FieldError message={fieldErrors.email} />
                </div>
                <div>
                  <RequiredLabel>Mobile Number</RequiredLabel>
                  <ModalInput
                    type="tel"
                    value={draft.mobile}
                    onChange={(e) => setField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                  />
                  <FieldError message={fieldErrors.mobile} />
                </div>
                <div>
                  <RequiredLabel>Years of Experience</RequiredLabel>
                  <ModalInput
                    type="number"
                    min="0"
                    value={draft.yearsOfExperience}
                    onChange={(e) => setField('yearsOfExperience', e.target.value)}
                    placeholder="Enter years"
                  />
                  <FieldError message={fieldErrors.yearsOfExperience} />
                </div>
                <div>
                  <RequiredLabel>Specialty</RequiredLabel>
                  <SpecialtyAutocomplete
                    specialtyId={draft.specialtyId}
                    specialtyName={draft.specialtyName}
                    specialties={specialties}
                    loading={loadingSpecialties}
                    loadError={specialtiesError}
                    onSpecialtiesChange={setSpecialties}
                    onChange={({ id, name }) => {
                      setFieldErrors((prev) => {
                        if (!prev.specialtyId) return prev
                        const next = { ...prev }
                        delete next.specialtyId
                        return next
                      })
                      setDraft((prev) => ({ ...prev, specialtyId: id, specialtyName: name }))
                    }}
                    placeholder="Search or add specialty"
                  />
                  <FieldError message={fieldErrors.specialtyId} />
                </div>
                <div className="sm:col-span-2">
                  <ModalFieldLabel>Profile Summary</ModalFieldLabel>
                  <textarea
                    value={draft.profileSummary}
                    onChange={(e) => setField('profileSummary', e.target.value)}
                    placeholder="Brief profile summary"
                    rows={3}
                    className="w-full rounded-[11px] px-3 py-2.5 text-[12.5px] font-semibold text-white outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}` }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-[13px] font-extrabold text-white mb-3">Qualifications</h3>
            <QualificationsEditor
              rows={draft.qualifications}
              onChange={(qualifications) => setField('qualifications', qualifications)}
              disabled={saving}
              error={fieldErrors.qualifications}
            />
          </section>

          <section>
            <h3 className="text-[13px] font-extrabold text-white mb-3">Consultation Fee</h3>
            <div
              className="rounded-[14px] p-4 max-w-[320px]"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}
            >
              <RequiredLabel>Fee per consultation</RequiredLabel>
              <div className="relative mt-1">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-extrabold pointer-events-none"
                  style={{ color: colors.accent }}
                >
                  ₹
                </span>
                <ModalInput
                  type="number"
                  min="0"
                  step="1"
                  inputMode="decimal"
                  value={draft.consultationFee}
                  onChange={(e) => setField('consultationFee', e.target.value)}
                  placeholder="e.g. 500"
                  className="pl-8 py-2"
                />
              </div>
              <p className="text-[11px] mt-2 leading-relaxed" style={{ color: colors.textDim }}>
                Amount charged for each doctor consultation booking.
              </p>
              <FieldError message={fieldErrors.consultationFee} />
            </div>
          </section>

          <section>
            <h3 className="text-[13px] font-extrabold text-white mb-3">Weekly Consultation Schedule</h3>
            <ScheduleEditor schedule={draft.schedule} onChange={(schedule) => setField('schedule', schedule)} />
          </section>

          {saveError && <p className="text-[12px] font-bold text-red-400">{saveError}</p>}

          <div className="flex justify-end gap-2.5 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.09)' }}>
              <button type="button" onClick={close} className="text-[12.5px] font-bold px-[18px] py-2 rounded-[10px] cursor-pointer" style={{ color: colors.textHighlight, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)' }}>
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="text-[12.5px] font-extrabold px-5 py-2 rounded-[10px] cursor-pointer disabled:opacity-60" style={{ color: colors.accentText, background: colors.primaryBtn, boxShadow: '0 6px 18px rgba(64,222,170,0.35)' }}>
                {isEdit ? 'Update Changes' : 'Save Doctor'}
              </button>
          </div>
            </div>
          )}
        </div>
      </div>
    </PortalModal>
  )
}
