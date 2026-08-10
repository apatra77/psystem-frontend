/**
 * Content for the signed-in customer landing page.
 *
 * Lives in mocks/ alongside landingData.js because it is still static copy —
 * swap each export for the matching service call (catalog, offers, rails)
 * without touching a single component.
 */

export const TICKER_OFFERS = [
  'FIRST20 — flat 20% off your first medicine order',
  'Free delivery above ₹499 · no minimum for Circle members',
  'Full body checkup at home — 89 tests at ₹999',
]

export const HOME_NAV = [
  { label: 'Medicines', slug: 'medicines' },
  { label: 'Lab Tests', slug: 'lab-tests' },
  { label: 'Doctor Consult', slug: 'consult' },
  { label: 'Wellness', slug: 'wellness' },
  { label: 'Devices', slug: 'devices' },
  { label: 'Ayurveda', slug: 'ayurveda' },
  { label: 'Baby & Mom', slug: 'baby' },
]

export const HERO = {
  kicker: 'LICENSED ONLINE PHARMACY',
  titleLead: 'Genuine medicines,',
  titleRest: 'delivered in',
  titleAccent: '120 minutes.',
  subtitle: '2.4 lakh+ products, every order verified by a registered pharmacist.',
  trust: ['100% GENUINE', 'RX VERIFIED', 'LIVE TRACKING', '7-DAY RETURNS'],
}

export const AISLES = [
  {
    slug: 'medicines',
    name: 'Medicines',
    accent: '#40deaa',
    subs: ['Fever & pain relief', 'Antibiotics', 'Cold & cough', 'Digestive health', 'Cardiac care'],
  },
  {
    slug: 'vitamins',
    name: 'Vitamins',
    accent: '#ffd58f',
    subs: ['Multivitamins', 'Vitamin D & calcium', 'Omega & fish oil', 'Immunity boosters', 'Protein & fitness'],
  },
  {
    slug: 'diabetes',
    name: 'Diabetes care',
    accent: '#6fc2ff',
    subs: ['Glucometers & strips', 'Insulin & needles', 'Sugar substitutes', 'Diabetic nutrition', 'Foot care'],
  },
  {
    slug: 'baby',
    name: 'Mother & baby',
    accent: '#b287ff',
    subs: ['Diapers & wipes', 'Baby food & formula', 'Maternity care', 'Baby skin care', 'Feeding essentials'],
  },
  {
    slug: 'personal',
    name: 'Personal care',
    accent: '#40deaa',
    subs: ['Oral care', 'Bath & body', 'Feminine hygiene', "Men's grooming", 'Elderly care'],
  },
  {
    slug: 'devices',
    name: 'Devices',
    accent: '#6fc2ff',
    subs: ['BP monitors', 'Thermometers', 'Nebulizers', 'Oximeters', 'Supports & braces'],
  },
  {
    slug: 'ayurveda',
    name: 'Ayurveda',
    accent: '#ffd58f',
    subs: ['Chyawanprash & immunity', 'Digestion & liver', 'Joint & pain relief', 'Hair & skin herbs', 'Sleep & stress'],
  },
  {
    slug: 'skin',
    name: 'Skin & hair',
    accent: '#b287ff',
    subs: ['Face care', 'Hair care', 'Sunscreen', 'Acne & scars', 'Dermatologist picks'],
  },
]

const product = (id, name, pack, price, mrp, off, rating, reviews, eta, chip = null) =>
  ({ id, name, pack, price, mrp, off, rating, reviews, eta, chip })

