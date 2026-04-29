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
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  not_started: 'in_progress',
  in_progress: 'done',
  done: 'not_started',
}

export function Row({ task, showDate = true }: Props) {
  const [hovered, setHovered] = useState(false)
  const { data: p } = useProject(task.projectId)
  const setStatus = useSetTaskStatus()
  const softDelete = useSoftDeleteTask()

  const isDone = task.status === 'done'
  const todayStr = todayIso()
  const overdue = task.dueDate != null && task.dueDate < todayStr && !isDone
  const today = task.dueDate === todayStr
  const tag = task.tags?.[0]
  const color = p?.color ?? '#6C6C6C'

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
        style={{
          flex: 1,
          fontSize: S.rowSize,
          color: isDone ? S.fgMuted : S.fg,
          textDecoration: isDone ? 'line-through' : 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {task.name}
      </span>
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
