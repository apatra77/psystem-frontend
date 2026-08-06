import { Activity, BadgeCheck, FlaskConical, Pill, ShieldCheck, Truck, Video } from 'lucide-react'

export const NAV_LINKS = ['Medicines', 'Lab Tests', 'Consult Doctor', 'Offers']

export const STATS = [
  { val: '2 Cr+', label: 'Happy Customers' },
  { val: '10k+', label: 'Medicines' },
  { val: '200+', label: 'Doctors' },
  { val: '500+', label: 'Cities Covered' },
]

export const FEATURES = [
  {
    icon: Pill,
    title: 'Order Medicines',
    desc: '10,000+ medicines delivered to your door. Upload prescription or order OTC.',
    color: 'bg-[rgba(64,222,170,0.12)]',
    ic: 'text-[#40deaa]',
    badge: '10k+ Products',
  },
  {
    icon: FlaskConical,
    title: 'Book Lab Tests',
    desc: '800+ diagnostic tests at NABL accredited labs. Home sample collection available.',
    color: 'bg-[rgba(111,194,255,0.12)]',
    ic: 'text-[#6fc2ff]',
    badge: '35% off today',
  },
  {
    icon: Video,
    title: 'Consult Doctors',
    desc: '200+ specialists online. Video, audio or chat consultations in minutes.',
    color: 'bg-[rgba(178,135,255,0.12)]',
    ic: 'text-[#b287ff]',
    badge: '₹99 onwards',
  },
  {
    icon: Activity,
    title: 'Health Records',
    desc: 'Store prescriptions, lab reports, and health history securely in one place.',
    color: 'bg-[rgba(255,213,143,0.12)]',
    ic: 'text-[#ffd58f]',
    badge: 'Encrypted & safe',
  },
]

export const TESTIMONIALS = [
  {
    name: 'Priya Kapoor',
    role: 'Working Professional',
    text: 'MEDIQ delivered my medicines in under 2 hours. The price comparison feature saved me ₹400 this month!',
    avatar: 'PK',
    stars: 5,
  },
  {
    name: 'Dr. Arun Mehta',
    role: 'General Physician',
    text: 'I recommend MEDIQ to all my patients. The prescription management system is incredibly well designed.',
    avatar: 'AM',
    stars: 5,
  },
  {
    name: 'Sunita Reddy',
    role: 'Senior Citizen',
    text: 'My daughter set it up for me. Now I order my monthly medicines without any hassle. Very simple to use.',
    avatar: 'SR',
    stars: 5,
  },
]

export const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    label: '100% Genuine Medicines',
    c: 'text-[#40deaa]',
    bg: 'bg-[rgba(64,222,170,0.12)]',
  },
  {
    icon: Truck,
    label: 'Same Day Delivery',
    c: 'text-[#6fc2ff]',
    bg: 'bg-[rgba(111,194,255,0.12)]',
  },
  {
    icon: BadgeCheck,
    label: 'FSSAI Approved',
    c: 'text-[#ffd58f]',
    bg: 'bg-[rgba(255,213,143,0.12)]',
  },
]

export const SPECIALTIES = ['General Physician', 'Dermatologist', 'Cardiologist', 'Gynaecologist']

export const FOOTER_LINKS = ['Privacy', 'Terms', 'Contact', 'Careers']
