import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'
import type { AiInboxStatus, SaveAiModelInput, TaskInputDto } from '@/lib/types'
import { projectKeys } from '@/features/projects/queries'
import { taskKeys } from '@/features/tasks/queries'

export const aiKeys = {
  all: ['ai'] as const,
  models: () => [...aiKeys.all, 'models'] as const,
  activeModel: () => [...aiKeys.all, 'active-model'] as const,
  inbox: (status?: AiInboxStatus | null) => [...aiKeys.all, 'inbox', status ?? 'all'] as const,
  pendingCount: () => [...aiKeys.all, 'pending-count'] as const,
}

export const useAiModels = () =>
  useQuery({ queryKey: aiKeys.models(), queryFn: api.listAiModels })

export const useActiveAiModel = () =>
  useQuery({ queryKey: aiKeys.activeModel(), queryFn: api.getActiveAiModel })

export const useAiInboxItems = (status: AiInboxStatus | null = 'pending') =>
  useQuery({ queryKey: aiKeys.inbox(status), queryFn: () => api.listAiInboxItems(status) })

export const usePendingAiInboxCount = () =>
  useQuery({ queryKey: aiKeys.pendingCount(), queryFn: api.countPendingAiInboxItems })

function invalidateAi(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: aiKeys.all })
}

export function useSaveAiModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveAiModelInput) => api.saveAiModel(input),
    onSuccess: () => invalidateAi(qc),
  })
}

export function useDeleteAiModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteAiModel,
    onSuccess: () => invalidateAi(qc),
  })
}

export function useSetActiveAiModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.setActiveAiModel,
    onSuccess: () => invalidateAi(qc),
  })
}

export function useAiCaptureTasks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.aiCaptureTasks,
    onSuccess: () => {
      invalidateAi(qc)
      qc.invalidateQueries({ queryKey: taskKeys.all })
      qc.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}

export function useConvertAiInboxItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TaskInputDto }) => api.convertAiInboxItem(id, input),
    onSuccess: () => {
      invalidateAi(qc)
      qc.invalidateQueries({ queryKey: taskKeys.all })
      qc.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}

export function useDismissAiInboxItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.dismissAiInboxItem,
    onSuccess: () => invalidateAi(qc),
  })
}
