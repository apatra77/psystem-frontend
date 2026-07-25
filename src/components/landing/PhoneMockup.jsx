import {
  Bell,
  ChevronRight,
  FlaskConical,
  Home,
  Package,
  Pill,
  Search,
  Star,
  Truck,
  Upload,
  User,
  Video,
  Zap,
} from 'lucide-react'
import { colors } from '../../theme/colors'

const ELEVATED_CARD = {
  background: 'linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(245,252,249,0.95) 100%)',
  border: '1px solid rgba(255,255,255,0.9)',
  boxShadow: `
    0 1px 2px rgba(0,0,0,0.06),
    0 4px 12px rgba(0,0,0,0.08),
    0 16px 32px rgba(0,0,0,0.14),
    0 32px 64px rgba(0,0,0,0.12),
    0 0 0 1px rgba(64,222,170,0.12),
    inset 0 1px 0 rgba(255,255,255,1)
  `,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
}

function FloatingBadge({ children, className = '', style = {}, animation = 'float-badge' }) {
  return (
    <div
      className={`absolute z-30 rounded-2xl ${animation} ${className}`}
      style={{
        ...ELEVATED_CARD,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export default function PhoneMockup() {
  return (
    <div
      className="relative flex-shrink-0 select-none mx-auto"
      style={{ width: 400, height: 600, paddingTop: 20 }}
    >
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'rgba(64,222,170,0.18)' }}
        />
        <div
          className="absolute top-1/3 left-2/3 w-44 h-44 rounded-full blur-2xl"
          style={{ background: 'rgba(111,194,255,0.12)' }}
        />
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2 top-5 z-10 rounded-[2.8rem] overflow-hidden"
        style={{
          width: 268,
          height: 560,
          background: '#050f0c',
          boxShadow: `
            0 40px 100px rgba(0,0,0,0.55),
            0 12px 40px rgba(0,0,0,0.35),
            0 0 0 1px rgba(64,222,170,0.18),
            inset 0 1px 0 rgba(255,255,255,0.06)
          `,
        }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[28px] bg-[#050f0c] rounded-b-[18px] z-20" />

        <div className="absolute inset-[3px] rounded-[2.5rem] overflow-hidden bg-white flex flex-col">
          <div className="flex items-center justify-between px-5 pt-[38px] pb-1 bg-white">
            <span className="text-[10px] font-bold text-slate-800 font-mono">9:41</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-px items-end">
                {[3, 5, 7, 9].map((h, i) => (
                  <div key={i} className="w-[2px] bg-slate-800 rounded-sm" style={{ height: h }} />
                ))}
              </div>
              <div className="w-3 h-[7px] border border-slate-800 rounded-sm ml-0.5">
                <div className="w-2/3 h-full bg-slate-800 rounded-sm" />
              </div>
            </div>
          </div>

          <div className="px-4 pb-3 pt-1" style={{ background: colors.primaryBtn }}>
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <div className="text-[8px] text-white/60 font-medium">Good morning, Rahul 👋</div>
                <div className="text-[13px] font-black text-white tracking-tight">MEDIQ</div>
              </div>
              <div className="flex gap-1.5">
                {[Bell, User].map((Icon, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center"
                  >
                    <Icon size={11} className="text-white" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-[10px] px-2.5 py-1.5 shadow-sm">
              <Search size={11} style={{ color: colors.accentDark }} />
              <span className="text-[10px] text-slate-400">Search medicines, tests…</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden bg-slate-50 px-2.5 py-2.5 space-y-2">
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100">
              <div className="grid grid-cols-4 gap-1">
                {[
                  { icon: Pill, label: 'Medicines', c: 'bg-[rgba(64,222,170,0.15)] text-[#0d8a64]' },
                  { icon: FlaskConical, label: 'Lab Tests', c: 'bg-[rgba(111,194,255,0.15)] text-[#6fc2ff]' },
                  { icon: Video, label: 'Consult', c: 'bg-[rgba(178,135,255,0.15)] text-[#b287ff]' },
                  { icon: Upload, label: 'Upload Rx', c: 'bg-[rgba(255,213,143,0.15)] text-[#ffd58f]' },
                ].map(({ icon: Icon, label, c }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 ${c} rounded-xl flex items-center justify-center`}>
                      <Icon size={13} />
                    </div>
                    <span className="text-[7px] text-slate-500 font-semibold text-center leading-tight">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl px-2.5 py-2 flex items-center gap-2"
              style={{ background: 'rgba(64,222,170,0.08)', border: '1px solid rgba(64,222,170,0.2)' }}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: colors.primaryBtn }}
              >
                <Zap size={11} className="text-[#04140f] fill-[#04140f]" />
              </div>
              <div className="flex-1">
                <div className="text-[8px] font-black text-[#0a1712]">Up to 35% off on lab tests</div>
                <div className="text-[7px] text-[#68a892]">Book now · Home collection available</div>
              </div>
              <ChevronRight size={10} className="text-[#40deaa]" />
            </div>

            <div>
              <div className="flex items-center justify-between px-0.5 mb-1.5">
                <span className="text-[9px] font-bold text-slate-700">Popular Medicines</span>
                <span className="text-[8px] font-bold" style={{ color: colors.accentDark }}>
                  See all
                </span>
              </div>
              <div className="flex gap-2 overflow-hidden">
                {[
                  { name: 'Dolo 650', type: 'Paracetamol', price: 30, off: 14, emoji: '💊', tag: 'Best' },
                  { name: 'Crocin', type: 'Pain Relief', price: 58, off: 14, emoji: '🩺' },
                ].map((m) => (
                  <div
                    key={m.name}
                    className="flex-shrink-0 w-[100px] bg-white rounded-xl p-2 shadow-sm border border-slate-100"
                  >
                    <div className="text-lg text-center mb-1">{m.emoji}</div>
                    <div className="text-[8px] font-bold text-slate-800">{m.name}</div>
                    <div className="text-[7px] text-slate-400 mb-1">{m.type}</div>
                    {m.tag && (
                      <span
                        className="text-[6px] px-1 py-0.5 rounded-full font-bold"
                        style={{
                          background: 'rgba(64,222,170,0.15)',
                          color: colors.accentDark,
                        }}
                      >
                        {m.tag}
                      </span>
                    )}
                    <div className="text-[9px] font-black text-slate-900 mt-0.5">₹{m.price}</div>
                    <div className="text-[7px] font-bold" style={{ color: colors.accentDark }}>
                      {m.off}% off
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl p-2.5 flex items-center gap-2"
              style={{ background: 'rgba(178,135,255,0.08)', border: '1px solid rgba(178,135,255,0.2)' }}
            >
              <span className="text-xl flex-shrink-0">👨‍⚕️</span>
              <div className="flex-1 min-w-0">
                <div className="text-[8px] font-black text-[#b287ff]">Consult a Doctor</div>
                <div className="text-[7px] text-[#9db4b0]">Available now · ₹99</div>
                <div className="flex mt-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={6} className="fill-[#ffd58f] text-[#ffd58f]" />
                  ))}
                </div>
              </div>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#b287ff' }}
              >
                <Video size={10} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white border-t border-slate-100 flex items-center justify-around px-2 py-2">
            {[
              { I: Home, l: 'Home', a: true },
              { I: Pill, l: 'Meds', a: false },
              { I: FlaskConical, l: 'Tests', a: false },
              { I: Package, l: 'Orders', a: false },
            ].map(({ I, l, a }) => (
              <div key={l} className="flex flex-col items-center gap-0.5">
                <I
                  size={13}
                  className={a ? 'text-[#0d8a64]' : 'text-slate-400'}
                  strokeWidth={a ? 2.5 : 1.8}
                />
                <span className={`text-[6px] font-bold ${a ? 'text-[#0d8a64]' : 'text-slate-400'}`}>
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FloatingBadge
        className="px-3.5 py-2.5 flex items-center gap-2.5"
        style={{ left: 0, top: '42%', animationDelay: '0s' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(64,222,170,0.2), rgba(13,138,100,0.15))',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 6px rgba(64,222,170,0.25)',
          }}
        >
          <Truck size={14} className="text-[#0d8a64]" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-black text-slate-800 leading-tight">Express Delivery</div>
          <div className="text-[9px] font-bold text-[#0d8a64] leading-tight mt-0.5">In 2 hours 🚀</div>
        </div>
      </FloatingBadge>

      <FloatingBadge
        className="px-3 py-2.5"
        animation="float-badge-alt"
        style={{ right: 0, top: '24%', animationDelay: '1.2s' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(178,135,255,0.2), rgba(178,135,255,0.08))',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
            }}
          >
            👨‍⚕️
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-black text-slate-800 leading-tight whitespace-nowrap">
              Dr. Priya Sharma
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background: '#40deaa',
                  boxShadow: '0 0 6px rgba(64,222,170,0.8)',
                }}
              />
              <span className="text-[8px] font-semibold text-[#0d8a64] whitespace-nowrap">
                Available now
              </span>
            </div>
          </div>
        </div>
      </FloatingBadge>

      <FloatingBadge
        className="px-4 py-3 text-center"
        style={{ right: 4, bottom: '18%', animationDelay: '0.6s' }}
      >
        <div className="text-[8px] font-semibold text-slate-500 uppercase tracking-wide">
          Orders Today
        </div>
        <div
          className="text-base font-black text-slate-900 leading-tight mt-0.5"
          style={{ letterSpacing: '-0.02em' }}
        >
          48,291 📦
        </div>
      </FloatingBadge>
    </div>
  )
}
