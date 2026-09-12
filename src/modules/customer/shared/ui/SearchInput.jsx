import { Search } from 'lucide-react'
import { colors } from '@/app/themes/colors'

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
  showIcon = true,
  onSubmit,
}) {
  return (
    <div
      className={`relative flex items-center rounded-[12px] ${className}`}
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.borderSubtle}` }}
    >
      {showIcon ? (
        <Search size={15} className="absolute left-3.5" style={{ color: colors.textDim }} />
      ) : null}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && onSubmit) {
            event.preventDefault()
            onSubmit()
          }
        }}
        placeholder={placeholder}
        className={`w-full bg-transparent py-2.5 text-[13px] outline-none rounded-[12px] ${showIcon ? 'pl-10 pr-3' : 'px-3'}`}
        style={{ color: colors.textBright }}
      />
    </div>
  )
}
