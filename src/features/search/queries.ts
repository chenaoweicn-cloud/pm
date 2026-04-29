import { useQuery } from '@tanstack/react-query'
import * as api from '@/lib/api'

export const useSearch = (query: string) =>
  useQuery({
    queryKey: ['search', query],
    queryFn: () => api.searchAll(query),
    enabled: query.trim().length > 0,
  })
