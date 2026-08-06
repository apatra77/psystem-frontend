import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useUiStore } from '@/app/store/uiStore'
import { colors } from '@/app/themes/colors'

const TONE = {
  success: { icon: CheckCircle2, color: '#40deaa', border: 'rgba(64,222,170,.36)' },
  error: { icon: AlertCircle, color: '#ff8a80', border: 'rgba(255,138,128,0.34)' },
  info: { icon: Info, color: '#9cc4ff', border: 'rgba(90,162,255,.32)' },
}

export default function Toaster() {
  const toasts = useUiStore((s) => s.toasts)
  const dismiss = useUiStore((s) => s.dismissToast)

  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 w-[330px] max-w-[calc(100vw-40px)]">
      {toasts.map(({ id, message, tone }) => {
        const meta = TONE[tone] ?? TONE.info
        const Icon = meta.icon
        return (
          <div
            key={id}
            role="status"
            className="flex items-start gap-3 px-4 py-3 rounded-[13px] text-[13px] font-semibold"
            style={{ background: '#0b1d17', border: `1px solid ${meta.border}`, color: colors.text, boxShadow: '0 14px 40px rgba(0,0,0,0.45)' }}
          >
            <Icon size={16} style={{ color: meta.color, flexShrink: 0, marginTop: 1 }} />
            <span className="flex-1">{message}</span>
            <button type="button" onClick={() => dismiss(id)} style={{ color: colors.textDim }} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
