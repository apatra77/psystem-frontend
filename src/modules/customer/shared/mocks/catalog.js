export const CATEGORIES = [
  { id: 'c1', slug: 'medicines', name: 'Medicines', icon: '💊', count: 1240 },
  { id: 'c2', slug: 'wellness', name: 'Wellness', icon: '🌿', count: 486 },
  { id: 'c3', slug: 'devices', name: 'Devices', icon: '🩺', count: 132 },
  { id: 'c4', slug: 'baby-care', name: 'Baby care', icon: '🍼', count: 214 },
  { id: 'c5', slug: 'personal-care', name: 'Personal care', icon: '🧴', count: 391 },
  { id: 'c6', slug: 'lab-tests', name: 'Lab tests', icon: '🧪', count: 78 },
]

export const PRODUCTS = [
  { id: 'p1', name: 'Dolo 650 Tablet', brand: 'Micro Labs', cat: 'medicines', pack: 'Strip of 15', price: 30, mrp: 34, rating: 4.6, reviews: 2410, rx: false, stock: 120, eta: '12 min', desc: 'Paracetamol 650mg for fever and mild pain relief.' },
  { id: 'p2', name: 'Azithral 500 Tablet', brand: 'Alembic', cat: 'medicines', pack: 'Strip of 5', price: 118, mrp: 132, rating: 4.4, reviews: 830, rx: true, stock: 44, eta: '15 min', desc: 'Azithromycin 500mg antibiotic. Prescription required.' },
  { id: 'p3', name: 'Accu-Chek Active Glucometer', brand: 'Roche', cat: 'devices', pack: '1 kit', price: 1099, mrp: 1450, rating: 4.7, reviews: 1290, rx: false, stock: 18, eta: '25 min', desc: 'Blood glucose monitoring kit with 10 free strips.' },
  { id: 'p4', name: 'Vitamin D3 60K Sachet', brand: 'HealthVit', cat: 'wellness', pack: 'Pack of 4', price: 245, mrp: 299, rating: 4.5, reviews: 640, rx: false, stock: 76, eta: '18 min', desc: 'Weekly cholecalciferol supplement for bone health.' },
  { id: 'p5', name: 'Omron HEM-7120 BP Monitor', brand: 'Omron', cat: 'devices', pack: '1 unit', price: 1799, mrp: 2260, rating: 4.8, reviews: 3110, rx: false, stock: 9, eta: '30 min', desc: 'Automatic upper-arm blood pressure monitor.' },
  { id: 'p6', name: 'Cetaphil Gentle Cleanser', brand: 'Galderma', cat: 'personal-care', pack: '250 ml', price: 399, mrp: 469, rating: 4.6, reviews: 1870, rx: false, stock: 52, eta: '20 min', desc: 'Soap-free daily cleanser for sensitive skin.' },
  { id: 'p7', name: 'Pampers Baby Diapers M', brand: 'Pampers', cat: 'baby-care', pack: 'Pack of 42', price: 649, mrp: 799, rating: 4.5, reviews: 2960, rx: false, stock: 31, eta: '22 min', desc: '12-hour dryness with a soft cotton-like top sheet.' },
  { id: 'p8', name: 'Complete Blood Count (CBC)', brand: 'MEDIQ Labs', cat: 'lab-tests', pack: 'Home sample', price: 349, mrp: 599, rating: 4.7, reviews: 410, rx: false, stock: 999, eta: 'Next slot 7am', desc: 'Home sample collection, reports within 12 hours.' },
  { id: 'p9', name: 'Pan-D Capsule', brand: 'Alkem', cat: 'medicines', pack: 'Strip of 15', price: 172, mrp: 199, rating: 4.3, reviews: 520, rx: true, stock: 12, eta: '14 min', desc: 'Pantoprazole + Domperidone for acid reflux.' },
  { id: 'p10', name: 'Digital Thermometer', brand: 'Dr Trust', cat: 'devices', pack: '1 unit', price: 249, mrp: 399, rating: 4.4, reviews: 980, rx: false, stock: 64, eta: '16 min', desc: 'Fast 10-second reading with fever alarm.' },
  { id: 'p11', name: 'Protein Powder Chocolate', brand: 'MuscleBlaze', cat: 'wellness', pack: '1 kg', price: 1649, mrp: 2199, rating: 4.5, reviews: 5120, rx: false, stock: 27, eta: '28 min', desc: '25g protein per serving with digestive enzymes.' },
  { id: 'p12', name: 'Sebamed Baby Lotion', brand: 'Sebamed', cat: 'baby-care', pack: '200 ml', price: 529, mrp: 620, rating: 4.6, reviews: 760, rx: false, stock: 40, eta: '19 min', desc: 'pH 5.5 lotion for delicate newborn skin.' },
]

export const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
  { id: 'eta', label: 'Fastest delivery' },
]

export const BRANDS = [...new Set(PRODUCTS.map((p) => p.brand))].sort()
