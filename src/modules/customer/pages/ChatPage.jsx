import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import Button from '@/shared/ui/Button'
import { SUPPORT_THREADS } from '@/shared/mocks/customer'
import { colors } from '@/app/themes/colors'

const SEED = [
  { id: 'm1', from: 'them', text: 'Hi! Your order is packed and ready to leave the store.' },
  { id: 'm2', from: 'me', text: 'Great — please leave it with security if I do not answer.' },
  { id: 'm3', from: 'them', text: 'Noted. The rider will call before arriving.' },
]

/** Chat with the store or the delivery partner. Wire to your socket/API in `send`. */
export default function ChatPage() {
  const { threadId } = useParams()
  const thread = SUPPORT_THREADS.find((t) => t.id === threadId)
  const [messages, setMessages] = useState(SEED)
  const [draft, setDraft] = useState('')

  const send = (e) => {
    e.preventDefault()
    if (!draft.trim()) return
    setMessages((prev) => [...prev, { id: `m${prev.length + 1}`, from: 'me', text: draft.trim() }])
    setDraft('')
  }

  return (
    <div className="max-w-[720px] mx-auto">
      <PageHeader title={thread?.with ?? 'Chat'} subtitle="Messages are kept for 30 days." />

      <div className="rounded-[18px] p-5 flex flex-col gap-3 min-h-[380px]" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
        {messages.map((m) => (
          <div
            key={m.id}
            className="max-w-[76%] px-4 py-2.5 rounded-[14px] text-[13px]"
            style={{
              alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start',
              background: m.from === 'me' ? 'rgba(64,222,170,.14)' : 'rgba(255,255,255,0.05)',
              color: m.from === 'me' ? colors.textBright : colors.text,
              border: `1px solid ${m.from === 'me' ? 'rgba(64,222,170,.3)' : colors.borderSubtle}`,
            }}
          >
            {m.text}
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex gap-2 mt-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-[13px] px-4 py-3 text-[13px] outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.borderSubtle}`, color: colors.textBright }}
        />
        <Button type="submit" icon={Send}>Send</Button>
      </form>
    </div>
  )
}
