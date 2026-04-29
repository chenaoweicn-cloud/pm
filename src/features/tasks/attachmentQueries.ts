import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'

export const useAttachments = (taskId: number | null) =>
  useQuery({
    queryKey: ['attachments', taskId!],
    queryFn: () => api.listAttachments(taskId!),
    enabled: taskId != null,
  })

export function useCreateAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createAttachment,
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ['attachments', variables.taskId] }),
  })
}

export function useDeleteAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteAttachment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments'] }),
  })
}
