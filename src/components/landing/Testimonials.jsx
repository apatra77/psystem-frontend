import { Star } from 'lucide-react'
import { TESTIMONIALS } from '../../data/landingData'
import { colors } from '../../theme/colors'

export default function Testimonials() {
  return (
    <section
      className="w-full py-20 backdrop-blur-sm"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderTop: `1px solid ${colors.borderSubtle}`,
        borderBottom: `1px solid ${colors.borderSubtle}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-12">
        <div className="text-center mb-12">
          <span
            className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
            style={{
              color: colors.accent,
              background: 'rgba(64,222,170,0.1)',
              border: '1px solid rgba(64,222,170,0.3)',
            }}
          >
            Loved by millions
          </span>
          <h2
            className="text-3xl md:text-4xl font-black mt-4 text-white"
            style={{ letterSpacing: '-0.025em' }}
          >
            What our users say
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-3xl p-6 transition-all hover:-translate-y-1"
              style={{
                background: colors.cardBg,
                border: '1px solid rgba(255,255,255,0.11)',
                boxShadow: '0 14px 34px rgba(0,0,0,0.25)',
              }}
            >
              <div className="flex gap-0.5 mb-4">
                {Array(t.stars)
                  .fill(0)
                  .map((_, i) => (
                    <Star key={i} size={14} className="fill-[#ffd58f] text-[#ffd58f]" />
                  ))}
              </div>
              <p className="text-sm leading-relaxed mb-5 font-medium" style={{ color: colors.textMuted }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ background: colors.primaryBtn, color: colors.accentText }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-black text-white">{t.name}</div>
                  <div className="text-xs font-medium" style={{ color: colors.textDim }}>
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
