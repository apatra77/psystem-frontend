import { useEffect, useRef, useState } from 'react'
import SplashScreen from './SplashScreen'

/** Minimum time the splash stays up, so a fast boot doesn't flash it. */
const MIN_VISIBLE_MS = 900
/** Must match the `.splash-screen` opacity transition in index.css. */
const FADE_MS = 420

/**
 * Shows the splash screen once, during application startup only.
 *
 * `ready` is the caller's signal that the app can render (session bootstrap
 * finished). Route changes never remount this — it lives above the router — and
 * the module-level `alreadyShown` flag makes a remount during development HMR
 * skip the splash instead of replaying it. Lazy-loaded pages use their
 * page-specific shimmers instead.
 */
let alreadyShown = false

export default function SplashGate({ ready, children }) {
  const [phase, setPhase] = useState(() => (alreadyShown ? 'done' : 'showing'))
  const startedAt = useRef(Date.now())

  useEffect(() => {
    if (phase === 'done' || !ready) return undefined

    const elapsed = Date.now() - startedAt.current
    const holdFor = Math.max(0, MIN_VISIBLE_MS - elapsed)

    const fadeTimer = setTimeout(() => setPhase('fading'), holdFor)
    const doneTimer = setTimeout(() => {
      alreadyShown = true
      setPhase('done')
    }, holdFor + FADE_MS)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [ready, phase])

  return (
    <>
      {/*
        Children mount as soon as the app is ready, underneath the still-visible
        overlay. The crossfade therefore reveals a fully painted app rather than
        swapping one screen for another, which is what causes the flicker.
      */}
      {ready ? children : null}
      {phase !== 'done' && <SplashScreen hidden={phase === 'fading'} />}
    </>
  )
}
