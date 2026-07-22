import { FEATURES } from '../../data/landingData'

export default function Features() {
  return (
    <section className="w-full py-20 max-w-7xl mx-auto px-5 md:px-12">
      <div className="text-center mb-14">
        <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full">
          What we offer
        </span>
        <h2
          className="text-3xl md:text-4xl font-black text-slate-900 mt-4 mb-3"
          style={{ letterSpacing: '-0.025em' }}
        >
          Everything healthcare,
          <br />
          in one place
        </h2>
        <p className="text-slate-400 text-base font-medium max-w-md mx-auto">
          From a headache to a health checkup — MEDIQ handles it all.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map(({ icon: Icon, title, desc, color, ic, badge }) => (
          <div
            key={title}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div
              className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
            >
              <Icon size={22} className={ic} />
            </div>
            <h3 className="font-black text-slate-800 text-base mb-2">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">{desc}</p>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
              {badge}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
