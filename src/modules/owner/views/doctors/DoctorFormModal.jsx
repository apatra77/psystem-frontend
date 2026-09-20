import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Camera, Check, ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react'
import PortalModal, { ModalFieldLabel, ModalInput, ModalSelect } from '../../components/PortalModal'
import ConsultationScheduleStep from './ConsultationScheduleStep'
import SpecialtyAutocomplete from '../../components/SpecialtyAutocomplete'
import Spinner from '@/components/ui/Spinner'
import { WEEK_DAYS, createDefaultSchedule } from '../../data/doctorsData'
import { cloneSchedule, doctorInitials } from './doctorUtils'
import {
  buildScheduleSummaryLines,
  cloneConsultationSchedule,
  consultationScheduleFromLegacySchedule,
  createDefaultConsultationSchedule,
  syncLegacyScheduleFromConsultation,
  validateConsultationSchedule,
} from './consultationScheduleModel'
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

const FORM_STEPS = [
  { id: 'basic', label: 'Basic Information' },
  { id: 'qualifications', label: 'Qualifications' },
  { id: 'consultation', label: 'Consultation Details' },
  { id: 'schedule', label: 'Consultation Schedule' },
  { id: 'review', label: 'Review & Save' },
]

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
  consultationSchedule: createDefaultConsultationSchedule(),
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

function validateEmailField(email) {
  const trimmed = String(email ?? '').trim()
  if (!trimmed) return ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Enter a valid email'
  return ''
}

function validateStep(stepIndex, draft) {
  const errors = {}

  if (stepIndex === 0) {
    if (!draft.doctorCode.trim()) errors.doctorCode = 'Doctor code is required'
    if (!draft.firstName.trim()) errors.firstName = 'First name is required'
    if (!draft.lastName.trim()) errors.lastName = 'Last name is required'
    const emailError = validateEmailField(draft.email)
    if (emailError) errors.email = emailError
    if (!draft.mobile.trim()) errors.mobile = 'Mobile number is required'
    else if (!/^\d{10}$/.test(draft.mobile.replace(/\D/g, ''))) errors.mobile = 'Enter a valid 10-digit mobile number'
  }

  if (stepIndex === 1) {
    const hasQualification = draft.qualifications.some((row) => row.qualificationName.trim())
    if (!hasQualification) errors.qualifications = 'Add at least one qualification'
  }

  if (stepIndex === 3) {
    const scheduleErrors = validateConsultationSchedule(draft.consultationSchedule)
    Object.assign(errors, scheduleErrors)
  }

  if (stepIndex === 2) {
    if (!draft.specialtyId) errors.specialtyId = 'Select a specialty'
    if (draft.yearsOfExperience === '' || draft.yearsOfExperience == null) {
      errors.yearsOfExperience = 'Years of experience is required'
    } else {
      const years = Number(draft.yearsOfExperience)
      if (!Number.isFinite(years) || years < 0) errors.yearsOfExperience = 'Enter a valid non-negative number of years'
    }
    if (draft.consultationFee === '' || draft.consultationFee == null) {
      errors.consultationFee = 'Consultation fee is required'
    } else {
      const fee = Number(draft.consultationFee)
      if (!Number.isFinite(fee) || fee < 0) errors.consultationFee = 'Enter a valid non-negative fee'
    }
  }

  return errors
}

function validateDraft(draft) {
  let errors = {}
  for (let i = 0; i < FORM_STEPS.length - 1; i += 1) {
    errors = { ...errors, ...validateStep(i, draft) }
  }
  return errors
}

function formatDoctorDisplayName(firstName, lastName) {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim()
  return name ? `Dr. ${name}` : '—'
}

