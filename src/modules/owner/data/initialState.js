export const INITIAL_OUTLETS = [
  { id: 'ind', name: 'Indiranagar', pincode: '560038', address: '100 Feet Road, Indiranagar, Bengaluru', status: 'open' },
  { id: 'kor', name: 'Koramangala', pincode: '560034', address: '80 Feet Road, Koramangala, Bengaluru', status: 'open' },
  { id: 'hsr', name: 'HSR Layout', pincode: '560102', address: '27th Main, HSR Layout, Bengaluru', status: 'paused' },
]

const defaultHours = {
  Mon: { open: '08:00', close: '23:00', closed: false, is24: false },
  Tue: { open: '08:00', close: '23:00', closed: false, is24: false },
  Wed: { open: '08:00', close: '23:00', closed: false, is24: false },
  Thu: { open: '08:00', close: '23:00', closed: false, is24: false },
  Fri: { open: '08:00', close: '23:00', closed: false, is24: false },
  Sat: { open: '08:00', close: '23:00', closed: false, is24: false },
  Sun: { open: '09:00', close: '22:00', closed: false, is24: false },
}

export const INITIAL_STORE_PROFILES = {
  ind: {
    name: 'MEDIQ — Indiranagar',
    phone: '+91 98450 12345',
    email: 'indiranagar@mediq.co',
    licenseDrug: 'KA-B01-123456',
    licenseFSSAI: '11223344556677',
    radiusKm: 5,
    status: 'open',
    address: '100 Feet Road, Indiranagar, Bengaluru',
    hours: { ...defaultHours },
  },
  kor: {
    name: 'MEDIQ — Koramangala',
    phone: '+91 98450 67890',
    email: 'koramangala@mediq.co',
    licenseDrug: 'KA-B01-223456',
    licenseFSSAI: '11223344556688',
    radiusKm: 6,
    status: 'open',
    address: '80 Feet Road, Koramangala, Bengaluru',
    hours: Object.fromEntries(Object.keys(defaultHours).map((d) => [d, { open: '00:00', close: '23:59', closed: false, is24: true }])),
  },
  hsr: {
    name: 'MEDIQ — HSR Layout',
    phone: '+91 98450 55667',
    email: 'hsr@mediq.co',
    licenseDrug: 'KA-B01-323456',
    licenseFSSAI: '11223344556699',
    radiusKm: 4,
    status: 'paused',
    address: '27th Main, HSR Layout, Bengaluru',
    hours: { ...defaultHours, Sun: { open: '00:00', close: '00:00', closed: true, is24: false } },
  },
}

export const INITIAL_CATEGORIES = [
  { id: 'medicines', name: 'Medicines', count: 312, accent: 'mint', status: 'active' },
  { id: 'vitamins', name: 'Vitamins & Supplements', count: 148, accent: 'blue', status: 'active' },
  { id: 'diabetes', name: 'Diabetes Care', count: 64, accent: 'gold', status: 'active' },
  { id: 'baby', name: 'Mother & Baby', count: 97, accent: 'purple', status: 'active' },
  { id: 'personal', name: 'Personal Care', count: 156, accent: 'mint', status: 'active' },
  { id: 'devices', name: 'Devices', count: 42, accent: 'blue', status: 'active' },
  { id: 'ayurveda', name: 'Ayurveda', count: 88, accent: 'gold', status: 'active' },
  { id: 'skin', name: 'Skin & Hair', count: 120, accent: 'purple', status: 'active' },
]

export const INITIAL_PRODUCTS = [
  { id: 'p1', name: 'Multivitamin Daily, 60 tabs', cat: 'vitamins', sku: 'MQ-VIT-1001', price: 349, mrp: 499, stock: 420, rx: false, status: 'active' },
  { id: 'p2', name: 'Omega-3 Fish Oil 1000mg', cat: 'vitamins', sku: 'MQ-VIT-1002', price: 649, mrp: 999, stock: 18, rx: false, status: 'active' },
  { id: 'p3', name: 'Vitamin D3 60K, 8 caps', cat: 'vitamins', sku: 'MQ-VIT-1003', price: 96, mrp: 128, stock: 0, rx: false, status: 'active' },
  { id: 'p4', name: 'Metformin 500mg SR', cat: 'medicines', sku: 'MQ-MED-2001', price: 32, mrp: 42, stock: 940, rx: true, status: 'active' },
  { id: 'p5', name: 'Telmisartan 40mg', cat: 'medicines', sku: 'MQ-MED-2002', price: 58, mrp: 84, stock: 12, rx: true, status: 'active' },
  { id: 'p6', name: 'Insulin Glargine Pen', cat: 'diabetes', sku: 'MQ-DIA-3001', price: 489, mrp: 612, stock: 26, rx: true, status: 'active' },
  { id: 'p7', name: 'Digital BP Monitor', cat: 'devices', sku: 'MQ-DEV-4001', price: 1499, mrp: 2199, stock: 54, rx: false, status: 'active' },
  { id: 'p8', name: 'Glucometer Kit + 25 strips', cat: 'diabetes', sku: 'MQ-DIA-3002', price: 899, mrp: 1299, stock: 8, rx: false, status: 'active' },
  { id: 'p9', name: 'Pulse Oximeter', cat: 'devices', sku: 'MQ-DEV-4002', price: 649, mrp: 999, stock: 0, rx: false, status: 'active' },
  { id: 'p10', name: 'Ashwagandha 600mg', cat: 'ayurveda', sku: 'MQ-AYU-5001', price: 399, mrp: 599, stock: 210, rx: false, status: 'active' },
  { id: 'p11', name: 'Electrolyte ORS, 21 sachets', cat: 'personal', sku: 'MQ-PER-6001', price: 189, mrp: 240, stock: 300, rx: false, status: 'active' },
  { id: 'p12', name: 'Baby Diaper Pants M, 54pc', cat: 'baby', sku: 'MQ-BAB-7001', price: 649, mrp: 799, stock: 76, rx: false, status: 'active' },
]

