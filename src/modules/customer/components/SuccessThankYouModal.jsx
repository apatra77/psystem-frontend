import { Check, X } from 'lucide-react'
import PortalModal from '@/shared/ui/PortalModal'
import Button from '@/shared/ui/Button'
import { colors } from '@/app/themes/colors'

const SPARKS = [
  { left: '18%', top: '28%', delay: '0.1s', color: '#40deaa' },
  { left: '78%', top: '32%', delay: '0.22s', color: '#6fc2ff' },
  { left: '72%', top: '68%', delay: '0.18s', color: '#ffd58f' },
  { left: '22%', top: '72%', delay: '0.28s', color: '#40deaa' },
]

/** Shared success popup (orders, consultation bookings, etc.). Stays open until dismissed. */
export default function SuccessThankYouModal({
  open,
  onClose,
  successLine,
  bodyLine,
  referenceLabel,
  referenceId,
  dismissLabel = 'Got it',
}) {
  if (!open) return null

  return (
    <PortalModal onClose={onClose} width={340} accentBorder scrollable={false}>
      <div className="relative overflow-hidden px-6 pb-6 pt-7 text-center">
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
          {successLine}
        </p>
        {bodyLine ? (
          <p
            className="mt-2 text-[13px] leading-relaxed"
            style={{ color: colors.textMuted, animation: 'dropIn 0.4s ease 0.34s both' }}
          >
            {bodyLine}
          </p>
        ) : null}
        {referenceId ? (
          <p className="mt-3 text-[11px] font-bold tabular-nums tracking-wide" style={{ color: colors.textDim }}>
            {referenceLabel}: {referenceId}
          </p>
        ) : null}

        <Button type="button" className="mt-5 w-full" onClick={onClose}>
          {dismissLabel}
        </Button>
      </div>
    </PortalModal>
  )
}
