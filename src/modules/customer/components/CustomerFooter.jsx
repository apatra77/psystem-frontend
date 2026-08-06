import { Link } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import { colors } from '@/app/themes/colors'
import { ENV } from '@/app/config/env'

const COLUMNS = [
  { title: 'Shop', links: [
    { label: 'All products', to: PATHS.customer.search },
    { label: 'Categories', to: PATHS.customer.categories },
    { label: 'Offers & coupons', to: PATHS.customer.offers },
    { label: 'Upload prescription', to: PATHS.customer.prescription },
    { label: 'Order something else', to: PATHS.customer.customOrder },
  ] },
  { title: 'Account', links: [
    { label: 'My orders', to: PATHS.customer.orders },
    { label: 'Addresses', to: PATHS.customer.addresses },
    { label: 'Payment methods', to: PATHS.customer.paymentMethods },
  ] },
  { title: 'Help', links: [
    { label: 'Support centre', to: PATHS.customer.support },
    { label: 'Raise a complaint', to: PATHS.customer.complaints },
    { label: 'Contact us', to: PATHS.customer.contact },
  ] },
  { title: 'Company', links: [
    { label: 'About us', to: PATHS.customer.about },
    { label: 'Privacy policy', to: PATHS.customer.privacy },
    { label: 'Terms & conditions', to: PATHS.customer.terms },
  ] },
]

export default function CustomerFooter() {
  return (
    <footer className="mt-10" style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
      <div className="max-w-[1180px] mx-auto px-5 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="font-extrabold text-lg" style={{ color: colors.textBright }}>{ENV.APP_NAME}</p>
          <p className="text-[12.5px] mt-2 max-w-[240px]" style={{ color: colors.textMuted }}>
            Medicines, devices and lab tests delivered from your neighbourhood pharmacy.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-[11px] font-extrabold uppercase tracking-wider mb-3" style={{ color: colors.textDim }}>{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.to + l.label}>
                  <Link to={l.to} className="text-[13px]" style={{ color: colors.textMuted }}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-[1180px] mx-auto px-5 py-5 text-[12px]" style={{ color: colors.textDim, borderTop: `1px solid ${colors.borderSubtle}` }}>
        © {new Date().getFullYear()} {ENV.APP_NAME}. Licensed pharmacy partner network.
      </div>
    </footer>
  )
}
