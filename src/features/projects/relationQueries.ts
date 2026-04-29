import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'
import { projectKeys } from './queries'

export const useProjectRelations = (projectId: number | null) =>
  useQuery({
    queryKey: projectKeys.relations(projectId!),
    queryFn: () => api.listProjectRelations(projectId!),
    enabled: projectId != null,
  })

export function useCreateProjectRelation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createProjectRelation,
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useDeleteProjectRelation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteProjectRelation,
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  })
}
