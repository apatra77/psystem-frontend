import { ArrowRight, Smartphone } from 'lucide-react'
import { SPECIALTIES } from '@/shared/mocks/landingData'
import { colors } from '@/app/themes/colors'

export default function CtaBanner({ onAuth, onDownload }) {
  return (
    <section className="w-full py-20 max-w-7xl mx-auto px-5 md:px-12">
      <div
        className="relative overflow-hidden rounded-3xl px-8 md:px-14 py-14 flex flex-col md:flex-row items-center gap-8"
        style={{
          background: colors.ctaBg,
          border: '1px solid rgba(255,255,255,0.13)',
        }}
      >
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2"
          style={{ background: 'rgba(64,222,170,0.08)' }}
        />
        <div
          className="absolute bottom-0 left-10 w-40 h-40 rounded-full translate-y-1/2"
          style={{ background: 'rgba(111,194,255,0.06)' }}
        />

        <div className="relative flex-1 text-white">
          <div className="text-3xl mb-3">🏥</div>
          <h2
            className="text-2xl md:text-3xl font-black mb-3"
            style={{ letterSpacing: '-0.025em' }}
          >
            Start your health journey today
          </h2>
          <p className="text-sm leading-relaxed max-w-md" style={{ color: colors.textSecondary }}>
            Join over 2 crore Indians who trust MEDIQ for their healthcare needs. Sign up free and
            get 20% off your first order.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            {SPECIALTIES.map((s) => (
              <span
                key={s}
                className="text-xs px-3 py-1.5 rounded-full font-semibold"
                style={{
                  background: 'rgba(64,222,170,0.1)',
                  border: '1px solid rgba(64,222,170,0.3)',
                  color: colors.accentSoft,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="relative flex flex-col gap-3 flex-shrink-0 w-full md:w-56">
          <button
            onClick={onAuth}
            className="w-full font-black py-3.5 rounded-2xl text-sm transition-colors shadow-lg flex items-center justify-center gap-2"
            style={{ background: colors.primaryBtn, color: colors.accentText }}
          >
            Get Started Free <ArrowRight size={15} />
          </button>
          <button
            onClick={onDownload}
            className="w-full font-bold py-3.5 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: `1px solid ${colors.borderStrong}`,
              color: colors.textBright,
            }}
          >
            <Smartphone size={15} />
            Download App
          </button>
        </div>
      </div>
    </section>
  )
}
