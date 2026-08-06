import { STATS } from '@/shared/mocks/landingData'
import { colors } from '@/app/themes/colors'

export default function Stats() {
  return (
    <section
      className="w-full py-10 backdrop-blur-sm"
      style={{
        borderTop: `1px solid ${colors.borderSubtle}`,
        borderBottom: `1px solid ${colors.borderSubtle}`,
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      <div className="max-w-5xl mx-auto px-5 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map(({ val, label }) => (
          <div key={label} className="text-center">
            <div
              className="text-3xl md:text-4xl font-black mb-1"
              style={{
                background: colors.gradientText,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {val}
            </div>
            <div className="text-sm font-semibold" style={{ color: colors.textDim }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
