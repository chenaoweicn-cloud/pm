import { useState } from 'react'
import { S } from '@/design/tokens'
import { todayIso, relDate } from '@/lib/date'
import { useProject } from '@/features/projects/queries'
import { useSetTaskStatus, useSoftDeleteTask } from '@/features/tasks/queries'
import type { Task, TaskStatus } from '@/lib/types'
import { Checkbox } from './Checkbox'

interface Props {
  task: Task
  showDate?: boolean
  showProject?: boolean
  projectName?: string
  projectColor?: string
  tagName?: string | null
  onEdit?: (task: Task) => void
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  not_started: 'in_progress',
  in_progress: 'done',
  done: 'not_started',
}

export function Row({
  task,
  showDate = true,
  showProject = false,
  projectName,
  projectColor,
  tagName,
  onEdit,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const shouldLoadProject = showProject && projectName == null
  const { data: p } = useProject(task.projectId, shouldLoadProject)
  const setStatus = useSetTaskStatus()
  const softDelete = useSoftDeleteTask()

  const isDone = task.status === 'done'
  const isSubtask = task.parentTaskId != null
  const todayStr = todayIso()
  const overdue = task.dueDate != null && task.dueDate < todayStr && !isDone
  const today = task.dueDate === todayStr
  const tag = tagName ?? task.tags?.[0]
  const color = projectColor ?? p?.color ?? '#6C6C6C'
  const effectiveProjectName = projectName ?? p?.name

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: S.rowPad,
        borderTop: S.rowBorder,
        background: hovered ? S.rowHover : 'transparent',
      }}
    >
      <Checkbox
        status={task.status}
        color={color}
        onClick={() => setStatus.mutate({ id: task.id, status: STATUS_CYCLE[task.status] })}
      />
      {task.priority === 'high' && (
        <span style={{ width: 3, height: 12, borderRadius: 1.5, background: S.warn, flexShrink: 0 }} />
      )}
      <span
        onClick={onEdit ? () => onEdit(task) : undefined}
        style={{
          flex: 1,
          fontSize: S.rowSize,
          color: isDone ? S.fgMuted : S.fg,
          textDecoration: isDone ? 'line-through' : 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          cursor: onEdit ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingLeft: isSubtask ? 18 : 0,
        }}
      >
        {isSubtask && (
          <span
            style={{
              fontSize: 12,
              color: S.fgMuted,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ↳
          </span>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.name}</span>
      </span>
      {showProject && effectiveProjectName && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            maxWidth: 180,
            fontSize: 10.5,
            color: S.fg,
            background: S.accentSoft,
            borderRadius: 999,
            padding: '3px 8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flexShrink: 0,
            fontWeight: 600,
          }}
          title={effectiveProjectName}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{effectiveProjectName}</span>
        </span>
      )}
      {tag && <span style={{ fontSize: 10, color: S.fgMuted }}>#{tag}</span>}
      {showDate && task.dueDate && (
        <span
          style={{
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 4,
            color: overdue || today ? S.warn : S.fgMuted,
            background: overdue || today ? S.warnSoft : S.chipBg,
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {relDate(task.dueDate)}
        </span>
      )}
      {onEdit && (
        <button
          onClick={() => onEdit(task)}
          style={{
            opacity: hovered ? 0.55 : 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 2px',
            fontSize: 13,
            color: S.fgMuted,
            lineHeight: 1,
            flexShrink: 0,
            transition: 'opacity 0.1s',
          }}
          title="编辑任务"
        >
          ✎
        </button>
      )}
      <button
        onClick={() => softDelete.mutate(task.id)}
        style={{
          opacity: hovered ? 0.45 : 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0 2px',
          fontSize: 14,
          color: S.fgMuted,
          lineHeight: 1,
          flexShrink: 0,
          transition: 'opacity 0.1s',
        }}
        title="删除任务"
      >
        ✕
      </button>
    </div>
  )
}
