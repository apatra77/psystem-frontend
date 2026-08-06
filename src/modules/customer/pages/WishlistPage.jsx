import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import PageHeader from '@/shared/ui/PageHeader'
import Button from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import ProductCard from '@/modules/customer/components/ProductCard'
import { useCatalogStore } from '@/app/store/catalogStore'
import { PATHS } from '@/app/router/paths'

export default function WishlistPage() {
  const wishlist = useCatalogStore((s) => s.wishlist)
  const products = useCatalogStore((s) => s.products)
  const saved = products.filter((p) => wishlist.includes(p.id))

  return (
    <div>
      <PageHeader title="Wishlist" subtitle="Items you saved for later." />
      {saved.length === 0 ? (
        <EmptyState icon={Heart} title="Nothing saved yet" action={<Button as={Link} to={PATHS.customer.search}>Browse products</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
