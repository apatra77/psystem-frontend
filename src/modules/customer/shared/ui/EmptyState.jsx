import { Inbox } from 'lucide-react'
import { colors } from '@/app/themes/colors'
import { msg } from '@/shared/messages/messages'

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <span
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.borderSubtle}` }}
      >
        <Icon size={22} style={{ color: colors.textDim }} />
      </span>
      <p className="font-bold text-[15px]" style={{ color: colors.textBright }}>
        {title ?? msg('common.noData')}
      </p>
      {description && (
        <p className="text-[13px] mt-1.5 max-w-sm" style={{ color: colors.textMuted }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
