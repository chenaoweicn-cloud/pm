// TS types aligned with docs/spec.md §6.1 schema (snake_case → camelCase).
// These will eventually mirror the Rust models exposed via Tauri IPC.

export type ProjectStatus = 'active' | 'archived'
export type TaskStatus = 'not_started' | 'in_progress' | 'done'
export type Priority = 'high' | 'medium' | 'low'
export type RelationType = 'successor' | 'related'
export type AttachmentType = 'link' | 'file'
export type AiInboxStatus = 'pending' | 'converted' | 'dismissed'

export interface Project {
  id: number
  name: string
  status: ProjectStatus
  type: string | null
  startDate: string | null
  endDate: string | null
  archivedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  // UI-derived (not in DB schema; computed from joins/queries in real impl)
  color?: string
  taskCount?: number
  dueCount?: number
}

export interface TaskGroup {
  id: number
  projectId: number
  name: string
  sortOrder: number
  createdAt: string
}

export interface Task {
  id: number
  projectId: number
  groupId: number | null
  parentTaskId: number | null
  name: string
  status: TaskStatus
  priority: Priority | null
  startDate: string | null
  dueDate: string | null
  estimateHours: number | null
  description: string | null
  completedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  // Many-to-many in real schema; flattened for the prototype
  tags?: string[]
}

export interface Tag {
  id: number
  name: string
  createdAt: string
}

export interface TaskAttachment {
  id: number
  taskId: number
  type: AttachmentType
  urlOrPath: string
  label: string | null
  createdAt: string
}

export interface ProjectRelation {
  id: number
  fromProjectId: number
  toProjectId: number
  relationType: RelationType
  note: string | null
  createdAt: string
}

export interface TaskInputDto {
  projectId: number
  name: string
  groupId?: number | null
  parentTaskId?: number | null
  priority?: Priority | null
  startDate?: string | null
  dueDate?: string | null
  estimateHours?: number | null
  description?: string | null
}

export interface SearchResults {
  projects: Project[]
  tasks: Task[]
}

export interface TrashItems {
  projects: Project[]
  tasks: Task[]
}

export interface AiModel {
  id: number
  displayName: string
  baseUrl: string
  modelName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SaveAiModelInput {
  id?: number | null
  displayName: string
  baseUrl: string
  modelName: string
  apiKey?: string | null
}

export interface AiInboxItem {
  id: number
  rawInput: string
  parsedName: string
  parsedDescription: string | null
  priority: Priority | null
  startDate: string | null
  dueDate: string | null
  projectCandidateId: number | null
  confidence: number
  status: AiInboxStatus
  modelId: number | null
  createdTaskId: number | null
  createdAt: string
  updatedAt: string
}

export interface AiCaptureResult {
  created: Task[]
  inboxItems: AiInboxItem[]
  failed: Array<{
    rawInput: string
    reason: string
  }>
}
