import { useState } from 'react'
import { X } from 'lucide-react'
import PortalModal, { ModalFieldLabel } from '@/shared/ui/PortalModal'
import Spinner from '@/shared/ui/Spinner'
import { colors } from '@/app/themes/colors'

function ModalTextarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full rounded-[10px] px-3 py-2.5 text-[13px] text-white font-[inherit] outline-none resize-none ${className}`}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.16)',
      }}
      {...props}
    />
  )
}

export default function CancelAppointmentModal({ appointment, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!appointment) return null

  const handleSubmit = async () => {
    const cancellationReason = reason.trim()
    if (!cancellationReason) {
      setError('Please enter a reason for cancellation.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await onConfirm?.({ appointment, cancellationReason })
      onClose?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel appointment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PortalModal onClose={onClose} width={460} accentBorder>
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-extrabold" style={{ color: colors.textBright }}>
              Cancel appointment
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: colors.textMuted }}>
              {appointment.doctorName} · {appointment.timeRange || appointment.date}
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

        <div>
          <ModalFieldLabel>Reason for cancellation</ModalFieldLabel>
          <ModalTextarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              setError('')
            }}
            placeholder="e.g. Schedule conflict"
            rows={3}
          />
        </div>

        {error ? (
          <p className="mt-3 text-[12px]" style={{ color: '#ff9f9f' }}>
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-[10px] px-4 py-2 text-[12px] font-bold disabled:opacity-50"
            style={{
              color: colors.textHighlight,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.16)',
            }}
          >
            Keep appointment
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-[10px] px-5 py-2 text-[12.5px] font-extrabold disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              color: '#fff',
              background: '#c0392b',
              boxShadow: '0 6px 18px rgba(192,57,43,0.35)',
            }}
          >
            {submitting ? (
              <>
                <Spinner size={14} />
                Cancelling…
              </>
            ) : (
              'Cancel appointment'
            )}
          </button>
        </div>
      </div>
    </PortalModal>
  )
}
