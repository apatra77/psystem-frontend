import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, Camera, Minus, Plus, X } from 'lucide-react'
import PortalModal, { ModalFieldLabel, ModalInput, ModalSelect, ToggleSwitch } from '../../components/PortalModal'
import Spinner from '@/components/ui/Spinner'
import { DOCTOR_STORES, WEEK_DAYS, createDefaultSchedule } from '../../data/doctorsData'
import {
  cloneSchedule,
  CONSULTATION_TYPE_OPTIONS,
  TIME_SLOT_OPTIONS,
} from './doctorUtils'
import {
  createAdminDoctor,
  fetchAdminDoctorById,
  fetchAdminSpecialties,
  setAdminDoctorStatus,
  updateAdminDoctor,
  uploadAdminDoctorProfileImage,
} from '@/services/adminDoctors'
import { toast } from '@/app/store/uiStore'
import { colors } from '@/theme/colors'

const EMPTY_DRAFT = {
  name: '',
  email: '',
  mobile: '',
  qualifications: '',
  specialtyId: '',
  storeId: '',
  experienceYears: '',
  consultationType: 'both',
  imageUrl: '',
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
  if (!draft.name.trim()) errors.name = 'Full name is required'
  if (!draft.email.trim()) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = 'Enter a valid email'
  if (!draft.mobile.trim()) errors.mobile = 'Mobile number is required'
  else if (!/^\d{10}$/.test(draft.mobile.replace(/\D/g, ''))) errors.mobile = 'Enter a valid 10-digit mobile number'
  if (!draft.qualifications.trim()) errors.qualifications = 'Qualifications are required'
  if (!draft.specialtyId) errors.specialtyId = 'Select a specialty'
  if (!draft.storeId) errors.storeId = 'Select a store'
  return errors
}

function mapDoctorToDraft(doctor) {
  return {
    name: doctor.name ?? '',
    email: doctor.email ?? '',
    mobile: doctor.mobile ?? '',
    qualifications: doctor.qualifications ?? '',
    specialtyId: String(doctor.specialtyId ?? ''),
    storeId: doctor.storeId ?? '',
    experienceYears: doctor.experienceYears != null ? String(doctor.experienceYears) : '',
    consultationType: doctor.consultationType ?? 'both',
    imageUrl: doctor.imageUrl ?? '',
    schedule: cloneSchedule(doctor.schedule ?? createDefaultSchedule()),
  }
}

