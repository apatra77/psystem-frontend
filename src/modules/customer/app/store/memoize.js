/**
 * Reference-stable memoisation for derived store getters.
 *
 * zustand v5 reads state through `useSyncExternalStore`, which requires
 * getSnapshot to return the *same reference* when nothing changed. A getter
 * like `results()` or `totals()` that builds a fresh array or object on every
 * call therefore makes React re-render forever:
 *
 *   Warning: The result of getSnapshot should be cached to avoid an infinite loop
 *   Error: Maximum update depth exceeded
 *
 * Wrapping the computation keeps the previous result while its inputs are
 * identical, so `useStore((s) => s.results())` is safe to call directly from a
 * component. Inputs are compared with Object.is, so pass the raw state slices
 * (arrays, objects) rather than values derived from them.
 *
 *   const computeTotals = memoizeDerived((items, coupon) => ({ ... }))
 *   totals: () => computeTotals(get().items, get().coupon)
 */
export function memoizeDerived(compute) {
  let lastInputs = null
  let lastResult

  return (...inputs) => {
    const hit =
      lastInputs !== null &&
      lastInputs.length === inputs.length &&
      lastInputs.every((value, i) => Object.is(value, inputs[i]))

    if (hit) return lastResult

    lastInputs = inputs
    lastResult = compute(...inputs)
    return lastResult
  }
}

export default memoizeDerived
