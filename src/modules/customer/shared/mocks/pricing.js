export const DELIVERY_FEE = 29
export const FREE_DELIVERY_ABOVE = 499
export const PACKAGING_FEE = 9
export const TAX_RATE = 0.05

export const COUPONS = [
  { code: 'MEDIQ10', type: 'percent', value: 10, maxDiscount: 150, label: '10% off up to ₹150' },
  { code: 'FIRST50', type: 'flat', value: 50, label: '₹50 off your first order' },
  { code: 'CARE20', type: 'percent', value: 20, maxDiscount: 300, label: '20% off up to ₹300' },
]

export const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', hint: 'GPay, PhonePe, Paytm' },
  { id: 'card', label: 'Credit / Debit card', hint: 'Visa, Mastercard, RuPay' },
  { id: 'wallet', label: 'MEDIQ wallet', hint: 'Balance ₹340' },
  { id: 'cod', label: 'Cash on delivery', hint: 'Pay the rider' },
]