function buildPayload(draft, specialties) {
  const specialty = specialties.find((s) => String(s.id) === String(draft.specialtyId))
  const store = DOCTOR_STORES.find((s) => s.id === draft.storeId)
  return {
    name: draft.name.trim(),
    email: draft.email.trim(),
    mobile: draft.mobile.replace(/\D/g, ''),
    qualifications: draft.qualifications.trim(),
    specialtyId: Number(draft.specialtyId),
    specialty: specialty?.label ?? '',
    storeId: draft.storeId,
    store: store?.label ?? '',
    experienceYears: draft.experienceYears === '' ? null : Number(draft.experienceYears),
    consultationType: draft.consultationType,
    schedule: cloneSchedule(draft.schedule),
  }
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
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [doctorStatus, setDoctorStatus] = useState('active')
  const [photoFile, setPhotoFile] = useState(null)

  const returnTo = useMemo(() => {
    const candidate = location.state?.returnTo
    return typeof candidate === 'string' && candidate.startsWith('/owner') ? candidate : '/owner/doctors'
  }, [location.state?.returnTo])

  const close = () => navigate(returnTo)

  useEffect(() => {
    let cancelled = false
    fetchAdminSpecialties()
      .then((list) => {
        if (!cancelled) setSpecialties(list)
      })
      .catch(() => {
        if (!cancelled) setSpecialties([])
      })
    return () => {
      cancelled = true
    }
  }, [])

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
      const payload = buildPayload(draft, specialties)
      if (isEdit) {
        await updateAdminDoctor(routeId, payload)
        if (photoFile) await uploadAdminDoctorProfileImage(routeId, photoFile)
        toast.success('Doctor updated successfully')
      } else {
        const created = await createAdminDoctor(payload)
        if (photoFile && created?.id) await uploadAdminDoctorProfileImage(created.id, photoFile)
        toast.success('Doctor added successfully')
      }
      close()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save doctor')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!routeId) return
    setSaving(true)
    try {
      const nextStatus = doctorStatus === 'inactive' ? 'active' : 'inactive'
      await setAdminDoctorStatus(routeId, nextStatus)
      toast.success(nextStatus === 'inactive' ? 'Doctor deactivated' : 'Doctor activated')
      close()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update doctor status')
    } finally {
      setSaving(false)
      setConfirmDeactivate(false)
    }
  }

  const specialtyOptions = specialties.map((s) => ({ value: String(s.id), label: s.label }))
  const storeOptions = DOCTOR_STORES.map((s) => ({ value: s.id, label: s.label }))

  return (
    <PortalModal onClose={close} width={760} maxHeight="92vh">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b sticky top-0 z-10" style={{ borderColor: 'rgba(255,255,255,0.09)', background: '#0d211a' }}>
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
                <div className="sm:col-span-2">
                  <RequiredLabel>Full Name</RequiredLabel>
                  <ModalInput value={draft.name} onChange={(e) => setField('name', e.target.value)} placeholder="Enter doctor name" />
                  <FieldError message={fieldErrors.name} />
                </div>
                <div>
                  <RequiredLabel>Email</RequiredLabel>
                  <ModalInput type="email" value={draft.email} onChange={(e) => setField('email', e.target.value)} placeholder="Enter email" />
                  <FieldError message={fieldErrors.email} />
                </div>
                <div>
                  <RequiredLabel>Mobile Number</RequiredLabel>
                  <ModalInput type="tel" value={draft.mobile} onChange={(e) => setField('mobile', e.target.value)} placeholder="Enter mobile number" />
                  <FieldError message={fieldErrors.mobile} />
                </div>
                <div>
                  <RequiredLabel>Qualifications</RequiredLabel>
                  <ModalInput value={draft.qualifications} onChange={(e) => setField('qualifications', e.target.value)} placeholder="MBBS, MD, etc." />
                  <FieldError message={fieldErrors.qualifications} />
                </div>
                <div>
                  <RequiredLabel>Specialty</RequiredLabel>
                  <ModalSelect value={draft.specialtyId} onChange={(e) => setField('specialtyId', e.target.value)} options={specialtyOptions} placeholder="Select specialty" />
                  <FieldError message={fieldErrors.specialtyId} />
                </div>
                <div>
                  <RequiredLabel>Store</RequiredLabel>
                  <ModalSelect value={draft.storeId} onChange={(e) => setField('storeId', e.target.value)} options={storeOptions} placeholder="Select store" />
                  <FieldError message={fieldErrors.storeId} />
                </div>
                <div>
                  <ModalFieldLabel>Experience</ModalFieldLabel>
                  <ModalInput type="number" min="0" value={draft.experienceYears} onChange={(e) => setField('experienceYears', e.target.value)} placeholder="Enter years" />
                </div>
                <div>
                  <ModalFieldLabel>Consultation Type</ModalFieldLabel>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {CONSULTATION_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setField('consultationType', opt.id)}
                        className="px-3 py-1.5 rounded-[9px] text-[11.5px] font-bold cursor-pointer"
                        style={
                          draft.consultationType === opt.id
                            ? { background: colors.primaryBtn, color: colors.accentText }
                            : { color: colors.textMuted, border: `1px solid ${colors.borderSubtle}`, background: 'rgba(255,255,255,0.04)' }
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-[13px] font-extrabold text-white">Consultation Schedule</h3>
              <button type="button" className="inline-flex items-center gap-1.5 text-[11px] font-bold cursor-pointer" style={{ color: colors.accent }}>
                <CalendarDays size={14} />
                View Calendar
              </button>
            </div>
            <ScheduleEditor schedule={draft.schedule} onChange={(schedule) => setField('schedule', schedule)} />
          </section>

          {saveError && <p className="text-[12px] font-bold text-red-400">{saveError}</p>}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.09)' }}>
            {isEdit ? (
              confirmDeactivate ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px]" style={{ color: colors.textDim }}>
                    {doctorStatus === 'inactive' ? 'Activate this doctor?' : 'Deactivate this doctor?'}
                  </span>
                  <button type="button" onClick={handleDeactivate} disabled={saving} className="text-[12px] font-bold text-red-400 cursor-pointer">Confirm</button>
                  <button type="button" onClick={() => setConfirmDeactivate(false)} className="text-[12px] font-bold cursor-pointer" style={{ color: colors.textMuted }}>Cancel</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeactivate(true)}
                  className="text-[12px] font-bold cursor-pointer self-start"
                  style={{ color: doctorStatus === 'inactive' ? colors.accent : '#f87171' }}
                >
                  {doctorStatus === 'inactive' ? 'Activate Doctor' : 'Deactivate Doctor'}
                </button>
              )
            ) : (
              <span />
            )}
            <div className="flex justify-end gap-2.5">
              <button type="button" onClick={close} className="text-[12.5px] font-bold px-[18px] py-2 rounded-[10px] cursor-pointer" style={{ color: colors.textHighlight, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)' }}>
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="text-[12.5px] font-extrabold px-5 py-2 rounded-[10px] cursor-pointer disabled:opacity-60" style={{ color: colors.accentText, background: colors.primaryBtn, boxShadow: '0 6px 18px rgba(64,222,170,0.35)' }}>
                {isEdit ? 'Save Changes' : 'Save Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalModal>
  )
}