function FormStepSidebar({ steps, currentStep, onStepClick, isEdit }) {
  return (
    <nav
      className="w-[210px] flex-shrink-0 self-stretch py-4 pl-4 pr-3 border-r space-y-1"
      style={{ borderColor: 'rgba(255,255,255,0.09)', background: 'rgba(0,0,0,0.15)' }}
      aria-label="Form steps"
    >
      {steps.map((step, index) => {
        const done = index < currentStep
        const active = index === currentStep
        const clickable = isEdit || done || index <= currentStep
        return (
          <button
            key={step.id}
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onStepClick(index)}
            className="w-full flex items-start gap-2.5 text-left rounded-[10px] px-2.5 py-2.5 transition-colors disabled:cursor-default cursor-pointer"
            style={{
              background: active ? 'rgba(64,222,170,0.12)' : 'transparent',
              border: active ? '1px solid rgba(64,222,170,0.35)' : '1px solid transparent',
            }}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-extrabold mt-0.5"
              style={{
                background: done ? colors.accent : active ? 'rgba(64,222,170,0.2)' : 'rgba(255,255,255,0.06)',
                color: done ? colors.accentText : active ? colors.accent : colors.textDim,
                border: `1px solid ${done || active ? 'rgba(64,222,170,0.45)' : 'rgba(255,255,255,0.12)'}`,
              }}
            >
              {done ? <Check size={12} strokeWidth={3} /> : index + 1}
            </span>
            <span
              className="text-[11.5px] font-bold leading-snug pt-0.5"
              style={{ color: active ? colors.textBright : done ? colors.textSecondary : colors.textDim }}
            >
              {step.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

function ReviewSection({ title, onEdit, children }) {
  return (
    <div className="rounded-[12px] p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <h4 className="text-[12px] font-extrabold text-white">{title}</h4>
        {onEdit ? (
          <button type="button" onClick={onEdit} className="text-[11px] font-bold cursor-pointer hover:underline" style={{ color: colors.accent }}>
            Edit
          </button>
        ) : null}
      </div>
      <div className="text-[12px] space-y-1" style={{ color: colors.textMuted }}>
        {children}
      </div>
    </div>
  )
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
    consultationSchedule: consultationScheduleFromLegacySchedule(doctor.schedule ?? createDefaultSchedule()),
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
  const [step, setStep] = useState(0)

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

  const setConsultationSchedule = (consultationSchedule) => {
    setFieldErrors((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((key) => {
        if (key.startsWith('schedule') || key.includes('monthly') || key.includes('custom') || key.includes('date') || key.includes('repeat')) {
          delete next[key]
        }
      })
      return next
    })
    setDraft((prev) => ({
      ...prev,
      consultationSchedule: cloneConsultationSchedule(consultationSchedule),
      schedule: syncLegacyScheduleFromConsultation(consultationSchedule),
    }))
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setField('imageUrl', URL.createObjectURL(file))
  }

  const goToStep = (nextStep) => {
    setStep(nextStep)
    setFieldErrors({})
  }

  const goNext = () => {
    if (step >= FORM_STEPS.length - 1) return
    const errors = validateStep(step, draft)
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setStep((prev) => Math.min(prev + 1, FORM_STEPS.length - 1))
  }

  const goBack = () => {
    setFieldErrors({})
    setStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSave = async () => {
    const errors = validateDraft(draft)
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      const firstStepWithError = [0, 1, 2, 3].find((index) => Object.keys(validateStep(index, draft)).length > 0)
      if (firstStepWithError != null) setStep(firstStepWithError)
      return
    }

    setSaving(true)
    setSaveError('')
    try {
      const syncedSchedule = syncLegacyScheduleFromConsultation(draft.consultationSchedule)
      const saveDraft = {
        ...draft,
        doctorStatus: isEdit ? doctorStatus : 'active',
        schedule: cloneSchedule(syncedSchedule),
        consultationSchedule: cloneConsultationSchedule(draft.consultationSchedule),
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
    <PortalModal onClose={close} width={960} scrollable={false} maxHeight="92vh">
      <div className="flex flex-col flex-1 min-h-0">
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

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 min-h-0">
              <Spinner />
              <p className="text-[12.5px] font-bold" style={{ color: colors.textSecondary }}>Loading doctor…</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-1 items-center justify-center px-5 py-10 text-center min-h-0">
              <div>
                <p className="text-[13px] font-bold text-red-400 mb-3">{loadError}</p>
                <button type="button" onClick={close} className="px-4 py-2 rounded-[10px] text-[12.5px] font-extrabold cursor-pointer" style={{ background: colors.primaryBtn, color: colors.accentText }}>
                  Back to doctors
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 min-h-0">
              <FormStepSidebar
                steps={FORM_STEPS}
                currentStep={step}
                isEdit={isEdit}
                onStepClick={(index) => {
                  if (index < step || isEdit) goToStep(index)
                }}
              />
              <div className="flex-1 flex flex-col min-w-0 min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto owner-scroll px-5 py-4">
                  <h3 className="text-[15px] font-extrabold text-white mb-1">{FORM_STEPS[step].label}</h3>
                  <p className="text-[11.5px] mb-4" style={{ color: colors.textDim }}>
                    Step {step + 1} of {FORM_STEPS.length}
                  </p>

                  {step === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4">
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
                          <ModalFieldLabel>Email</ModalFieldLabel>
                          <ModalInput type="email" value={draft.email} onChange={(e) => setField('email', e.target.value)} placeholder="Enter email (optional)" />
                          <FieldError message={fieldErrors.email} />
                        </div>
                        <div className="sm:col-span-2">
                          <RequiredLabel>Mobile Number</RequiredLabel>
                          <ModalInput
                            type="tel"
                            value={draft.mobile}
                            onChange={(e) => setField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10-digit mobile number"
                          />
                          <FieldError message={fieldErrors.mobile} />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <QualificationsEditor
                      rows={draft.qualifications}
                      onChange={(qualifications) => setField('qualifications', qualifications)}
                      disabled={saving}
                      error={fieldErrors.qualifications}
                    />
                  ) : null}

                  {step === 2 ? (
                    <div className="space-y-4 max-w-xl">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <RequiredLabel>Consultation Fee (₹)</RequiredLabel>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-extrabold pointer-events-none" style={{ color: colors.accent }}>
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
                          <FieldError message={fieldErrors.consultationFee} />
                        </div>
                        <div>
                          <RequiredLabel>Experience (Years)</RequiredLabel>
                          <ModalInput
                            type="number"
                            min="0"
                            value={draft.yearsOfExperience}
                            onChange={(e) => setField('yearsOfExperience', e.target.value)}
                            placeholder="Enter years"
                          />
                          <FieldError message={fieldErrors.yearsOfExperience} />
                        </div>
                      </div>
                      <div>
                        <ModalFieldLabel>About Doctor</ModalFieldLabel>
                        <textarea
                          value={draft.profileSummary}
                          onChange={(e) => setField('profileSummary', e.target.value)}
                          placeholder="Brief profile summary for patients"
                          rows={4}
                          className="w-full rounded-[11px] px-3 py-2.5 text-[12.5px] font-semibold text-white outline-none resize-none"
                          style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <ConsultationScheduleStep
                      value={draft.consultationSchedule}
                      onChange={setConsultationSchedule}
                      errors={fieldErrors}
                    />
                  ) : null}

                  {step === 4 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_120px] gap-4">
                      <div className="space-y-3">
                        <ReviewSection title="Basic Information" onEdit={() => goToStep(0)}>
                          <p><span className="font-bold text-white/90">Code:</span> {draft.doctorCode || '—'}</p>
                          <p><span className="font-bold text-white/90">Name:</span> {formatDoctorDisplayName(draft.firstName, draft.lastName)}</p>
                          <p><span className="font-bold text-white/90">Email:</span> {draft.email.trim() || '—'}</p>
                          <p><span className="font-bold text-white/90">Mobile:</span> {draft.mobile || '—'}</p>
                        </ReviewSection>
                        <ReviewSection title="Qualifications" onEdit={() => goToStep(1)}>
                          {draft.qualifications.filter((r) => r.qualificationName.trim()).map((row, index) => (
                            <p key={`review-qual-${index}`}>
                              {row.qualificationName}
                              {row.institutionName ? ` — ${row.institutionName}` : ''}
                              {row.yearCompleted ? ` (${row.yearCompleted})` : ''}
                            </p>
                          ))}
                        </ReviewSection>
                        <ReviewSection title="Consultation Details" onEdit={() => goToStep(2)}>
                          <p><span className="font-bold text-white/90">Specialty:</span> {draft.specialtyName || '—'}</p>
                          <p><span className="font-bold text-white/90">Fee:</span> {draft.consultationFee !== '' ? `₹${draft.consultationFee}` : '—'}</p>
                          <p><span className="font-bold text-white/90">Experience:</span> {draft.yearsOfExperience !== '' ? `${draft.yearsOfExperience} years` : '—'}</p>
                          {draft.profileSummary.trim() ? <p className="pt-1 whitespace-pre-wrap">{draft.profileSummary}</p> : null}
                        </ReviewSection>
                        <ReviewSection title="Schedule" onEdit={() => goToStep(3)}>
                          {buildScheduleSummaryLines(draft.consultationSchedule).length ? (
                            buildScheduleSummaryLines(draft.consultationSchedule).map((line, index) => (
                              <p key={`review-sched-${index}`}>
                                <span className="font-bold text-white/90">{line.title}:</span> {line.time}
                                {line.meta ? ` · ${line.meta}` : ''}
                              </p>
                            ))
                          ) : (
                            <p>No consultation schedule configured</p>
                          )}
                        </ReviewSection>
                      </div>
                      <div className="flex lg:justify-center">
                        {draft.imageUrl ? (
                          <img src={draft.imageUrl} alt="" className="w-[96px] h-[96px] rounded-full object-cover" style={{ border: '2px solid rgba(64,222,170,0.35)' }} />
                        ) : (
                          <span className="w-[96px] h-[96px] rounded-full flex items-center justify-center text-[14px] font-extrabold" style={{ background: 'rgba(64,222,170,0.14)', color: colors.accent, border: '1px solid rgba(64,222,170,0.36)' }}>
                            {doctorInitials(formatDoctorDisplayName(draft.firstName, draft.lastName))}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {saveError ? <p className="text-[12px] font-bold text-red-400 mt-4">{saveError}</p> : null}
                </div>

                <div
                  className="flex-shrink-0 flex items-center justify-between gap-2.5 px-5 py-3 border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.09)', background: 'rgba(0,0,0,0.12)' }}
                >
                  <button
                    type="button"
                    onClick={close}
                    className="text-[12.5px] font-bold px-[18px] py-2 rounded-[10px] cursor-pointer"
                    style={{ color: colors.textHighlight, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)' }}
                  >
                    Cancel
                  </button>
                  <div className="flex items-center gap-2.5">
                    {step > 0 ? (
                      <button
                        type="button"
                        onClick={goBack}
                        className="inline-flex items-center gap-1 text-[12.5px] font-bold px-[18px] py-2 rounded-[10px] cursor-pointer"
                        style={{ color: colors.textHighlight, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)' }}
                      >
                        <ChevronLeft size={16} />
                        Back
                      </button>
                    ) : null}
                    {step < FORM_STEPS.length - 1 ? (
                      <button
                        type="button"
                        onClick={goNext}
                        className="inline-flex items-center gap-1 text-[12.5px] font-extrabold px-5 py-2 rounded-[10px] cursor-pointer"
                        style={{ color: colors.accentText, background: colors.primaryBtn, boxShadow: '0 6px 18px rgba(64,222,170,0.35)' }}
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="text-[12.5px] font-extrabold px-5 py-2 rounded-[10px] cursor-pointer disabled:opacity-60"
                        style={{ color: colors.accentText, background: colors.primaryBtn, boxShadow: '0 6px 18px rgba(64,222,170,0.35)' }}
                      >
                        {isEdit ? 'Update Changes' : 'Save Doctor'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PortalModal>
  )
}
