import { Activity } from 'lucide-react'
import { FOOTER_LINKS } from '../../data/landingData'

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-5 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#0057B8,#0090FF)' }}
          >
            <Activity size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-black text-blue-700 tracking-tight">MEDIQ</span>
        </div>
        <p className="text-xs text-slate-400 text-center font-medium">
          © 2026 MEDIQ Health Technologies Pvt. Ltd. · FSSAI Lic. No. 10019022004029 · All
          medicines are sourced from certified distributors.
        </p>
        <div className="flex gap-5 text-xs font-semibold text-slate-400">
          {FOOTER_LINKS.map((l) => (
            <a key={l} href="#" className="hover:text-blue-600 transition-colors">
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
