import { ArrowRight, Menu, Smartphone, X } from 'lucide-react'
import { useState } from 'react'
import Logo from '../ui/Logo'
import { NAV_LINKS } from '../../data/landingData'
import { colors } from '../../theme/colors'

export default function Header({ onAuth, onDownload }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-lg"
      style={{
        background: colors.headerBg,
        borderBottom: `1px solid ${colors.borderSubtle}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-12 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Logo />
          <span
            className="hidden sm:block text-[9px] px-2 py-0.5 rounded-full font-black"
            style={{
              background: 'rgba(64,222,170,0.12)',
              color: colors.accent,
              border: '1px solid rgba(64,222,170,0.3)',
            }}
          >
            TRUSTED
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold" style={{ color: colors.textMuted }}>
          {NAV_LINKS.map((n, i) => (
            <a
              key={n}
              href="#"
              className="transition-colors relative group"
              style={{ color: i === 0 ? colors.textBright : colors.textMuted }}
            >
              {n}
              <span
                className="absolute -bottom-0.5 left-0 rounded-full transition-all duration-200"
                style={{
                  height: 2,
                  width: i === 0 ? '100%' : 0,
                  background: colors.accent,
                }}
              />
              <span
                className="absolute -bottom-0.5 left-0 w-0 h-0.5 rounded-full group-hover:w-full transition-all duration-200"
                style={{ background: colors.accent }}
              />
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: `1px solid ${colors.borderStrong}`,
              color: colors.textBright,
            }}
          >
            <Smartphone size={15} style={{ color: colors.textSecondary }} />
            Download App
          </button>
          <button
            onClick={onAuth}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            style={{ background: colors.primaryBtn, color: colors.accentText }}
          >
            Sign In / Get Started
            <ArrowRight size={14} />
          </button>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: colors.textHighlight,
          }}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {menuOpen && (
        <div
          className="md:hidden px-5 py-4 shadow-lg space-y-3"
          style={{
            background: colors.bgElevated,
            borderTop: `1px solid ${colors.borderSubtle}`,
          }}
        >
          {NAV_LINKS.map((n) => (
            <a
              key={n}
              href="#"
              className="block text-sm font-semibold py-1 transition-colors"
              style={{ color: colors.textMuted }}
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
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors"
              style={{
                border: `1px solid ${colors.borderStrong}`,
                color: colors.textBright,
                background: 'rgba(255,255,255,0.07)',
              }}
            >
              <Smartphone size={15} />
              Download App
            </button>
            <button
              onClick={() => {
                onAuth()
                setMenuOpen(false)
              }}
              className="py-2.5 rounded-xl text-sm font-bold"
              style={{ background: colors.primaryBtn, color: colors.accentText }}
            >
              Sign In / Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
