import { FEATURES } from '@/shared/mocks/landingData'
import { colors } from '@/app/themes/colors'

export default function Features() {
  return (
    <section className="w-full py-20 max-w-7xl mx-auto px-5 md:px-12">
      <div className="text-center mb-14">
        <span
          className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
          style={{
            color: colors.accent,
            background: 'rgba(64,222,170,0.1)',
            border: '1px solid rgba(64,222,170,0.3)',
          }}
        >
          What we offer
        </span>
        <h2
          className="text-3xl md:text-4xl font-black mt-4 mb-3 text-white"
          style={{ letterSpacing: '-0.025em' }}
        >
          Everything healthcare,
          <br />
          in one place
        </h2>
        <p className="text-base font-medium max-w-md mx-auto" style={{ color: colors.textSecondary }}>
          From a headache to a health checkup — MEDIQ handles it all.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map(({ icon: Icon, title, desc, color, ic, badge }) => (
          <div
            key={title}
            className="rounded-3xl p-6 hover:-translate-y-1 transition-all cursor-pointer group"
            style={{
              background: colors.cardBg,
              border: '1px solid rgba(255,255,255,0.11)',
              boxShadow: '0 14px 34px rgba(0,0,0,0.25)',
            }}
          >
            <div
              className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
            >
              <Icon size={22} className={ic} />
            </div>
            <h3 className="font-black text-base mb-2 text-white">{title}</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: colors.textSecondary }}>
              {desc}
            </p>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-bold"
              style={{
                background: 'rgba(64,222,170,0.1)',
                color: colors.accentSoft,
                border: '1px solid rgba(64,222,170,0.3)',
              }}
            >
              {badge}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
