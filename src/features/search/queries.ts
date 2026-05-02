import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as api from '@/lib/api'

export const SEARCH_MIN_CHARS = 2
const SEARCH_DEBOUNCE_MS = 250

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs, value])

  return debounced
}

export function useSearch(query: string) {
  const normalizedQuery = query.trim()
  const debouncedQuery = useDebouncedValue(normalizedQuery, SEARCH_DEBOUNCE_MS)

  return useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => api.searchAll(debouncedQuery),
    enabled: debouncedQuery.length >= SEARCH_MIN_CHARS,
  })
}
