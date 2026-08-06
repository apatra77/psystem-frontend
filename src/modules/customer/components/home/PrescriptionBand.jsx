import { Link } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import { colors } from '@/app/themes/colors'
import Reveal from './Reveal'
import { SECTION_MAX, SECTION_X } from './layout'

/** Prescription upload call-out. Stacks under `md`, side-by-side above it. */
export default function PrescriptionBand() {
  return (
    <section className={`${SECTION_MAX} ${SECTION_X} pt-11`} aria-labelledby="rx-title">
      <Reveal
        className="grid items-center gap-6 overflow-hidden rounded-[22px] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:gap-8"
        style={{ background: colors.ctaBg, border: '1px solid rgba(255,255,255,.13)' }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <img
            src="/images/landing/prescription.png"
            alt=""
            loading="lazy"
            decoding="async"
            className="w-[100px] flex-shrink-0 rounded-[12px] sm:w-[120px]"
            style={{ boxShadow: '0 14px 30px rgba(0,0,0,.5)' }}
          />
          <div>
            <h2 id="rx-title" className="text-[18px] font-extrabold tracking-[-0.5px] sm:text-[21px]" style={{ color: colors.textBright }}>
              Have a prescription? Upload &amp; we handle the rest.
            </h2>
            <p className="mt-1.5 max-w-[520px] text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>
              Pharmacist verification, interaction checks and generic substitutes that save up to 70% — automatic on every upload.
            </p>
          </div>
        </div>

        <Link
          to={PATHS.customer.prescription}
          className="justify-self-start whitespace-nowrap rounded-[12px] px-7 py-3.5 text-[13px] font-extrabold"
          style={{ background: colors.primaryBtn, color: colors.accentText, boxShadow: '0 8px 24px rgba(64,222,170,.4)' }}
        >
          ℞ Upload prescription
        </Link>
      </Reveal>
    </section>
  )
}
