import { ArrowRight, ChevronRight, Smartphone, Zap } from 'lucide-react'
import PhoneMockup from './PhoneMockup'
import { TRUST_BADGES } from '../../data/landingData'
import { colors } from '../../theme/colors'

export default function Hero({ onAuth, onDownload }) {
  return (
    <section
      className="relative w-full overflow-x-clip"
      style={{ background: colors.heroBg }}
    >
      <div
        className="absolute w-[460px] h-[460px] rounded-full blur-2xl pointer-events-none"
        style={{
          top: -120,
          right: 80,
          background: 'radial-gradient(circle,rgba(64,222,170,0.18),transparent 62%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 md:px-12 pt-16 pb-20 md:pt-24 md:pb-28 flex flex-col lg:flex-row items-center gap-14 lg:gap-8">
        <div className="flex-1 max-w-2xl">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-7"
            style={{
              background: 'rgba(255,213,143,0.1)',
              border: '1px solid rgba(255,213,143,0.3)',
              color: colors.gold,
            }}
          >
            <Zap size={12} className="fill-[#ffd58f] text-[#ffd58f]" />
            #1 Healthcare App in India
            <ChevronRight size={12} />
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] mb-6 text-white"
            style={{ letterSpacing: '-0.03em' }}
          >
            Your Smart{' '}
            <span
              style={{
                background: colors.gradientText,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Healthcare
            </span>
            <br />
            Companion
          </h1>

          <p
            className="text-lg md:text-xl font-medium leading-relaxed mb-9 max-w-xl"
            style={{ color: colors.textMuted }}
          >
            Order medicines, book lab tests, and consult doctors — all from the comfort of your home.
          </p>

          <div className="flex flex-wrap gap-3.5 mb-11">
            <button
              onClick={onAuth}
              className="flex items-center gap-2.5 px-7 py-4 rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
              style={{
                background: colors.primaryBtn,
                color: colors.accentText,
                boxShadow: '0 8px 24px rgba(64,222,170,0.4)',
              }}
            >
              Get Started Free
              <ArrowRight size={16} />
            </button>
            <button
              onClick={onDownload}
              className="flex items-center gap-2.5 px-7 py-4 rounded-2xl font-bold text-sm transition-all"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: `1px solid ${colors.borderStrong}`,
                color: colors.textBright,
              }}
            >
              <Smartphone size={16} style={{ color: colors.textSecondary }} />
              Download App
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            {TRUST_BADGES.map(({ icon: Icon, label, c, bg }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: colors.textDim }}
              >
                <div className={`w-6 h-6 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon size={13} className={c} />
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 hidden lg:flex items-center justify-center" style={{ minWidth: 400 }}>
          <PhoneMockup />
        </div>
      </div>
    </section>
  )
}
