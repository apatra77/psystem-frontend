import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { colors } from '@/app/themes/colors'

/** items: [{ label, to }] — the last entry renders as plain text. */
export default function Breadcrumb({ items = [], className = '' }) {
  return (
    <nav className={`flex items-center gap-1.5 text-[12.5px] mb-4 ${className}`} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const last = index === items.length - 1
        return (
          <Fragment key={item.label}>
            {last || !item.to ? (
              <span style={{ color: last ? colors.textBright : colors.textMuted, fontWeight: last ? 700 : 400 }}>{item.label}</span>
            ) : (
              <Link to={item.to} style={{ color: colors.textMuted }}>{item.label}</Link>
            )}
            {!last && <ChevronRight size={12} style={{ color: colors.textDim }} />}
          </Fragment>
        )
      })}
    </nav>
  )
}
