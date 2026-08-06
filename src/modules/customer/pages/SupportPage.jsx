import { Link } from 'react-router-dom'
import { MessageSquare, Phone, ShieldAlert } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import Button from '@/shared/ui/Button'
import { SUPPORT_THREADS } from '@/shared/mocks/customer'
import { PATHS, buildPath } from '@/app/router/paths'
import { timeAgo } from '@/app/utils/format'
import { colors } from '@/app/themes/colors'

const FAQ = [
  { q: 'When will my order arrive?', a: 'Most orders land within 15–30 minutes. Live rider tracking opens once the store hands the parcel over.' },
  { q: 'Can I change or cancel an order?', a: 'Yes — within 15 minutes of placing it, from the order detail page, as long as the rider has not picked it up.' },
  { q: 'How do refunds work?', a: 'Approved refunds return to the original payment method within 3–5 working days. COD refunds go to your MEDIQ wallet instantly.' },
  { q: 'Why do you need my prescription?', a: 'Scheduled medicines require a valid prescription by law. A pharmacist verifies it before dispatch.' },
]

export default function SupportPage() {
  return (
    <div>
      <PageHeader title="Help &amp; support" subtitle="Chat with the store, call the rider or raise a complaint." />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Link to={PATHS.customer.complaints} className="p-5 rounded-[18px]" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <ShieldAlert size={20} style={{ color: colors.gold }} />
          <p className="text-[14px] font-extrabold mt-3" style={{ color: colors.textBright }}>Raise a complaint</p>
          <p className="text-[12.5px] mt-1" style={{ color: colors.textMuted }}>Refunds, damaged items, billing.</p>
        </Link>
        <a href="tel:180012345" className="p-5 rounded-[18px]" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <Phone size={20} style={{ color: colors.accent }} />
          <p className="text-[14px] font-extrabold mt-3" style={{ color: colors.textBright }}>Call support</p>
          <p className="text-[12.5px] mt-1" style={{ color: colors.textMuted }}>1800 123 45 · 8am–11pm.</p>
        </a>
        <Link to={buildPath(PATHS.customer.chat, { threadId: 'th1' })} className="p-5 rounded-[18px]" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <MessageSquare size={20} style={{ color: colors.blue }} />
          <p className="text-[14px] font-extrabold mt-3" style={{ color: colors.textBright }}>Live chat</p>
          <p className="text-[12.5px] mt-1" style={{ color: colors.textMuted }}>Store and delivery partner.</p>
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="text-[16px] font-extrabold mb-3" style={{ color: colors.textBright }}>Your conversations</h2>
        <div className="space-y-2.5">
          {SUPPORT_THREADS.map((t) => (
            <Link
              key={t.id}
              to={buildPath(PATHS.customer.chat, { threadId: t.id })}
              className="flex items-center gap-4 p-4 rounded-[16px]"
              style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
            >
              <MessageSquare size={17} style={{ color: colors.accent }} />
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-extrabold" style={{ color: colors.textBright }}>{t.with}</p>
                <p className="text-[12.5px] truncate" style={{ color: colors.textMuted }}>{t.last}</p>
              </div>
              <span className="text-[11.5px]" style={{ color: colors.textDim }}>{timeAgo(t.at)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[16px] font-extrabold mb-3" style={{ color: colors.textBright }}>Frequently asked</h2>
        <div className="space-y-2.5">
          {FAQ.map((f) => (
            <details key={f.q} className="p-4 rounded-[16px]" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <summary className="text-[13.5px] font-extrabold cursor-pointer" style={{ color: colors.textBright }}>{f.q}</summary>
              <p className="text-[12.5px] mt-2" style={{ color: colors.textMuted }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-8">
        <Button as={Link} to={PATHS.customer.orders} variant="secondary">Back to my orders</Button>
      </div>
    </div>
  )
}
