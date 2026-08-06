import { useCallback, useState } from 'react'

/** `const [open, toggle, setOpen] = useToggle()` — modals and drawers everywhere. */
export function useToggle(initial = false) {
  const [value, setValue] = useState(initial)
  const toggle = useCallback(() => setValue((v) => !v), [])
  return [value, toggle, setValue]
}

export default useToggle
