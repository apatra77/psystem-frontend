import { Activity } from 'lucide-react'

export default function Logo({ size = 'md' }) {
  const iconSize = size === 'sm' ? 13 : 16
  const boxSize = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'
  const textSize = size === 'sm' ? 'text-lg' : 'text-xl'

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div
        className={`${boxSize} rounded-xl flex items-center justify-center shadow`}
        style={{ background: 'linear-gradient(135deg,#0057B8,#0090FF)' }}
      >
        <Activity size={iconSize} className="text-white" strokeWidth={2.5} />
      </div>
      <span
        className={`${textSize} font-black tracking-tight`}
        style={{ color: '#0057B8', letterSpacing: '-0.03em' }}
      >
        MEDIQ
      </span>
    </div>
  )
}