const BASE_ORDERS = [
  { id: '#MQ-18344', customer: 'Priya Sharma', phone: '+91 98765 43210', address: 'Indiranagar 100ft Rd', status: 'new', payment: 'Card', placedMinAgo: 6, orderedAt: '2026-05-10T12:42:00.000Z', rx: true, coldChain: true, rider: null, items: [{ n: 'Insulin Glargine Pen', q: 2, p: 489 }, { n: 'Metformin 500mg SR', q: 3, p: 32 }] },
  { id: '#MQ-18343', customer: 'Rohit Verma', phone: '+91 91234 56789', address: 'Domlur', status: 'new', payment: 'COD', placedMinAgo: 4, orderedAt: '2026-05-10T12:44:00.000Z', rx: false, coldChain: false, rider: null, items: [{ n: 'Vitamin D3 60K', q: 1, p: 96 }] },
  { id: '#MQ-18342', customer: 'Anita Rao', phone: '+91 99887 76655', address: 'Indiranagar 12th Main', status: 'new', payment: 'UPI', placedMinAgo: 2, orderedAt: '2026-05-10T12:46:00.000Z', rx: true, coldChain: false, rider: null, items: [{ n: 'Multivitamin Daily', q: 1, p: 349 }] },
  { id: '#MQ-18341', customer: 'Karan Mehta', phone: '+91 98123 45678', address: 'Koramangala 4th Block', status: 'preparing', payment: 'UPI', placedMinAgo: 18, orderedAt: '2026-05-10T12:30:00.000Z', rx: false, coldChain: false, rider: null, items: [{ n: 'Ashwagandha 600mg', q: 1, p: 399 }] },
  { id: '#MQ-18340', customer: 'Deepa Nair', phone: '+91 97654 32109', address: 'HSR Layout Sector 2', status: 'rejected', payment: 'Card', placedMinAgo: 32, orderedAt: '2026-05-10T12:16:00.000Z', rx: false, coldChain: false, rider: null, items: [{ n: 'Digital BP Monitor', q: 1, p: 1499 }] },
  { id: '#MQ-18339', customer: 'Fatima Sheikh', phone: '+91 96543 21098', address: 'Koramangala 5th Block', status: 'preparing', payment: 'UPI', placedMinAgo: 24, orderedAt: '2026-05-10T12:24:00.000Z', rx: true, coldChain: false, rider: null, items: [{ n: 'Metformin 500mg SR', q: 2, p: 32 }] },
  { id: '#MQ-18336', customer: 'Meera Pillai', phone: '+91 95432 10987', address: 'Indiranagar 80ft Rd', status: 'ready', payment: 'UPI', placedMinAgo: 38, orderedAt: '2026-05-10T12:10:00.000Z', rx: true, coldChain: false, rider: null, items: [{ n: 'Telmisartan 40mg', q: 1, p: 58 }] },
  { id: '#MQ-18330', customer: 'Vikram Singh', phone: '+91 94321 09876', address: 'HSR Layout 27th Main', status: 'out', payment: 'UPI', placedMinAgo: 55, orderedAt: '2026-05-10T11:53:00.000Z', rx: false, coldChain: false, rider: 'Manoj Toppo', eta: 8, items: [{ n: 'Glucometer Kit + 25 strips', q: 1, p: 899 }] },
  { id: '#MQ-18328', customer: 'Sara Khan', phone: '+91 93210 98765', address: 'Indiranagar', status: 'delivered', payment: 'UPI', date: '19 Jul', time: '9:12 PM', orderedAt: '2026-07-19T15:42:00.000Z', rx: false, coldChain: false, rider: 'Suresh Kumar', items: [{ n: 'Vitamin D3 60K', q: 1, p: 96 }] },
]

