import { ArrowRight, Menu, Smartphone, X } from 'lucide-react'
import { useState } from 'react'
import Logo from '../ui/Logo'
import { NAV_LINKS } from '../../data/landingData'

export default function Header({ onAuth, onDownload }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-lg border-b border-blue-100/70 shadow-sm">
      <div className="max-w-7xl mx-auto px-5 md:px-12 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Logo />
          <span className="hidden sm:block text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black">
            TRUSTED
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-500">
          {NAV_LINKS.map((n) => (
            <a key={n} href="#" className="hover:text-blue-600 transition-colors relative group">
              {n}
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-500 rounded-full group-hover:w-full transition-all duration-200" />
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-200 bg-white text-slate-700 text-sm font-bold hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            <Smartphone size={15} className="text-slate-500" />
            Download App
          </button>
          <button
            onClick={onAuth}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            style={{ background: 'linear-gradient(135deg,#0057B8,#0090FF)' }}
          >
            Sign In / Get Started
            <ArrowRight size={14} />
          </button>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-5 py-4 shadow-lg space-y-3">
          {NAV_LINKS.map((n) => (
            <a
              key={n}
              href="#"
              className="block text-sm font-semibold text-slate-600 py-1 hover:text-blue-600 transition-colors"
            >
              {n}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => {
                onDownload()
                setMenuOpen(false)
              }}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Smartphone size={15} />
              Download App
            </button>
            <button
              onClick={() => {
                onAuth()
                setMenuOpen(false)
              }}
              className="py-2.5 rounded-xl text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg,#0057B8,#0090FF)' }}
            >
              Sign In / Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
