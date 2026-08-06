import { Link } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import { SERVICES } from '@/shared/mocks/customerHome'
import { colors } from '@/app/themes/colors'
import Reveal from './Reveal'
import { SECTION_MAX, SECTION_X } from './layout'

/** Consult / diagnostics / auto-refill trio. One column on phone, three from `md`. */
export default function ServiceCards() {
  return (
    <section className={`${SECTION_MAX} ${SECTION_X} pt-11`} aria-label="MEDIQ services">
      <ul className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3">
        {SERVICES.map((service, i) => (
          <Reveal as="li" key={service.id} delay={i * 90}>
            <Link
              to={PATHS.customer.support}
              className="relative flex min-h-[190px] flex-col overflow-hidden rounded-[20px] p-6"
              style={{ background: service.bg, border: `1px solid ${service.border}` }}
            >
              <span
                className="float-service pointer-events-none absolute -right-9 -top-7 h-[150px] w-[150px] rounded-full"
                style={{ background: `radial-gradient(circle,${service.accent}33,transparent 68%)` }}
                aria-hidden="true"
              />
              <p className="text-[10px] font-extrabold tracking-[0.2em]" style={{ color: service.accent }}>
                {service.kicker}
              </p>
              <h3 className="mt-2.5 max-w-[190px] text-[17px] font-extrabold tracking-[-0.3px] sm:text-[18px]" style={{ color: colors.textBright }}>
                {service.title}
              </h3>
              <p className="mt-2 max-w-[220px] text-[12px] leading-relaxed" style={{ color: '#9db4b0' }}>
                {service.desc}
              </p>
              <p className="mt-auto pt-4 text-[11px] font-extrabold tracking-[0.14em]" style={{ color: service.accent }}>
                {service.cta} →
              </p>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
