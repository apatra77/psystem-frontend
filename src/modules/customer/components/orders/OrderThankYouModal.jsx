import SuccessThankYouModal from '@/modules/customer/components/SuccessThankYouModal'

export default function OrderThankYouModal({ open, orderId, onClose }) {
  return (
    <SuccessThankYouModal
      open={open}
      onClose={onClose}
      successLine="Order placed successfully."
      bodyLine="Visit again — we're always here for your health needs."
      referenceLabel="Order ID"
      referenceId={orderId}
      dismissLabel="Continue"
    />
  )
}
