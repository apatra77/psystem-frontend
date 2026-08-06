import { useRef } from 'react'
import { colors } from '@/app/themes/colors'

export default function OtpInput({ value, onChange, error }) {
  const refs = useRef([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '')

  const focusAt = (index) => {
    refs.current[index]?.focus()
  }

  const setDigit = (index, digit) => {
    const arr = digits.slice()
    arr[index] = digit
    onChange(arr.join(''))
  }

  const handleChange = (index, raw) => {
    const cleaned = raw.replace(/\D/g, '')
    if (!cleaned) {
      setDigit(index, '')
      return
    }

    if (cleaned.length === 1) {
      setDigit(index, cleaned)
      if (index < 5) focusAt(index + 1)
      return
    }

    const next = (value.slice(0, index) + cleaned).slice(0, 6)
    onChange(next)
    focusAt(Math.min(index + cleaned.length, 5))
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        setDigit(index, '')
      } else if (index > 0) {
        setDigit(index - 1, '')
        focusAt(index - 1)
      }
      e.preventDefault()
      return
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      focusAt(index - 1)
      e.preventDefault()
      return
    }

    if (e.key === 'ArrowRight' && index < 5) {
      focusAt(index + 1)
      e.preventDefault()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    onChange(pasted)
    focusAt(Math.min(pasted.length, 5))
  }

  return (
    <div>
      <div className="flex justify-between gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className="otp-digit w-full aspect-square text-center text-lg font-black outline-none rounded-xl border-2 transition-all duration-200"
            style={{
              color: colors.textBright,
              colorScheme: 'dark',
              borderColor: error
                ? '#ff8a80'
                : digit
                  ? colors.accent
                  : 'rgba(255,255,255,0.12)',
              background: digit ? 'rgba(64,222,170,0.08)' : 'rgba(255,255,255,0.04)',
              boxShadow: digit ? '0 0 0 3px rgba(64,222,170,0.1)' : 'none',
            }}
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-xs text-[#ff8a80] text-center">{error}</p>
      )}
    </div>
  )
}
