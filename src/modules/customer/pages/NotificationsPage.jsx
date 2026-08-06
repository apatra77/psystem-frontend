import PageHeader from '@/shared/ui/PageHeader'
import Button from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import { useOrderStore } from '@/app/store/orderStore'
import { timeAgo } from '@/app/utils/format'
import { colors } from '@/app/themes/colors'

export default function NotificationsPage() {
  const notifications = useOrderStore((s) => s.notifications)
  const markAll = useOrderStore((s) => s.markAllNotificationsRead)

  return (
    <div>
      <PageHeader title="Notifications" actions={<Button size="sm" variant="secondary" onClick={markAll}>Mark all read</Button>} />
      {notifications.length === 0 ? (
        <EmptyState title="No notifications" />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="p-4 rounded-[16px]"
              style={{ background: colors.cardBg, border: `1px solid ${n.read ? colors.borderSubtle : 'rgba(64,222,170,.3)'}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13.5px] font-extrabold" style={{ color: colors.textBright }}>{n.title}</p>
                <span className="text-[11.5px] whitespace-nowrap" style={{ color: colors.textDim }}>{timeAgo(n.at)}</span>
              </div>
              <p className="text-[12.5px] mt-1" style={{ color: colors.textMuted }}>{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
