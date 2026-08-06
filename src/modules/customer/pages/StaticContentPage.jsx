import { Link, useParams } from 'react-router-dom'
import PageHeader from '@/shared/ui/PageHeader'
import EmptyState from '@/shared/ui/EmptyState'
import Button from '@/shared/ui/Button'
import { PATHS } from '@/app/router/paths'
import { STATIC_PAGES } from '@/shared/mocks/staticContent'
import { colors } from '@/app/themes/colors'

/**
 * Renders About / Privacy / Terms from one component.
 *
 * The slug comes either from the `/legal/:slug` param or from a `slug` prop, so
 * a dedicated route (`/about`) and the generic legal route share this page. An
 * unknown slug shows a recoverable empty state rather than crashing.
 */
export default function StaticContentPage({ slug: slugProp }) {
  const params = useParams()
  const slug = slugProp ?? params.slug
  const page = STATIC_PAGES[slug]

  if (!page) {
    return (
      <EmptyState
        title="Page not found"
        subtitle="That document does not exist or has been moved."
        action={<Button as={Link} to={PATHS.customer.home}>Back to home</Button>}
      />
    )
  }

  return (
    <article>
      <PageHeader title={page.title} subtitle={page.subtitle} />

      <div className="max-w-[760px] space-y-5">
        {page.sections.map((section) => (
          <section
            key={section.heading}
            className="rounded-[18px] p-6"
            style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
          >
            <h2 className="text-[15px] font-extrabold" style={{ color: colors.textBright }}>
              {section.heading}
            </h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed" style={{ color: colors.textMuted }}>
              {section.body}
            </p>
          </section>
        ))}

        <p className="text-[12px]" style={{ color: colors.textDim }}>
          Questions about this page?{' '}
          <Link to={PATHS.customer.contact} className="font-bold" style={{ color: colors.accent }}>
            Contact us
          </Link>
          .
        </p>
      </div>
    </article>
  )
}
