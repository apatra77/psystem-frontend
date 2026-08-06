import { Search } from 'lucide-react'
import { colors } from '@/app/themes/colors'

export default function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div
      className={`relative flex items-center rounded-[12px] ${className}`}
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.borderSubtle}` }}
    >
      <Search size={15} className="absolute left-3.5" style={{ color: colors.textDim }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent pl-10 pr-3 py-2.5 text-[13px] outline-none rounded-[12px]"
        style={{ color: colors.textBright }}
      />
    </div>
  )
}
