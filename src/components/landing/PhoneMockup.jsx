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

export default function PhoneMockup() {
  return (
    <div className="relative flex-shrink-0 select-none">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-2/3 w-40 h-40 bg-green-300/20 rounded-full blur-2xl" />
      </div>

      <div
        className="relative mx-auto rounded-[2.8rem] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.30),0_0_0_1px_rgba(255,255,255,0.15)]"
        style={{ width: 268, height: 560, background: '#0d0d0f' }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[28px] bg-[#0d0d0f] rounded-b-[18px] z-20" />

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

          <div
            className="px-4 pb-3 pt-1"
            style={{ background: 'linear-gradient(135deg,#0057B8,#0090FF)' }}
          >
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
              <Search size={11} className="text-blue-500" />
              <span className="text-[10px] text-slate-400">Search medicines, tests…</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden bg-slate-50 px-2.5 py-2.5 space-y-2">
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100">
              <div className="grid grid-cols-4 gap-1">
                {[
                  { icon: Pill, label: 'Medicines', c: 'bg-blue-50 text-blue-600' },
                  { icon: FlaskConical, label: 'Lab Tests', c: 'bg-green-50 text-green-600' },
                  { icon: Video, label: 'Consult', c: 'bg-purple-50 text-purple-600' },
                  { icon: Upload, label: 'Upload Rx', c: 'bg-orange-50 text-orange-600' },
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
              style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)' }}
            >
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap size={11} className="text-white fill-white" />
              </div>
              <div className="flex-1">
                <div className="text-[8px] font-black text-blue-800">Up to 35% off on lab tests</div>
                <div className="text-[7px] text-blue-400">Book now · Home collection available</div>
              </div>
              <ChevronRight size={10} className="text-blue-400" />
            </div>

            <div>
              <div className="flex items-center justify-between px-0.5 mb-1.5">
                <span className="text-[9px] font-bold text-slate-700">Popular Medicines</span>
                <span className="text-[8px] text-blue-600 font-bold">See all</span>
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
                      <span className="text-[6px] bg-green-100 text-green-700 px-1 py-0.5 rounded-full font-bold">
                        {m.tag}
                      </span>
                    )}
                    <div className="text-[9px] font-black text-slate-900 mt-0.5">₹{m.price}</div>
                    <div className="text-[7px] text-green-600 font-bold">{m.off}% off</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl p-2.5 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)' }}
            >
              <span className="text-xl flex-shrink-0">👨‍⚕️</span>
              <div className="flex-1 min-w-0">
                <div className="text-[8px] font-black text-purple-800">Consult a Doctor</div>
                <div className="text-[7px] text-purple-500">Available now · ₹99</div>
                <div className="flex mt-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={6} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
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
                <I size={13} className={a ? 'text-blue-600' : 'text-slate-400'} strokeWidth={a ? 2.5 : 1.8} />
                <span className={`text-[6px] font-bold ${a ? 'text-blue-600' : 'text-slate-400'}`}>
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -left-14 top-[38%] bg-white rounded-2xl shadow-xl border border-slate-100 px-3 py-2 flex items-center gap-2">
        <div className="w-7 h-7 bg-green-100 rounded-xl flex items-center justify-center">
          <Truck size={13} className="text-green-600" />
        </div>
        <div>
          <div className="text-[9px] font-black text-slate-700">Express Delivery</div>
          <div className="text-[8px] text-green-600 font-semibold">In 2 hours 🚀</div>
        </div>
      </div>

      <div className="absolute -right-12 top-[22%] bg-white rounded-2xl shadow-xl border border-slate-100 px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs">
            👨‍⚕️
          </div>
          <div>
            <div className="text-[8px] font-black text-slate-700">Dr. Priya Sharma</div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[7px] text-green-600">Available now</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-8 bottom-[22%] bg-white rounded-2xl shadow-xl border border-slate-100 px-3 py-2 text-center">
        <div className="text-[8px] text-slate-400 font-medium">Orders Today</div>
        <div className="text-sm font-black text-slate-800">48,291 📦</div>
      </div>
    </div>
  )
}
