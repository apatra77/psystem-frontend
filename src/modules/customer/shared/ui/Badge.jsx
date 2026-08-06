const TONES = {
  success: { color: '#40deaa', background: 'rgba(64,222,170,.14)', border: '1px solid rgba(64,222,170,.36)' },
  info: { color: '#9cc4ff', background: 'rgba(90,162,255,.14)', border: '1px solid rgba(90,162,255,.32)' },
  warn: { color: '#ffd58f', background: 'rgba(255,181,71,.15)', border: '1px solid rgba(255,181,71,.34)' },
  danger: { color: '#ff8a80', background: 'rgba(255,138,128,0.14)', border: '1px solid rgba(255,138,128,0.34)' },
  neutral: { color: '#9dc3b4', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' },
  purple: { color: '#d4bcff', background: 'rgba(178,135,255,.15)', border: '1px solid rgba(178,135,255,.34)' },
}

export default function Badge({ tone = 'neutral', children, className = '', style }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-1 rounded-full ${className}`}
      style={{ ...TONES[tone], ...style }}
    >
      {children}
    </span>
  )
}
