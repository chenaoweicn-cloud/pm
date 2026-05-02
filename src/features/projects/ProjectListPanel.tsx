import { S } from '@/design/tokens'
import { GroupCard, GroupHeader } from '@/components/ui/GroupCard'
import { Row } from '@/components/ui/Row'
import type { Task } from '@/lib/types'
import { useFirstTagNamesForTasks } from '@/features/tasks/tagQueries'

interface Props {
  tasks: Task[]
  projectColor?: string | null
  onEditTask?: (task: Task) => void
}

export function ProjectListPanel({ tasks, projectColor, onEditTask }: Props) {
  const { data: tagNames = {} } = useFirstTagNamesForTasks(tasks.map(task => task.id))
  const rootTasks = tasks.filter(task => task.parentTaskId == null)
  const childMap = new Map<number, Task[]>()
  for (const task of tasks) {
    if (task.parentTaskId == null) continue
    const list = childMap.get(task.parentTaskId) ?? []
    list.push(task)
    childMap.set(task.parentTaskId, list)
  }

  return (
    <>
      <GroupCard>
        <GroupHeader
          title="全部任务"
          count={`${tasks.filter(t => t.status === 'done').length} / ${tasks.length}`}
        />
        {tasks.length === 0 ? (
            <div style={{ padding: '10px 18px', fontSize: 12, color: S.fgMuted, fontStyle: 'italic' }}>
              暂无任务
            </div>
          ) : (
            rootTasks.map(task => (
              <div key={task.id}>
                <Row task={task} projectColor={projectColor ?? undefined} tagName={tagNames[task.id]} onEdit={onEditTask} />
                {(childMap.get(task.id) ?? []).map(child => (
                  <Row key={child.id} task={child} projectColor={projectColor ?? undefined} tagName={tagNames[child.id]} onEdit={onEditTask} />
                ))}
              </div>
            ))
          )}
      </GroupCard>
    </>
  )
}
