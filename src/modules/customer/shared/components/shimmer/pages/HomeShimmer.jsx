import { ShimmerBar, ShimmerCard, ShimmerCircle, ShimmerPage, repeat } from '../primitives'
import { colors } from '@/app/themes/colors'

/** Mirrors CustomerLandingPage: ticker, header, hero, category aisles, product rails. */
export default function HomeShimmer() {
  return (
    <ShimmerPage label="Loading home">
      <div style={{ background: colors.bgBanner, padding: '8px 0' }}>
        <ShimmerBar height={12} width="42%" style={{ margin: '0 auto' }} />
      </div>

      <div style={{ background: colors.headerBg, borderBottom: `1px solid ${colors.borderSubtle}` }}>
        <div className="flex items-center gap-4 px-4 py-3.5 sm:px-8 lg:px-12">
          <ShimmerBar width={120} height={32} radius={10} />
          <ShimmerBar className="hidden md:block" width={150} height={38} radius={12} />
          <ShimmerBar height={40} radius={14} />
          <div className="hidden sm:flex gap-3">
            {repeat(3, (i) => <ShimmerCircle key={i} size={40} />)}
          </div>
        </div>
        <div className="hidden gap-2 px-4 pb-2.5 sm:px-8 lg:flex lg:px-12">
          {repeat(7, (i) => <ShimmerBar key={i} width={92} height={20} />)}
        </div>
      </div>

      <div className="px-4 py-12 sm:px-8 lg:px-12" style={{ background: colors.heroBg }}>
        <ShimmerBar width={190} height={12} />
        <ShimmerBar className="mt-4" width="min(560px, 90%)" height={44} radius={12} />
        <ShimmerBar className="mt-3" width="min(420px, 80%)" height={44} radius={12} />
        <ShimmerBar className="mt-4" width="min(360px, 70%)" height={16} />
        <div className="mt-6 flex flex-wrap gap-3">
          <ShimmerBar width={172} height={44} radius={12} />
          <ShimmerBar width={196} height={44} radius={12} />
        </div>
      </div>

      <div className="px-4 pt-11 sm:px-8 lg:px-12">
        <ShimmerBar width={210} height={26} />
        <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {repeat(8, (i) => (
            <ShimmerCard key={i} padding={16} className="flex flex-col items-center gap-3">
              <ShimmerCircle size={68} />
              <ShimmerBar width="80%" height={12} />
            </ShimmerCard>
          ))}
        </div>
      </div>

      {repeat(2, (r) => (
        <div key={r} className="px-4 pt-10 sm:px-8 lg:px-12">
          <div className="mb-4 flex items-baseline gap-3">
            <ShimmerBar width={200} height={22} />
            <ShimmerBar width={130} height={12} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {repeat(5, (i) => (
              <ShimmerCard key={i} padding={12} className="flex flex-col gap-2.5">
                <ShimmerBar height={118} radius={12} />
                <ShimmerBar width="55%" height={11} />
                <ShimmerBar height={13} />
                <ShimmerBar width="70%" height={13} />
                <ShimmerBar className="mt-1" height={30} radius={99} />
              </ShimmerCard>
            ))}
          </div>
        </div>
      ))}
    </ShimmerPage>
  )
}
