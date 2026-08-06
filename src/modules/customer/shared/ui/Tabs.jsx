import { colors } from '@/app/themes/colors'

export default function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-5">
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="text-[12.5px] font-bold px-3.5 py-2 rounded-[10px] transition-all"
            style={{
              background: active ? 'rgba(64,222,170,.14)' : 'rgba(255,255,255,0.04)',
              color: active ? colors.accent : colors.textMuted,
              border: `1px solid ${active ? 'rgba(64,222,170,.34)' : colors.borderSubtle}`,
            }}
          >
            {tab.label}
            {tab.count != null && <span className="ml-1.5 opacity-70">{tab.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
