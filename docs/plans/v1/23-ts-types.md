# Task 23: TypeScript 类型定义

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: 与 Rust models 严格对齐的类型**

  ```typescript
  // src/lib/types.ts
  export type ProjectStatus = 'active' | 'archived'
  export type TaskStatus = 'not_started' | 'in_progress' | 'done'
  export type Priority = 'high' | 'medium' | 'low'
  export type RelationType = 'successor' | 'related'
  export type AttachmentType = 'link' | 'file'

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
  }

  export interface TaskGroup {
    id: number
    projectId: number
    name: string
    sortOrder: number
    createdAt: string
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
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): TS 类型定义"
  ```

