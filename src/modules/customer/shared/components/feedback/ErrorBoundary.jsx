import { Component } from 'react'
import { msg } from '@/shared/messages/messages'
import { colors } from '@/app/themes/colors'

/**
 * Catches render-time crashes.
 *
 * Two shapes:
 *  - `variant="screen"` (default) at the app root — full-screen, offers reload.
 *  - `variant="inline"` inside a route — keeps the header, footer and
 *    navigation alive so a single broken page never blanks the app. Pair it
 *    with a `key` that changes per route (see RouteBoundary) so navigating away
 *    clears the error instead of staying stuck on it.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Wire this to Sentry / your logger.
    console.error('[ErrorBoundary]', error, info)
  }

  retry = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    const { children, variant = 'screen' } = this.props
    if (!error) return children

    const isInline = variant === 'inline'

    return (
      <div
        className={
          isInline
            ? 'flex flex-col items-center justify-center gap-4 px-6 py-20 text-center'
            : 'flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center'
        }
        style={isInline ? undefined : { background: colors.pageBg }}
        role="alert"
      >
        <p className="text-[18px] font-extrabold" style={{ color: colors.textBright }}>
          {msg('common.somethingWentWrong')}
        </p>
        <p className="max-w-[420px] text-[13px]" style={{ color: colors.textMuted }}>
          {isInline
            ? 'This page ran into a problem. You can try again, or use the navigation to go somewhere else.'
            : 'The application ran into an unexpected problem.'}
        </p>
        <button
          type="button"
          onClick={isInline ? this.retry : () => window.location.reload()}
          className="rounded-[12px] px-5 py-2.5 text-[13px] font-bold"
          style={{ background: colors.primaryBtn, color: colors.accentText }}
        >
          {isInline ? 'Try again' : 'Reload'}
        </button>
      </div>
    )
  }
}
