import Spinner from '@/shared/ui/Spinner'
import { colors } from '@/app/themes/colors'

export default function FullScreenLoader({ label }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-3" style={{ background: colors.bg }} role="status" aria-live="polite">
      <Spinner size={22} />
      {label && <p className="text-[13px]" style={{ color: colors.textMuted }}>{label}</p>}
    </div>
  )
}
