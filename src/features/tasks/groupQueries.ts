import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'

export const useTaskGroups = (projectId: number | null) =>
  useQuery({
    queryKey: ['groups', projectId!],
    queryFn: () => api.listTaskGroups(projectId!),
    enabled: projectId != null,
  })

export function useCreateTaskGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createTaskGroup,
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ['groups', variables.projectId] }),
  })
}

export function useRenameTaskGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => api.renameTaskGroup(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export function useDeleteTaskGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteTaskGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  })
}
