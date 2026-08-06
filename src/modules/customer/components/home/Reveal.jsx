import useReveal from '@/shared/hooks/useReveal'

/**
 * Fades and lifts its child into view once. Wraps the shared `useReveal`
 * observer so sections stay declarative:
 *
 *   <Reveal delay={100}><Card /></Reveal>
 *
 * Renders a plain div by default; pass `as` to keep the section semantics.
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', style = {}, children, ...rest }) {
  const ref = useReveal()

  return (
    <Tag
      ref={ref}
      className={`reveal-on-scroll ${className}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
