import { useEffect, useState } from 'react'
import { CheckCircle2, Phone, X } from 'lucide-react'
import PortalModal, { ModalFieldLabel, ModalInput } from '@/shared/ui/PortalModal'
import Spinner from '@/shared/ui/Spinner'
import { useAuthStore } from '@/app/store/authStore'
import {
  CALLBACK_DESCRIPTION_MAX,
  createUserCallbackRequest,
} from '@/services/callbackRequests'
import { colors } from '@/app/themes/colors'

const SUCCESS_MESSAGE =
  'Your request was submitted successfully. You will receive a call shortly.'

function ModalTextarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full rounded-[10px] px-3 py-2.5 text-[13px] text-white font-[inherit] outline-none resize-none ${className}`}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.16)',
      }}
      {...props}
    />
  )
}

export default function CallbackRequestModal({
  onClose,
  initialMobile = '',
  initialDescription = '',
}) {
  const authUser = useAuthStore((s) => s.user)

  const [step, setStep] = useState('form')
  const [customerName, setCustomerName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setCustomerName(authUser?.fullName?.trim() ?? '')
    setMobileNumber(initialMobile || authUser?.mobile?.trim() || '')
    setDescription(initialDescription)
    setError('')
    setStep('form')
  }, [authUser, initialMobile, initialDescription])

  const handleSave = async () => {
    const name = customerName.trim()
    const mobile = mobileNumber.trim()
    const details = description.trim()

    if (!name) {
      setError('Please enter your name.')
      return
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }
    if (!details) {
      setError('Please describe how we can help.')
      return
    }

    setSaving(true)
    setError('')

    try {
      await createUserCallbackRequest({
        customerName: name,
        mobileNumber: mobile,
        description: details,
        countryCode: authUser?.countryCode ?? '+91',
      })
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your callback request.')
    } finally {
      setSaving(false)
    }
  }

  if (step === 'success') {
    return (
      <PortalModal onClose={onClose} width={400} accentBorder>
        <div className="p-6 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: 'rgba(64,222,170,0.14)', border: '1px solid rgba(64,222,170,0.35)' }}
          >
            <CheckCircle2 size={28} style={{ color: colors.accent }} strokeWidth={2} />
          </div>
          <h2 className="text-[17px] font-extrabold text-white mb-2">Thank you</h2>
          <p className="text-[13px] leading-relaxed m-0" style={{ color: colors.textSecondary }}>
            {SUCCESS_MESSAGE}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-[11px] px-5 py-2.5 text-[13px] font-extrabold cursor-pointer"
            style={{ background: colors.primaryBtn, color: colors.accentText }}
          >
            OK
          </button>
        </div>
      </PortalModal>
    )
  }

  return (
    <PortalModal onClose={onClose} width={420} accentBorder>
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: 'rgba(64,222,170,0.12)', border: '1px solid rgba(64,222,170,0.3)' }}
            >
              <Phone size={16} style={{ color: colors.accent }} strokeWidth={2.2} />
            </span>
            <h2 className="text-[17px] font-extrabold text-white tracking-tight m-0">Request a call back</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-80 disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.07)', color: colors.textHighlight }}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <ModalFieldLabel>Name</ModalFieldLabel>
            <ModalInput
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your full name"
              disabled={saving}
              maxLength={120}
            />
          </label>

          <label className="block">
            <ModalFieldLabel>Mobile number</ModalFieldLabel>
            <ModalInput
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              disabled={saving}
              inputMode="numeric"
              maxLength={10}
            />
          </label>

          <label className="block">
            <div className="flex items-center justify-between mb-1.5">
              <ModalFieldLabel>Description</ModalFieldLabel>
              <span className="text-[10px] font-bold" style={{ color: colors.textDim }}>
                {description.length}/{CALLBACK_DESCRIPTION_MAX}
              </span>
            </div>
            <ModalTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, CALLBACK_DESCRIPTION_MAX))}
              placeholder="Tell us how we can help you"
              disabled={saving}
              rows={4}
              maxLength={CALLBACK_DESCRIPTION_MAX}
            />
          </label>
        </div>

        {error && (
          <p className="mt-3 mb-0 text-[12px] font-semibold text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2.5 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-[12.5px] font-bold px-[18px] py-2 rounded-[10px] cursor-pointer disabled:opacity-60"
            style={{
              color: colors.textBright,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.16)',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-[12.5px] font-extrabold px-5 py-2 rounded-[10px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
            style={{
              color: colors.accentText,
              background: colors.primaryBtn,
              boxShadow: '0 6px 18px rgba(64,222,170,0.35)',
            }}
          >
            {saving ? (
              <>
                <Spinner />
                Saving…
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </PortalModal>
  )
}
