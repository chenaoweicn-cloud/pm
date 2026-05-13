// src/lib/api.ts
import { invoke } from '@tauri-apps/api/core'
import type {
  Project, Task, TaskGroup, Tag, TaskAttachment, ProjectRelation,
  TaskInputDto, SearchResults, TrashItems,
  TaskStatus, RelationType, AttachmentType,
  AiCaptureResult, AiInboxItem, AiInboxStatus, AiModel, SaveAiModelInput,
} from './types'

// Projects
export const listActiveProjects = () => invoke<Project[]>('list_active_projects')
export const listArchivedProjects = () => invoke<Project[]>('list_archived_projects')
export const getProject = (id: number) => invoke<Project>('get_project', { id })
export const createProject = (args: { name: string; type?: string | null; startDate?: string | null; endDate?: string | null }) =>
  invoke<Project>('create_project', args)
export const updateProject = (args: { id: number; name: string; type?: string | null; startDate?: string | null; endDate?: string | null }) =>
  invoke<Project>('update_project', args)
export const archiveProject = (id: number) => invoke<void>('archive_project', { id })
export const unarchiveProject = (id: number) => invoke<void>('unarchive_project', { id })
export const softDeleteProject = (id: number) => invoke<void>('soft_delete_project', { id })

// Project Relations
export const createProjectRelation = (args: { fromId: number; toId: number; relationType: RelationType; note?: string | null }) =>
  invoke<ProjectRelation>('create_project_relation', args)
export const listProjectRelations = (projectId: number) =>
  invoke<ProjectRelation[]>('list_project_relations', { projectId })
export const deleteProjectRelation = (id: number) => invoke<void>('delete_project_relation', { id })

// Task Groups
export const createTaskGroup = (args: { projectId: number; name: string; sortOrder: number }) =>
  invoke<TaskGroup>('create_task_group', args)
export const listTaskGroups = (projectId: number) => invoke<TaskGroup[]>('list_task_groups', { projectId })
export const renameTaskGroup = (id: number, name: string) => invoke<TaskGroup>('rename_task_group', { id, name })
export const deleteTaskGroup = (id: number) => invoke<void>('delete_task_group', { id })

// Tasks
export const createTask = (input: TaskInputDto) => invoke<Task>('create_task', { input })
export const getTask = (id: number) => invoke<Task>('get_task', { id })
export const listTasksForProject = (projectId: number) => invoke<Task[]>('list_tasks_for_project', { projectId })
export const listAllActiveTasks = () => invoke<Task[]>('list_all_active_tasks')
export const updateTask = (id: number, input: TaskInputDto) => invoke<Task>('update_task', { id, input })
export const setTaskStatus = (id: number, status: TaskStatus) => invoke<Task>('set_task_status', { id, status })
export const softDeleteTask = (id: number) => invoke<void>('soft_delete_task', { id })
export const todayTasks = (today: string) => invoke<Task[]>('today_tasks', { today })
export const completedTasksInRange = (args: { start: string; endExclusive: string; includeArchived: boolean }) =>
  invoke<Task[]>('completed_tasks_in_range', args)
export const inProgressTasks = (includeArchived: boolean) =>
  invoke<Task[]>('in_progress_tasks', { includeArchived })

// Tags
export const upsertTag = (name: string) => invoke<Tag>('upsert_tag', { name })
export const listTags = () => invoke<Tag[]>('list_tags')
export const listTagsForTask = (taskId: number) => invoke<Tag[]>('list_tags_for_task', { taskId })
export const listFirstTagNamesForTasks = (taskIds: number[]) =>
  invoke<Record<number, string>>('list_first_tag_names_for_tasks', { taskIds })
export const attachTag = (taskId: number, tagId: number) => invoke<void>('attach_tag', { taskId, tagId })
export const detachTag = (taskId: number, tagId: number) => invoke<void>('detach_tag', { taskId, tagId })

// Attachments
export const createAttachment = (args: { taskId: number; type: AttachmentType; urlOrPath: string; label?: string | null }) =>
  invoke<TaskAttachment>('create_attachment', args)
export const listAttachments = (taskId: number) => invoke<TaskAttachment[]>('list_attachments', { taskId })
export const deleteAttachment = (id: number) => invoke<void>('delete_attachment', { id })

// Search
export const searchAll = (query: string) => invoke<SearchResults>('search_all', { query })

// Trash
export const listTrash = () => invoke<TrashItems>('list_trash')
export const restoreProject = (id: number) => invoke<void>('restore_project', { id })
export const restoreTask = (id: number) => invoke<void>('restore_task', { id })
export const purgeProject = (id: number) => invoke<void>('purge_project', { id })
export const purgeTask = (id: number) => invoke<void>('purge_task', { id })

// Backup
export const backupNow = (customDir?: string) => invoke<string>('backup_now', { customDir: customDir ?? null })
export const getDefaultBackupDir = () => invoke<string>('get_default_backup_dir')

// Export
export const exportJson = (args: { outputPath: string; projectId?: number | null }) =>
  invoke<string>('export_json', args)
export const exportMarkdown = (args: { outputPath: string; start?: string | null; endExclusive?: string | null }) =>
  invoke<string>('export_markdown', args)

// Notifications
export const checkNotificationsNow = () => invoke<void>('check_notifications_now')

// AI Models
export const listAiModels = () => invoke<AiModel[]>('list_ai_models')
export const getActiveAiModel = () => invoke<AiModel | null>('get_active_ai_model')
export const saveAiModel = (input: SaveAiModelInput) => invoke<AiModel>('save_ai_model', { input })
export const deleteAiModel = (id: number) => invoke<void>('delete_ai_model', { id })
export const setActiveAiModel = (id: number) => invoke<void>('set_active_ai_model', { id })

// AI Inbox
export const aiCaptureTasks = (text: string) => invoke<AiCaptureResult>('ai_capture_tasks', { text })
export const listAiInboxItems = (status?: AiInboxStatus | null) =>
  invoke<AiInboxItem[]>('list_ai_inbox_items', { status: status ?? null })
export const countPendingAiInboxItems = () => invoke<number>('count_pending_ai_inbox_items')
export const convertAiInboxItem = (id: number, input: TaskInputDto) =>
  invoke<Task>('convert_ai_inbox_item', { id, input })
export const dismissAiInboxItem = (id: number) => invoke<void>('dismiss_ai_inbox_item', { id })
