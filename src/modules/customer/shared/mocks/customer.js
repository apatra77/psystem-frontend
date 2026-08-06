export const INITIAL_ADDRESSES = [
  { id: 'a1', label: 'Home', name: 'Aarav Menon', phone: '9812345670', line1: '304, Palm Grove Apartments', line2: '12th Main, Indiranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038', isDefault: true },
  { id: 'a2', label: 'Work', name: 'Aarav Menon', phone: '9812345670', line1: 'Tower B, 7th Floor', line2: 'Embassy Tech Village, Outer Ring Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560103', isDefault: false },
]

export const INITIAL_PAYMENT_METHODS = [
  { id: 'pm1', type: 'upi', label: 'aarav@okhdfcbank', isDefault: true },
  { id: 'pm2', type: 'card', label: 'HDFC Visa •••• 4821', expiry: '08/28', isDefault: false },
]

export const INITIAL_CUSTOMER_ORDERS = [
  {
    id: 'MQ-88214',
    placedAt: '2026-07-27T09:12:00.000Z',
    status: 'out_for_delivery',
    paymentMethod: 'upi',
    address: 'Home · 304, Palm Grove Apartments, Indiranagar',
    rider: { name: 'Imran S.', phone: '9800011223', vehicle: 'KA-01-HH-2231', eta: '9 min' },
    items: [
      { id: 'p1', name: 'Dolo 650 Tablet', qty: 2, price: 30 },
      { id: 'p4', name: 'Vitamin D3 60K Sachet', qty: 1, price: 245 },
    ],
    total: 334,
  },
  {
    id: 'MQ-88190',
    placedAt: '2026-07-21T15:44:00.000Z',
    status: 'delivered',
    paymentMethod: 'card',
    address: 'Work · Embassy Tech Village',
    rider: null,
    items: [{ id: 'p10', name: 'Digital Thermometer', qty: 1, price: 249 }],
    total: 287,
  },
  {
    id: 'MQ-88101',
    placedAt: '2026-07-09T11:02:00.000Z',
    status: 'cancelled',
    paymentMethod: 'cod',
    address: 'Home · 304, Palm Grove Apartments',
    rider: null,
    items: [{ id: 'p6', name: 'Cetaphil Gentle Cleanser', qty: 1, price: 399 }],
    total: 437,
  },
]

export const ORDER_STATUS = {
  placed: { label: 'Order placed', tone: 'info', step: 0 },
  confirmed: { label: 'Confirmed', tone: 'info', step: 1 },
  packed: { label: 'Packed', tone: 'info', step: 2 },
  out_for_delivery: { label: 'Out for delivery', tone: 'warn', step: 3 },
  delivered: { label: 'Delivered', tone: 'success', step: 4 },
  cancelled: { label: 'Cancelled', tone: 'danger', step: -1 },
}

export const TRACKING_STEPS = ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered']

export const CANCEL_WINDOW_MINUTES = 15

export const INITIAL_PRESCRIPTIONS = [
  { id: 'rx1', fileName: 'dr-sharma-2026-07-20.jpg', uploadedAt: '2026-07-20T08:30:00.000Z', status: 'approved', note: 'Valid until 20 Oct 2026' },
  { id: 'rx2', fileName: 'lab-followup.pdf', uploadedAt: '2026-07-26T17:10:00.000Z', status: 'under_review', note: 'Pharmacist reviewing' },
]

export const INITIAL_COMPLAINTS = [
  { id: 'CMP-4410', orderId: 'MQ-88190', type: 'refund', subject: 'Damaged packaging', status: 'resolved', createdAt: '2026-07-22T06:00:00.000Z' },
]

export const INITIAL_NOTIFICATIONS = [
  { id: 'n1', title: 'Your order is on the way', body: 'Imran will reach you in about 9 minutes.', at: '2026-07-28T04:05:00.000Z', read: false },
  { id: 'n2', title: 'Prescription approved', body: 'You can now order Azithral 500.', at: '2026-07-27T12:20:00.000Z', read: false },
  { id: 'n3', title: '20% off wellness', body: 'Use CARE20 before Sunday.', at: '2026-07-25T09:00:00.000Z', read: true },
]

export const SUPPORT_THREADS = [
  { id: 'th1', with: 'Store · MEDIQ Indiranagar', last: 'We have packed your order.', at: '2026-07-28T03:58:00.000Z' },
  { id: 'th2', with: 'Delivery partner · Imran S.', last: 'I am at the gate.', at: '2026-07-28T04:06:00.000Z' },
]
