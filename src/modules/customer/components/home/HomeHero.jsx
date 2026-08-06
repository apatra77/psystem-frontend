import { Link } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import useParallax from '@/shared/hooks/useParallax'
import useMediaQuery from '@/shared/hooks/useMediaQuery'
import { HERO } from '@/shared/mocks/customerHome'
import { colors } from '@/app/themes/colors'
import { SECTION_MAX, SECTION_X } from './layout'

/**
 * Aurora hero. The three floating packshots are decorative parallax layers:
 * they are hidden below `lg` (where they would collide with the copy) and the
 * parallax hook is disabled with them, so phones do no scroll work at all.
 */
export default function HomeHero() {
  const showDecor = useMediaQuery('(min-width: 1024px)')

  const layerFront = useParallax(0.24, { enabled: showDecor })
  const layerMid = useParallax(0.36, { enabled: showDecor })
  const layerBack = useParallax(0.14, { enabled: showDecor })

  return (
    <section className="relative isolate" style={{ background: colors.heroBg, overflow: 'clip' }} aria-labelledby="hero-title">
      <div
        className="aurora-glow pointer-events-none absolute -top-[120px] right-20 h-[460px] w-[460px] rounded-full"
        style={{ background: 'radial-gradient(circle,rgba(64,222,170,.18),transparent 62%)', filter: 'blur(16px)' }}
        aria-hidden="true"
      />

      {showDecor && (
        <div aria-hidden="true">
          <div ref={layerFront} className="pointer-events-none absolute right-[8vw] top-10 z-[2] w-[300px] will-change-transform">
            <img src="/images/landing/hero-primary.png" alt="" loading="lazy" decoding="async" className="float-slow block w-full" />
          </div>
          <div ref={layerMid} className="pointer-events-none absolute right-[22vw] top-[210px] z-[2] w-[150px] will-change-transform">
            <img src="/images/landing/hero-secondary.png" alt="" loading="lazy" decoding="async" className="float-fast block w-full" />
          </div>
          <div ref={layerBack} className="pointer-events-none absolute right-[30vw] top-[60px] w-[120px] opacity-85 will-change-transform">
            <img src="/images/landing/hero-tertiary.png" alt="" loading="lazy" decoding="async" className="float-drift block w-full" />
          </div>
        </div>
      )}

      <div className={`${SECTION_MAX} ${SECTION_X} relative z-[5]`}>
        <div className="max-w-[680px] py-12 lg:py-14">
          <p className="flex items-center gap-3 text-[11px] font-bold tracking-[0.22em]" style={{ color: colors.accentSoft }}>
            <span className="h-px w-[26px]" style={{ background: colors.accentSoft }} aria-hidden="true" />
            {HERO.kicker}
          </p>

          <h1
            id="hero-title"
            className="mt-4 text-[32px] font-extrabold leading-[1.06] tracking-[-1px] sm:text-[40px] lg:text-[46px] lg:tracking-[-1.8px]"
            style={{ color: colors.textBright }}
          >
            {HERO.titleLead}
            <br />
            {HERO.titleRest}{' '}
            <span
              style={{
                background: colors.gradientText,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {HERO.titleAccent}
            </span>
          </h1>

          <p className="mt-3.5 max-w-[420px] text-[14px] leading-relaxed sm:text-[15px]" style={{ color: colors.textMuted }}>
            {HERO.subtitle}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={PATHS.customer.search}
              className="rounded-[12px] px-7 py-3.5 text-[13px] font-extrabold"
              style={{ background: colors.primaryBtn, color: colors.accentText, boxShadow: '0 8px 24px rgba(64,222,170,.4)' }}
            >
              Order medicines
            </Link>
            <Link
              to={PATHS.customer.prescription}
              className="rounded-[12px] px-7 py-3.5 text-[13px] font-bold"
              style={{ background: 'rgba(255,255,255,.07)', border: `1px solid ${colors.borderStrong}`, color: colors.textBright }}
            >
              ℞ Upload prescription
            </Link>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-7 gap-y-2 text-[11px] font-bold tracking-[0.1em]" style={{ color: colors.textDim }}>
            {HERO.trust.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
