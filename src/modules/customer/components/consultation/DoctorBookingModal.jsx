import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import PortalModal from '@/shared/ui/PortalModal'
import { fmtINR } from '@/app/utils/format'
import { colors } from '@/app/themes/colors'

export default function DoctorBookingModal({ doctor, fetchSlots, onClose, onConfirm }) {
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!doctor?.id) return undefined

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const nextSlots = await fetchSlots(doctor.id, 'today')
        if (!cancelled) {
          setSlots(nextSlots.filter((slot) => slot.available))
          setSelectedSlot(nextSlots.find((slot) => slot.available) ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          setSlots([])
          setError(err?.message ?? 'Could not load available slots')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [doctor?.id, fetchSlots])

  if (!doctor) return null

  return (
    <PortalModal onClose={onClose} width={480} accentBorder>
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-extrabold" style={{ color: colors.textBright }}>
              Book consultation
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>
              {doctor.name} · {doctor.specialty}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-white/5"
            aria-label="Close"
          >
            <X size={18} style={{ color: colors.textDim }} />
          </button>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textDim }}>
          Available slots · Today
        </p>

        {loading ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-9 animate-pulse rounded-[8px]"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              />
            ))}
          </div>
        ) : error ? (
          <p className="mt-3 text-[13px]" style={{ color: '#ff9f9f' }}>
            {error}
          </p>
        ) : slots.length === 0 ? (
          <p className="mt-3 text-[13px]" style={{ color: colors.textMuted }}>
            No slots available today. Please try another doctor.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {slots.map((slot) => {
              const active = selectedSlot?.id === slot.id
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className="rounded-[8px] px-3 py-2 text-[12px] font-bold"
                  style={
                    active
                      ? {
                          color: colors.accentText,
                          background: colors.primaryBtn,
                          border: '1px solid rgba(64,222,170,0.45)',
                        }
                      : {
                          color: colors.textHighlight,
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${colors.borderSubtle}`,
                        }
                  }
                >
                  {slot.time}
                </button>
              )
            })}
          </div>
        )}

        <div
          className="mt-5 flex items-center justify-between gap-3 rounded-[12px] px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.borderSubtle}` }}
        >
          <span className="text-[12px]" style={{ color: colors.textMuted }}>
            Consultation fee
          </span>
          <span className="text-[15px] font-extrabold" style={{ color: colors.textBright }}>
            {doctor.fee > 0 ? fmtINR(doctor.fee) : '—'}
          </span>
        </div>

        <button
          type="button"
          disabled={!selectedSlot || loading}
          onClick={() => onConfirm?.({ doctor, slot: selectedSlot })}
          className="mt-4 w-full rounded-[12px] py-3 text-[13px] font-extrabold disabled:cursor-not-allowed disabled:opacity-45"
          style={{ background: colors.primaryBtn, color: colors.accentText }}
        >
          Confirm booking
        </button>
      </div>
    </PortalModal>
  )
}