function expandOrders(base, targetCount = 128) {
  const payments = ['UPI', 'Card', 'COD']
  const reviewStatuses = ['new', 'preparing', 'ready', 'out', 'delivered', 'rejected']
  const customers = [
    ['Arjun Desai', '+91 90123 45678', 'BTM Layout'],
    ['Neha Kapoor', '+91 90234 56789', 'Whitefield'],
    ['Imran Ali', '+91 90345 67890', 'Jayanagar'],
    ['Lakshmi Iyer', '+91 90456 78901', 'Malleshwaram'],
    ['Rahul Joshi', '+91 90567 89012', 'Yelahanka'],
  ]

  const result = [...base]
  let index = 0

  while (result.length < targetCount) {
    const seed = base[index % base.length]
    const [customer, phone, address] = customers[index % customers.length]
    const status = reviewStatuses[index % reviewStatuses.length]
    const minutesAgo = 60 + index * 17
    const orderedAt = new Date(Date.now() - minutesAgo * 60_000).toISOString()

    result.push({
      ...seed,
      id: `#MQ-${18300 - index}`,
      customer,
      phone,
      address,
      status,
      payment: payments[index % payments.length],
      placedMinAgo: minutesAgo,
      orderedAt,
      date: undefined,
      time: undefined,
      rider: status === 'out' ? 'Manoj Toppo' : status === 'delivered' ? 'Suresh Kumar' : null,
    })
    index += 1
  }

  return result
}

export const INITIAL_ORDERS = expandOrders(BASE_ORDERS)

export const INITIAL_STAFF = [
  { id: 'st1', name: 'Neha Kulkarni', email: 'neha.kulkarni@mediq.co', role: 'Admin', status: 'active', lastActive: 'Active now' },
  { id: 'st2', name: 'Ramesh Gowda', email: 'ramesh.gowda@mediq.co', role: 'Store Manager', status: 'active', lastActive: '2 hrs ago' },
  { id: 'st3', name: 'Sunita Devi', email: 'sunita.devi@mediq.co', role: 'Inventory Staff', status: 'active', lastActive: '35 min ago' },
]

export const INITIAL_RIDERS = [
  { id: 'r1', name: 'Suresh Kumar', fleet: 'inhouse', vehicle: 'Bike', status: 'busy', rating: 4.8, mapX: 62, mapY: 38 },
  { id: 'r2', name: 'Manoj Toppo', fleet: 'inhouse', vehicle: 'Scooter', status: 'busy', rating: 4.7, mapX: 30, mapY: 62 },
  { id: 'r3', name: 'Ravi Shetty', fleet: 'inhouse', vehicle: 'Bike', status: 'offline', rating: 4.9, mapX: 78, mapY: 70 },
]

export const INITIAL_PROMOS = [
  { id: 'pr1', name: 'FIRST20', desc: 'Flat 20% off your first medicine order', type: 'percent', code: 'FIRST20', status: 'active', used: 3204, validTill: '31 Aug 2026' },
  { id: 'pr2', name: 'Free delivery ₹499+', desc: 'Free delivery above ₹499', type: 'threshold', code: 'AUTO', status: 'active', used: 18420, validTill: 'Ongoing' },
]

export const REV_LABELS = ['7 Jul', '8 Jul', '9 Jul', '10 Jul', '11 Jul', '12 Jul', '13 Jul', '14 Jul', '15 Jul', '16 Jul', '17 Jul', '18 Jul', '19 Jul', '20 Jul']
export const REV_VALUES = [128400, 134200, 119800, 142600, 151300, 146900, 163200, 158700, 171400, 166900, 179800, 175300, 192100, 184320]

export const KPI_DATA = [
  { label: 'Revenue today', value: '₹1,84,320', trend: '+12.4%' },
  { label: 'Orders today', value: '142', trend: '+8.1%' },
  { label: 'Avg order value', value: '₹1,298', trend: '+3.2%' },
  { label: 'Active customers', value: '3,842', trend: '+5.4%' },
]

export const BEST_SELLERS = [
  { rank: 1, name: 'Electrolyte ORS, 21 sachets', units: 890, revenueFmt: '₹1,68,210', pct: 100 },
  { rank: 2, name: 'Multivitamin Daily, 60 tabs', units: 612, revenueFmt: '₹2,13,588', pct: 78 },
  { rank: 3, name: 'Vitamin D3 60K', units: 1120, revenueFmt: '₹1,07,520', pct: 64 },
  { rank: 4, name: 'Ashwagandha 600mg', units: 340, revenueFmt: '₹1,35,660', pct: 52 },
  { rank: 5, name: 'Metformin 500mg SR', units: 1840, revenueFmt: '₹58,880', pct: 35 },
]

export const PEAK_HOURS = [
  { label: '8a', pct: 13 }, { label: '9a', pct: 22 }, { label: '10a', pct: 35 }, { label: '11a', pct: 56 },
  { label: '12p', pct: 68 }, { label: '1p', pct: 61 }, { label: '2p', pct: 48 }, { label: '3p', pct: 42 },
  { label: '4p', pct: 53 }, { label: '5p', pct: 77 }, { label: '6p', pct: 100 }, { label: '7p', pct: 95 },
  { label: '8p', pct: 87 }, { label: '9p', pct: 66 }, { label: '10p', pct: 39 }, { label: '11p', pct: 23 },
]
