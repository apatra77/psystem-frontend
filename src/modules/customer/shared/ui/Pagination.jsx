import { ChevronLeft, ChevronRight } from 'lucide-react'
import { colors } from '@/app/themes/colors'

/** Compact pager with an ellipsis window — used by every DataTable screen. */
export default function Pagination({ page, totalPages, onChange, className = '' }) {
  if (totalPages <= 1) return null

  const window = 1
  const pages = []
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= window) pages.push(i)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }

  const item = (active) => ({
    background: active ? 'rgba(64,222,170,.14)' : 'rgba(255,255,255,0.04)',
    color: active ? colors.accent : colors.textMuted,
    border: `1px solid ${active ? 'rgba(64,222,170,.34)' : colors.borderSubtle}`,
  })

  return (
    <nav className={`flex items-center justify-center gap-1.5 py-5 ${className}`} aria-label="Pagination">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} className="px-2.5 py-2 rounded-[9px] disabled:opacity-40" style={item(false)} aria-label="Previous page">
        <ChevronLeft size={14} />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap${i}`} className="px-2 text-[12px]" style={{ color: colors.textDim }}>…</span>
        ) : (
          <button key={p} type="button" onClick={() => onChange(p)} className="min-w-[34px] px-2.5 py-2 rounded-[9px] text-[12.5px] font-bold" style={item(p === page)}>
            {p}
          </button>
        ),
      )}
      <button type="button" disabled={page === totalPages} onClick={() => onChange(page + 1)} className="px-2.5 py-2 rounded-[9px] disabled:opacity-40" style={item(false)} aria-label="Next page">
        <ChevronRight size={14} />
      </button>
    </nav>
  )
}
