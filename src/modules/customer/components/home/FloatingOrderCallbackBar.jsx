import { useEffect, useState } from 'react'
import { Phone, X } from 'lucide-react'
import CallbackRequestModal from '@/modules/customer/components/CallbackRequestModal'
import { useAuthStore } from '@/app/store/authStore'

const DISMISS_KEY = 'mediq-order-callback-bar-dismissed'
const SUPPORT_PHONE = '1800-212-2323'
const SUPPORT_TEL = '18002122323'

export default function FloatingOrderCallbackBar() {
  const authUser = useAuthStore((s) => s.user)
  const [visible, setVisible] = useState(false)
  const [phone, setPhone] = useState('')
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

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#e8e8e8] bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
        role="region"
        aria-label="Order medicines callback"
      >
        <div className="relative mx-auto flex max-w-[1280px] flex-wrap items-center gap-3 px-4 py-3 pr-12 sm:gap-4 sm:px-6 sm:pr-6 lg:flex-nowrap lg:py-3.5">
          <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-white">
              <Phone size={18} strokeWidth={2.2} />
            </span>
            <p className="m-0 text-[13px] leading-snug text-[#3b3b3b]">
              Order Medicines… Call us at{' '}
              <a href={`tel:${SUPPORT_TEL}`} className="font-extrabold text-[#10847e] no-underline hover:underline">
                {SUPPORT_PHONE}
              </a>{' '}
              or get a free call back
            </p>
          </div>

          <p className="m-0 w-full text-[12px] font-semibold leading-snug text-[#3b3b3b] lg:hidden">
            Order medicines — get a free call back
          </p>

          <div className="flex w-full min-w-0 flex-1 items-center gap-2 sm:w-auto lg:flex-none lg:min-w-[280px]">
            <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-[8px] border border-[#d8d8d8] bg-white">
              <span className="flex shrink-0 items-center gap-1.5 border-r border-[#e5e5e5] px-2.5 py-2.5 text-[13px] font-bold text-[#333] sm:px-3">
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
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-[13px] font-medium text-[#222] outline-none placeholder:text-[#999]"
                maxLength={10}
              />
            </div>

            <button
              type="button"
              onClick={openCallback}
              className="inline-flex shrink-0 items-center gap-2 rounded-[8px] px-3 py-2.5 text-[11.5px] font-extrabold text-white cursor-pointer sm:px-4 sm:text-[12.5px]"
              style={{ background: '#ff6f61', boxShadow: '0 4px 14px rgba(255,111,97,0.35)' }}
            >
              <Phone size={15} strokeWidth={2.2} className="hidden sm:block" />
              <span className="whitespace-nowrap">Get a Call to Order Medicines</span>
            </button>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[#666] cursor-pointer hover:bg-[#f3f3f3] sm:static sm:shrink-0"
            aria-label="Dismiss callback bar"
          >
            <X size={18} />
          </button>
        </div>

        {phoneError && (
          <p className="mx-auto max-w-[1280px] px-4 pb-2 text-[11px] font-semibold text-red-500 sm:px-6" role="alert">
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
