import { S } from '@/design/tokens'
import { TODAY, relDate } from '@/lib/date'
import { projectById } from '@/lib/mockData'
import type { Task } from '@/lib/types'
import { Checkbox } from './Checkbox'

interface Props {
  task: Task
  showDate?: boolean
}

export function Row({ task, showDate = true }: Props) {
  const p = projectById(task.projectId)
  if (!p) return null
  const isDone = task.status === 'done'
  const overdue = task.dueDate != null && task.dueDate < TODAY && !isDone
  const today = task.dueDate === TODAY
  const tag = task.tags?.[0]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: S.rowPad,
        borderTop: S.rowBorder,
      }}
    >
      <Checkbox status={task.status} color={p.color} />
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
    </div>
  )
}
