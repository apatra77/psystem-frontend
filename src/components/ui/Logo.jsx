import { Activity } from 'lucide-react'

export default function Logo({ size = 'md' }) {
  const iconSize = size === 'sm' ? 13 : 16
  const boxSize = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'
  const textSize = size === 'sm' ? 'text-lg' : 'text-xl'

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div
        className={`${boxSize} rounded-xl flex items-center justify-center shadow`}
        style={{
          background: 'linear-gradient(135deg,#40deaa,#0d8a64)',
          boxShadow: '0 6px 18px rgba(64,222,170,0.45), inset 0 1px 2px rgba(255,255,255,0.5)',
        }}
      >
        <Activity size={iconSize} className="text-[#04140f]" strokeWidth={2.5} />
      </div>
      <span
        className={`${textSize} font-black tracking-tight text-white`}
        style={{ letterSpacing: '-0.03em' }}
      >
        MEDIQ
      </span>
    </div>
  )
}
