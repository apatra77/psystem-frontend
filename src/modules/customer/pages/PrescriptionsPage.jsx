import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import { useOrderStore } from '@/app/store/orderStore'
import { PATHS } from '@/app/router/paths'
import { fmtDateTime } from '@/app/utils/format'
import { colors } from '@/app/themes/colors'

const TONE = { approved: 'success', under_review: 'warn', rejected: 'danger' }

export default function PrescriptionsPage() {
  const prescriptions = useOrderStore((s) => s.prescriptions)

  return (
    <div>
      <PageHeader
        title="My prescriptions"
        subtitle="Uploaded prescriptions and their review status."
        actions={<Button as={Link} to={PATHS.customer.prescription}>Upload new</Button>}
      />
      {prescriptions.length === 0 ? (
        <EmptyState icon={FileText} title="No prescriptions uploaded" action={<Button as={Link} to={PATHS.customer.prescription}>Upload one</Button>} />
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="flex items-center gap-4 p-4 rounded-[16px]" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <FileText size={18} style={{ color: colors.accent }} />
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-extrabold truncate" style={{ color: colors.textBright }}>{rx.fileName}</p>
                <p className="text-[12px] mt-0.5" style={{ color: colors.textDim }}>{fmtDateTime(rx.uploadedAt)} · {rx.note}</p>
              </div>
              <Badge tone={TONE[rx.status] ?? 'neutral'}>{rx.status.replace('_', ' ')}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
