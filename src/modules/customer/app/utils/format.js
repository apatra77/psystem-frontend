export const fmtINR = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`

export const fmtDecimalINR = (n) =>
  `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function getInitials(value = '') {
  const source = String(value).includes('@') ? String(value).split('@')[0] : String(value)
  const parts = source.trim().split(/[\s._-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (source.slice(0, 2) || '??').toUpperCase()
}

export function fmtDate(iso, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', opts)
}

export function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export function timeAgo(iso) {
  if (!iso) return '—'
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} d ago`
}

export const titleCase = (s = '') =>
  String(s).replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export const truncate = (s = '', n = 40) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

export const maskPhone = (p = '') => (p.length >= 10 ? `${p.slice(0, 2)}••••${p.slice(-4)}` : p)
