import { useEffect, useState } from 'react'
import { Phone, X } from 'lucide-react'
import CallbackRequestModal from '@/modules/customer/components/CallbackRequestModal'
import { useAuthStore } from '@/app/store/authStore'
import {
  contactPhoneTelHref,
  fetchStoreContactPhone,
  formatContactPhoneDisplay,
} from '@/services/generalSettings'
import { colors } from '@/app/themes/colors'

const DISMISS_KEY = 'mediq-order-callback-bar-dismissed'

export default function FloatingOrderCallbackBar() {
  const authUser = useAuthStore((s) => s.user)
  const [visible, setVisible] = useState(false)
  const [phone, setPhone] = useState('')
  const [supportPhone, setSupportPhone] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [phoneError, setPhoneError] = useState('')

  useEffect(() => {
    setVisible(sessionStorage.getItem(DISMISS_KEY) !== '1')
  }, [])

  useEffect(() => {
    if (authUser?.mobile?.trim()) {
      setPhone(authUser.mobile.trim())
    }
  }, [authUser?.mobile])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const value = await fetchStoreContactPhone()
        if (!cancelled) setSupportPhone(value)
      } catch {
        if (!cancelled) setSupportPhone('')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  const openCallback = () => {
    const mobile = phone.trim()
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setPhoneError('Enter a valid 10-digit mobile number.')
      return
    }
    setPhoneError('')
    setModalOpen(true)
  }

  if (!visible) return null

  const supportPhoneDisplay = formatContactPhoneDisplay(supportPhone)
  const supportPhoneTel = contactPhoneTelHref(supportPhone)

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-[70]"
        style={{
          background: colors.headerBg,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderTop: `1px solid ${colors.borderSubtle}`,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.45)',
        }}
        role="region"
        aria-label="Order medicines callback"
      >
        <div className="relative mx-auto flex max-w-[1280px] flex-wrap items-center gap-3 px-4 py-3 pr-12 sm:gap-4 sm:px-6 sm:pr-6 lg:flex-nowrap lg:py-3.5">
          <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(64,222,170,0.14)', border: '1px solid rgba(64,222,170,0.35)' }}
            >
              <Phone size={18} strokeWidth={2.2} style={{ color: colors.accent }} />
            </span>
            <p className="m-0 text-[13px] leading-snug" style={{ color: colors.textSecondary }}>
              Order Medicines…
              {supportPhoneDisplay ? (
                <>
                  {' '}
                  Call us at{' '}
                  <a
                    href={supportPhoneTel}
                    className="font-extrabold no-underline hover:underline"
                    style={{ color: colors.accent }}
                  >
                    {supportPhoneDisplay}
                  </a>
                </>
              ) : null}{' '}
              or get a free call back
            </p>
          </div>

          <p className="m-0 w-full text-[12px] font-semibold leading-snug lg:hidden" style={{ color: colors.textMuted }}>
            Order medicines — get a free call back
          </p>

          <div className="flex w-full min-w-0 flex-1 items-center gap-2 sm:w-auto lg:flex-none lg:min-w-[280px]">
            <div
              className="flex min-w-0 flex-1 items-center overflow-hidden rounded-[10px]"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${colors.border}` }}
            >
              <span
                className="flex shrink-0 items-center gap-1.5 border-r px-2.5 py-2.5 text-[13px] font-bold sm:px-3"
                style={{ borderColor: colors.borderSubtle, color: colors.textHighlight }}
              >
                <span aria-hidden="true">🇮🇳</span>
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                  setPhoneError('')
                }}
                placeholder="Enter Phone Number"
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-[13px] font-semibold outline-none"
                style={{ color: colors.textBright }}
                maxLength={10}
              />
            </div>

            <button
              type="button"
              onClick={openCallback}
              className="inline-flex shrink-0 items-center gap-2 rounded-[10px] px-3 py-2.5 text-[11.5px] font-extrabold cursor-pointer sm:px-4 sm:text-[12.5px]"
              style={{
                background: colors.primaryBtn,
                color: colors.accentText,
                boxShadow: '0 6px 18px rgba(64,222,170,0.35)',
              }}
            >
              <Phone size={15} strokeWidth={2.2} className="hidden sm:block" />
              <span className="whitespace-nowrap">Get a Call to Order Medicines</span>
            </button>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full cursor-pointer sm:static sm:shrink-0"
            style={{ color: colors.textMuted, background: 'rgba(255,255,255,0.06)' }}
            aria-label="Dismiss callback bar"
          >
            <X size={18} />
          </button>
        </div>

        {phoneError && (
          <p className="mx-auto max-w-[1280px] px-4 pb-2 text-[11px] font-semibold text-red-400 sm:px-6" role="alert">
            {phoneError}
          </p>
        )}
      </div>

      {modalOpen && (
        <CallbackRequestModal
          initialMobile={phone.trim()}
          initialDescription="Need help ordering medicines"
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
