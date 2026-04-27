// TS types aligned with docs/spec.md §6.1 schema (snake_case → camelCase).
// These will eventually mirror the Rust models exposed via Tauri IPC.

export type ProjectStatus = 'active' | 'archived'
export type TaskStatus = 'not_started' | 'in_progress' | 'done'
export type Priority = 'high' | 'medium' | 'low'
export type RelationType = 'successor' | 'related'
export type AttachmentType = 'link' | 'file'

export interface Project {
  id: number
  name: string
  status: ProjectStatus
  type?: string
  startDate?: string
  endDate?: string
  archivedAt?: string
  deletedAt?: string
  createdAt?: string
  updatedAt?: string
  // UI-derived (not in DB schema; computed from joins/queries in real impl)
  color: string
  taskCount?: number
  dueCount?: number
}

export interface TaskGroup {
  id: number
  projectId: number
  name: string
  sortOrder?: number
}

export interface Task {
  id: number
  projectId: number
  groupId?: number
  parentTaskId?: number
  name: string
  status: TaskStatus
  priority?: Priority
  startDate?: string
  dueDate?: string
  estimateHours?: number
  description?: string
  completedAt?: string
  deletedAt?: string
  createdAt?: string
  updatedAt?: string
  // Many-to-many in real schema; flattened for the prototype
  tags?: string[]
}

export interface Tag {
  id: number
  name: string
}

export interface TaskAttachment {
  id: number
  taskId: number
  type: AttachmentType
  urlOrPath: string
  label?: string
}

export interface ProjectRelation {
  id: number
  fromProjectId: number
  toProjectId: number
  relationType: RelationType
  note?: string
}
