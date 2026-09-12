import { Link } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { PATHS } from '@/app/router/paths'
import { TRUST_BADGES } from '@/shared/mocks/customerHome'
import { colors } from '@/app/themes/colors'
import Reveal from './Reveal'
import { SECTION_MAX, SECTION_X } from './layout'

const PANEL =
  'flex min-h-[132px] flex-col justify-center rounded-[16px] border border-[rgba(255,255,255,0.11)] p-4 sm:min-h-[140px] sm:p-5'

/** Prescription, app download, and trust badges in one compact row. */
export default function AppTrustBand() {
  return (
    <section
      className={`${SECTION_MAX} ${SECTION_X} pt-8 pb-2`}
      aria-label="Prescription upload, app download, and certifications"
    >
      <div className="rail-scroll -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-[1.25fr_1fr_0.95fr]">
        <Reveal
          className={`${PANEL} w-[88vw] max-w-[360px] flex-shrink-0 snap-start md:w-auto md:max-w-none`}
          style={{ background: colors.ctaBg }}
        >
          <div className="flex h-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <img
              src="/images/landing/prescription.png"
              alt=""
              loading="lazy"
              decoding="async"
              className="h-[64px] w-[64px] flex-shrink-0 rounded-[10px] object-cover sm:h-[72px] sm:w-[72px]"
              style={{ boxShadow: '0 10px 24px rgba(0,0,0,.45)' }}
            />
            <div className="min-w-0 flex-1">
              <h2
                id="rx-title"
                className="text-[14px] font-extrabold leading-snug tracking-[-0.3px] text-white sm:text-[15px]"
              >
                Have a prescription? Upload &amp; we handle the rest.
              </h2>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed sm:text-[12px]" style={{ color: colors.textSecondary }}>
                Pharmacist verification, interaction checks and generic substitutes that save up to 70%.
              </p>
            </div>
            <Link
              to={PATHS.customer.prescription}
              className="inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-[12px] border border-[rgba(130,210,185,0.28)] bg-[rgba(255,255,255,0.05)] px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-[rgba(255,255,255,0.08)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35D6A3] sm:text-[13px]"
            >
              <Upload size={16} strokeWidth={2.2} aria-hidden="true" />
              Upload prescription
            </Link>
          </div>
        </Reveal>

        <Reveal
          delay={60}
          className={`${PANEL} w-[88vw] max-w-[360px] flex-shrink-0 snap-start md:w-auto md:max-w-none`}
          style={{
            background: 'linear-gradient(172deg,rgba(255,255,255,.06),rgba(255,255,255,.02))',
          }}
        >
          <p className="text-[10px] font-extrabold tracking-[0.14em]" style={{ color: colors.accentSoft }}>
            SECURE &amp; CERTIFIED
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {TRUST_BADGES.map(({ label, strong }) => (
              <li
                key={label}
                className="rounded-md px-2 py-1 text-[10px] font-bold sm:px-2.5 sm:py-1.5"
                style={{
                  color: strong ? '#9ff0d4' : '#cfe6dc',
                  border: `1px solid ${strong ? 'rgba(64,222,170,.35)' : 'rgba(255,255,255,.15)'}`,
                }}
              >
                {label}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal
          delay={120}
          className={`${PANEL} w-[88vw] max-w-[360px] flex-shrink-0 snap-start md:w-auto md:max-w-none`}
          style={{ background: colors.bgBanner }}
        >
          <div className="flex h-full items-center gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-[13px] font-extrabold leading-snug tracking-[-0.3px] text-white sm:text-[14px]">
                Refills, reminders &amp; live tracking — on the app
              </h2>
              <p className="mt-1 text-[10px] sm:text-[11px]" style={{ color: colors.textMuted }}>
                Scan to download · iOS &amp; Android
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {['App Store', 'Google Play'].map((store) => (
                  <span
                    key={store}
                    className="rounded-[8px] px-2.5 py-1.5 text-[10px] font-bold sm:px-3 sm:py-2 sm:text-[11px]"
                    style={{
                      background: 'rgba(255,255,255,.1)',
                      border: '1px solid rgba(255,255,255,.2)',
                      color: colors.textBright,
                    }}
                  >
                    {store}
                  </span>
                ))}
              </div>
            </div>
            <div
              className="h-[64px] w-[64px] flex-shrink-0 rounded-[10px] sm:h-[72px] sm:w-[72px]"
              style={{
                background: 'repeating-conic-gradient(#0a1712 0% 25%,#e8f5ef 0% 50%)',
                backgroundSize: '12px 12px',
                border: '4px solid #e8f5ef',
              }}
              aria-hidden="true"
              title="Download QR code"
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
