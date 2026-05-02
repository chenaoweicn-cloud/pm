import { useState } from 'react'
import { S } from '@/design/tokens'
import { GroupCard, GroupHeader } from '@/components/ui/GroupCard'
import { Row } from '@/components/ui/Row'
import { useAllActiveTasks } from '@/features/tasks/queries'
import { useActiveProjects } from '@/features/projects/queries'
import { useFirstTagNamesForTasks } from '@/features/tasks/tagQueries'
import type { Task } from '@/lib/types'
import { TaskForm } from '@/features/tasks/TaskForm'

export function CrossView() {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const { data: allTasks = [] } = useAllActiveTasks()
  const { data: projects = [] } = useActiveProjects()
  const ts = allTasks.filter(t => t.status !== 'done').sort((a, b) =>
    (a.dueDate ?? 'z').localeCompare(b.dueDate ?? 'z'),
  )
  const { data: tagNames = {} } = useFirstTagNamesForTasks(ts.map(task => task.id))

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: S.contentPad }}>
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: S.fgMuted,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          跨项目
        </div>
        <div
          style={{
            fontSize: S.heroSize,
            fontWeight: S.heroWeight,
            color: S.fg,
            marginTop: 4,
            letterSpacing: -0.3,
          }}
        >
          所有进行中
        </div>
      </div>
      <GroupCard>
        <GroupHeader title="按到期时间" count={ts.length} />
        {ts.map(t => {
          const project = projects.find(item => item.id === t.projectId)
          return (
            <Row
              key={t.id}
              task={t}
              showProject
              projectName={project?.name}
              projectColor={project?.color ?? '#6C6C6C'}
              tagName={tagNames[t.id]}
              onEdit={setEditingTask}
            />
          )
        })}
      </GroupCard>
      {editingTask && (
        <TaskForm
          initialTask={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  )
}
