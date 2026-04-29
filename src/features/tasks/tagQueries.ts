import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'
import { taskKeys } from './queries'

export const useTags = () => useQuery({ queryKey: ['tags'], queryFn: api.listTags })

export const useTagsForTask = (taskId: number | null) =>
  useQuery({
    queryKey: ['tags', 'task', taskId!],
    queryFn: () => api.listTagsForTask(taskId!),
    enabled: taskId != null,
  })

export function useAttachTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, tagId }: { taskId: number; tagId: number }) => api.attachTag(taskId, tagId),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  })
}

export function useDetachTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, tagId }: { taskId: number; tagId: number }) => api.detachTag(taskId, tagId),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  })
}

export function useUpsertTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.upsertTag(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })
}
