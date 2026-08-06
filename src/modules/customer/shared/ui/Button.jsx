import { colors } from '@/app/themes/colors'
import Spinner from './Spinner'

const VARIANTS = {
  primary: { background: colors.primaryBtn, color: colors.accentText, border: '1px solid transparent' },
  secondary: { background: 'rgba(255,255,255,0.06)', color: colors.text, border: `1px solid ${colors.border}` },
  ghost: { background: 'transparent', color: colors.textMuted, border: '1px solid transparent' },
  danger: { background: 'rgba(255,138,128,0.14)', color: '#ff8a80', border: '1px solid rgba(255,138,128,0.34)' },
}

const SIZES = {
  sm: 'text-[12px] px-3 py-1.5 rounded-[9px]',
  md: 'text-[13px] px-4 py-2.5 rounded-[11px]',
  lg: 'text-sm px-6 py-3 rounded-[13px]',
}

export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  children,
  ...rest
}) {
  const isDisabled = disabled || loading
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-2 font-bold transition-all ${SIZES[size]} ${className}`}
      style={{ ...VARIANTS[variant], opacity: isDisabled ? 0.55 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
      disabled={Tag === 'button' ? isDisabled : undefined}
      {...rest}
    >
      {loading ? <Spinner size={14} /> : Icon ? <Icon size={15} strokeWidth={2} /> : null}
      {children}
    </Tag>
  )
}
