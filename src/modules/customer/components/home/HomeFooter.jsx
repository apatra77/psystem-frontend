import { Link } from 'react-router-dom'
import Logo from '@/shared/ui/Logo'
import { PATHS } from '@/app/router/paths'
import { FOOTER_COLUMNS, FOOTER_LEGAL } from '@/shared/mocks/customerHome'
import { SECTION_MAX, SECTION_X } from './layout'

function resolveFooterHref(link) {
  if (link.path) return link.path
  return PATHS.customer[link.to] ?? PATHS.customer.support
}

const linkClass =
  'text-[12px] leading-[1.7] text-[#66887D] transition-colors hover:text-[#8BAEA3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35D6A3]'

/** Compact storefront footer — brand, nav columns, legal bar. */
export default function HomeFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-8 border-t border-[rgba(130,210,185,0.12)] bg-[#050f0c] pt-8 pb-5 text-[#66887D]">
      <div className={`${SECTION_MAX} ${SECTION_X}`}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_repeat(4,minmax(0,1fr))] lg:gap-x-8 lg:gap-y-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size="sm" />
            <p className="mt-2.5 max-w-[300px] text-[11px] leading-[1.65] text-[#66887D]">
              {FOOTER_LEGAL}
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="min-w-0">
              <p className="mb-2 text-[10px] font-bold tracking-[0.12em] text-[#F5F7F6]">
                {column.title}
              </p>
              <ul className="space-y-1">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={resolveFooterHref(link)} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-[rgba(130,210,185,0.1)] pt-4 text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[#66887D]">
            © {year} MEDIQ · Medicines are dispensed only against valid prescriptions
          </p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-1 gap-y-1">
            {[
              { label: 'Terms', to: PATHS.customer.terms },
              { label: 'Privacy', to: PATHS.customer.privacy },
              { label: 'Regulatory', to: PATHS.customer.support },
              { label: 'Grievance officer', to: PATHS.customer.complaints },
            ].map((item, index) => (
              <span key={item.label} className="inline-flex items-center">
                {index > 0 && (
                  <span className="mx-1.5 text-[#4a6b60]" aria-hidden="true">
                    ·
                  </span>
                )}
                <Link to={item.to} className={`${linkClass} text-[11px]`}>
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
