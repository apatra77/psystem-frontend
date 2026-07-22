import { ArrowRight } from 'lucide-react'
import Spinner from '../ui/Spinner'

export default function PrimaryBtn({ loading, label, green }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-5 w-full py-3.5 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70"
      style={{
        background: green
          ? 'linear-gradient(135deg,#00A651,#00C96A)'
          : 'linear-gradient(135deg,#0057B8,#0090FF)',
      }}
    >
      {loading ? (
        <>
          <Spinner />
          {label.includes('Sign') ? 'Signing In…' : 'Sending OTP…'}
        </>
      ) : (
        <>
          {label} {!loading && <ArrowRight size={14} />}
        </>
      )}
    </button>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[11px] text-slate-400 font-medium">or continue with</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  )
}

function SocialBtns() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {[
        { label: 'Google', letter: 'G', color: '#EA4335' },
        { label: 'Apple', letter: '🍎', color: '#000' },
      ].map((s) => (
        <button
          key={s.label}
          type="button"
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <span style={{ color: s.color, fontFamily: 'serif', fontWeight: 900 }}>{s.letter}</span>
          {s.label}
        </button>
      ))}
    </div>
  )
}

function SuccessState({ title, sub }) {
  return (
    <div className="flex flex-col items-center py-10 gap-4 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center bg-green-100"
        style={{ animation: 'popIn 0.4s cubic-bezier(0.34,1.5,0.64,1)' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-green-600" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <div>
        <div className="text-xl font-black text-slate-800">{title}</div>
        <div className="text-sm text-slate-400 mt-1">{sub}</div>
      </div>
    </div>
  )
}

export { Divider, SocialBtns, SuccessState }
