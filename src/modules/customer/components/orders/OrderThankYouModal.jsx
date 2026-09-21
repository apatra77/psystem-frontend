import { useEffect, useRef } from 'react'
import { Check, X } from 'lucide-react'
import PortalModal from '@/shared/ui/PortalModal'
import { colors } from '@/app/themes/colors'

const AUTO_CLOSE_MS = 3500

const SPARKS = [
  { left: '18%', top: '28%', delay: '0.1s', color: '#40deaa' },
  { left: '78%', top: '32%', delay: '0.22s', color: '#6fc2ff' },
  { left: '72%', top: '68%', delay: '0.18s', color: '#ffd58f' },
  { left: '22%', top: '72%', delay: '0.28s', color: '#40deaa' },
]

/** Flipkart-style order placed toast with motion + auto dismiss. */
export default function OrderThankYouModal({ open, orderId, onClose }) {
  const closeTimerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    closeTimerRef.current = window.setTimeout(onClose, AUTO_CLOSE_MS)
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <PortalModal onClose={onClose} width={340} accentBorder scrollable={false}>
      <div className="relative overflow-hidden px-6 pb-5 pt-7 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 transition hover:bg-white/5"
          style={{ color: colors.textDim }}
          aria-label="Close"
        >
          <X size={17} />
        </button>

        <div className="relative mx-auto mb-5 h-[76px] w-[76px]">
          {SPARKS.map((spark) => (
            <span
              key={`${spark.left}-${spark.top}`}
              className="order-success-spark pointer-events-none absolute h-2 w-2 rounded-full"
              style={{
                left: spark.left,
                top: spark.top,
                background: spark.color,
                animationDelay: spark.delay,
                boxShadow: `0 0 10px ${spark.color}`,
              }}
              aria-hidden="true"
            />
          ))}
          <span
            className="order-success-ripple pointer-events-none absolute inset-0 rounded-full"
            style={{ border: '2px solid rgba(64,222,170,0.45)' }}
            aria-hidden="true"
          />
          <span
            className="order-success-check relative z-[1] mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full"
            style={{
              background: 'linear-gradient(145deg, rgba(64,222,170,0.28), rgba(13,138,100,0.35))',
              border: '2px solid rgba(64,222,170,0.55)',
              boxShadow: '0 0 28px rgba(64,222,170,0.35)',
            }}
          >
            <Check size={36} strokeWidth={3} style={{ color: '#eafff6' }} />
          </span>
        </div>

        <h2
          className="text-[19px] font-extrabold leading-tight"
          style={{ color: colors.textBright, animation: 'dropIn 0.4s ease 0.2s both' }}
        >
          Thank you!
        </h2>
        <p
          className="mt-2 text-[14px] font-semibold leading-snug"
          style={{ color: colors.accentSoft, animation: 'dropIn 0.4s ease 0.28s both' }}
        >
          Order placed successfully.
        </p>
        <p
          className="mt-2 text-[13px] leading-relaxed"
          style={{ color: colors.textMuted, animation: 'dropIn 0.4s ease 0.34s both' }}
        >
          Visit again — we&apos;re always here for your health needs.
        </p>
        {orderId ? (
          <p className="mt-3 text-[11px] font-bold tabular-nums tracking-wide" style={{ color: colors.textDim }}>
            Order ID: {orderId}
          </p>
        ) : null}

        <div
          className="mt-5 h-1 w-full overflow-hidden rounded-full"
          style={{ background: 'rgba(255,255,255,0.08)' }}
          aria-hidden="true"
        >
          <div
            className="order-success-auto-bar h-full rounded-full"
            style={{ background: colors.accent }}
          />
        </div>
        <p className="mt-2 text-[10px]" style={{ color: colors.textDim }}>
          Closing automatically… tap ✕ to dismiss
        </p>
      </div>
    </PortalModal>
  )
}
