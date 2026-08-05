import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Activity,
  ArrowRight,
  Building2,
  ChevronDown,
  Flag,
  Hash,
  Mail,
  Map,
  MapPin,
  Phone,
  UserCircle,
} from 'lucide-react'
import Spinner from '../ui/Spinner'
import { isValidEmail } from '../../utils/validation'
import {
  fetchAddressByPincode,
  mapPincodeAddressResponse,
  matchIndianState,
  saveUserAddress,
  saveUserDetails,
} from '../../services/user'
import { colors } from '../../theme/colors'

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
]

const DEFAULT_COUNTRY_CODE = '+91'

function normalizeAddress(initialAddress) {
  if (!initialAddress) {
    return {
      line1: '',
      line2: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
    }
  }
  if (typeof initialAddress === 'string') {
    return {
      line1: initialAddress,
      line2: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
    }
  }
  return {
    line1: initialAddress.line1 ?? '',
    line2: initialAddress.line2 ?? '',
    landmark: initialAddress.landmark ?? '',
    city: initialAddress.city ?? '',
    state: initialAddress.state ?? '',
    pincode: initialAddress.pincode ?? '',
  }
}

function fieldBorderStyle(error, focused) {
  if (error) {
    return {
      borderColor: '#ff8a80',
      background: 'rgba(255,138,128,0.08)',
    }
  }
  if (focused) {
    return {
      borderColor: colors.accent,
      background: 'rgba(255,255,255,0.06)',
      boxShadow: '0 0 0 4px rgba(64,222,170,0.12)',
    }
  }
  return {
    borderColor: 'rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
  }
}