export const RAILS = [
  {
    id: 'deals',
    title: 'Deals of the day',
    sub: 'Refreshed every 24 hrs',
    accent: '#40deaa',
    items: [
      product('r1-1', 'Multivitamin Daily, 60 tabs', 'Bottle of 60', 349, 499, 30, '4.4', '12,304', '2 hrs'),
      product('r1-2', 'Omega-3 Fish Oil 1000mg', 'Bottle of 90', 649, 999, 35, '4.5', '8,912', '2 hrs'),
      product('r1-3', 'Vitamin D3 60K, 8 caps', 'Weekly strip', 96, 128, 25, '4.6', '21,450', '2 hrs', 'GENERIC — SAVE 60%'),
      product('r1-4', 'Melatonin 5mg, sleep support', 'Bottle of 60', 449, 599, 25, '4.3', '5,633', '2 hrs'),
      product('r1-5', 'Immunity Booster Combo', 'Pack of 2', 799, 1198, 33, '4.4', '3,208', 'Tomorrow'),
    ],
  },
  // {
  //   id: 'chronic',
  //   title: 'Chronic care refills',
  //   sub: 'Auto-refill eligible · extra 5% off for Circle',
  //   accent: '#6fc2ff',
  //   items: [
  //     product('r2-1', 'Metformin 500mg SR', 'Strip of 15', 32, 42, 24, '4.7', '44,201', '2 hrs', 'AUTO-REFILL'),
  //     product('r2-2', 'Telmisartan 40mg', 'Strip of 15', 58, 84, 31, '4.6', '31,876', '2 hrs', 'AUTO-REFILL'),
  //     product('r2-3', 'Atorvastatin 10mg', 'Strip of 15', 47, 69, 32, '4.6', '28,540', '2 hrs', 'GENERIC — SAVE 55%'),
  //     product('r2-4', 'Levothyroxine 50mcg', 'Bottle of 100', 129, 158, 18, '4.8', '52,113', '2 hrs', 'AUTO-REFILL'),
  //     product('r2-5', 'Insulin Glargine pen', '3ml prefilled', 489, 612, 20, '4.7', '9,340', '2 hrs', 'COLD-CHAIN'),
  //   ],
  // },
  // {
  //   id: 'devices',
  //   title: 'Devices & monitoring',
  //   sub: 'Clinically validated',
  //   accent: '#ffd58f',
  //   items: [
  //     product('r3-1', 'Digital BP Monitor', 'Upper arm · validated', 1499, 2199, 32, '4.5', '18,224', 'Tomorrow'),
  //     product('r3-2', 'Glucometer Kit + 25 strips', '1 kit', 899, 1299, 31, '4.4', '22,871', '2 hrs'),
  //     product('r3-3', 'Pulse Oximeter', 'Fingertip · OLED', 649, 999, 35, '4.3', '15,632', '2 hrs'),
  //     product('r3-4', 'Digital Thermometer', 'Flexible tip', 199, 299, 33, '4.5', '40,118', '2 hrs'),
  //     product('r3-5', 'Nebulizer Machine', 'Compressor type', 1299, 1899, 32, '4.4', '7,754', 'Tomorrow'),
  //   ],
  // },
  // {
  //   id: 'wellness',
  //   title: 'Wellness & everyday',
  //   sub: 'Most reordered this month',
  //   accent: '#b287ff',
  //   items: [
  //     product('r4-1', 'Whey Protein Isolate 1kg', 'Chocolate', 1899, 2799, 32, '4.5', '11,203', 'Tomorrow'),
  //     product('r4-2', 'Collagen Powder, 200g', 'Marine · unflavoured', 999, 1399, 29, '4.3', '6,450', '2 hrs'),
  //     product('r4-3', 'Biotin 10,000mcg', 'Strip of 30', 299, 449, 33, '4.2', '9,822', '2 hrs'),
  //     product('r4-4', 'Ashwagandha 600mg', 'Bottle of 60', 399, 599, 33, '4.5', '17,690', '2 hrs', 'AYURVEDA'),
  //     product('r4-5', 'Electrolyte ORS, 21 sachets', 'Orange', 189, 240, 21, '4.6', '25,077', '2 hrs'),
  //   ],
  // },
]

export const SERVICES = [
  // {
  //   id: 'consult',
  //   kicker: 'CONSULT',
  //   title: 'A doctor on screen in 10 minutes',
  //   desc: '22 specialities · prescriptions flow straight to your cart',
  //   cta: 'FROM ₹199',
  //   accent: '#9cc4ff',
  //   bg: 'linear-gradient(172deg,rgba(90,162,255,.13),rgba(90,162,255,.04))',
  //   border: 'rgba(90,162,255,.3)',
  // },
  // {
  //   id: 'lab',
  //   kicker: 'DIAGNOSTICS',
  //   title: 'Full body checkup at home, ₹999',
  //   desc: '89 tests · NABL labs · reports within 24 hours',
  //   cta: 'BOOK A TEST',
  //   accent: '#ffd58f',
  //   bg: 'linear-gradient(172deg,rgba(255,181,71,.15),rgba(255,181,71,.04))',
  //   border: 'rgba(255,181,71,.32)',
  // },
  // {
  //   id: 'refill',
  //   kicker: 'AUTO-REFILL',
  //   title: 'Never run out of what matters',
  //   desc: 'Scheduled refills, gentle reminders, 5% off every cycle',
  //   cta: 'SET UP',
  //   accent: '#d4bcff',
  //   bg: 'linear-gradient(172deg,rgba(178,135,255,.14),rgba(178,135,255,.04))',
  //   border: 'rgba(178,135,255,.32)',
  // },
]

export const TRUST_BADGES = [
  { label: 'UPI', strong: false },
  { label: 'Visa', strong: false },
  { label: 'Mastercard', strong: false },
  { label: 'RuPay', strong: false },
  { label: 'COD', strong: false },
  { label: '256-bit SSL', strong: true },
  { label: 'NABL Labs', strong: true },
  { label: 'Licensed Pharmacy', strong: true },
]

/**
 * Footer navigation. `to` is a route key resolved in HomeFooter against PATHS,
 * so every link lands on a real page instead of a dead anchor.
 */
export const FOOTER_COLUMNS = [
  {
    title: 'SHOP',
    links: [
      { label: 'All products', to: 'search' },
      { label: 'Categories', to: 'categories' },
      { label: 'Offers & coupons', to: 'offers' },
      { label: 'Upload prescription', to: 'prescription' },
    ],
  },
  {
    title: 'SERVICES',
    links: [
      { label: 'Custom order', to: 'customOrder' },
      { label: 'Order tracking', to: 'orders' },
      { label: 'Wishlist', to: 'wishlist' },
      { label: 'Notifications', to: 'notifications' },
    ],
  },
  {
    title: 'COMPANY',
    links: [
      { label: 'About us', to: 'about' },
      { label: 'Contact us', to: 'contact' },
      { label: 'Privacy policy', to: 'privacy' },
      { label: 'Terms & conditions', to: 'terms' },
    ],
  },
  {
    title: 'SUPPORT',
    links: [
      { label: 'Help centre', to: 'support' },
      { label: 'Raise a complaint', to: 'complaints' },
      { label: 'My orders', to: 'orders' },
    ],
  },
]

export const FOOTER_LEGAL =
  'Licensed online pharmacy · Drug licence KA-B01-123456 · FSSAI 11223344556677. All medicines dispensed against valid prescriptions, verified by registered pharmacists.'
