import SuccessThankYouModal from '@/modules/customer/components/SuccessThankYouModal'

export default function ConsultationBookingThankYouModal({ open, bookingId, onClose }) {
  return (
    <SuccessThankYouModal
      open={open}
      onClose={onClose}
      successLine="Consultation booked successfully."
      bodyLine="Please arrive a few minutes early at the clinic with your ID and any medical reports."
      referenceLabel="Booking ID"
      referenceId={bookingId}
    />
  )
}
