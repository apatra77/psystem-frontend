import { ArrowRight, Smartphone } from 'lucide-react'
import { SPECIALTIES } from '../../data/landingData'

export default function CtaBanner({ onAuth, onDownload }) {
  return (
    <section className="w-full py-20 max-w-7xl mx-auto px-5 md:px-12">
      <div
        className="relative overflow-hidden rounded-3xl px-8 md:px-14 py-14 flex flex-col md:flex-row items-center gap-8"
        style={{
          background: 'linear-gradient(135deg,#0057B8 0%,#0090FF 55%,#00A651 100%)',
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />

        <div className="relative flex-1 text-white">
          <div className="text-3xl mb-3">🏥</div>
          <h2
            className="text-2xl md:text-3xl font-black mb-3"
            style={{ letterSpacing: '-0.025em' }}
          >
            Start your health journey today
          </h2>
          <p className="text-white/75 text-sm leading-relaxed max-w-md">
            Join over 2 crore Indians who trust MEDIQ for their healthcare needs. Sign up free and
            get 20% off your first order.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            {SPECIALTIES.map((s) => (
              <span
                key={s}
                className="text-xs bg-white/15 border border-white/20 text-white px-3 py-1.5 rounded-full font-semibold"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="relative flex flex-col gap-3 flex-shrink-0 w-full md:w-56">
          <button
            onClick={onAuth}
            className="w-full bg-white text-blue-700 font-black py-3.5 rounded-2xl text-sm hover:bg-blue-50 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            Get Started Free <ArrowRight size={15} />
          </button>
          <button
            onClick={onDownload}
            className="w-full bg-white/15 border-2 border-white/30 text-white font-bold py-3.5 rounded-2xl text-sm hover:bg-white/25 transition-colors flex items-center justify-center gap-2"
          >
            <Smartphone size={15} />
            Download App
          </button>
        </div>
      </div>
    </section>
  )
}
