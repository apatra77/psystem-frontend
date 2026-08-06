import { ENV } from '@/app/config/env'
import { colors } from '@/app/themes/colors'

/**
 * Branded startup screen: logo mark, wordmark, and a three-dot progress hint.
 *
 * Purely presentational — SplashGate owns when it appears and when it fades.
 * `position: fixed` with `inset: 0` means it never participates in document
 * flow, so mounting or unmounting it cannot shift the app underneath.
 */
export default function SplashScreen({ hidden = false }) {
  return (
    <div
      className="splash-screen fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5"
      style={{ background: colors.pageBg, opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto' }}
      role="status"
      aria-live="polite"
      aria-hidden={hidden}
    >
      <span className="sr-only">Loading {ENV.APP_NAME}</span>

      <div className="relative flex items-center justify-center">
        <span
          className="splash-halo absolute h-[136px] w-[136px] rounded-full sm:h-[164px] sm:w-[164px]"
          style={{ background: 'radial-gradient(circle,rgba(64,222,170,.28),transparent 68%)' }}
          aria-hidden="true"
        />
        <span
          className="splash-mark relative flex h-[72px] w-[72px] items-center justify-center rounded-[22px] sm:h-[84px] sm:w-[84px]"
          style={{
            background: colors.primaryBtn,
            boxShadow: '0 18px 44px rgba(64,222,170,.45), inset 0 1px 3px rgba(255,255,255,.5)',
          }}
          aria-hidden="true"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.accentText} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </span>
      </div>

      <p
        className="splash-word text-[26px] font-black tracking-[-0.03em] sm:text-[30px]"
        style={{ color: colors.textBright }}
      >
        {ENV.APP_NAME}
      </p>

      <p className="splash-word text-[12px] font-semibold tracking-[0.18em]" style={{ color: colors.textDim }}>
        LICENSED ONLINE PHARMACY
      </p>

      <div className="splash-word mt-1 flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="splash-dot h-[6px] w-[6px] rounded-full"
            style={{ background: colors.accent, animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
    </div>
  )
}
