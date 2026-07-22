import { STATS } from '../../data/landingData'

export default function Stats() {
  return (
    <section className="w-full py-10 border-y border-blue-100/60 bg-white/60 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-5 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map(({ val, label }) => (
          <div key={label} className="text-center">
            <div
              className="text-3xl md:text-4xl font-black mb-1"
              style={{
                background: 'linear-gradient(135deg,#0057B8,#00A651)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {val}
            </div>
            <div className="text-sm text-slate-400 font-semibold">{label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