function ProfileField({
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  inputMode,
  maxLength,
  readOnly,
  loading,
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div>
      {label && (
        <label
          className="block text-[12px] font-semibold mb-1.5"
          style={{ color: colors.textSecondary }}
        >
          {label}
        </label>
      )}
      <div
        className="relative flex items-center rounded-2xl border-2 transition-all duration-200"
        style={fieldBorderStyle(error, focused)}
      >
        {Icon && (
          <Icon
            size={15}
            className="absolute left-3.5 flex-shrink-0 transition-colors pointer-events-none"
            style={{
              color: error ? '#ff8a80' : focused ? colors.accent : colors.textDim,
            }}
          />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          readOnly={readOnly}
          className={`field-input w-full bg-transparent py-2.5 text-sm outline-none rounded-2xl ${Icon ? 'pl-10 pr-10' : 'px-3.5 pr-10'} ${readOnly ? 'opacity-80 cursor-default' : ''}`}
          style={{ color: colors.textBright, colorScheme: 'dark' }}
        />
        {loading && (
          <span className="absolute right-3.5 pointer-events-none">
            <Spinner />
          </span>
        )}
      </div>
      {error && <p className="mt-1.5 ml-0.5 text-xs text-[#ff8a80]">{error}</p>}
    </div>
  )
}

function ProfilePhoneField({ label, countryCode, value, onChange, error }) {
  const [focused, setFocused] = useState(false)

  return (
    <div>
      {label && (
        <label
          className="block text-[12px] font-semibold mb-1.5"
          style={{ color: colors.textSecondary }}
        >
          {label}
        </label>
      )}
      <div
        className="flex items-stretch rounded-2xl border-2 transition-all duration-200 overflow-hidden"
        style={fieldBorderStyle(error, focused)}
      >
        <div
          className="flex items-center px-3.5 py-2.5 text-sm font-bold flex-shrink-0"
          style={{
            color: colors.textHighlight,
            borderRight: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          {countryCode}
        </div>
        <div className="relative flex-1 flex items-center min-w-0">
          <Phone
            size={15}
            className="absolute left-3.5 flex-shrink-0 pointer-events-none"
            style={{ color: focused ? colors.accent : colors.textDim }}
          />
          <input
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="9876543210"
            autoComplete="tel-national"
            inputMode="numeric"
            maxLength={10}
            className="field-input w-full bg-transparent pl-10 pr-3.5 py-2.5 text-sm outline-none"
            style={{ color: colors.textBright, colorScheme: 'dark' }}
          />
        </div>
      </div>
      {error && <p className="mt-1.5 ml-0.5 text-xs text-[#ff8a80]">{error}</p>}
    </div>
  )
}

function ProfileSelect({ label, icon: Icon, value, onChange, options, placeholder, error }) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return

    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuMaxH = 200
      const gap = 6
      const spaceBelow = window.innerHeight - rect.bottom - gap
      const spaceAbove = rect.top - gap
      const openUp = spaceBelow < 160 && spaceAbove > spaceBelow

      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: 110,
        maxHeight: openUp
          ? Math.min(menuMaxH, spaceAbove)
          : Math.min(menuMaxH, spaceBelow),
        ...(openUp ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap }),
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const handleClick = (event) => {
      if (
        !buttonRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const selectedLabel = options.find((opt) => opt === value)

  return (
    <div>
      {label && (
        <label
          className="block text-[12px] font-semibold mb-1.5"
          style={{ color: colors.textSecondary }}
        >
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative w-full flex items-center rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer"
        style={{
          ...fieldBorderStyle(error, open),
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {Icon && (
          <Icon
            size={15}
            className="absolute left-3.5 flex-shrink-0 pointer-events-none"
            style={{ color: open ? colors.accent : colors.textDim }}
          />
        )}
        <span
          className={`block w-full py-2.5 text-sm truncate ${Icon ? 'pl-10 pr-9' : 'px-3.5 pr-9'}`}
          style={{ color: selectedLabel ? colors.textBright : colors.textDim }}
        >
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDown
          size={15}
          className="absolute right-3.5 pointer-events-none transition-transform"
          style={{
            color: colors.textDim,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      {error && <p className="mt-1.5 ml-0.5 text-xs text-[#ff8a80]">{error}</p>}

      {open &&
        menuStyle &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className="rounded-[12px] p-1.5 overflow-y-auto owner-scroll owner-dropdown"
            style={{
              ...menuStyle,
              background: 'rgba(10,28,22,0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.13)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
            }}
          >
            {options.map((opt) => {
              const isSelected = opt === value
              return (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt)
                    setOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] font-semibold cursor-pointer transition-colors hover:bg-[rgba(64,222,170,0.1)]"
                  style={{
                    color: isSelected ? colors.accent : '#cfe6dc',
                    background: isSelected ? 'rgba(64,222,170,0.12)' : 'transparent',
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}

function isValidIndianMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile)
}

export default function ProfileSetupModal({
  mode = 'setup',
  initialFullName = '',
  initialEmail = '',
  initialMobile = '',
  initialCountryCode = DEFAULT_COUNTRY_CODE,
  initialAddress = null,
  onComplete,
  onSkip,
  onClose,
}) {
  const isAddAddress = mode === 'addAddress'
  const [fullName, setFullName] = useState(initialFullName)
  const [email, setEmail] = useState(initialEmail)
  const [mobile, setMobile] = useState(initialMobile)
  const [countryCode] = useState(initialCountryCode || DEFAULT_COUNTRY_CODE)
  const [address, setAddress] = useState(() => normalizeAddress(initialAddress))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const lastLookupPincode = useRef('')

  const setAddressField = (key, value) => {
    if (key === 'pincode') {
      lastLookupPincode.current = ''
    }
    setAddress((prev) => ({ ...prev, [key]: value }))
    if (key === 'pincode') {
      setErrors((prev) => ({ ...prev, pincode: '' }))
    }
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const pincode = address.pincode.trim()
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeLoading(false)
      return undefined
    }
    if (lastLookupPincode.current === pincode) return undefined

    const controller = new AbortController()
    let cancelled = false

    ;(async () => {
      setPincodeLoading(true)
      try {
        const data = await fetchAddressByPincode(pincode, controller.signal)
        if (cancelled) return

        lastLookupPincode.current = pincode
        const mapped = mapPincodeAddressResponse(data)
        setAddress((prev) => ({
          ...prev,
          city: mapped.city || prev.city,
          state: mapped.state ? matchIndianState(mapped.state, INDIAN_STATES) : prev.state,
        }))
        setErrors((prev) => ({ ...prev, pincode: '', city: '', state: '' }))
      } catch (error) {
        if (cancelled || error?.name === 'AbortError') return
        lastLookupPincode.current = ''
        setErrors((prev) => ({
          ...prev,
          pincode:
            error instanceof Error ? error.message : 'Could not find address for this pincode',
        }))
      } finally {
        if (!cancelled) setPincodeLoading(false)
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [address.pincode])

  const submit = async (e) => {
    e.preventDefault()
    const nextErrors = {}

    if (!fullName.trim()) nextErrors.name = 'Full name is required'
    if (!email.trim()) nextErrors.email = 'Email is required'
    else if (!isValidEmail(email.trim())) nextErrors.email = 'Enter a valid email'
    if (!mobile.trim()) nextErrors.mobile = 'Mobile number is required'
    else if (!isValidIndianMobile(mobile.trim())) nextErrors.mobile = 'Enter a valid 10-digit mobile number'
    if (!address.line1.trim()) nextErrors.line1 = 'Address line 1 is required'
    if (!address.city.trim()) nextErrors.city = 'City is required'
    if (!address.state.trim()) nextErrors.state = 'State is required'
    if (!address.pincode.trim()) nextErrors.pincode = 'Pincode is required'
    else if (!/^\d{6}$/.test(address.pincode.trim())) nextErrors.pincode = 'Enter a valid 6-digit pincode'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const profile = {
      fullName: fullName.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      countryCode,
      country: 'India',
      address: {
        line1: address.line1.trim(),
        line2: address.line2.trim(),
        landmark: address.landmark.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
      },
    }

    setSaving(true)
    setSaveError('')
    try {
      if (isAddAddress) {
        await saveUserAddress(profile)
      } else {
        await saveUserDetails(profile)
      }
      onComplete?.(profile)
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : isAddAddress
            ? 'Failed to save address. Please try again.'
            : 'Failed to save profile. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: 'rgba(5,15,12,0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="relative w-full max-w-[660px] max-h-[88vh] rounded-[24px] shadow-2xl overflow-hidden flex flex-col"
        style={{
          animation: 'modalPop 0.3s cubic-bezier(0.34,1.5,0.64,1) both',
          background: colors.bgElevated,
          border: `1px solid ${colors.borderStrong}`,
        }}
      >
        <div className="flex-shrink-0">
          <div className="h-1" style={{ background: colors.primaryBtn }} />

          <div
            className="flex items-center justify-center gap-2 px-5 pt-3.5 pb-2.5"
            style={{ borderBottom: `1px solid rgba(64,222,170,0.2)` }}
          >
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: colors.primaryBtn }}
            >
              <Activity size={14} className="text-[#04140f]" strokeWidth={2.5} />
            </div>
            <span
              className="text-lg font-black tracking-tight text-white"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              MEDIQ
            </span>
          </div>
        </div>

        <form onSubmit={submit} noValidate className="flex flex-col flex-1 min-h-0">
          <div
            className="flex-1 overflow-y-auto px-7 pt-4 pb-3 min-h-0 owner-scroll"
            style={{ animation: 'slideIn 0.22s ease both' }}
          >
            <div className="mb-3">
              <h2
                className="text-[22px] font-black text-white"
                style={{ letterSpacing: '-0.025em' }}
              >
                {isAddAddress ? 'Add new address' : 'Complete your profile'}
              </h2>
              <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: colors.textSecondary }}>
                {isAddAddress
                  ? 'Add your name and delivery address to save this location.'
                  : "You're almost there. Add your name and delivery address to finish setting up your account."}
              </p>
            </div>

            <div className="space-y-2.5">
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: colors.textDim }}
                >
                  Full name
                </label>
                <ProfileField
                  icon={UserCircle}
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Rahul Sharma"
                  error={errors.name}
                  autoComplete="name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: colors.textDim }}
                  >
                    Email
                  </label>
                  <ProfileField
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                    error={errors.email}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: colors.textDim }}
                  >
                    Mobile
                  </label>
                  <ProfilePhoneField
                    countryCode={countryCode}
                    value={mobile}
                    onChange={setMobile}
                    error={errors.mobile}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: colors.textDim }}
                >
                  Address
                </label>

                <div className="space-y-2">
                  <ProfileField
                    label="Address Line 1"
                    icon={MapPin}
                    value={address.line1}
                    onChange={(v) => setAddressField('line1', v)}
                    placeholder="House no., building, street"
                    error={errors.line1}
                    autoComplete="address-line1"
                  />

                  <ProfileField
                    label="Address Line 2 (Optional)"
                    icon={Building2}
                    value={address.line2}
                    onChange={(v) => setAddressField('line2', v)}
                    placeholder="Apartment, suite, floor, etc."
                    autoComplete="address-line2"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <ProfileField
                      label="Landmark (Optional)"
                      icon={Flag}
                      value={address.landmark}
                      onChange={(v) => setAddressField('landmark', v)}
                      placeholder="Nearby place or landmark"
                    />
                    <ProfileField
                      label="Pincode"
                      icon={Hash}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={address.pincode}
                      onChange={(v) => setAddressField('pincode', v.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Pincode"
                      error={errors.pincode}
                      autoComplete="postal-code"
                      loading={pincodeLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <ProfileField
                      label="City / Town"
                      icon={Building2}
                      value={address.city}
                      onChange={(v) => setAddressField('city', v)}
                      placeholder="City / Town"
                      error={errors.city}
                      autoComplete="address-level2"
                    />
                    <ProfileSelect
                      label="State"
                      icon={Map}
                      value={address.state}
                      onChange={(v) => setAddressField('state', v)}
                      options={INDIAN_STATES}
                      placeholder="State"
                      error={errors.state}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="flex-shrink-0 px-7 py-4 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.09)' }}
          >
            {saveError && (
              <div className="mb-3 text-[12px] font-bold text-red-400">{saveError}</div>
            )}
            <div className="flex gap-3">
              {isAddAddress ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      color: colors.textHighlight,
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.16)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: colors.primaryBtn,
                      color: colors.accentText,
                      boxShadow: '0 8px 24px rgba(64,222,170,0.35)',
                    }}
                  >
                    {saving ? (
                      <>
                        <Spinner />
                        Saving…
                      </>
                    ) : (
                      'Save address'
                    )}
                  </button>
                </>
              ) : (
                <>
              <button
                type="button"
                onClick={onSkip}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  color: colors.textHighlight,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.16)',
                }}
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: colors.primaryBtn,
                  color: colors.accentText,
                  boxShadow: '0 8px 24px rgba(64,222,170,0.35)',
                }}
              >
                {saving ? (
                  <>
                    <Spinner />
                    Saving…
                  </>
                ) : (
                  <>
                    Continue to dashboard
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
