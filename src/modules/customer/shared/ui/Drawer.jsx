import { useEffect } from 'react'
import { X } from 'lucide-react'
import PortalModal from './PortalModal'
import { colors } from '@/app/themes/colors'

/** Slide-over panel — mobile filters, mobile nav, quick-view. */
export default function Drawer({ open, onClose, title, side = 'right', width = 340, children, footer }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <PortalModal>
      <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true">
        <div className="absolute inset-0" style={{ background: 'rgba(3,10,8,0.7)' }} onClick={onClose} />
        <aside
          className="absolute top-0 bottom-0 flex flex-col"
          style={{
            [side]: 0,
            width,
            maxWidth: '90vw',
            background: '#0b1d17',
            borderLeft: side === 'right' ? `1px solid ${colors.border}` : 'none',
            borderRight: side === 'left' ? `1px solid ${colors.border}` : 'none',
          }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
            <p className="text-[15px] font-extrabold" style={{ color: colors.textBright }}>{title}</p>
            <button type="button" onClick={onClose} style={{ color: colors.textDim }} aria-label="Close"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="px-5 py-4" style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>{footer}</div>}
        </aside>
      </div>
    </PortalModal>
  )
}
