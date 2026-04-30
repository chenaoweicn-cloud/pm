import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'

export const projectKeys = {
  all: ['projects'] as const,
  active: () => [...projectKeys.all, 'active'] as const,
  archived: () => [...projectKeys.all, 'archived'] as const,
  detail: (id: number) => [...projectKeys.all, 'detail', id] as const,
}

export const useActiveProjects = () =>
  useQuery({ queryKey: projectKeys.active(), queryFn: api.listActiveProjects })

export const useArchivedProjects = () =>
  useQuery({ queryKey: projectKeys.archived(), queryFn: api.listArchivedProjects })

export const useProject = (id: number | null) =>
  useQuery({ queryKey: projectKeys.detail(id!), queryFn: () => api.getProject(id!), enabled: id != null })

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.updateProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useArchiveProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.archiveProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useUnarchiveProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.unarchiveProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useSoftDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.softDeleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  })
}
