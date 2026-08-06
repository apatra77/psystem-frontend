import { TRUST_BADGES } from '@/shared/mocks/customerHome'
import { colors } from '@/app/themes/colors'
import Reveal from './Reveal'
import { SECTION_MAX, SECTION_X } from './layout'

/** App download panel beside the payment / certification badges. */
export default function AppTrustBand() {
  return (
    <section className={`${SECTION_MAX} ${SECTION_X} grid gap-3.5 pt-11 lg:grid-cols-[1.4fr_1fr]`} aria-label="Apps and certifications">
      <Reveal
        className="flex flex-col items-start gap-6 rounded-[20px] p-7 sm:flex-row sm:items-center"
        style={{ background: colors.bgBanner }}
      >
        <div className="flex-1">
          <h2 className="text-[17px] font-extrabold tracking-[-0.4px] sm:text-[18px]" style={{ color: colors.textBright }}>
            Refills, reminders &amp; live tracking — on the app
          </h2>
          <p className="mt-1.5 text-[12px]" style={{ color: colors.textMuted }}>Scan to download · iOS &amp; Android</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {['App Store', 'Google Play'].map((store) => (
              <span
                key={store}
                className="rounded-[10px] px-4 py-2.5 text-[12px] font-bold"
                style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: colors.textBright }}
              >
                {store}
              </span>
            ))}
          </div>
        </div>
        <div
          className="h-[92px] w-[92px] flex-shrink-0 rounded-[14px]"
          style={{
            background: 'repeating-conic-gradient(#0a1712 0% 25%,#e8f5ef 0% 50%)',
            backgroundSize: '16px 16px',
            border: '6px solid #e8f5ef',
          }}
          aria-hidden="true"
        />
      </Reveal>

      <Reveal
        delay={100}
        className="flex flex-col justify-center gap-3 rounded-[20px] p-7"
        style={{
          background: 'linear-gradient(172deg,rgba(255,255,255,.06),rgba(255,255,255,.02))',
          border: '1px solid rgba(255,255,255,.11)',
        }}
      >
        <p className="text-[11px] font-extrabold tracking-[0.16em]" style={{ color: colors.accentSoft }}>
          SECURE &amp; CERTIFIED
        </p>
        <ul className="flex flex-wrap gap-2">
          {TRUST_BADGES.map(({ label, strong }) => (
            <li
              key={label}
              className="rounded-lg px-3 py-1.5 text-[11px] font-bold"
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
    </section>
  )
}
