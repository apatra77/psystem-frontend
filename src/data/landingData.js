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
    color: 'bg-blue-50',
    ic: 'text-blue-600',
    badge: '10k+ Products',
  },
  {
    icon: FlaskConical,
    title: 'Book Lab Tests',
    desc: '800+ diagnostic tests at NABL accredited labs. Home sample collection available.',
    color: 'bg-green-50',
    ic: 'text-green-600',
    badge: '35% off today',
  },
  {
    icon: Video,
    title: 'Consult Doctors',
    desc: '200+ specialists online. Video, audio or chat consultations in minutes.',
    color: 'bg-purple-50',
    ic: 'text-purple-600',
    badge: '₹99 onwards',
  },
  {
    icon: Activity,
    title: 'Health Records',
    desc: 'Store prescriptions, lab reports, and health history securely in one place.',
    color: 'bg-orange-50',
    ic: 'text-orange-600',
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
  { icon: ShieldCheck, label: '100% Genuine Medicines', c: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Truck, label: 'Same Day Delivery', c: 'text-green-600', bg: 'bg-green-50' },
  { icon: BadgeCheck, label: 'FSSAI Approved', c: 'text-orange-600', bg: 'bg-orange-50' },
]

export const SPECIALTIES = ['General Physician', 'Dermatologist', 'Cardiologist', 'Gynaecologist']

export const FOOTER_LINKS = ['Privacy', 'Terms', 'Contact', 'Careers']
