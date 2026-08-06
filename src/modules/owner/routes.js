import { useLocation } from 'react-router-dom'

export const OWNER_PAGES = [
  'dashboard',
  'orders',
  'logistics',
  'products',
  'categories',
  'inventory',
  'discounts',
  'staff',
  'store',
  'profile',
]

export function pathToPage(pathname) {
  if (pathname === '/owner' || pathname === '/owner/') return 'dashboard'
  const segment = pathname.replace(/^\/owner\/?/, '').split('/')[0]
  return OWNER_PAGES.includes(segment) ? segment : 'dashboard'
}

export function pageToPath(page) {
  if (page === 'dashboard') return '/owner'
  return `/owner/${page}`
}

export function useOwnerPage() {
  const { pathname } = useLocation()
  return pathToPage(pathname)
}
