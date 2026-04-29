import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'

export const useTrash = () => useQuery({ queryKey: ['trash'], queryFn: api.listTrash })

export function useRestoreProject() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: api.restoreProject, onSuccess: () => qc.invalidateQueries() })
}
export function useRestoreTask() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: api.restoreTask, onSuccess: () => qc.invalidateQueries() })
}
export function usePurgeProject() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: api.purgeProject, onSuccess: () => qc.invalidateQueries() })
}
export function usePurgeTask() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: api.purgeTask, onSuccess: () => qc.invalidateQueries() })
}
