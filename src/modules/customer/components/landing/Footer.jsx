import { Activity } from 'lucide-react'
import { FOOTER_LINKS } from '@/shared/mocks/landingData'
import { colors } from '@/app/themes/colors'

export default function Footer() {
  return (
    <footer
      className="w-full"
      style={{
        background: colors.bgDeep,
        borderTop: `1px solid ${colors.borderSubtle}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#40deaa,#0d8a64)' }}
          >
            <Activity size={13} className="text-[#04140f]" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-black text-white tracking-tight">MEDIQ</span>
        </div>
        <p className="text-xs text-center font-medium" style={{ color: colors.textDim }}>
          © 2026 MEDIQ Health Technologies Pvt. Ltd. · FSSAI Lic. No. 10019022004029 · All
          medicines are sourced from certified distributors.
        </p>
        <div className="flex gap-5 text-xs font-semibold" style={{ color: colors.textDim }}>
          {FOOTER_LINKS.map((l) => (
            <a key={l} href="#" className="transition-colors hover:text-[#40deaa]">
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
