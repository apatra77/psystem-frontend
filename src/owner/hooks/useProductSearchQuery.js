import { useEffect, useRef } from 'react'
import { Subject, from } from 'rxjs'
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators'

const SEARCH_DEBOUNCE_MS = 350

export function useProductSearchQuery({ searchProducts, loadProductsByCategory, getCategoryFilter }) {
  const subjectRef = useRef(null)
  const getCategoryFilterRef = useRef(getCategoryFilter)
  getCategoryFilterRef.current = getCategoryFilter

  useEffect(() => {
    const subject = new Subject()
    subjectRef.current = subject

    const subscription = subject
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        switchMap((query) => {
          const trimmed = query.trim()
          if (!trimmed) {
            return from(loadProductsByCategory(getCategoryFilterRef.current()))
          }
          return from(searchProducts(trimmed))
        }),
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      subject.complete()
      subjectRef.current = null
    }
  }, [searchProducts, loadProductsByCategory])

  const queueSearch = (query) => {
    subjectRef.current?.next(query)
  }

  return { queueSearch }
}
