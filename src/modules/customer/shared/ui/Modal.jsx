import { useEffect } from 'react'
import { X } from 'lucide-react'
import PortalModal from './PortalModal'
import { colors } from '@/app/themes/colors'

export default function Modal({ open, onClose, title, subtitle, width = 560, children, footer }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <PortalModal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="absolute inset-0" style={{ background: 'rgba(3,10,8,0.72)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
        <div
          className="relative w-full rounded-[20px] overflow-hidden max-h-[90vh] flex flex-col"
          style={{ maxWidth: width, background: '#0b1d17', border: `1px solid ${colors.border}`, boxShadow: '0 30px 80px rgba(0,0,0,0.55)' }}
        >
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
            <div>
              <h2 className="text-[16px] font-extrabold" style={{ color: colors.textBright }}>{title}</h2>
              {subtitle && <p className="text-[12.5px] mt-1" style={{ color: colors.textMuted }}>{subtitle}</p>}
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg" style={{ color: colors.textDim }} aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5 overflow-y-auto">{children}</div>
          {footer && (
            <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </PortalModal>
  )
}
