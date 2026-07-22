import { ArrowRight, ChevronRight, Smartphone, Zap } from 'lucide-react'
import PhoneMockup from './PhoneMockup'
import { TRUST_BADGES } from '../../data/landingData'

export default function Hero({ onAuth, onDownload }) {
  return (
    <section className="w-full max-w-7xl mx-auto px-5 md:px-12 pt-16 pb-20 md:pt-24 md:pb-28 flex flex-col lg:flex-row items-center gap-14 lg:gap-8">
      <div className="flex-1 max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-4 py-2 rounded-full mb-7 shadow-sm">
          <Zap size={12} className="fill-blue-500 text-blue-500" />
          #1 Healthcare App in India
          <ChevronRight size={12} />
        </div>

        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.08] mb-6"
          style={{ letterSpacing: '-0.03em' }}
        >
          Your Smart{' '}
          <span
            style={{
              background: 'linear-gradient(135deg,#0057B8 0%,#00A651 100%)',
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

        <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-9 max-w-xl">
          Order medicines, book lab tests, and consult doctors — all from the comfort of your home.
        </p>

        <div className="flex flex-wrap gap-3.5 mb-11">
          <button
            onClick={onAuth}
            className="flex items-center gap-2.5 px-7 py-4 rounded-2xl text-white font-bold text-sm shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
            style={{ background: 'linear-gradient(135deg,#0057B8,#0090FF)' }}
          >
            Get Started Free
            <ArrowRight size={16} />
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-2.5 px-7 py-4 rounded-2xl font-bold text-sm border-2 border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-md transition-all"
          >
            <Smartphone size={16} className="text-slate-500" />
            Download App
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          {TRUST_BADGES.map(({ icon: Icon, label, c, bg }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <div className={`w-6 h-6 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon size={13} className={c} />
                </div>
                {label}
              </div>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 hidden lg:flex items-center justify-center" style={{ minWidth: 320 }}>
        <PhoneMockup />
      </div>
    </section>
  )
}
