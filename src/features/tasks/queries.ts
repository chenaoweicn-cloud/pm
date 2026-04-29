import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'
import type { TaskInputDto, TaskStatus } from '@/lib/types'

export const taskKeys = {
  all: ['tasks'] as const,
  byProject: (pid: number) => [...taskKeys.all, 'project', pid] as const,
  allActive: () => [...taskKeys.all, 'all-active'] as const,
  today: (today: string) => [...taskKeys.all, 'today', today] as const,
  detail: (id: number) => [...taskKeys.all, 'detail', id] as const,
  range: (s: string, e: string, arch: boolean) => [...taskKeys.all, 'range', s, e, arch] as const,
  inProgress: (arch: boolean) => [...taskKeys.all, 'in-progress', arch] as const,
}

export const useTasksForProject = (projectId: number | null) =>
  useQuery({ queryKey: taskKeys.byProject(projectId!), queryFn: () => api.listTasksForProject(projectId!), enabled: projectId != null })

export const useAllActiveTasks = () =>
  useQuery({ queryKey: taskKeys.allActive(), queryFn: api.listAllActiveTasks })

export const useTodayTasks = (today: string) =>
  useQuery({ queryKey: taskKeys.today(today), queryFn: () => api.todayTasks(today) })

export const useCompletedInRange = (start: string, endExclusive: string, includeArchived: boolean) =>
  useQuery({ queryKey: taskKeys.range(start, endExclusive, includeArchived), queryFn: () => api.completedTasksInRange({ start, endExclusive, includeArchived }) })

export const useInProgressTasks = (includeArchived: boolean) =>
  useQuery({ queryKey: taskKeys.inProgress(includeArchived), queryFn: () => api.inProgressTasks(includeArchived) })

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TaskInputDto) => api.createTask(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TaskInputDto }) => api.updateTask(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  })
}

export function useSetTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => api.setTaskStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  })
}

export function useSoftDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.softDeleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  })
}
