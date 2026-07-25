import { useEffect, useRef } from 'react'
import { Smartphone, X } from 'lucide-react'
import { colors } from '../../theme/colors'

const QR_PATTERN = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
]

function QrBlock({ r, c, yOffset = 0, prefix = '' }) {
  return QR_PATTERN[r][c] ? (
    <rect
      key={`${prefix}${r}-${c}`}
      x={c * 17}
      y={r * 17 + yOffset}
      width={16}
      height={16}
      rx={2}
      fill="#40deaa"
    />
  ) : null
}

export default function DownloadModal({ onClose }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', fn)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(5,15,12,0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
        style={{
          animation: 'modalPop 0.3s cubic-bezier(0.34,1.5,0.64,1) both',
          background: colors.bgElevated,
          border: `1px solid ${colors.borderStrong}`,
        }}
      >
        <div className="h-1" style={{ background: colors.primaryBtn }} />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10"
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: colors.textSecondary,
          }}
        >
          <X size={15} />
        </button>

        <div className="p-7 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ background: colors.primaryBtn }}
          >
            <Smartphone size={26} className="text-[#04140f]" />
          </div>
          <h2 className="text-xl font-black text-white mb-1">Get the MEDIQ App</h2>
          <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
            Scan the QR code or tap a button below
          </p>

          <div
            className="w-40 h-40 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${colors.borderStrong}`,
            }}
          >
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              {[0, 1, 2, 3, 4, 5, 6].map((r) =>
                [0, 1, 2, 3, 4, 5, 6].map((c) => <QrBlock key={`t-${r}-${c}`} r={r} c={c} />),
              )}
              {[
                [48, 48],
                [54, 48],
                [60, 48],
                [48, 54],
                [60, 54],
                [48, 60],
                [54, 60],
                [60, 60],
              ].map(([x, y], i) => (
                <rect key={`d${i}`} x={x} y={y} width={6} height={6} rx={1} fill="#40deaa" opacity={0.7} />
              ))}
              {[0, 1, 2, 3, 4, 5, 6].map((r) =>
                [0, 1, 2, 3, 4, 5, 6].map((c) => (
                  <QrBlock key={`bl-${r}-${c}`} r={r} c={c} yOffset={63} prefix="bl-" />
                )),
              )}
            </svg>
          </div>

          <p className="text-xs mb-5 font-medium" style={{ color: colors.textDim }}>
            Available on iOS &amp; Android
          </p>

          <div className="flex flex-col gap-3">
            <a
              href="#"
              className="flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl hover:bg-slate-800 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white flex-shrink-0">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.39-1.32 2.76-2.54 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <div className="text-left">
                <div className="text-[9px] text-white/60 font-medium leading-none">
                  Download on the
                </div>
                <div className="text-sm font-bold leading-tight">App Store</div>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl hover:bg-slate-800 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 flex-shrink-0">
                <path
                  fill="#EA4335"
                  d="M3.18 23.76c.37.2.8.21 1.21-.01l11.5-6.63-2.5-2.5-10.21 9.14z"
                />
                <path
                  fill="#FBBC04"
                  d="M20.83 10.5l-3.16-1.82-2.76 2.76 2.76 2.76 3.19-1.84a1.67 1.67 0 0 0 0-2.86z"
                />
                <path
                  fill="#34A853"
                  d="M3.18.24A1.6 1.6 0 0 0 2.5 1.5v21a1.6 1.6 0 0 0 .68 1.26l.09.07 11.77-11.76v-.28L3.27.17l-.09.07z"
                />
                <path
                  fill="#4285F4"
                  d="M15.39 8.44L4.39.17a1.6 1.6 0 0 0-1.21-.01l10.21 9.78 2-1.5z"
                />
              </svg>
              <div className="text-left">
                <div className="text-[9px] text-white/60 font-medium leading-none">Get it on</div>
                <div className="text-sm font-bold leading-tight">Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
