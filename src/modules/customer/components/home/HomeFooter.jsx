import { Link } from 'react-router-dom'
import Logo from '@/shared/ui/Logo'
import { PATHS } from '@/app/router/paths'
import { FOOTER_COLUMNS, FOOTER_LEGAL } from '@/shared/mocks/customerHome'
import { colors } from '@/app/themes/colors'
import { SECTION_MAX, SECTION_X } from './layout'

/** Storefront footer. Five columns on desktop, two on phone. */
export default function HomeFooter() {
  return (
    <footer className="mt-12 pb-6 pt-12" style={{ background: colors.bgDeep, color: '#6f8f83' }}>
      <div className={`${SECTION_MAX} ${SECTION_X}`}>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <div>
            <Logo size="sm" />
            <p className="mt-3.5 max-w-[280px] text-[12px] leading-[1.8]">{FOOTER_LEGAL}</p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="mb-2 text-[11px] font-bold tracking-[0.1em]" style={{ color: colors.textBright }}>
                {column.title}
              </p>
              <ul className="text-[13px] leading-[2.2]">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={PATHS.customer[link.to] ?? PATHS.customer.support}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div
          className="mt-8 flex flex-col gap-2 pt-4 text-[12px] sm:flex-row sm:justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}
        >
          <span>© {new Date().getFullYear()} MEDIQ · Medicines are dispensed only against valid prescriptions</span>
          <span>Terms · Privacy · Regulatory · Grievance officer</span>
        </div>
      </div>
    </footer>
  )
}
