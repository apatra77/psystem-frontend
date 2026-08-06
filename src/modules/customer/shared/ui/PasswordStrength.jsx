import { Check } from 'lucide-react'

export default function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ chars', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Symbol', ok: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length
  const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const textColors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-600', 'text-green-600']

  if (!password) return null

  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? colors[score] : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2.5 flex-wrap">
          {checks.map((c) => (
            <span
              key={c.label}
              className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${
                c.ok ? 'text-green-600' : 'text-slate-300'
              }`}
            >
              <Check size={8} strokeWidth={3} />
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-[10px] font-bold ${textColors[score]}`}>{labels[score]}</span>
        )}
      </div>
    </div>
  )
}
