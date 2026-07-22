import { Star } from 'lucide-react'
import { TESTIMONIALS } from '../../data/landingData'

export default function Testimonials() {
  return (
    <section className="w-full py-20 bg-white/60 backdrop-blur-sm border-y border-blue-100/40">
      <div className="max-w-7xl mx-auto px-5 md:px-12">
        <div className="text-center mb-12">
          <span className="text-xs font-black text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-full">
            Loved by millions
          </span>
          <h2
            className="text-3xl md:text-4xl font-black text-slate-900 mt-4"
            style={{ letterSpacing: '-0.025em' }}
          >
            What our users say
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-lg transition-all"
            >
              <div className="flex gap-0.5 mb-4">
                {Array(t.stars)
                  .fill(0)
                  .map((_, i) => (
                    <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                  ))}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-5 font-medium">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ background: 'linear-gradient(135deg,#0057B8,#00A651)' }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-black text-slate-800">{t.name}</div>
                  <div className="text-xs text-slate-400 font-medium">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
